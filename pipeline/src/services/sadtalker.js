const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SADTALKER_PYTHON = process.env.SADTALKER_PYTHON;
const SADTALKER_DIR = process.env.SADTALKER_DIR;
const FFMPEG_BIN = process.env.FFMPEG_BIN;

/**
 * Animate a face image driven by an audio file using SadTalker.
 *
 * @param {string} faceImage  - Path to input face image (jpg/png)
 * @param {string} audioFile  - Path to driving audio (wav)
 * @param {string} outputDir  - Directory where result mp4 will be written
 * @returns {Promise<string>} - Resolves with the output mp4 file path
 */
function runSadTalker(faceImage, audioFile, outputDir) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(outputDir, { recursive: true });

    const args = [
      path.join(SADTALKER_DIR, 'inference.py'),
      '--driven_audio', audioFile,
      '--source_image', faceImage,
      '--result_dir', outputDir,
      '--still',
      '--preprocess', 'crop',
      '--checkpoint_dir', path.join(SADTALKER_DIR, 'checkpoints'),
    ];

    // SadTalker needs ffmpeg on PATH for video muxing
    const env = {
      ...process.env,
      PATH: `${FFMPEG_BIN};${process.env.PATH}`,
      PYTHONPATH: SADTALKER_DIR,
    };

    const proc = spawn(SADTALKER_PYTHON, args, { cwd: SADTALKER_DIR, env });

    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); if (stderr.length > 2000) stderr = stderr.slice(-2000); });
    proc.stdout.on('data', (d) => { process.stdout.write('[sadtalker] ' + d); });

    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`SadTalker exited ${code}: ${stderr}`));

      // SadTalker writes a timestamped mp4 at the root of result_dir
      const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.mp4'));
      if (!files.length) return reject(new Error('SadTalker produced no output mp4'));

      // Pick the most recently modified mp4
      const latest = files
        .map(f => ({ f, mtime: fs.statSync(path.join(outputDir, f)).mtime }))
        .sort((a, b) => b.mtime - a.mtime)[0].f;

      resolve(path.join(outputDir, latest));
    });

    proc.on('error', reject);
  });
}

module.exports = { runSadTalker };
