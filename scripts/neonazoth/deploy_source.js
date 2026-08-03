#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const REMOTE = process.env.NEONAZOTH_REMOTE || 'warptrail@neonazoth';
const REMOTE_APP_DIR = process.env.NEONAZOTH_APP_DIR || '~/discowarpcore';
const REMOTE_PORT = process.env.NEONAZOTH_PORT || '5002';
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
  '.env',
  '.env.*',
  '.DS_Store',
  '**/.DS_Store',
  '*.log',
  '*.pid',
  '*.sock',
  '*.backup*',
  '*.bak-*',
  'frontend/node_modules/',
  'frontend/dist/',
  'backend/media/',
  'dump/',
  'var/',
  'test/output/',
];

const LAN_IP_SCRIPT = 'ip route get 1.1.1.1 2>/dev/null | sed -n "s/.* src \\\\([0-9.]*\\\\).*/\\\\1/p" | head -n1';

if (!/^\d+$/.test(String(REMOTE_PORT))) {
  throw new Error(`NEONAZOTH_PORT must be numeric; received ${REMOTE_PORT}`);
}

function quoteShell(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function runCommand(command, args, {
  cwd = REPO_ROOT,
  capture = false,
  timeoutMs = 0,
} = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let timeoutTimer = null;

    if (capture) {
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
    }

    if (timeoutMs > 0) {
      timeoutTimer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
      }, timeoutMs);
      timeoutTimer.unref?.();
    }

    child.on('error', (error) => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      resolve({ code: 1, stdout, stderr, error, timedOut });
    });

    child.on('close', (code, signal) => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      resolve({ code: timedOut ? 124 : code, signal, stdout, stderr, timedOut });
    });
  });
}

function rsyncArgs({ dryRun }) {
  return [
    dryRun ? '-avzn' : '-avz',
    '--human-readable',
    '--progress',
    '--stats',
    '--delete',
    ...RSYNC_EXCLUDES.flatMap((entry) => ['--exclude', entry]),
    './',
    `${REMOTE}:${REMOTE_APP_DIR}/`,
  ];
}

function remoteProbeScript() {
  return `
    set +e
    printf 'hostname=%s\\n' "$(hostname 2>/dev/null || true)"
    printf 'primary_ip=%s\\n' "$(${LAN_IP_SCRIPT})"
    printf 'all_ips=%s\\n' "$(hostname -I 2>/dev/null | xargs 2>/dev/null || true)"
    HEALTH_CODE="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 4 http://127.0.0.1:${REMOTE_PORT}/api/health 2>/dev/null || true)"
    printf 'health_code=%s\\n' "$HEALTH_CODE"
  `;
}

function parseRemoteProbe(output = '') {
  const values = {};
  for (const line of String(output).split(/\r?\n/)) {
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    values[line.slice(0, separator)] = line.slice(separator + 1).trim();
  }
  return {
    hostname: values.hostname || '',
    primaryIp: values.primary_ip || '',
    allIps: (values.all_ips || '').split(/\s+/).filter(Boolean),
    healthCode: values.health_code || '',
  };
}

function lanUrl(ip) {
  return `http://${ip || '<neonazoth-ip>'}:${REMOTE_PORT}`;
}

function isNonLoopbackIpv4(value) {
  return /^(?!127\.)(?:\d{1,3}\.){3}\d{1,3}$/.test(value);
}

function formatHealth(healthCode) {
  if (!healthCode || healthCode === '000') return 'not reachable';
  if (healthCode === '200') return `healthy (${healthCode})`;
  return `returned HTTP ${healthCode}`;
}

function phase(label, message) {
  console.log(`\n[${label}] ${message}`);
}

function printRemoteState(state, label) {
  console.log(`  ${label} host:   ${state.hostname || REMOTE}`);
  console.log(`  ${label} LAN IP:  ${state.primaryIp || '<not detected>'}`);
  console.log(`  ${label} health:  ${formatHealth(state.healthCode)}`);
}

async function probeRemote() {
  const result = await runCommand(
    'ssh',
    [...SSH_OPTIONS, REMOTE, `bash -lc ${quoteShell(remoteProbeScript())}`],
    { capture: true, timeoutMs: 20_000 }
  );
  if (result.code !== 0) {
    const detail = result.stderr.trim() || `exit code ${result.code}`;
    throw new Error(`Could not query ${REMOTE}: ${detail}`);
  }
  return parseRemoteProbe(result.stdout);
}

async function localState() {
  const [revision, status] = await Promise.all([
    runCommand('git', ['log', '-1', '--format=%h %s'], { capture: true, timeoutMs: 5_000 }),
    runCommand('git', ['status', '--porcelain=v1'], { capture: true, timeoutMs: 5_000 }),
  ]);
  if (revision.code !== 0) return 'unavailable';
  const changedPaths = status.code === 0
    ? status.stdout.split(/\r?\n/).filter(Boolean).length
    : null;
  return changedPaths === null
    ? revision.stdout.trim()
    : `${revision.stdout.trim()} (${changedPaths} uncommitted path${changedPaths === 1 ? '' : 's'})`;
}

async function verifyLanUrl(state) {
  if (!state.primaryIp) return { code: null, skipped: true };
  return runCommand(
    'curl',
    ['--noproxy', '*', '--silent', '--show-error', '--output', '/dev/null', '--write-out', '%{http_code}', '--max-time', '5', lanUrl(state.primaryIp) + '/api/health'],
    { capture: true, timeoutMs: 8_000 }
  );
}

function printUsage() {
  console.log('Usage: node scripts/neonazoth/deploy_source.js [--dry-run]');
  console.log('');
  console.log('Sync source to Neonazoth with protected exclusions and a chatty status report.');
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has('--help') || args.has('-h')) {
    printUsage();
    return;
  }
  const dryRun = args.has('--dry-run');
  const unknownArgs = [...args].filter((arg) => arg !== '--dry-run');
  if (unknownArgs.length > 0) {
    throw new Error(`Unknown option: ${unknownArgs.join(', ')}`);
  }

  console.log('╭──────────────────────────────────────────────────────────────╮');
  console.log(`│ ${dryRun ? 'NEONAZOTH PROTECTED DEPLOY PREVIEW' : 'NEONAZOTH SOURCE DEPLOY'}                  │`);
  console.log('╰──────────────────────────────────────────────────────────────╯');
  console.log(`  local revision: ${await localState()}`);
  console.log(`  target:         ${REMOTE}:${REMOTE_APP_DIR}`);
  console.log(`  app URL port:   ${REMOTE_PORT}`);
  console.log('  protected:      runtime, secrets, media, databases, logs, build caches');

  phase('1/4', 'Checking SSH access, remote identity, current LAN address, and current health');
  const before = await probeRemote();
  printRemoteState(before, 'before');

  phase('2/4', dryRun ? 'Running protected rsync preview' : 'Synchronizing source with live progress and transfer stats');
  const sync = await runCommand('rsync', rsyncArgs({ dryRun }), { timeoutMs: 20 * 60 * 1000 });
  if (sync.code !== 0) {
    throw new Error(`rsync failed with exit code ${sync.code}.`);
  }
  console.log(`  ${dryRun ? 'Preview' : 'Source sync'} completed successfully.`);

  if (dryRun) {
    console.log('\n[dry run complete] No remote files were changed.');
    console.log(`  If approved, run: npm run deploy:neonazoth`);
    return;
  }

  phase('3/4', 'Re-checking the remote service and resolving the LAN address');
  const after = await probeRemote();
  printRemoteState(after, 'after');

  phase('4/4', 'Testing the LAN URL from this machine');
  const lanCheck = await verifyLanUrl(after);
  if (lanCheck.skipped) {
    console.log('  Could not test the LAN URL because Neonazoth did not report an IP address.');
  } else if (lanCheck.code === 0) {
    console.log(`  LAN request returned HTTP ${lanCheck.stdout.trim() || 'unknown'}.`);
  } else {
    console.log(`  LAN request could not be verified from this machine (${lanCheck.stderr.trim() || `exit code ${lanCheck.code}`}).`);
  }

  console.log('\n╭─ DEPLOY RESULT ──────────────────────────────────────────────');
  console.log(`│ Open from the LAN: ${lanUrl(after.primaryIp)}`);
  const otherLanIps = after.allIps.filter((ip) => ip !== after.primaryIp && isNonLoopbackIpv4(ip));
  if (otherLanIps.length > 0) {
    console.log(`│ Other remote IPs:  ${otherLanIps.join(', ')}`);
  }
  console.log('│');
  console.log('│ This command syncs source only. It does not npm install, build,');
  console.log('│ or restart the running Express/Vite services.');
  console.log('╰──────────────────────────────────────────────────────────────');
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`\n✖ Deploy stopped: ${error?.message || error}`);
    process.exit(1);
  });
}

module.exports = {
  LAN_IP_SCRIPT,
  REMOTE_APP_DIR,
  REMOTE_PORT,
  RSYNC_EXCLUDES,
  lanUrl,
  parseRemoteProbe,
  remoteProbeScript,
  rsyncArgs,
};
