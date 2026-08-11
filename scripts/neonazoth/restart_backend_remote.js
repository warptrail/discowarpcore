#!/usr/bin/env node

const fs = require('fs');
const fsp = require('fs/promises');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const BACKEND_ENTRY = 'backend/server.js';
const EXPECTED_HOST = process.env.NEONAZOTH_EXPECTED_HOST || 'neonazoth';
const RUNTIME_DIR = path.join(PROJECT_ROOT, '.runtime');
const LOG_PATH = path.join(RUNTIME_DIR, 'production-backend.log');
const STATE_PATH = path.join(RUNTIME_DIR, 'production-backend.json');
const STOP_TIMEOUT_MS = 12_000;
const START_TIMEOUT_MS = 45_000;

require('dotenv').config({ path: path.join(PROJECT_ROOT, 'backend', '.env') });

function normalizeCommandLine(value) {
  return String(value || '')
    .replace(/\0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isExpectedBackendProcess({ commandLine, cwd }, projectRoot = PROJECT_ROOT) {
  const normalizedCwd = path.resolve(String(cwd || ''));
  const normalizedCommand = normalizeCommandLine(commandLine);
  const commandParts = normalizedCommand.split(' ').filter(Boolean);
  return (
    normalizedCwd === path.resolve(projectRoot) &&
    path.basename(commandParts[0] || '') === 'node' &&
    commandParts.includes(BACKEND_ENTRY)
  );
}

function readProcessInfo(pid) {
  try {
    return {
      pid,
      commandLine: fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8'),
      cwd: fs.readlinkSync(`/proc/${pid}/cwd`),
    };
  } catch {
    return null;
  }
}

function findVerifiedBackendProcesses() {
  return fs.readdirSync('/proc', { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
    .map((entry) => readProcessInfo(Number(entry.name)))
    .filter(Boolean)
    .filter((info) => isExpectedBackendProcess(info));
}

function assertRemoteIdentity({ hostname = os.hostname(), projectRoot = PROJECT_ROOT } = {}) {
  const shortHostname = String(hostname || '').split('.', 1)[0].toLowerCase();
  if (shortHostname !== EXPECTED_HOST.toLowerCase()) {
    throw new Error(
      `Refusing production restart on host "${hostname}"; expected "${EXPECTED_HOST}".`,
    );
  }
  if (path.basename(path.resolve(projectRoot)) !== 'discowarpcore') {
    throw new Error(`Refusing restart from unexpected project root: ${projectRoot}`);
  }
}

function requestHealth(port) {
  return new Promise((resolve) => {
    const request = http.get({
      hostname: '127.0.0.1',
      port,
      path: '/api/health',
      timeout: 2500,
    }, (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });
    request.on('timeout', () => request.destroy());
    request.on('error', () => resolve(false));
  });
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    const finish = (open) => {
      socket.destroy();
      resolve(open);
    };
    socket.setTimeout(1500);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function waitFor(check, expected, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check() === expected) return true;
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  return false;
}

async function stopVerifiedBackend(processInfo) {
  console.log(`[restart] stopping verified backend pid=${processInfo.pid}`);
  process.kill(processInfo.pid, 'SIGTERM');
  const stopped = await waitFor(
    () => Boolean(readProcessInfo(processInfo.pid)),
    false,
    STOP_TIMEOUT_MS,
  );
  if (!stopped) {
    throw new Error(
      `Verified backend pid=${processInfo.pid} did not stop after SIGTERM; refusing to force-kill it.`,
    );
  }
}

async function startBackend(port) {
  await fsp.mkdir(RUNTIME_DIR, { recursive: true });
  const logHandle = await fsp.open(LOG_PATH, 'a');
  const child = spawn('npm', ['start'], {
    cwd: PROJECT_ROOT,
    detached: true,
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
    stdio: ['ignore', logHandle.fd, logHandle.fd],
  });
  child.unref();
  await logHandle.close();

  await fsp.writeFile(STATE_PATH, `${JSON.stringify({
    launcherPid: child.pid,
    startedAt: new Date().toISOString(),
    hostname: os.hostname(),
    port,
    projectRoot: PROJECT_ROOT,
  }, null, 2)}\n`, { mode: 0o600 });

  console.log(`[restart] started npm launcher pid=${child.pid}`);
  const healthy = await waitFor(() => requestHealth(port), true, START_TIMEOUT_MS);
  if (!healthy) {
    throw new Error(`Backend did not become healthy on port ${port}; inspect ${LOG_PATH}`);
  }

  const running = findVerifiedBackendProcesses();
  if (running.length !== 1) {
    throw new Error(
      `Expected one verified backend after startup, found ${running.length}; inspect ${LOG_PATH}`,
    );
  }
  console.log(`[restart] healthy backend pid=${running[0].pid} port=${port}`);
}

async function main() {
  assertRemoteIdentity();

  const port = Number(process.env.PORT || process.env.NEONAZOTH_PORT || 5002);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid production port: ${process.env.PORT || process.env.NEONAZOTH_PORT}`);
  }

  const running = findVerifiedBackendProcesses();
  if (running.length > 1) {
    throw new Error(`Refusing restart: found ${running.length} matching backend processes.`);
  }

  if (running.length === 0 && await isPortOpen(port)) {
    throw new Error(
      `Port ${port} is occupied but no process matches ${PROJECT_ROOT}/${BACKEND_ENTRY}; refusing to stop an unknown listener.`,
    );
  }

  if (running.length === 1) {
    await stopVerifiedBackend(running[0]);
    const released = await waitFor(() => isPortOpen(port), false, STOP_TIMEOUT_MS);
    if (!released) {
      throw new Error(`Port ${port} stayed occupied after the verified backend stopped.`);
    }
  }

  await startBackend(port);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`✖ Guarded production restart failed: ${error?.message || error}`);
    process.exit(1);
  });
}

module.exports = {
  EXPECTED_HOST,
  PROJECT_ROOT,
  assertRemoteIdentity,
  isExpectedBackendProcess,
  normalizeCommandLine,
};
