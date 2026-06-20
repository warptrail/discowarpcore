#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const {
  askConfirm,
  askEnter,
  askSelect,
  askText,
  createPromptSession,
} = require('../vision-intake-tui/tuiPrompts');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const REMOTE = process.env.NEONAZOTH_REMOTE || 'neonazoth';
const REMOTE_APP_DIR = process.env.NEONAZOTH_APP_DIR || '~/discowarpcore';
const REMOTE_PORT = process.env.NEONAZOTH_PORT || '5002';
const LOCAL_DB = process.env.MOONSHADE_DB || 'discowarpcore';
const REMOTE_DB = process.env.NEONAZOTH_DB || 'discowarpcore';

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
const SERVER_PROCESS_AWK = "ps -u \"$USER\" -o pid=,ppid=,stat=,comm=,args= | awk '(($4 ~ /^node/ || $4 == \"npm\") && ($0 ~ /backend\\/server.js/ || $0 ~ /npm start/)) {print}'";
const SERVER_PID_AWK = "ps -u \"$USER\" -o pid=,comm=,args= | awk '(($2 ~ /^node/ || $2 == \"npm\") && ($0 ~ /backend\\/server.js/ || $0 ~ /npm start/)) {print $1}'";

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

function timestampForName(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
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

async function runChecked(command, args, label, options = {}) {
  const result = await runCommand(command, args, options);
  if (result.code !== 0) {
    throw new Error(`${label || command} failed with exit code ${result.code}.`);
  }
  return result;
}

async function assertLocalCommand(command, installHint = '') {
  const result = await runCommand('sh', ['-lc', `command -v ${quoteShell(command)}`], {
    inherit: false,
  });
  if (result.code !== 0) {
    throw new Error(`Missing local command: ${command}${installHint ? `\n${installHint}` : ''}`);
  }
}

async function assertRemoteCommand(command, installHint = '') {
  const result = await captureRemote(`command -v ${quoteShell(command)}`);
  if (result.code !== 0) {
    throw new Error(`Missing NeonAzoth command: ${command}${installHint ? `\n${installHint}` : ''}`);
  }
}

async function captureRemote(script) {
  return runRemote(script, { inherit: false });
}

async function getRemoteAppAbsDir() {
  const result = await captureRemote(`cd ${REMOTE_APP_DIR} && pwd -P`);
  if (result.code !== 0) {
    throw new Error(`Could not resolve NeonAzoth app directory: ${REMOTE_APP_DIR}`);
  }
  const appDir = result.stdout.trim();
  if (!appDir.startsWith('/')) {
    throw new Error(`Resolved NeonAzoth app directory is not absolute: ${appDir}`);
  }
  return appDir;
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
    echo "== Process =="
    PIDS="$(${SERVER_PID_AWK})"
    if [ -n "$PIDS" ]; then
      ${SERVER_PROCESS_AWK}
    else
      echo "not running"
    fi
    echo
    echo "== Listening Ports =="
    ss -ltnp 2>/dev/null | grep -E ":${REMOTE_PORT}\\\\b|:27017\\\\b" || true
    echo
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
    echo
    echo "== Recent Log =="
    tail -n 20 var/logs/server.log 2>/dev/null || echo "no server log yet"
  `;
  await runRemote(script);
}

async function startServer() {
  const script = `
    set -euo pipefail
    cd ${REMOTE_APP_DIR}
    mkdir -p var/logs
    PIDS="$(${SERVER_PID_AWK})"
    if [ -n "$PIDS" ]; then
      echo "Server is already running."
      ${SERVER_PROCESS_AWK}
      exit 0
    fi
    nohup npm start > var/logs/server.log 2>&1 < /dev/null &
    sleep 2
    ${SERVER_PID_AWK} > var/logs/server.pid
    echo "Started server PID(s):"
    cat var/logs/server.pid
    echo
    curl -sS --max-time 5 http://127.0.0.1:${REMOTE_PORT}/api/health
    echo
  `;
  await runRemoteChecked(script, 'Start server');
}

async function stopServer(rl) {
  if (!(await askConfirm(rl, 'Stop the Disco Warp Core server on neonazoth?', { defaultValue: false }))) {
    return;
  }
  const script = `
    set +e
    cd ${REMOTE_APP_DIR} || exit 1
    PIDS="$(${SERVER_PID_AWK})"
    if [ -z "$PIDS" ]; then
      echo "Server is not running."
      exit 0
    fi
    echo "$PIDS" | xargs kill
    sleep 2
    REMAINING="$(${SERVER_PID_AWK})"
    if [ -n "$REMAINING" ]; then
      echo "Server did not stop cleanly; remaining PID(s): $REMAINING" >&2
      exit 1
    fi
    rm -f var/logs/server.pid
    echo "Server stopped."
  `;
  await runRemoteChecked(script, 'Stop server');
}

async function restartServer(rl) {
  if (!(await askConfirm(rl, 'Restart the Disco Warp Core server on neonazoth?', { defaultValue: true }))) {
    return;
  }
  const script = `
    set +e
    cd ${REMOTE_APP_DIR} || exit 1
    PIDS="$(${SERVER_PID_AWK})"
    if [ -n "$PIDS" ]; then
      echo "$PIDS" | xargs kill
      sleep 2
    fi
    if [ -n "$(${SERVER_PID_AWK})" ]; then
      echo "Existing server process is still running." >&2
      exit 1
    fi
    set -e
    mkdir -p var/logs
    nohup npm start > var/logs/server.log 2>&1 < /dev/null &
    sleep 2
    ${SERVER_PID_AWK} > var/logs/server.pid
    echo "Restarted server PID(s):"
    cat var/logs/server.pid
    echo
    curl -sS --max-time 5 http://127.0.0.1:${REMOTE_PORT}/api/health
    echo
  `;
  await runRemoteChecked(script, 'Restart server');
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

async function dumpMoonshadeDatabase(stamp) {
  fs.mkdirSync(path.join(REPO_ROOT, 'dump'), { recursive: true });
  const archivePath = path.join(
    REPO_ROOT,
    'dump',
    `moonshade-${LOCAL_DB}-merge-source-${stamp}.archive.gz`
  );
  await runChecked(
    'mongodump',
    [`--db=${LOCAL_DB}`, `--archive=${archivePath}`, '--gzip'],
    'Moonshade MongoDB dump'
  );
  return archivePath;
}

async function transferArchiveToNeonazoth(localArchivePath) {
  const fileName = path.basename(localArchivePath);
  const remoteAppAbsDir = await getRemoteAppAbsDir();
  const remoteArchivePath = `${remoteAppAbsDir}/dump/${fileName}`;
  await runRemoteChecked(`cd ${REMOTE_APP_DIR} && mkdir -p dump`, 'Prepare remote dump directory');
  await runChecked(
    'rsync',
    ['-avz', localArchivePath, `${REMOTE}:${remoteArchivePath}`],
    'Transfer Moonshade MongoDB dump'
  );
  return remoteArchivePath;
}

async function restoreArchiveToStagingDatabase(remoteArchivePath, sourceDbName) {
  const script = `
    set -euo pipefail
    mongorestore --drop --gzip \
      --archive=${quoteShell(remoteArchivePath)} \
      --nsFrom='${LOCAL_DB}.*' \
      --nsTo='${sourceDbName}.*'
  `;
  await runRemoteChecked(script, 'Restore Moonshade dump into staging database');
}

async function runMergePreflight(sourceDbName) {
  const script = `
    set -euo pipefail
    cd ${REMOTE_APP_DIR}
    MERGE_SOURCE_DB=${quoteShell(sourceDbName)} MERGE_TARGET_DB=${quoteShell(REMOTE_DB)} node backend/scripts/merge-staged-db.js preflight
  `;
  return runRemote(script);
}

async function applyStagedMerge(sourceDbName) {
  const script = `
    set -euo pipefail
    cd ${REMOTE_APP_DIR}
    MERGE_SOURCE_DB=${quoteShell(sourceDbName)} MERGE_TARGET_DB=${quoteShell(REMOTE_DB)} node backend/scripts/merge-staged-db.js apply
  `;
  await runRemoteChecked(script, 'Apply staged MongoDB merge');
}

async function backupNeonazothBeforeMerge() {
  await runRemoteChecked(`cd ${REMOTE_APP_DIR} && npm run backup:full`, 'NeonAzoth pre-merge backup');
}

async function copyMoonshadeMediaToNeonazoth() {
  const mediaRoot = path.join(REPO_ROOT, 'backend', 'media') + '/';
  await runRemoteChecked(`cd ${REMOTE_APP_DIR} && mkdir -p backend/media`, 'Prepare remote media directory');
  console.log('Copying Moonshade media with --ignore-existing; NeonAzoth media files will not be overwritten.');
  await runChecked(
    'rsync',
    ['-avz', '--ignore-existing', mediaRoot, `${REMOTE}:${REMOTE_APP_DIR}/backend/media/`],
    'Copy Moonshade media to NeonAzoth'
  );
}

async function dumpNeonazothDatabase(stamp) {
  const fileName = `neonazoth-${REMOTE_DB}-overwrite-local-source-${stamp}.archive.gz`;
  const remoteAppAbsDir = await getRemoteAppAbsDir();
  const remoteArchivePath = `${remoteAppAbsDir}/dump/${fileName}`;
  await runRemoteChecked(
    `
      set -euo pipefail
      cd ${REMOTE_APP_DIR}
      mkdir -p dump
      mongodump --db=${quoteShell(REMOTE_DB)} --archive=${quoteShell(`dump/${fileName}`)} --gzip
    `,
    'NeonAzoth MongoDB dump'
  );
  return {
    fileName,
    remoteArchivePath,
    localArchivePath: path.join(REPO_ROOT, 'dump', fileName),
  };
}

async function transferNeonazothArchiveToMoonshade(remoteArchivePath, localArchivePath) {
  fs.mkdirSync(path.dirname(localArchivePath), { recursive: true });
  await runChecked(
    'rsync',
    ['-avz', `${REMOTE}:${remoteArchivePath}`, localArchivePath],
    'Transfer NeonAzoth MongoDB dump to Moonshade'
  );
}

async function backupMoonshadeBeforeOverwrite(stamp) {
  fs.mkdirSync(path.join(REPO_ROOT, 'dump'), { recursive: true });
  const archivePath = path.join(
    REPO_ROOT,
    'dump',
    `moonshade-${LOCAL_DB}-before-neonazoth-overwrite-${stamp}.archive.gz`
  );
  await runChecked(
    'mongodump',
    [`--db=${LOCAL_DB}`, `--archive=${archivePath}`, '--gzip'],
    'Moonshade pre-overwrite MongoDB backup'
  );
  return archivePath;
}

async function backupMoonshadeMediaBeforeOverwrite(stamp) {
  const mediaRoot = path.join(REPO_ROOT, 'backend', 'media');
  const backupDir = path.join(
    REPO_ROOT,
    'dump',
    `moonshade-media-before-neonazoth-overwrite-${stamp}`
  );
  fs.mkdirSync(backupDir, { recursive: true });
  await runChecked(
    'rsync',
    ['-av', `${mediaRoot}/`, `${backupDir}/`],
    'Moonshade pre-overwrite media backup'
  );
  return backupDir;
}

function neonazothMediaRsyncArgs({ dryRun }) {
  return [
    dryRun ? '-avzn' : '-avz',
    '--delete',
    `${REMOTE}:${REMOTE_APP_DIR}/backend/media/`,
    `${path.join(REPO_ROOT, 'backend', 'media')}/`,
  ];
}

async function previewNeonazothMediaOverwrite() {
  console.log('');
  console.log('Media overwrite dry run:');
  await runChecked(
    'rsync',
    neonazothMediaRsyncArgs({ dryRun: true }),
    'Preview NeonAzoth media overwrite'
  );
}

async function restoreNeonazothDatabaseOverMoonshade(localArchivePath) {
  await runChecked(
    'mongorestore',
    [
      '--drop',
      '--gzip',
      `--archive=${localArchivePath}`,
      `--nsFrom=${REMOTE_DB}.*`,
      `--nsTo=${LOCAL_DB}.*`,
    ],
    'Restore NeonAzoth database over Moonshade'
  );
}

async function overwriteMoonshadeMediaFromNeonazoth() {
  await runChecked(
    'rsync',
    neonazothMediaRsyncArgs({ dryRun: false }),
    'Overwrite Moonshade media from NeonAzoth'
  );
}

async function overwriteMoonshadeFromNeonazoth(rl) {
  console.log('');
  console.log('This wizard OVERWRITES this MacBook database and media from NeonAzoth.');
  console.log('');
  console.log('Destructive effects:');
  console.log(`- drops and restores local MongoDB database: ${LOCAL_DB}`);
  console.log('- replaces local backend/media with NeonAzoth backend/media using rsync --delete');
  console.log('- local-only database records and local-only media files are removed unless restored from backup');
  console.log('');
  console.log('Safety steps:');
  console.log('- creates a local MongoDB archive before overwrite');
  console.log('- creates a local backend/media backup directory before overwrite');
  console.log('- downloads a fresh NeonAzoth MongoDB archive');
  console.log('- shows an rsync --delete dry run before destructive media sync');

  if (!(await askConfirm(rl, 'Create backups and preview overwrite?', { defaultValue: false }))) {
    return;
  }

  await assertLocalCommand('mongodump', 'Install MongoDB Database Tools on this Mac before running overwrite.');
  await assertLocalCommand('mongorestore', 'Install MongoDB Database Tools on this Mac before running overwrite.');
  await assertLocalCommand('rsync', 'Install rsync on this Mac before running overwrite.');
  await assertRemoteCommand('mongodump', 'Install MongoDB Database Tools on NeonAzoth before running overwrite.');

  const stamp = timestampForName();
  const localBackupArchive = await backupMoonshadeBeforeOverwrite(stamp);
  const localMediaBackupDir = await backupMoonshadeMediaBeforeOverwrite(stamp);
  const remoteDump = await dumpNeonazothDatabase(stamp);
  await transferNeonazothArchiveToMoonshade(
    remoteDump.remoteArchivePath,
    remoteDump.localArchivePath
  );
  await previewNeonazothMediaOverwrite();

  console.log('');
  console.log('Rollback artifacts created:');
  console.log(`- MongoDB backup: ${localBackupArchive}`);
  console.log(`- media backup: ${localMediaBackupDir}`);
  console.log('');
  console.log('Manual DB rollback command if needed:');
  console.log(
    `mongorestore --drop --gzip --archive=${quoteShell(localBackupArchive)} --nsFrom='${LOCAL_DB}.*' --nsTo='${LOCAL_DB}.*'`
  );
  console.log('');
  const typed = await askText(
    rl,
    'Type OVERWRITE LOCAL FROM NEONAZOTH to drop local DB and replace local media',
    {
      validate(value) {
        if (value !== 'OVERWRITE LOCAL FROM NEONAZOTH') {
          throw new Error('Exact confirmation phrase did not match.');
        }
        return value;
      },
    }
  );
  if (typed !== 'OVERWRITE LOCAL FROM NEONAZOTH') return;

  await restoreNeonazothDatabaseOverMoonshade(remoteDump.localArchivePath);
  await overwriteMoonshadeMediaFromNeonazoth();
  console.log('');
  console.log('Local Moonshade database and media now match NeonAzoth.');
}

async function syncMergeToolingToNeonazoth() {
  await runRemoteChecked(`cd ${REMOTE_APP_DIR} && mkdir -p backend/scripts`, 'Prepare remote script directory');
  await runChecked(
    'rsync',
    [
      '-avz',
      path.join(REPO_ROOT, 'backend', 'scripts', 'merge-staged-db.js'),
      `${REMOTE}:${REMOTE_APP_DIR}/backend/scripts/merge-staged-db.js`,
    ],
    'Sync merge tooling to NeonAzoth'
  );
  await runRemoteChecked(
    `cd ${REMOTE_APP_DIR} && node --check backend/scripts/merge-staged-db.js`,
    'Check remote merge tooling syntax'
  );
}

async function dropStagingDatabase(sourceDbName) {
  await runRemoteChecked(
    `mongosh --quiet ${quoteShell(sourceDbName)} --eval 'db.dropDatabase()' >/dev/null`,
    'Drop staging database'
  );
}

async function mergeMoonshadeIntoNeonazoth(rl) {
  console.log('');
  console.log('This wizard merges Moonshade MongoDB data into NeonAzoth.');
  console.log('');
  console.log('Hard stops:');
  console.log('- refuses to apply if any box short IDs overlap');
  console.log('- also refuses on staged batch/media unique-key collisions');
  console.log('');
  console.log('Safety steps:');
  console.log('- creates a fresh full NeonAzoth backup before writes');
  console.log('- restores Moonshade into a temporary staging DB first');
  console.log('- stops the app while applying the merge');
  console.log('- copies Moonshade media without deleting or overwriting NeonAzoth media');

  if (!(await askConfirm(rl, 'Create staging dump and run merge preflight?', { defaultValue: false }))) {
    return;
  }

  await assertLocalCommand('mongodump', 'Install MongoDB Database Tools on this Mac before running the merge wizard.');
  await assertRemoteCommand(
    'mongorestore',
    'Install MongoDB Database Tools on NeonAzoth before running the merge wizard.'
  );
  await assertRemoteCommand(
    'mongodump',
    'Install MongoDB Database Tools on NeonAzoth before running the merge wizard.'
  );
  await assertRemoteCommand('mongosh', 'Install mongosh on NeonAzoth before running the merge wizard.');

  const stamp = timestampForName();
  const sourceDbName = `discowarpcore_moonshade_merge_${stamp.replace(/[^0-9]/g, '')}`;

  await syncMergeToolingToNeonazoth();
  const localArchivePath = await dumpMoonshadeDatabase(stamp);
  const remoteArchivePath = await transferArchiveToNeonazoth(localArchivePath);
  await restoreArchiveToStagingDatabase(remoteArchivePath, sourceDbName);

  console.log('');
  console.log('Running preflight collision check...');
  const preflight = await runMergePreflight(sourceDbName);
  if (preflight.code !== 0) {
    throw new Error(`Preflight failed. Staging database retained for inspection: ${sourceDbName}`);
  }

  console.log('');
  console.log('Preflight passed.');
  if (!(await askConfirm(rl, 'Back up NeonAzoth, copy media, apply merge, and restart?', { defaultValue: false }))) {
    console.log(`Staging database retained for now: ${sourceDbName}`);
    return;
  }

  await backupNeonazothBeforeMerge();
  await stopServerForWizard();
  await copyMoonshadeMediaToNeonazoth();
  await applyStagedMerge(sourceDbName);
  await dropStagingDatabase(sourceDbName);
  await startServer();
  console.log('');
  console.log('Moonshade data and media merge completed.');
}

async function stopServerForWizard() {
  const script = `
    set +e
    cd ${REMOTE_APP_DIR} || exit 1
    PIDS="$(${SERVER_PID_AWK})"
    if [ -z "$PIDS" ]; then
      echo "Server is not running."
      exit 0
    fi
    echo "$PIDS" | xargs kill
    sleep 2
    if [ -n "$(${SERVER_PID_AWK})" ]; then
      echo "Existing server process is still running." >&2
      exit 1
    fi
    rm -f var/logs/server.pid
    echo "Server stopped."
  `;
  await runRemoteChecked(script, 'Stop server for merge');
}

async function syncBuildRestart(rl) {
  console.log('');
  console.log('This sync uses --delete on neonazoth source files, but preserves:');
  console.log('  backend/media/ backend/.env dump/ var/ .git/ node_modules/ frontend/dist/');
  if (!(await askConfirm(rl, 'Run the real sync, install/build, and restart?', { defaultValue: false }))) {
    return;
  }
  await syncSource({ dryRun: false });
  await installAndBuild();
  await restartServer(rl);
}

async function followLogs() {
  console.log('Following remote log. Press Ctrl-C to stop log view.');
  await runRemote(`cd ${REMOTE_APP_DIR} && mkdir -p var/logs && tail -f var/logs/server.log`);
}

async function openUrlHint() {
  const result = await captureRemote(LAN_IP_SCRIPT);
  const ip = result.stdout.trim() || '<neonazoth-ip>';
  console.log('');
  console.log(`Open this from any device on the LAN: http://${ip}:${REMOTE_PORT}`);
}

async function checkMergePrerequisites() {
  printHeader();
  await assertLocalCommand('mongodump', 'Install MongoDB Database Tools on this Mac before running the merge wizard.');
  console.log('local mongodump: ok');
  await assertRemoteCommand('mongorestore', 'Install MongoDB Database Tools on NeonAzoth before running the merge wizard.');
  console.log('remote mongorestore: ok');
  await assertRemoteCommand('mongodump', 'Install MongoDB Database Tools on NeonAzoth before running the merge wizard.');
  console.log('remote mongodump: ok');
  await assertRemoteCommand('mongosh', 'Install mongosh on NeonAzoth before running the merge wizard.');
  console.log('remote mongosh: ok');
}

async function checkOverwritePrerequisites() {
  printHeader();
  await assertLocalCommand('mongodump', 'Install MongoDB Database Tools on this Mac before running overwrite.');
  console.log('local mongodump: ok');
  await assertLocalCommand('mongorestore', 'Install MongoDB Database Tools on this Mac before running overwrite.');
  console.log('local mongorestore: ok');
  await assertLocalCommand('rsync', 'Install rsync on this Mac before running overwrite.');
  console.log('local rsync: ok');
  await assertRemoteCommand('mongodump', 'Install MongoDB Database Tools on NeonAzoth before running overwrite.');
  console.log('remote mongodump: ok');
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
  if (arg === '--start') {
    await startServer();
    return;
  }
  if (arg === '--merge-check') {
    await checkMergePrerequisites();
    return;
  }
  if (arg === '--overwrite-local-check') {
    await checkOverwritePrerequisites();
    return;
  }

  if (!process.stdin.isTTY) {
    throw new Error('Remote control TUI requires an interactive terminal. Use --status, --url, --start, --merge-check, or --overwrite-local-check for one-shot checks.');
  }

  const rl = createPromptSession();
  try {
    while (true) {
      printHeader();
      const action = await askSelect(rl, 'Action', [
        { label: 'Status and health check', value: 'status' },
        { label: 'Start server', value: 'start' },
        { label: 'Stop server', value: 'stop' },
        { label: 'Restart server', value: 'restart' },
        { label: 'Follow server log', value: 'logs' },
        { label: 'Protected source sync dry run', value: 'sync_dry' },
        { label: 'Protected sync + install + build + restart', value: 'sync_build_restart' },
        { label: 'Merge Moonshade DB + media into NeonAzoth', value: 'merge_moonshade' },
        { label: 'Overwrite local DB + media from NeonAzoth', value: 'overwrite_local' },
        { label: 'Show LAN URL', value: 'url' },
        { label: 'Quit', value: 'quit' },
      ]);

      if (action === 'quit') break;

      try {
        if (action === 'status') await showStatus();
        if (action === 'start') await startServer();
        if (action === 'stop') await stopServer(rl);
        if (action === 'restart') await restartServer(rl);
        if (action === 'logs') await followLogs();
        if (action === 'sync_dry') await syncSource({ dryRun: true });
        if (action === 'sync_build_restart') await syncBuildRestart(rl);
        if (action === 'merge_moonshade') await mergeMoonshadeIntoNeonazoth(rl);
        if (action === 'overwrite_local') await overwriteMoonshadeFromNeonazoth(rl);
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
