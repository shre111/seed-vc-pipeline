const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SEEDVC_PYTHON = process.env.SEEDVC_PYTHON;
const SEEDVC_DIR = process.env.SEEDVC_DIR;

/**
 * Clone voice from a reference audio sample and apply it to a source audio.
 *
 * @param {string} sourceAudio  - Path to the audio whose content to keep (what is said)
 * @param {string} targetAudio  - Path to the reference voice sample (whose voice to clone)
 * @param {string} outputDir    - Directory where output wav will be written
 * @param {object} [params]     - Optional inference params
 * @param {number} [params.diffusionSteps=30]  - Diffusion steps (higher = better quality, slower)
 * @param {number} [params.lengthAdjust=1.0]   - Speech speed (<1 faster, >1 slower)
 * @param {number} [params.cfgRate=0.7]        - Classifier-free guidance rate
 * @returns {Promise<string>}   - Resolves with the output wav file path
 */
function runSeedVC(sourceAudio, targetAudio, outputDir, params = {}) {
  const {
    diffusionSteps = 30,
    lengthAdjust   = 1.0,
    cfgRate        = 0.7,
  } = params;

  return new Promise((resolve, reject) => {
    fs.mkdirSync(outputDir, { recursive: true });

    const args = [
      path.join(SEEDVC_DIR, 'inference.py'),
      '--source', sourceAudio,
      '--target', targetAudio,
      '--output', outputDir,
      '--diffusion-steps', String(diffusionSteps),
      '--length-adjust',   String(lengthAdjust),
      '--inference-cfg-rate', String(cfgRate),
      '--fp16', 'False',
    ];

    const env = { ...process.env, PYTHONPATH: SEEDVC_DIR };
    const proc = spawn(SEEDVC_PYTHON, args, { cwd: SEEDVC_DIR, env });

    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); if (stderr.length > 2000) stderr = stderr.slice(-2000); });
    proc.stdout.on('data', (d) => { process.stdout.write('[seedvc] ' + d); });

    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`Seed-VC exited ${code}: ${stderr}`));

      const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.wav'));
      if (!files.length) return reject(new Error('Seed-VC produced no output wav'));

      // Sort by mtime descending so leftover .wav files from prior runs are not picked
      const latest = files
        .map(f => ({ f, mtime: fs.statSync(path.join(outputDir, f)).mtime }))
        .sort((a, b) => b.mtime - a.mtime)[0].f;

      resolve(path.join(outputDir, latest));
    });

    proc.on('error', reject);
  });
}

module.exports = { runSeedVC };
