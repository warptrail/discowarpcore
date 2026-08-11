#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const {
  askConfirm,
  askEnter,
  askSelect,
  createPromptSession,
} = require('../vision-intake-tui/tuiPrompts');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const REMOTE = process.env.NEONAZOTH_REMOTE || 'neonazoth';
const REMOTE_APP_DIR = process.env.NEONAZOTH_APP_DIR || '~/discowarpcore';
const REMOTE_PORT = process.env.NEONAZOTH_PORT || '5002';
const REMOTE_COMPLETION_MARKER = '__DWC_REMOTE_COMMAND_COMPLETE__';
const REMOTE_COMPLETION_GRACE_MS = 1500;
const REMOTE_COMMAND_TIMEOUT_MS = 20 * 60 * 1000;
const SSH_OPTIONS = [
  '-o', 'BatchMode=yes',
  '-o', 'ConnectTimeout=10',
  '-o', 'ServerAliveInterval=15',
  '-o', 'ServerAliveCountMax=3',
];

const RSYNC_EXCLUDES = [
  'node_modules/',
  'dist/',
  '.git/',
  '.vite/',
  '.runtime/',
  '.tarot/',
  'frontend/node_modules/',
  'frontend/dist/',
  'backend/media/',
  'backend/.env',
  'backend/.env.*',
  'dump/',
  'var/',
  'test/output/',
  '.DS_Store',
  '**/.DS_Store',
  '*.log',
  '*.pid',
  '*.sock',
  '*.backup*',
  '*.bak-*',
];

const PROTECTED_DRY_RUN_PATTERNS = [
  /(^|\/)\.runtime(\/|$)/,
  /(^|\/)\.tarot(\/|$)/,
  /(^|\/)\.DS_Store$/,
  /^backend\/media(\/|$)/,
  /^backend\/\.env(?:\.|$)/,
  /^dump(\/|$)/,
  /^var(\/|$)/,
  /^test\/output(\/|$)/,
  /\.log$/,
  /\.pid$/,
  /\.sock$/,
  /\.backup[^/]*$/,
  /\.bak-[^/]*$/,
];

const LAN_IP_SCRIPT = 'ip route get 1.1.1.1 2>/dev/null | sed -n "s/.* src \\\\([0-9.]*\\\\).*/\\\\1/p" | head -n1';

function quoteShell(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function runCommand(command, args, {
  cwd = REPO_ROOT,
  inherit = true,
  completionMarker = '',
  completionGraceMs = REMOTE_COMPLETION_GRACE_MS,
  timeoutMs = 0,
} = {}) {
  return new Promise((resolve) => {
    const pipeOutput = !inherit || Boolean(completionMarker);
    const child = spawn(command, args, {
      cwd,
      stdio: pipeOutput ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    });

    let stdout = '';
    let stderr = '';
    let completionSeen = false;
    let completionTimer = null;
    let timeoutTimer = null;
    let forcedCloseAfterCompletion = false;
    let timedOut = false;

    if (timeoutMs > 0) {
      timeoutTimer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
      }, timeoutMs);
      timeoutTimer.unref?.();
    }

    if (pipeOutput) {
      child.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        stdout += text;
        if (inherit) {
          process.stdout.write(
            completionMarker ? text.split(completionMarker).join('') : text
          );
        }

        if (!completionSeen && completionMarker && stdout.includes(completionMarker)) {
          completionSeen = true;
          completionTimer = setTimeout(() => {
            forcedCloseAfterCompletion = true;
            child.kill('SIGTERM');
          }, completionGraceMs);
          completionTimer.unref?.();
        }
      });
      child.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        stderr += text;
        if (inherit) process.stderr.write(text);
      });
    }

    child.on('error', (error) => {
      if (completionTimer) clearTimeout(completionTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
      resolve({
        code: 1,
        stdout,
        stderr,
        error,
        completionSeen,
        forcedCloseAfterCompletion,
        timedOut,
      });
    });

    child.on('close', (code, signal) => {
      if (completionTimer) clearTimeout(completionTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
      resolve({
        code: completionSeen && !timedOut ? 0 : code,
        signal,
        stdout,
        stderr,
        completionSeen,
        forcedCloseAfterCompletion,
        timedOut,
      });
    });
  });
}

async function runRemote(script, options = {}) {
  return runCommand(
    'ssh',
    [...SSH_OPTIONS, REMOTE, `bash -lc ${quoteShell(script)}`],
    options
  );
}

async function runRemoteChecked(script, label) {
  const markedScript = `${script}\nprintf '\\n${REMOTE_COMPLETION_MARKER}\\n'`;
  const result = await runRemote(markedScript, {
    completionMarker: REMOTE_COMPLETION_MARKER,
    timeoutMs: REMOTE_COMMAND_TIMEOUT_MS,
  });
  if (result.timedOut) {
    throw new Error(`${label || 'Remote command'} exceeded the 20-minute safety limit.`);
  }
  if (result.code !== 0 || !result.completionSeen) {
    throw new Error(`${label || 'Remote command'} failed with exit code ${result.code}.`);
  }
  if (result.forcedCloseAfterCompletion) {
    console.log('[remote] Work completed; closed a stale SSH channel safely.');
  }
}

async function captureRemote(script) {
  return runRemote(script, { inherit: false });
}

function printHeader() {
  if (process.stdout.isTTY) {
    console.clear();
  }
  console.log('DISCO WARP CORE REMOTE CONTROL');
  console.log(`Remote: ${REMOTE}`);
  console.log(`App dir: ${REMOTE_APP_DIR}`);
  console.log(`Port: ${REMOTE_PORT}`);
}

async function showStatus() {
  printHeader();
  const script = `
    set +e
    cd ${REMOTE_APP_DIR} || exit 1
    echo "== Health =="
    curl -sS --max-time 3 http://127.0.0.1:${REMOTE_PORT}/api/health || true
    echo
    echo
    echo "== LAN URL =="
    IP="$(${LAN_IP_SCRIPT})"
    if [ -n "$IP" ]; then
      echo "http://$IP:${REMOTE_PORT}"
    else
      echo "http://<neonazoth-ip>:${REMOTE_PORT}"
    fi
  `;
  await runRemote(script);
}

function rsyncArgs({ dryRun }) {
  return [
    dryRun ? '-avzn' : '-avz',
    '--delete',
    ...RSYNC_EXCLUDES.flatMap((entry) => ['--exclude', entry]),
    './',
    `${REMOTE}:${REMOTE_APP_DIR}/`,
  ];
}

function findProtectedDryRunEntries(output = '') {
  return String(output)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const pathEntry = line.replace(/^deleting\s+/, '');
      return PROTECTED_DRY_RUN_PATTERNS.some((pattern) => pattern.test(pathEntry));
    });
}

async function syncSource({ dryRun }) {
  console.log(dryRun ? 'Running protected rsync dry run...' : 'Syncing protected source tree...');
  const result = await runCommand('rsync', rsyncArgs({ dryRun }), {
    inherit: !dryRun,
  });
  if (dryRun) {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
  }
  if (result.code !== 0) {
    throw new Error(`rsync failed with exit code ${result.code}.`);
  }
  if (dryRun) {
    const protectedEntries = findProtectedDryRunEntries(result.stdout);
    if (protectedEntries.length > 0) {
      throw new Error(
        `Protected rsync dry run included unsafe paths:\n${protectedEntries.join('\n')}`
      );
    }
    console.log('[dry run] Protected paths are absent from the transfer/delete plan.');
  }
}

async function installAndBuild() {
  const script = `
    set -euo pipefail
    cd ${REMOTE_APP_DIR}
    echo "[deploy 1/3] Installing backend dependencies"
    npm install --no-audit --no-fund
    cd frontend
    echo "[deploy 2/3] Installing frontend dependencies"
    npm install --no-audit --no-fund
    echo "[deploy 3/3] Building production frontend"
    npm run build
    echo "[deploy] Install and build complete"
  `;
  await runRemoteChecked(script, 'Install and build');
}

function buildRemoteRestartScript() {
  return `
    set -euo pipefail
    cd ${REMOTE_APP_DIR}
    node scripts/neonazoth/restart_backend_remote.js
  `;
}

async function restartBackend() {
  console.log('Running guarded production backend restart...');
  await runRemoteChecked(buildRemoteRestartScript(), 'Guarded backend restart');
}

async function syncInstallBuildCheck(rl) {
  console.log('');
  console.log('This sync uses --delete on neonazoth source files, but preserves:');
  console.log('  backend/media/ backend/.env dump/ var/ .git/ node_modules/ frontend/dist/');
  console.log('  .runtime/ .tarot/ logs, pid/socket files, local backups, and OS metadata');
  console.log('');
  console.log('A fresh protected dry run is required immediately before deployment.');
  await syncSource({ dryRun: true });
  if (!(await askConfirm(rl, 'Run the real sync, install/build, guarded restart, and health check?', { defaultValue: false }))) {
    return;
  }
  await syncSource({ dryRun: false });
  await installAndBuild();
  await restartBackend();
  await showStatus();
}

async function openUrlHint() {
  const result = await captureRemote(LAN_IP_SCRIPT);
  const ip = result.stdout.trim() || '<neonazoth-ip>';
  console.log('');
  console.log(`Open this from any device on the LAN: http://${ip}:${REMOTE_PORT}`);
}

async function main() {
  const arg = process.argv[2] || '';
  if (arg === '--status') {
    await showStatus();
    return;
  }
  if (arg === '--url') {
    printHeader();
    await openUrlHint();
    return;
  }
  if (arg === '--restart') {
    printHeader();
    await restartBackend();
    await showStatus();
    return;
  }
  if (!process.stdin.isTTY) {
    throw new Error('Remote deploy TUI requires an interactive terminal. Use --status or --url for one-shot checks.');
  }

  const rl = createPromptSession();
  try {
    while (true) {
      printHeader();
      const action = await askSelect(rl, 'Action', [
        { label: 'Status and health check', value: 'status' },
        { label: 'Protected source sync dry run', value: 'sync_dry' },
        { label: 'Protected sync + install + build + guarded restart + health check', value: 'sync_install_build_check' },
        { label: 'Guarded production backend restart', value: 'restart' },
        { label: 'Show LAN URL', value: 'url' },
        { label: 'Quit', value: 'quit' },
      ]);

      if (action === 'quit') break;

      try {
        if (action === 'status') await showStatus();
        if (action === 'sync_dry') await syncSource({ dryRun: true });
        if (action === 'sync_install_build_check') await syncInstallBuildCheck(rl);
        if (action === 'restart') await restartBackend();
        if (action === 'url') await openUrlHint();
      } catch (error) {
        console.error('');
        console.error(error?.message || error);
      }

      await askEnter(rl);
    }
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error?.message || error);
    process.exit(1);
  });
}

module.exports = {
  REMOTE_COMPLETION_MARKER,
  RSYNC_EXCLUDES,
  buildRemoteRestartScript,
  findProtectedDryRunEntries,
  rsyncArgs,
  runCommand,
};
