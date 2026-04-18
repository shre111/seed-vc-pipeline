const { spawn } = require('child_process');
const path = require('path');

const FFMPEG_BIN = process.env.FFMPEG_BIN;
const ffmpegExe = path.join(FFMPEG_BIN, 'ffmpeg.exe');

/**
 * Normalise a video: re-encode to h264/aac, ensure consistent resolution & fps.
 * This is the final post-processing step before delivery.
 *
 * @param {string} inputFile  - Path to raw mp4 from SadTalker
 * @param {string} outputFile - Path for the final normalised mp4
 * @returns {Promise<string>} - Resolves with outputFile path
 */
function normaliseVideo(inputFile, outputFile) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', inputFile,
      '-vcodec', 'libx264',
      '-acodec', 'aac',
      '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2',
      '-r', '25',
      '-movflags', '+faststart',
      '-hide_banner',
      '-loglevel', 'error',
      outputFile,
    ];

    const proc = spawn(ffmpegExe, args);

    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); if (stderr.length > 2000) stderr = stderr.slice(-2000); });

    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`FFmpeg exited ${code}: ${stderr}`));
      resolve(outputFile);
    });

    proc.on('error', reject);
  });
}

module.exports = { normaliseVideo };
