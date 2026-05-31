const fs = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function buildOptionalArgs({ location, box, artifactsDir, outputDir } = {}) {
  const args = [];
  if (artifactsDir) args.push('--artifacts-dir', artifactsDir);
  if (outputDir) args.push('--output-dir', outputDir);
  if (location) args.push('--location', location);
  if (box) args.push('--box', box);
  return args;
}

function buildPreprocessCommand({ rawDir, processedDir }) {
  return {
    command: process.execPath,
    args: [
      'scripts/preprocess_vision_images.js',
      '--source-dir',
      rawDir,
      '--output-dir',
      processedDir,
      '--render-mode',
      'cutout',
      '--output-mode',
      'transparent-png',
      '--force',
    ],
  };
}

function buildVisionCommand({
  mode,
  sourceDir,
  batchName,
  location,
  box,
  artifactsDir,
  outputDir,
}) {
  const modeFlag = mode === 'validate' ? '--validate' : mode === 'package' ? '--package' : '--init';
  return {
    command: process.execPath,
    args: [
      'scripts/build_vision_intake_batch.js',
      modeFlag,
      '--source-dir',
      sourceDir,
      '--batch-label',
      batchName,
      ...buildOptionalArgs({ location, box, artifactsDir, outputDir }),
    ],
  };
}

async function appendLog(logPath, text) {
  if (!logPath) return;
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  await fs.appendFile(logPath, text, 'utf8');
}

async function runCommand({
  command,
  args = [],
  cwd = REPO_ROOT,
  env = {},
  logPath = '',
  label = command,
}) {
  const commandLine = [command, ...args].join(' ');
  await appendLog(logPath, `$ ${commandLine}\n`);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: {
        ...process.env,
        ...env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      process.stdout.write(text);
      void appendLog(logPath, text);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      process.stderr.write(text);
      void appendLog(logPath, text);
    });

    child.on('error', reject);
    child.on('close', (code) => {
      void appendLog(logPath, `\n[exit ${code}]\n`);
      if (code === 0) {
        resolve({ code, commandLine });
      } else {
        reject(new Error(`${label} failed with exit code ${code}. See ${logPath || 'terminal output'}.`));
      }
    });
  });
}

module.exports = {
  REPO_ROOT,
  buildPreprocessCommand,
  buildVisionCommand,
  runCommand,
};
