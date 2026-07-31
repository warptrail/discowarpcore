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

const RSYNC_EXCLUDES = [
  'node_modules/',
  'dist/',
  '.git/',
  '.vite/',
  'frontend/node_modules/',
  'frontend/dist/',
  'backend/media/',
  'backend/.env',
  'dump/',
  'var/',
];

const LAN_IP_SCRIPT = 'ip route get 1.1.1.1 2>/dev/null | sed -n "s/.* src \\\\([0-9.]*\\\\).*/\\\\1/p" | head -n1';

function quoteShell(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function runCommand(command, args, { cwd = REPO_ROOT, inherit = true } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    if (!inherit) {
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

async function runRemote(script, options = {}) {
  return runCommand('ssh', [REMOTE, `bash -lc ${quoteShell(script)}`], options);
}

async function runRemoteChecked(script, label) {
  const result = await runRemote(script);
  if (result.code !== 0) {
    throw new Error(`${label || 'Remote command'} failed with exit code ${result.code}.`);
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

async function syncSource({ dryRun }) {
  console.log(dryRun ? 'Running protected rsync dry run...' : 'Syncing protected source tree...');
  const result = await runCommand('rsync', rsyncArgs({ dryRun }));
  if (result.code !== 0) {
    throw new Error(`rsync failed with exit code ${result.code}.`);
  }
}

async function installAndBuild() {
  const script = `
    set -euo pipefail
    cd ${REMOTE_APP_DIR}
    npm install
    cd frontend
    npm install
    npm run build
  `;
  await runRemoteChecked(script, 'Install and build');
}

async function syncInstallBuildCheck(rl) {
  console.log('');
  console.log('This sync uses --delete on neonazoth source files, but preserves:');
  console.log('  backend/media/ backend/.env dump/ var/ .git/ node_modules/ frontend/dist/');
  if (!(await askConfirm(rl, 'Run the real sync, install/build, and health check?', { defaultValue: false }))) {
    return;
  }
  await syncSource({ dryRun: false });
  await installAndBuild();
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
        { label: 'Protected sync + install + build + health check', value: 'sync_install_build_check' },
        { label: 'Show LAN URL', value: 'url' },
        { label: 'Quit', value: 'quit' },
      ]);

      if (action === 'quit') break;

      try {
        if (action === 'status') await showStatus();
        if (action === 'sync_dry') await syncSource({ dryRun: true });
        if (action === 'sync_install_build_check') await syncInstallBuildCheck(rl);
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

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
