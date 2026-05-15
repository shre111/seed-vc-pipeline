const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const { createJob, getJob, updateJob } = require('../utils/jobStore');
const { runSeedVC } = require('../services/seedvc');
const { runSadTalker } = require('../services/sadtalker');
const { normaliseVideo } = require('../services/ffmpeg');

const router = express.Router();

const UPLOADS_DIR = process.env.UPLOADS_DIR;
const OUTPUTS_DIR = process.env.OUTPUTS_DIR;

// Multer — store uploads with original extension preserved
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const jobId = req.jobId;
    const dir = path.join(UPLOADS_DIR, jobId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, file.fieldname + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ['.wav', '.mp3', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error(`File type ${ext} not allowed`));
  },
});

// Attach a fresh job ID before multer runs so destination can use it
function attachJobId(req, res, next) {
  req.jobId = uuidv4();
  next();
}

// POST /api/pipeline/start
// Fields: source_audio (what is said), target_audio (whose voice), face_image
router.post(
  '/start',
  attachJobId,
  upload.fields([
    { name: 'source_audio', maxCount: 1 },
    { name: 'target_audio', maxCount: 1 },
    { name: 'face_image',   maxCount: 1 },
  ]),
  (req, res) => {
    const { source_audio, target_audio, face_image } = req.files || {};

    if (!source_audio || !target_audio || !face_image) {
      return res.status(400).json({
        error: 'Missing required files: source_audio, target_audio, face_image',
      });
    }

    const jobId = req.jobId;
    const job = createJob(jobId);

    job.inputFiles = {
      sourceAudio: source_audio[0].path,
      targetAudio: target_audio[0].path,
      faceImage:   face_image[0].path,
    };

    const toNum = (val, def) => { const n = parseFloat(val); return Number.isFinite(n) ? n : def; };
    job.inferenceParams = {
      diffusionSteps: Math.min(100, Math.max(1,   toNum(req.body.diffusion_steps, 30))),
      lengthAdjust:   Math.min(2.0, Math.max(0.5, toNum(req.body.length_adjust,   1.0))),
      cfgRate:        Math.min(1.0, Math.max(0.0, toNum(req.body.cfg_rate,         0.7))),
    };

    // Run pipeline asynchronously; clean up uploaded inputs when done
    runPipeline(jobId)
      .catch((err) => {
        console.error(`[job:${jobId}] Fatal:`, err.message);
        updateJob(jobId, { status: 'failed', error: err.message });
      })
      .finally(() => {
        const uploadDir = path.join(UPLOADS_DIR, jobId);
        fs.rm(uploadDir, { recursive: true, force: true }, () => {});
      });

    res.status(202).json({ jobId, status: 'queued' });
  }
);

// GET /api/pipeline/status/:jobId
router.get('/status/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  res.json({
    jobId: job.id,
    status: job.status,
    step: job.step,
    progress: job.progress,
    outputFile: job.outputFile ? path.basename(job.outputFile) : null,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  });
});

// GET /api/pipeline/download/:jobId
router.get('/download/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.status !== 'done') return res.status(409).json({ error: `Job is ${job.status}` });

  res.download(job.outputFile, `output_${job.id}.mp4`);
});

// --- Pipeline orchestration ---

async function runPipeline(jobId) {
  const job = getJob(jobId);
  const { sourceAudio, targetAudio, faceImage } = job.inputFiles;
  const inferenceParams = job.inferenceParams || {};

  const workDir = path.join(OUTPUTS_DIR, jobId);
  fs.mkdirSync(workDir, { recursive: true });

  // Step 1: Voice cloning
  updateJob(jobId, { status: 'cloning', step: 'voice_cloning', progress: 10 });
  console.log(`[job:${jobId}] Step 1: Voice cloning (steps=${inferenceParams.diffusionSteps})...`);

  const cloneOutputDir = path.join(workDir, 'seedvc');
  const clonedAudio = await runSeedVC(sourceAudio, targetAudio, cloneOutputDir, inferenceParams);
  updateJob(jobId, { progress: 40 });
  console.log(`[job:${jobId}] Voice cloning done → ${clonedAudio}`);

  // Step 2: Avatar animation
  updateJob(jobId, { status: 'animating', step: 'avatar_animation', progress: 50 });
  console.log(`[job:${jobId}] Step 2: Avatar animation...`);

  const animOutputDir = path.join(workDir, 'sadtalker');
  const rawVideo = await runSadTalker(faceImage, clonedAudio, animOutputDir);
  updateJob(jobId, { progress: 80 });
  console.log(`[job:${jobId}] Avatar animation done → ${rawVideo}`);

  // Step 3: FFmpeg normalisation
  updateJob(jobId, { status: 'processing', step: 'ffmpeg_normalise', progress: 90 });
  console.log(`[job:${jobId}] Step 3: FFmpeg post-processing...`);

  const finalVideo = path.join(workDir, 'final_output.mp4');
  await normaliseVideo(rawVideo, finalVideo);
  console.log(`[job:${jobId}] Done → ${finalVideo}`);

  updateJob(jobId, { status: 'done', step: null, progress: 100, outputFile: finalVideo });
}

// Return multer errors (wrong type, file too large) as JSON instead of HTML.
// Also delete any partially uploaded files — multer may have written some files
// before rejecting, and no job record exists to trigger the normal cleanup.
router.use((err, req, res, next) => {
  if (err && (err.code === 'LIMIT_FILE_SIZE' || err.message?.includes('not allowed'))) {
    if (req.jobId) {
      fs.rm(path.join(UPLOADS_DIR, req.jobId), { recursive: true, force: true }, () => {});
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
