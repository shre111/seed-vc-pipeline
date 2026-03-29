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
 * @returns {Promise<string>}   - Resolves with the output wav file path
 */
function runSeedVC(sourceAudio, targetAudio, outputDir) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(outputDir, { recursive: true });

    const args = [
      path.join(SEEDVC_DIR, 'inference.py'),
      '--source', sourceAudio,
      '--target', targetAudio,
      '--output', outputDir,
      '--diffusion-steps', '30',
      '--fp16', 'False',
    ];

    const env = { ...process.env, PYTHONPATH: SEEDVC_DIR };
    const proc = spawn(SEEDVC_PYTHON, args, { cwd: SEEDVC_DIR, env });

    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.stdout.on('data', (d) => { process.stdout.write('[seedvc] ' + d); });

    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`Seed-VC exited ${code}: ${stderr}`));

      // Seed-VC writes output as: vc_<source>_<target>_<params>.wav
      const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.wav'));
      if (!files.length) return reject(new Error('Seed-VC produced no output wav'));

      resolve(path.join(outputDir, files[0]));
    });

    proc.on('error', reject);
  });
}

module.exports = { runSeedVC };
