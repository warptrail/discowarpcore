#!/usr/bin/env node

const fs = require('fs/promises');
const { constants: FS_CONSTANTS } = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const sharp = require('sharp');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
require('dotenv').config({ path: path.join(REPO_ROOT, 'backend', '.env') });

const DEFAULT_OBJECT_GLOW_REPO = path.resolve(REPO_ROOT, '..', 'objectiglow');
const DEFAULT_INPUT_PATH = path.join(REPO_ROOT, 'test', 'input', 'original_mystery_object.jpg');
const DEFAULT_RENDER_TOKENS = {
  background: 'midnight',
  glow: 'arc',
};

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

async function isExecutableFile(filePath) {
  try {
    await fs.access(filePath, FS_CONSTANTS.X_OK);
    return true;
  } catch (_error) {
    return false;
  }
}

function prependPythonPath(entry, existing) {
  const current = toTrimmed(existing);
  return current ? `${entry}${path.delimiter}${current}` : entry;
}

async function ensureSmokeInput(inputPath) {
  try {
    await fs.access(inputPath, FS_CONSTANTS.R_OK);
    return inputPath;
  } catch (_error) {
    const generatedPath = path.join(os.tmpdir(), 'dwc-objectglow-smoke-input.png');
    const svg = `
      <svg width="640" height="480" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f4f4f0"/>
        <ellipse cx="320" cy="250" rx="145" ry="105" fill="#1f8f73"/>
        <rect x="245" y="135" width="150" height="205" rx="28" fill="#205ac8"/>
        <circle cx="320" cy="205" r="54" fill="#ffcc66"/>
      </svg>
    `;
    await sharp(Buffer.from(svg)).png().toFile(generatedPath);
    return generatedPath;
  }
}

async function resolveObjectGlowInvocation({ objectGlowRepo, inputPath, outputPath, renderTokens }) {
  const repoRoot = path.resolve(objectGlowRepo || process.env.OBJECT_GLOW_REPO || DEFAULT_OBJECT_GLOW_REPO);
  const launcherPath = path.join(repoRoot, 'bin', 'objectglow');
  const venvPythonPath = path.join(repoRoot, '.venv', 'bin', 'python');
  const cliArgs = [
    inputPath,
    '--output',
    outputPath,
    '--progress-format',
    'jsonl',
    '--background-token',
    renderTokens.background,
    '--glow-token',
    renderTokens.glow,
    '--run-id',
    'dwc-objectglow-smoke',
    '--media-id',
    'dwc-objectglow-smoke-media',
    '--batch-id',
    'dwc-objectglow-smoke-batch',
  ];

  if (await isExecutableFile(launcherPath)) {
    return {
      strategy: 'repo-launcher',
      executable: launcherPath,
      args: cliArgs,
      cwd: repoRoot,
      env: {
        ...process.env,
        OBJECT_GLOW_REPO: repoRoot,
      },
      repoRoot,
    };
  }

  if (await isExecutableFile(venvPythonPath)) {
    return {
      strategy: 'repo-venv-python-fallback',
      executable: venvPythonPath,
      args: ['-m', process.env.OBJECT_GLOW_MODULE || 'itemcutout', ...cliArgs],
      cwd: repoRoot,
      env: {
        ...process.env,
        OBJECT_GLOW_REPO: repoRoot,
        PYTHONPATH: prependPythonPath(path.join(repoRoot, 'src'), process.env.PYTHONPATH),
      },
      repoRoot,
    };
  }

  throw new Error(
    `objectGlow launcher not found at ${launcherPath}; fallback python not found at ${venvPythonPath}`
  );
}

function runObjectGlow({ executable, args, cwd, env }) {
  return new Promise((resolve) => {
    const child = spawn(executable, args, {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      resolve({ exitCode: null, signal: null, stdout, stderr, error });
    });
    child.on('close', (exitCode, signal) => {
      resolve({ exitCode, signal, stdout, stderr, error: null });
    });
  });
}

function parseCompletedEvent(stdout) {
  const lines = String(stdout || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      const parsed = JSON.parse(lines[index]);
      if (parsed?.event === 'job_completed') return parsed;
    } catch (_error) {
      // Ignore non-JSON progress lines.
    }
  }
  return null;
}

async function assertOutput(outputPath) {
  const stat = await fs.stat(outputPath);
  if (!stat.isFile() || stat.size <= 0) {
    throw new Error(`Smoke output is missing or empty: ${outputPath}`);
  }
  const metadata = await sharp(outputPath).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Smoke output is not a readable image: ${outputPath}`);
  }
  return {
    bytes: stat.size,
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const renderTokens = {
    background: toTrimmed(args['background-token']) || DEFAULT_RENDER_TOKENS.background,
    glow: toTrimmed(args['glow-token']) || DEFAULT_RENDER_TOKENS.glow,
  };
  const inputPath = await ensureSmokeInput(path.resolve(toTrimmed(args.input) || DEFAULT_INPUT_PATH));
  const outputPath = path.resolve(
    toTrimmed(args.output) || path.join(os.tmpdir(), `dwc-objectglow-smoke-${Date.now()}.webp`)
  );
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const invocation = await resolveObjectGlowInvocation({
    objectGlowRepo: toTrimmed(args['objectglow-repo']),
    inputPath,
    outputPath,
    renderTokens,
  });

  console.log('[objectglow-smoke] invocation', {
    strategy: invocation.strategy,
    objectGlowRepo: invocation.repoRoot,
    executable: invocation.executable,
    inputPath,
    outputPath,
    renderTokens,
  });

  const result = await runObjectGlow(invocation);
  if (result.error || result.exitCode !== 0) {
    const reason = result.error?.message || `objectGlow exited with code ${result.exitCode}`;
    throw new Error(`${reason}\nSTDERR:\n${result.stderr}\nSTDOUT:\n${result.stdout.slice(-1200)}`);
  }

  const output = await assertOutput(outputPath);
  const completedEvent = parseCompletedEvent(result.stdout);
  console.log('[objectglow-smoke] success', {
    outputPath,
    output,
    completedEvent: completedEvent
      ? {
          event: completedEvent.event,
          outputPath: completedEvent.outputPath,
          glowApplied: completedEvent.glowApplied,
          glowColor: completedEvent.glowColor,
          background: completedEvent.background,
          glow: completedEvent.glow,
        }
      : null,
  });
}

main().catch((error) => {
  console.error('[objectglow-smoke] failed');
  console.error(error?.stack || error);
  process.exitCode = 1;
});
