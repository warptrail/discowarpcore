#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  chmodSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildDiagnosticReport, renderDoctor, renderSupportMarkdown } from './tarot-runtime/diagnostics.mjs';
import { attachJsonLineHandler, requestJsonLine } from './tarot-runtime/ipc.mjs';
import { createLineCollector, appendLogEntries, readLogEntries, rotateLog } from './tarot-runtime/log-store.mjs';
import { createActionSerializer, nextRetry } from './tarot-runtime/lifecycle.mjs';
import { healthContract, validateManifest } from './tarot-runtime/manifest.mjs';
import { atomicWriteFile, atomicWriteJson, redactValue, safeReadJson } from './tarot-runtime/persistence.mjs';
import { probeReadiness } from './tarot-runtime/probe.mjs';
import { commandFingerprint, signalProcessGroup } from './tarot-runtime/process.mjs';
import { createRuntimeService, displayState, newRunId, publicServiceState, transitionService } from './tarot-runtime/state.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runtime = resolve(root, '.runtime');
const manifestPath = resolve(root, 'tarot.manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const profileName = process.argv.includes('production') ? 'production' : 'development';
const profile = manifest.profiles?.[profileName] || manifest.profiles.development;
const manifestValidation = validateManifest(manifest, root, profileName);
if (!manifestValidation.valid) throw new Error(`Invalid tarot.manifest.json:\n- ${manifestValidation.errors.join('\n- ')}`);
const withoutMongo = process.argv.includes('--without-mongo') || process.env.TAROT_WITHOUT_MONGO === '1';
const recoverRequested = process.argv.includes('--recover');
const projectName = manifest.displayName || manifest.projectId || 'Tarot project';
const socketPath = resolve(runtime, 'tarot-dock.sock');
const lockPath = resolve(runtime, 'tarot-dock.lock');
const statePath = resolve(runtime, 'tarot-dock-state.json');
const logsDirectory = resolve(runtime, 'tarot-logs');
const incidentPath = resolve(runtime, 'tarot-incidents.json');
const supportDirectory = resolve(runtime, 'tarot-support');
const bootstrapLogPath = resolve(runtime, 'tarot-agent-bootstrap.log');
const shellDirectory = resolve(runtime, 'tarot-dock-shell');
const dockScript = resolve(root, 'scripts/tarot-dock.mjs');
const agentScript = resolve(root, 'scripts/tarot-agent.mjs');
const sigilSymbols = ['⌁', '⋮', '⟡', '◌', '╳', '∷', '◇', '⊹', '◈', '░', '▒', '▓'];
const terminalPalette = [31, 32, 33, 34, 35, 36, 91, 92, 93, 94, 95, 96];
const hash = createHash('sha256').update(projectName).digest();
const sigil = Array.from({ length: 8 }, (_, index) => sigilSymbols[hash[index] % sigilSymbols.length]).join('');
const requestedAccent = Number(manifest.branding?.terminalColor);
const accentColor = terminalPalette.includes(requestedAccent) ? requestedAccent : terminalPalette[hash[8] % terminalPalette.length];
const services = new Map((profile.services || []).map((service) => [service.id, createRuntimeService(service)]));
const agentSessionId = `agent-${Date.now()}-${randomUUID().slice(0, 8)}`;
let incidents = safeReadJson(incidentPath, []);
let selectedAddress = 2;
let viewMode = 'status';
let logServiceId = '';
let lockOwned = false;
let shuttingDown = false;
let observationTimer = null;
let lastHeartbeatAt = 0;
let warpFrame = 0;
let logSequence = 0;
let agentServer = null;
const enqueueAction = createActionSerializer();

function recordIncident(type, service, message, details = {}) {
  incidents.push({
    id: randomUUID(),
    at: new Date().toISOString(),
    type,
    serviceId: service?.id || '',
    message,
    ...details,
  });
  incidents = incidents.slice(-500);
  atomicWriteJson(incidentPath, incidents);
}

function paint(code, value) {
  return process.stdout.isTTY ? `\u001b[${code}m${value}\u001b[0m` : value;
}

function clip(value, width) {
  const characters = Array.from(String(value));
  if (width <= 0) return '';
  return characters.length > width ? `${characters.slice(0, Math.max(0, width - 1)).join('')}…` : value;
}

function serviceLogPath(service) {
  return resolve(logsDirectory, `${String(service.id).replace(/[^a-z0-9_-]/gi, '-')}.jsonl`);
}

function frontendLanAdapter(service) {
  const args = service.args || [];
  const direct = [service.command, ...args].join(' ').toLowerCase();
  if (/\btarot-static-server\.mjs\b/.test(direct)) return 'static';
  if (/\bvinext\b/.test(direct)) return 'vinext';
  if (/\bvite\b/.test(direct)) return 'vite';
  if (/\bnext\b/.test(direct)) return 'next';
  if (/\breact-scripts\b/.test(direct)) return 'react-scripts';
  if (service.command !== 'npm') return '';
  const runIndex = args.indexOf('run');
  const scriptName = runIndex >= 0 ? args[runIndex + 1] : '';
  const serviceRoot = resolve(root, service.cwd || '.');
  const packagePath = resolve(serviceRoot, 'package.json');
  if ((!serviceRoot.startsWith(`${root}/`) && serviceRoot !== root) || !existsSync(packagePath)) return '';
  try {
    const script = String(JSON.parse(readFileSync(packagePath, 'utf8')).scripts?.[scriptName] || '').toLowerCase();
    if (/\bvinext\b/.test(script)) return 'vinext';
    if (/\bvite\b/.test(script)) return 'vite';
    if (/\bnext\b/.test(script)) return 'next';
    return /\breact-scripts\b/.test(script) ? 'react-scripts' : '';
  } catch { return ''; }
}

function migrateFrontendLanContracts(candidateManifest) {
  if (candidateManifest.network?.development?.lan?.enabled === false) return false;
  let changed = false;
  for (const service of candidateManifest.profiles?.development?.services || []) {
    const adapter = frontendLanAdapter(service);
    if (service.monitorOnly || service.lan || !adapter) continue;
    service.lan = { enabled: true, adapter, host: '0.0.0.0' };
    changed = true;
  }
  return changed;
}

function run(command, args, options = {}) {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', (error) => resolveRun({ code: -1, stdout, stderr, error }));
    child.once('exit', (code) => resolveRun({ code: code ?? 1, stdout, stderr }));
  });
}

function acquireLock() {
  mkdirSync(runtime, { recursive: true });
  try {
    const descriptor = openSync(lockPath, 'wx');
    writeFileSync(descriptor, JSON.stringify({
      schemaVersion: 1,
      pid: process.pid,
      processStartedAt: processStartTime(process.pid),
      projectRoot: root,
      projectId: manifest.projectId,
      agentSessionId,
      tarotVersion: manifest.tarotVersion || manifest.version || '',
      socketPath,
      acquiredAt: new Date().toISOString(),
    }, null, 2));
    closeSync(descriptor);
    lockOwned = true;
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const pid = readLock().pid;
    if (isTarotDockProcess(pid)) throw new Error('Tarot Dock is already running in this project.');
    unlinkSync(lockPath);
    acquireLock();
  }
}

function readLock() {
  if (!existsSync(lockPath)) return { pid: 0 };
  const raw = readFileSync(lockPath, 'utf8').trim();
  try {
    const parsed = JSON.parse(raw);
    return { ...parsed, pid: Number(parsed.pid) || 0 };
  } catch { return { pid: Number(raw) || 0, legacy: true }; }
}

function processStartTime(pid) {
  const result = spawnSync('ps', ['-p', String(pid), '-o', 'lstart='], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : '';
}

function isTarotDockProcess(pid) {
  if (!Number.isInteger(pid) || pid < 1) return false;
  try { process.kill(pid, 0); } catch { return false; }
  const inspection = spawnSync('ps', ['-p', String(pid), '-o', 'command='], { encoding: 'utf8' });
  if (inspection.status !== 0 || !/(?:^|[\\/ ])tarot-(?:dock|agent)\.mjs(?:\s|$)/.test(inspection.stdout || '')) return false;
  const cwd = spawnSync('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'], { encoding: 'utf8' });
  const processRoot = (cwd.stdout || '').split(/\r?\n/).find((line) => line.startsWith('n'))?.slice(1);
  if (!processRoot || resolve(processRoot) !== root) return false;
  const lock = readLock();
  return !lock.processStartedAt || !processStartTime(pid) || lock.processStartedAt === processStartTime(pid);
}

async function waitForDockExit(pid, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isTarotDockProcess(pid)) return true;
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  return !isTarotDockProcess(pid);
}

async function recoverExistingDock() {
  if (!recoverRequested || !existsSync(lockPath)) return;
  const pid = readLock().pid;
  if (!isTarotDockProcess(pid)) return;
  console.log(`Recovering the prior Tarot Dock for ${projectName} (PID ${pid})…`);
  try { process.kill(pid, 'SIGTERM'); } catch (error) { throw new Error(`Could not signal the prior Tarot Dock: ${error.message}`); }
  if (!await waitForDockExit(pid)) throw new Error(`The prior Tarot Dock (PID ${pid}) did not close. Close that project's Tarot terminal, then retry.`);
  try { rmSync(socketPath, { force: true }); } catch {}
  try { unlinkSync(lockPath); } catch {}
  console.log('Prior Tarot Dock released. Starting a fresh Dock…');
}

function releaseLock() {
  if (!lockOwned) return;
  try { if (readLock().pid === process.pid) unlinkSync(lockPath); } catch {}
  lockOwned = false;
}

function resolveCommand(service) {
  const env = Object.fromEntries(Object.entries(service.env || {}).map(([key, value]) => [key, String(value)]));
  const externalRoot = service.cwdEnv ? process.env[service.cwdEnv] : '';
  if (service.cwdEnv && !externalRoot) return { error: `${service.cwdEnv} is not configured for ${service.label || service.id}.` };
  const configuredCwd = resolve(externalRoot || root, service.cwd || '.');
  if (!service.cwdEnv && !configuredCwd.startsWith(`${root}/`) && configuredCwd !== root) return { error: `${service.label || service.id} has a working directory outside this project.` };
  if (!existsSync(configuredCwd)) return { error: `${service.label || service.id} working directory was not found: ${service.cwd || '.'}` };
  const lan = serviceLan(service);
  const commandArgs = applyLanBinding(service, normalizeNpmPrefix(service, service.args || [], configuredCwd), env, lan);
  if (service.command === 'npm') return { command: process.platform === 'win32' ? 'npm.cmd' : 'npm', args: commandArgs, cwd: configuredCwd, env };
  return { command: service.command, args: commandArgs, cwd: configuredCwd, env };
}

function normalizeNpmPrefix(service, args, configuredCwd) {
  if (service.command !== 'npm') return [...args];
  const prefixIndex = args.indexOf('--prefix');
  const prefix = prefixIndex >= 0 ? args[prefixIndex + 1] : '';
  if (!prefix) return [...args];
  const fromServiceCwd = resolve(configuredCwd, prefix);
  const fromProjectRoot = resolve(root, prefix);
  // A copied manifest can legitimately contain both cwd: "frontend" and
  // --prefix frontend. npm then looks for frontend/frontend/package.json.
  // Remove only that exact redundant prefix; never rewrite an arbitrary path.
  if (!existsSync(fromServiceCwd) && existsSync(fromProjectRoot)) return args.filter((_, index) => index !== prefixIndex && index !== prefixIndex + 1);
  return [...args];
}

function serviceLan(service) {
  const enabled = profileName === 'development' && manifest.network?.development?.lan?.enabled !== false && service.lan?.enabled !== false;
  const adapter = service.lan?.adapter || '';
  return { enabled, adapter, host: service.lan?.host || manifest.network?.development?.lan?.host || '0.0.0.0' };
}

function computerLanHostname() {
  const hostname = os.hostname().trim().replace(/\.$/, '');
  return hostname && hostname !== 'localhost' && !net.isIP(hostname) ? (hostname.includes('.') ? hostname : `${hostname}.local`) : '';
}

function appendDelimitedEnv(env, key, value) {
  if (!value) return;
  const values = new Set(String(env[key] || '').split(',').map((item) => item.trim()).filter(Boolean));
  values.add(value);
  env[key] = [...values].join(',');
}

function appendLaunchFlags(service, args, flags) {
  if (service.command === 'npm' && !args.includes('--')) return [...args, '--', ...flags];
  return [...args, ...flags];
}

function applyLanBinding(service, args, env, lan) {
  if (!lan.enabled || !lan.adapter) return [...args];
  if (lan.adapter === 'env') {
    env.HOST ||= lan.host;
    env.TAROT_LAN_HOST ||= lan.host;
    return [...args];
  }
  const hasHost = args.some((argument) => argument === '--host' || argument.startsWith('--host='));
  if (lan.adapter === 'uvicorn') return hasHost ? [...args] : [...args, '--host', lan.host];
  if (lan.adapter === 'vite') {
    appendDelimitedEnv(env, '__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS', computerLanHostname());
    if (hasHost) return [...args];
    return appendLaunchFlags(service, args, ['--host', lan.host]);
  }
  if (lan.adapter === 'vinext') {
    appendDelimitedEnv(env, '__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS', computerLanHostname());
    const hasHostname = args.some((argument) => argument === '--hostname' || argument.startsWith('--hostname='));
    if (hasHostname) return [...args];
    return appendLaunchFlags(service, args, ['--hostname', lan.host]);
  }
  if (lan.adapter === 'next') {
    const hasHostname = args.some((argument) => ['-H', '--hostname'].includes(argument) || argument.startsWith('--hostname='));
    return hasHostname ? [...args] : appendLaunchFlags(service, args, ['-H', lan.host]);
  }
  if (lan.adapter === 'react-scripts') {
    env.HOST ||= lan.host;
    return [...args];
  }
  if (lan.adapter === 'static') {
    const hasStaticHost = args.some((argument) => argument === '--host' || argument.startsWith('--host='));
    const hasStaticPort = args.some((argument) => argument === '--port' || argument.startsWith('--port='));
    return [
      ...args,
      ...(hasStaticHost ? [] : ['--host', lan.host]),
      ...(hasStaticPort ? [] : ['--port', String(service.port)]),
    ];
  }
  return [...args];
}

async function listeners(port) {
  const result = await run('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fp']);
  const pids = [...new Set([...result.stdout.matchAll(/^p(\d+)$/gm)].map((match) => Number(match[1])))];
  return Promise.all(pids.map(async (pid) => {
    const [command, executable, parent, started, cwd] = await Promise.all([
      run('ps', ['-p', String(pid), '-o', 'command=']),
      run('ps', ['-p', String(pid), '-o', 'comm=']),
      run('ps', ['-p', String(pid), '-o', 'ppid=']),
      run('ps', ['-p', String(pid), '-o', 'lstart=']),
      run('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn']),
    ]);
    return {
      pid,
      ppid: Number(parent.stdout.trim()) || null,
      command: command.stdout.trim(),
      executable: executable.stdout.trim(),
      processStartedAt: started.stdout.trim(),
      cwd: (cwd.stdout.split(/\r?\n/).find((line) => line.startsWith('n')) || '').slice(1),
    };
  }));
}

function commandIdentityTokens(service, serviceCommand) {
  const source = [service.command, ...(service.args || []), serviceCommand.command, ...serviceCommand.args].join(' ').toLowerCase();
  const tokens = new Set();
  ['vite', 'vinext', 'next', 'react-scripts', 'uvicorn', 'flask', 'nodemon'].forEach((token) => { if (source.includes(token)) tokens.add(token); });
  for (const argument of service.args || []) {
    if (/\.(?:m?js|cjs|py|rb|go)$/i.test(argument)) tokens.add(argument.split('/').pop().toLowerCase());
  }
  if (service.command && service.command !== 'npm') tokens.add(service.command.split('/').pop().toLowerCase());
  return [...tokens].filter((token) => token.length > 2);
}

function belongsTo(serviceCommand, listener, service = {}) {
  if (!listener.cwd) return false;
  const expected = resolve(serviceCommand.cwd);
  const actual = resolve(listener.cwd);
  if (!(actual === expected || actual.startsWith(`${expected}/`))) return false;
  if (service.process?.pid && listener.pid === service.process.pid) return true;
  const tokens = commandIdentityTokens(service, serviceCommand);
  if (!tokens.length) return false;
  const observed = `${listener.executable || ''} ${listener.command || ''}`.toLowerCase();
  return tokens.some((token) => observed.includes(token));
}

async function probeService(service) {
  const contract = healthContract(service);
  const activeListeners = await listeners(service.port);
  return probeReadiness({ contract: service.protocol === 'mongodb' ? { ...contract, type: 'tcp' } : contract, port: service.port, listenerPresent: activeListeners.length > 0 });
}

async function refresh(forceHealth = false) {
  await Promise.all([...services.values()].map(async (service) => {
    const activeListeners = await listeners(service.port);
    if (service.monitorOnly) {
      if (withoutMongo && service.protocol === 'mongodb') {
        service.state = 'bypassed';
        transitionService(service, { processState: 'absent', healthState: 'unknown', ownershipState: 'system' }, 'Bypassed by --without-mongo.');
        service.state = 'bypassed';
      } else {
        transitionService(service, {
          processState: activeListeners.length ? 'running' : 'absent',
          healthState: activeListeners.length ? 'healthy' : 'unknown',
          ownershipState: 'system',
        }, activeListeners.length ? 'Observed a system-managed listener.' : 'System service is not listening.');
      }
      return;
    }
    const command = resolveCommand(service);
    const verified = !command.error && activeListeners.length > 0 && activeListeners.every((listener) => belongsTo(command, listener, service));
    const owned = Boolean(service.process && service.process.exitCode == null);
    const ownershipState = owned ? 'tarot' : verified ? 'verified-project' : activeListeners.length ? 'unknown' : 'unknown';
    const processState = owned
      ? (service.processState === 'stopping' ? 'stopping' : activeListeners.length ? 'running' : 'starting')
      : activeListeners.length ? 'running' : service.processState === 'exited' ? 'exited' : 'absent';
    service.observedPids = activeListeners.map((listener) => listener.pid);
    service.observedProcessStartedAt = activeListeners.map((listener) => listener.processStartedAt).filter(Boolean);
    transitionService(service, { processState, ownershipState }, activeListeners.length ? 'Live listener evidence reconciled.' : owned ? 'Process is running but has not opened its port yet.' : 'No live process or listener evidence.');
    if (activeListeners.length && (forceHealth || Date.now() >= (service.nextProbeAt || 0))) {
      const previousHealth = service.healthState;
      transitionService(service, { healthState: 'checking' }, 'Checking declared readiness contract.');
      const result = await probeService(service);
      service.probe = result;
      service.lastProbeAt = result.checkedAt;
      service.nextProbeAt = Date.now() + healthContract(service).intervalMs;
      transitionService(service, { healthState: result.ok ? 'healthy' : 'unhealthy', processState: 'running' }, result.message);
      service.error = result.ok ? '' : result.message;
      if (previousHealth !== service.healthState && previousHealth !== 'checking') {
        recordIncident('health-transition', service, `${previousHealth} -> ${service.healthState}: ${result.message}`);
      }
    } else if (!activeListeners.length && !owned) {
      transitionService(service, { healthState: 'unknown' });
    }
  }));
  persist();
}

async function ensureMongo() {
  const mongo = [...services.values()].find((service) => service.protocol === 'mongodb');
  if (!mongo) return true;
  if (withoutMongo) {
    transitionService(mongo, { processState: 'absent', healthState: 'unknown', ownershipState: 'system' }, 'Bypassed by --without-mongo.');
    mongo.state = 'bypassed';
    mongo.error = 'Bypassed by --without-mongo.';
    persist();
    return true;
  }
  if ((await listeners(mongo.port)).length) {
    transitionService(mongo, { processState: 'running', healthState: 'healthy', ownershipState: 'system' }, 'Observed a ready system-managed MongoDB listener.');
    mongo.error = '';
    persist();
    return true;
  }
  const [command, ...args] = mongo.startCommand || [];
  if (!command) {
    mongo.state = 'error';
    mongo.error = 'No MongoDB start command is declared in tarot.manifest.json.';
    persist();
    return false;
  }
  transitionService(mongo, { processState: 'starting', healthState: 'checking', ownershipState: 'system' }, 'Requested the declared MongoDB manager to start the service.');
  mongo.error = '';
  persist();
  const started = await run(command, args, { cwd: root });
  const managementFailure = started.error || started.code !== 0
    ? [started.stderr.trim(), started.stdout.trim(), started.error?.message].filter(Boolean).join(' · ') || `Could not run ${command} ${args.join(' ')}.`
    : '';
  const attempts = Math.ceil((mongo.startupTimeoutMs || 30000) / 500);
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if ((await listeners(mongo.port)).length) {
      transitionService(mongo, { processState: 'running', healthState: 'healthy', ownershipState: 'system' }, managementFailure ? 'MongoDB became ready even though its management command reported an error.' : 'MongoDB is ready.');
      mongo.error = managementFailure ? `Warning: ${managementFailure}` : '';
      if (managementFailure) recordIncident('mongo-management-warning', mongo, mongo.error);
      persist();
      return true;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  transitionService(mongo, { processState: 'absent', healthState: 'unhealthy', ownershipState: 'system' }, `MongoDB did not listen on :${mongo.port} during the observation window.`);
  mongo.error = managementFailure || `MongoDB did not listen on :${mongo.port} after its start command.`;
  recordIncident('mongo-start-failed', mongo, mongo.error);
  persist();
  return false;
}

function mongoFailureMessage() {
  const mongo = [...services.values()].find((service) => service.protocol === 'mongodb');
  const detail = mongo?.error ? ` ${mongo.error}` : '';
  return `MongoDB could not be started.${detail} Retry with mongo start, or use npm run tarot -- --without-mongo for degraded mode.`;
}

function addresses() {
  const primary = services.get(manifest.primaryService) || [...services.values()].find((service) => service.port);
  const port = primary?.port || 7609;
  const lan = primary && serviceLan(primary).enabled && Boolean(serviceLan(primary).adapter);
  const hostname = os.hostname().trim().replace(/\.$/, '');
  const computer = hostname && hostname !== 'localhost' && !net.isIP(hostname) ? (hostname.includes('.') ? hostname : `${hostname}.local`) : null;
  const networks = Object.values(os.networkInterfaces()).flat().filter((item) => item?.family === 'IPv4' && !item.internal);
  return [
    { label: 'localhost', url: `http://localhost:${port}/` },
    ...(lan && computer ? [{ label: computer, url: `http://${computer}:${port}/` }] : []),
    ...(lan ? [{ label: 'LAN IP', url: `http://${networks[0]?.address || '127.0.0.1'}:${port}/` }] : []),
  ];
}

function addressIndex(reference) {
  const available = addresses();
  if (!reference) return -1;
  if (/^\d+$/.test(reference)) return Number(reference) - 1;
  const value = reference.toLowerCase();
  if (['local', 'localhost', 'l'].includes(value)) return available.findIndex((address) => address.label === 'localhost');
  if (['computer', 'host', 'hostname', 'c'].includes(value)) return available.findIndex((address) => address.label !== 'localhost' && address.label !== 'LAN IP');
  if (['lan', 'network', 'n'].includes(value)) return available.findIndex((address) => address.label === 'LAN IP');
  return -1;
}

function persist() {
  const publicServices = [...services.values()].map((service, index) => ({ ...publicServiceState(service, index), logs: service.logs.slice(-24) }));
  atomicWriteJson(statePath, { schemaVersion: 1, agentSessionId, updatedAt: new Date().toISOString(), projectName, profile: profile.label || profileName.toUpperCase(), sigil, accentColor, selectedAddress, viewMode, logServiceId, services: publicServices, addresses: addresses() });
  heartbeatRegistry(publicServices);
}

function heartbeatRegistry(publicServices, force = false) {
  const registry = manifest.registry || {};
  const now = Date.now();
  if (!registry.url || (!force && now - lastHeartbeatAt < 30000)) return;
  lastHeartbeatAt = now;
  const url = `${String(registry.url).replace(/\/$/, '')}/heartbeat`;
  const servicesPayload = publicServices.filter((service) => !service.monitorOnly).map((service) => ({ serviceId: service.id, profile: profileName, state: service.state, port: service.port }));
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId: manifest.projectId, projectName, rootPath: root, source: manifest.sync?.source || '', tarotVersion: manifest.tarotVersion || manifest.version || '', syncChannel: manifest.sync?.channel || 'stable', services: servicesPayload }),
    signal: AbortSignal.timeout(1500),
  }).catch(() => {});
}

function resolveService(reference) {
  if (!reference) return null;
  if (/^\d+$/.test(reference)) return [...services.values()][Number(reference) - 1] || null;
  return services.get(reference) || null;
}

function openLogs(reference) {
  if (reference && !resolveService(reference)) return `Unknown Scry slot or service: ${reference}.`;
  const service = reference ? resolveService(reference) : (services.get(logServiceId) || [...services.values()].find((item) => item.logs.length) || [...services.values()][0]);
  if (!service) return 'This Tarot manifest has no services.';
  viewMode = 'logs';
  logServiceId = service.id;
  persist();
  return renderScry(service);
}

function toggleView(reference) {
  if (reference) return openLogs(reference);
  if (viewMode === 'logs') {
    viewMode = 'status';
    persist();
    return renderDeck();
  }
  return openLogs();
}

function stopTree(child, signal = 'SIGTERM') {
  signalProcessGroup(child, signal);
}

async function releasePort(service, command) {
  const activeListeners = await listeners(service.port);
  const unknown = activeListeners.filter((listener) => !belongsTo(command, listener, service));
  if (unknown.length) return `:${service.port} belongs to unverified ${unknown.map((item) => `PID ${item.pid}`).join(', ')}; left untouched.`;
  for (const listener of activeListeners) {
    try { process.kill(listener.pid, 'SIGTERM'); } catch {}
  }
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (!(await listeners(service.port)).length) return null;
    await new Promise((resolveWait) => setTimeout(resolveWait, 125));
  }
  return `Could not release :${service.port} from the prior verified ${service.label} process.`;
}

function startupTimeoutMs(service) {
  const configured = Number(healthContract(service).startupTimeoutMs || service.startupTimeoutMs);
  return Number.isFinite(configured) && configured > 0 ? configured : 60000;
}

async function waitForServiceReady(service, timeoutMs = startupTimeoutMs(service)) {
  const deadline = Date.now() + timeoutMs;
  service.startupDeadlineAt = new Date(deadline).toISOString();
  while (Date.now() < deadline) {
    const result = await probeService(service);
    service.probe = result;
    service.lastProbeAt = result.checkedAt;
    if (result.ok) return true;
    if (!service.process || service.process.exitCode != null) return false;
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  return false;
}

async function start(serviceId, options = {}) {
  const service = services.get(serviceId);
  if (!service) return `Unknown service: ${serviceId}.`;
  if (service.monitorOnly) return `${service.label} is observed only; Tarot will not start or stop it.`;
  if (service.process && service.process.exitCode == null) return `${service.label} is already Tarot-owned.`;
  if (service.verified && service.healthState === 'healthy') return `${service.label} is already running under a verified project listener; Tarot did not replace it.`;
  if (service.dependsOn?.includes('mongodb') && !(await ensureMongo()) && !withoutMongo) {
    return 'MongoDB could not be started. Fix the MongoDB service or restart Tarot with npm run tarot -- --without-mongo.';
  }
  const command = resolveCommand(service);
  if (command.error) return command.error;
  service.commandFingerprint = commandFingerprint(command);
  const portProblem = await releasePort(service, command);
  if (portProblem) { service.state = 'error'; service.error = portProblem; persist(); return portProblem; }
  service.runId = newRunId(service.id);
  if (!options.retry) service.restartAttempts = 0;
  service.startedAt = Date.now();
  service.intentionalStop = false;
  service.exitCode = null;
  service.exitSignal = null;
  transitionService(service, { processState: 'starting', healthState: 'checking', ownershipState: 'tarot' }, `Starting run ${service.runId}.`);
  service.error = ''; service.logs = [];
  mkdirSync(logsDirectory, { recursive: true });
  appendLogEntries(serviceLogPath(service), [{ type: 'run-start', message: `Run ${service.runId} started.`, stream: 'tarot', runId: service.runId, capturedAt: Date.now(), sequence: ++logSequence }]);
  const childEnvironment = { ...process.env, ...command.env, DECKONE_TAROT_ACTIVE: '1' };
  if (withoutMongo) childEnvironment.TAROT_WITHOUT_MONGO = '1';
  const child = spawn(command.command, command.args, {
    cwd: command.cwd,
    detached: process.platform !== 'win32',
    env: childEnvironment,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  service.process = child;
  service.pid = child.pid;
  service.processStartedAt = processStartTime(child.pid);
  const collectEntries = (entries) => {
    service.logs.push(...entries);
    service.logs = service.logs.slice(-24);
    appendLogEntries(serviceLogPath(service), entries);
    persist();
  };
  const stdout = createLineCollector({ stream: 'out', runId: service.runId, onEntries: collectEntries, nextSequence: () => ++logSequence });
  const stderr = createLineCollector({ stream: 'error', runId: service.runId, onEntries: collectEntries, nextSequence: () => ++logSequence });
  child.stdout.on('data', (chunk) => stdout.write(chunk));
  child.stderr.on('data', (chunk) => stderr.write(chunk));
  child.once('error', (error) => {
    service.error = `Could not spawn ${service.label}: ${error.message}`;
    transitionService(service, { processState: 'exited', healthState: 'unhealthy', ownershipState: 'tarot' }, service.error);
    recordIncident('spawn-error', service, service.error, { code: error.code || '' });
    persist();
  });
  child.once('exit', (code, signal) => {
    stdout.flush(); stderr.flush();
    const intentional = service.intentionalStop;
    service.process = null;
    service.exitCode = code;
    service.exitSignal = signal;
    const exitDetail = signal || (code ?? 'unknown');
    const message = intentional ? `Stopped intentionally${signal ? ` by ${signal}` : ''}.` : `Exited unexpectedly (${exitDetail}).`;
    transitionService(service, { processState: intentional ? 'absent' : 'exited', healthState: 'unknown', ownershipState: 'unknown' }, message);
    service.error = intentional ? '' : message;
    if (!intentional) {
      recordIncident('unexpected-exit', service, message, { code, signal, runId: service.runId });
      const early = Date.now() - (service.startedAt || 0) <= startupTimeoutMs(service);
      const retry = nextRetry(service.restartAttempts, early);
      if (retry) {
        service.restartAttempts = retry.attempt;
        recordIncident('retry-scheduled', service, `Retry ${retry.attempt}/2 scheduled in ${retry.delayMs} ms.`, { runId: service.runId });
        setTimeout(() => enqueueAction(() => start(service.id, { retry: true })).catch(() => {}), retry.delayMs);
      }
    }
    persist();
  });
  if (await waitForServiceReady(service)) {
    transitionService(service, { processState: 'running', healthState: 'healthy', ownershipState: 'tarot' }, service.probe?.message || 'Readiness contract passed.');
    service.error = '';
    persist();
    return `${service.label} awakened on :${service.port}.`;
  }
  // Keep a still-running process in starting state.  It may be completing a
  // backfill or other legitimate boot work; refresh() will promote it to live
  // as soon as the listener and health endpoint become available.
  if (service.process && service.process.exitCode == null) {
    const contract = healthContract(service);
    transitionService(service, { processState: 'running', healthState: 'unhealthy', ownershipState: 'tarot' }, `Startup deadline expired while ${contract.type.toUpperCase()} readiness was still failing.`);
    service.error = service.probe?.message || `Readiness did not pass on :${service.port}.`;
    recordIncident('startup-timeout', service, service.error, { runId: service.runId });
    persist();
    return `${service.label} is running but unhealthy on :${service.port}: ${service.error}`;
  }
  transitionService(service, { processState: 'exited', healthState: 'unhealthy', ownershipState: 'unknown' }, 'The process exited before readiness passed.');
  service.error ||= `Service exited before becoming ready on :${service.port}.`;
  persist();
  return `${service.label} did not become healthy.`;
}

async function startWithDependencies(serviceId, visited = new Set()) {
  const service = services.get(serviceId);
  if (!service) return [{ serviceId, status: 'failed', message: `Unknown service: ${serviceId}.` }];
  if (visited.has(serviceId)) return [];
  visited.add(serviceId);
  const outcomes = [];
  for (const dependency of service.dependsOn || []) {
    const dependencyService = services.get(dependency);
    if (!dependencyService) {
      outcomes.push({ serviceId, status: 'blocked', message: `${service.label} requires missing dependency ${dependency}.` });
      return outcomes;
    }
    if (dependencyService.healthState !== 'healthy') {
      outcomes.push(...await startWithDependencies(dependency, visited));
      await refresh(true);
      if (dependencyService.healthState !== 'healthy') {
        outcomes.push({ serviceId, status: 'blocked', message: `${service.label} could not start because ${dependencyService.label} is unavailable.` });
        return outcomes;
      }
    }
  }
  const message = await start(serviceId);
  await refresh();
  outcomes.push({ serviceId, status: /awakened on|already Tarot-owned|already running under a verified/.test(message) ? 'succeeded' : 'failed', message });
  return outcomes;
}

async function stop(serviceId) {
  const service = services.get(serviceId);
  if (!service) return `Unknown service: ${serviceId}.`;
  if (service.monitorOnly) return `${service.label} is observed only; it stays under system ownership.`;
  if (!service.process) {
    const command = resolveCommand(service);
    if (command.error) return command.error;
    const activeListeners = await listeners(service.port);
    const verified = activeListeners.length > 0 && activeListeners.every((listener) => belongsTo(command, listener, service));
    if (!verified) return `${service.label} is not a verified DeckOne service, so it was left running.`;
    const portProblem = await releasePort(service, command);
    if (portProblem) return portProblem;
    service.verified = false;
    service.state = 'quiet';
    persist();
    return `${service.label} released from its verified DeckOne provider.`;
  }
  const child = service.process;
  service.intentionalStop = true;
  transitionService(service, { processState: 'stopping' }, 'An intentional Tarot stop was requested.');
  persist();
  stopTree(child, 'SIGTERM');
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (child.exitCode != null || !(await listeners(service.port)).length) break;
    await new Promise((resolveWait) => setTimeout(resolveWait, 125));
  }
  if (child.exitCode == null && (await listeners(service.port)).length) {
    stopTree(child, 'SIGKILL');
    recordIncident('stop-escalated', service, 'SIGTERM exceeded five seconds; Tarot sent SIGKILL to the verified owned process group.');
  }
  service.process = null;
  transitionService(service, { processState: 'absent', healthState: 'unknown', ownershipState: 'unknown' }, 'Tarot verified the service stopped.');
  service.error = '';
  persist();
  return `${service.label} released.`;
}

async function copy(reference) {
  if (!reference) {
    return [
      'Choose a relay to copy:',
      ...addresses().map((address, index) => `  ${index + 1}. ${address.label}  ${address.url}`),
      'Use copy local, copy lan, copy computer, or copy <number>.',
    ].join('\n');
  }
  const index = addressIndex(reference);
  if (!addresses()[index]) {
    if (['lan', 'network', 'n'].includes(String(reference).toLowerCase())) return 'LAN relay is unavailable because the primary frontend is not LAN-configured.';
    return `Unknown link choice: ${reference}. Try local, computer, lan, or 1–${addresses().length}.`;
  }
  selectedAddress = index;
  const address = addresses()[index];
  const command = process.platform === 'darwin' ? 'pbcopy' : 'xclip';
  const args = process.platform === 'darwin' ? [] : ['-selection', 'clipboard'];
  const child = spawn(command, args, { stdio: ['pipe', 'ignore', 'ignore'] });
  child.stdin.end(address.url);
  persist();
  return `Copied ${address.label}: ${address.url}`;
}

function diagnosticReport() {
  return buildDiagnosticReport({
    root,
    manifest,
    profileName,
    statePath,
    lockPath,
    socketPath,
    releasePath: resolve(root, 'tarot-port.release.json'),
    incidents,
    state: safeReadJson(statePath, null),
  });
}

function filteredReport(report, reference) {
  if (!reference || reference.startsWith('--')) return report;
  const service = resolveService(reference);
  if (!service) throw new Error(`Unknown service: ${reference}.`);
  return { ...report, services: report.services.filter((entry) => entry.id === service.id) };
}

function diagnosticsCommand(args = []) {
  const report = filteredReport(diagnosticReport(), args.find((argument) => !argument.startsWith('--')));
  return args.includes('--json') ? JSON.stringify(report, null, 2) : renderDoctor(report);
}

function explainService(reference) {
  const service = reference ? resolveService(reference) : [...services.values()].find((entry) => entry.healthState === 'unhealthy' || entry.processState === 'exited') || [...services.values()][0];
  if (!service) return 'This Tarot manifest has no services.';
  const next = service.ownershipState === 'unknown' && service.processState === 'running'
    ? 'Do not stop it automatically. Run tarot doctor for ownership evidence.'
    : service.healthState === 'unhealthy'
      ? `Inspect scry ${[...services.keys()].indexOf(service.id) + 1}, then restart ${service.id} if its error is understood.`
      : service.processState === 'absent'
        ? `Run start ${service.id}, or awaken for the complete dependency-safe stack.`
        : 'No repair is currently required.';
  return [
    `✦ TAROT EXPLAINS / ${service.label}`,
    `  Display: ${displayState(service).toUpperCase()}`,
    `  Process: ${service.processState} · health: ${service.healthState} · ownership: ${service.ownershipState}`,
    `  Evidence: ${service.stateReason || 'No transition reason recorded.'}`,
    `  Last probe: ${service.lastProbeAt || 'not yet'}${service.probe?.message ? ` · ${service.probe.message}` : ''}`,
    `  Safest next action: ${next}`,
  ].join('\n');
}

function incidentsCommand(args = []) {
  const limitIndex = args.indexOf('--limit');
  const reference = args.find((argument, index) => !argument.startsWith('--') && index !== limitIndex + 1);
  const service = reference ? resolveService(reference) : null;
  if (reference && !service) return `Unknown service: ${reference}.`;
  const limit = Math.min(200, Math.max(1, Number(args[limitIndex + 1]) || 20));
  const selected = incidents.filter((incident) => !service || incident.serviceId === service.id).slice(-limit);
  return selected.length ? selected.map((incident) => `${incident.at}  ${incident.serviceId || 'tarot'}  ${incident.type}  ${incident.message}`).join('\n') : 'No matching Tarot incidents are recorded.';
}

function copyText(value) {
  if (process.platform !== 'darwin') return false;
  const child = spawn('pbcopy', [], { stdio: ['pipe', 'ignore', 'ignore'] });
  child.stdin.end(value);
  return true;
}

function reportCommand(args = []) {
  const unsafeFull = args.includes('--unsafe-full');
  const asJson = args.includes('--json');
  const reference = args.find((argument) => !argument.startsWith('--') && args[args.indexOf(argument) - 1] !== '--output');
  const report = filteredReport(diagnosticReport(), reference);
  const output = asJson ? JSON.stringify(unsafeFull ? report : redactValue(report, { projectRoot: root }), null, 2) : renderSupportMarkdown(report, unsafeFull);
  const outputIndex = args.indexOf('--output');
  const defaultPath = resolve(supportDirectory, `${new Date().toISOString().replace(/[:.]/g, '-')}.${asJson ? 'json' : 'md'}`);
  const outputPath = outputIndex >= 0 && args[outputIndex + 1] ? resolve(root, args[outputIndex + 1]) : defaultPath;
  mkdirSync(dirname(outputPath), { recursive: true });
  atomicWriteFile(outputPath, `${output}\n`, 0o600);
  if (args.includes('--copy')) copyText(output);
  return `Tarot support report written to ${outputPath}${args.includes('--copy') ? ' and copied to the clipboard' : ''}.`;
}

function repairCommand(args = []) {
  if (args.includes('--preview')) return [
    '✦ TAROT REPAIR PREVIEW',
    '  rotate-logs   Rotate Tarot-managed service logs without touching application data.',
    '  rebuild-state Reconcile runtime state from live listeners and health evidence.',
    'Apply one repair explicitly: tarot repair --apply <repair-id>',
  ].join('\n');
  const applyIndex = args.indexOf('--apply');
  const repairId = applyIndex >= 0 ? args[applyIndex + 1] : '';
  if (repairId === 'rotate-logs') {
    for (const service of services.values()) rotateLog(serviceLogPath(service), true);
    recordIncident('repair', null, 'Rotated Tarot service logs by explicit request.');
    return 'Tarot service logs were rotated.';
  }
  if (repairId === 'rebuild-state') {
    refresh(true).catch(() => {});
    recordIncident('repair', null, 'Requested runtime-state reconciliation from live evidence.');
    return 'Tarot is rebuilding runtime state from live evidence.';
  }
  return 'Use tarot repair --preview, then tarot repair --apply <repair-id>.';
}

async function control(parts) {
  const [verb = 'status', argument] = parts;
  // Legacy hooks are deliberately no-ops. A normal shell must never have a
  // reserved scroll region or be repainted above a running command.
  if (verb === 'reflow' || verb === 'redraw') return '';
  if (verb === 'awaken' || verb === 'raise') {
    if (!(await ensureMongo()) && !withoutMongo) return mongoFailureMessage();
    const outcomes = [];
    const seen = new Set();
    for (const service of [...services.values()].filter((item) => item.autostart && !item.monitorOnly)) {
      for (const outcome of await startWithDependencies(service.id)) {
        if (seen.has(outcome.serviceId) && outcome.status === 'succeeded') continue;
        seen.add(outcome.serviceId);
        outcomes.push(outcome.message);
      }
    }
    await refresh(true); return outcomes.join('\n');
  }
  if (verb === 'start') return (await startWithDependencies(argument)).map((outcome) => outcome.message).join('\n');
  if (verb === 'mongo') {
    const mongo = [...services.values()].find((service) => service.protocol === 'mongodb');
    if (!mongo) return 'This Tarot manifest does not declare MongoDB.';
    if (argument === 'start' || argument === 'awaken') return (await ensureMongo()) ? `MongoDB is ready on :${mongo.port}.` : mongoFailureMessage();
    await refresh();
    return `MongoDB: ${mongo.state} :${mongo.port}${mongo.error ? ` · ${mongo.error}` : ''}`;
  }
  if (verb === 'stop' || verb === 'banish') {
    if (argument) return stop(argument);
    const outcomes = [];
    for (const service of [...services.values()].reverse()) {
      if (service.monitorOnly) continue;
      const command = resolveCommand(service);
      const activeListeners = command.error ? [] : await listeners(service.port);
      const verified = Boolean(service.process) || (activeListeners.length > 0 && activeListeners.every((listener) => belongsTo(command, listener, service)));
      if (verified) outcomes.push(await stop(service.id));
    }
    await refresh();
    return outcomes.length ? outcomes.join('\n') : 'No verified DeckOne services were running.';
  }
  if (verb === 'restart') { await stop(argument); return (await startWithDependencies(argument)).map((outcome) => outcome.message).join('\n'); }
  if (verb === 'scry-all') return 'Open the live all-service relay with scry-all.';
  if (verb === 'view' || verb === 'scry') return toggleView(argument);
  if (verb === 'logs') return openLogs(argument);
  if (verb === 'status') {
    viewMode = 'status';
    await refresh();
    return renderStatus();
  }
  if (verb === 'deck') { viewMode = 'status'; await refresh(); return renderDeck(); }
  if (verb === 'prompt') { warpFrame += 1; return promptStatus(); }
  if (verb === 'ports') return [...services.values()].map((service) => `${service.label.padEnd(22)} :${service.port}  ${service.notes || ''}`).join('\n');
  if (verb === 'links') return addresses().map((address, index) => `${index + 1}. ${address.label}: ${address.url}`).join('\n');
  if (verb === 'select') { const index = addressIndex(argument); if (!addresses()[index]) return 'Choose local, computer, lan, or a link number.'; selectedAddress = index; persist(); return `Selected ${addresses()[index].label}.`; }
  if (verb === 'copy') return copy(argument);
  if (verb === 'doctor') return diagnosticsCommand(parts.slice(1));
  if (verb === 'explain') return explainService(argument);
  if (verb === 'incidents') return incidentsCommand(parts.slice(1));
  if (verb === 'report') return reportCommand(parts.slice(1));
  if (verb === 'repair') return repairCommand(parts.slice(1));
  if (verb === 'help') return [
    paint(String(accentColor), `✦ TAROT GUIDE / ${projectName.toUpperCase()}`),
    paint('35', '  AWAKEN  awaken · awaken --scry · start <service> · restart <service> · stop [service] · banish'),
    paint('35', '  OBSERVE scry = status portal · scry-all = live all-service relay · scry <1–n> / logs <1–n> = snapshot'),
    paint('35', '  MAP     status · deck · ports · links'),
    paint('35', '  RELAYS  copy = choose · copy local / lan / computer · 1–3 = direct copy · C / c = LAN'),
    paint('35', '  DIAGNOSE tarot doctor [service] · tarot explain [service] · tarot incidents · tarot report --copy'),
    paint('35', '  SYSTEM  mongo [start] · tarot repair --preview · farewell = release Tarot services and close'),
    paint('2', '  Scry Portal keys: [1–9] logs · [a] all-service relay · [s] status · [q / Esc] return to shell'),
  ].join('\n');
  if (verb === 'farewell') {
    await shutdown();
    setTimeout(() => agentServer?.close(() => process.exit(0)), 20);
    return 'Tarot released its services and closed its agent.';
  }
  return `Unknown Tarot command: ${verb}. Try tarot help.`;
}

function servicePresentation(service, index) {
  const live = service.healthState === 'healthy';
  const external = service.ownershipState === 'unknown' && service.processState === 'running';
  const owner = service.monitorOnly ? 'SYSTEM' : external ? 'UNKNOWN' : service.ownershipState === 'tarot' ? 'TAROT' : service.ownershipState === 'verified-project' ? 'PROJECT' : 'IDLE';
  const failing = ['unhealthy', 'error'].includes(service.state) || service.healthState === 'unhealthy';
  const status = failing ? 'ERROR' : live ? 'ONLINE' : service.processState === 'starting' ? 'WAKING' : service.state === 'bypassed' ? 'BYPASS' : service.processState === 'running' ? 'OBSERVED' : 'QUIET';
  const color = failing ? '91' : live ? (external || service.monitorOnly ? '96' : '92') : '2';
  const marker = live ? '●' : failing ? '×' : '○';
  const lan = serviceLan(service);
  const lanState = service.monitorOnly ? '' : lan.adapter ? `  LAN / ${lan.enabled ? 'READY' : 'OFF'}` : lan.enabled ? '  LAN / MANUAL' : '';
  return paint(color, `${marker} ${index + 1} · ${service.label} :${service.port}  ${status}  OWNER / ${owner}${lanState}${service.error ? ` · ${service.error}` : ''}`);
}

function liveSummary() {
  const managed = [...services.values()].filter((service) => !service.monitorOnly);
  const running = managed.filter((service) => ['tarot', 'verified-project'].includes(service.ownershipState) && service.healthState === 'healthy').length;
  const external = managed.filter((service) => service.ownershipState === 'unknown' && service.processState === 'running').length;
  return { running, total: managed.length, external, active: running > 0 };
}

function promptStatus() {
  const { running, total, external, active } = liveSummary();
  return `${running}/${total}${external ? ` +${external} external` : ''} ${active ? 'active' : 'quiet'}`;
}

function warpCore() {
  return liveSummary().active ? ['◒', '◓', '◑', '◐'][warpFrame % 4] : '○';
}

function renderStatus() {
  return [...services.values()].map((service, index) => servicePresentation(service, index)).join('\n');
}

function renderDeck() {
  const { running, total } = liveSummary();
  const links = addresses().map((address, index) => `[${index + 1}] ${address.label}`).join(' · ');
  return [
    paint(String(accentColor), `✦ TAROT / ${projectName.toUpperCase()} · ${sigil} · ${running}/${total} services · ${warpCore()}`),
    paint('35', '  STATUS DECK'),
    renderStatus(),
    paint(String(accentColor), `  LINK RELAYS  ${links}`),
    '  COPY  type 1–3 + Return · C / c = LAN relay',
    paint(String(accentColor), '  CONTROL  awaken · start <service> · stop <service> · banish · restart <service>'),
    paint(String(accentColor), `  OBSERVE  scry · scry-all · logs <1–${services.size}> · view · help`),
  ].join('\n');
}

function renderScry(service) {
  const slot = [...services.keys()].indexOf(service.id) + 1;
  const entries = service.logs.slice(-12);
  const output = entries.length
    ? entries.map((entry) => paint(entry.stream === 'error' ? '91' : '2', `${entry.stream === 'error' ? '!' : '·'} ${entry.message}`))
    : [paint('2', service.owned ? 'No output captured yet — this service is running quietly.' : 'No live stream is attached. Restart it through Tarot to capture a new stream.')];
  return [
    paint(String(accentColor), `◌ SCRY ${slot} / ${service.label} :${service.port}`),
    ...output,
    paint('2', `Use scry <1–${services.size}> or logs <1–${services.size}> to switch · view returns to the status deck.`),
  ].join('\n');
}

function portalServiceLine(service, index, focused) {
  const live = ['live', 'observed'].includes(service.state);
  const status = service.state === 'error' ? 'ERROR' : live ? 'ONLINE' : service.state === 'starting' ? 'WAKING' : service.state === 'bypassed' ? 'BYPASS' : 'QUIET';
  const color = service.state === 'error' ? '91' : live ? (service.monitorOnly ? '96' : '92') : '2';
  const marker = live ? '●' : service.state === 'error' ? '×' : '○';
  return paint(color, `${focused ? '›' : ' '} ${marker} ${index + 1} · ${service.label} :${service.port}  ${status}`);
}

function renderAllServiceLogs(state, rows, line) {
  const entries = (state.services || [])
    .flatMap((service, index) => (service.logs || []).map((entry, logIndex) => ({
      service,
      index,
      logIndex,
      entry: typeof entry === 'string' ? { message: entry, stream: 'out' } : entry,
    })))
    .sort((left, right) => (left.entry.capturedAt || left.logIndex) - (right.entry.capturedAt || right.logIndex))
    .slice(-Math.max(3, rows - 6));
  if (!entries.length) return [line('· No Tarot-managed service output has been captured yet. Start or restart a service through Tarot to attach its stream.')];
  return entries.map(({ service, index, entry }) => {
    const source = `[${index + 1} ${clip(service.label || service.id, 16)}]`;
    return line(`${entry.stream === 'error' ? '!' : '·'} ${source} ${entry.message || entry}`, entry.stream === 'error' ? '91' : '2');
  });
}

function allLogEntryKey(service, entry, index) {
  return `${service.id}:${entry.sequence ?? `${entry.capturedAt || 'legacy'}:${index}`}:${entry.stream || 'out'}:${entry.message || entry}`;
}

function formatAllLogEntry(service, serviceIndex, entry) {
  const source = `[${serviceIndex + 1} ${service.label || service.id}]`;
  return `${entry.stream === 'error' ? '!' : '·'} ${source} ${entry.message || entry}`;
}

function readDurableEntries(service, serviceIndex) {
  const path = serviceLogPath(service);
  if (!existsSync(path)) return [];
  return readLogEntries(path, { runId: service.runId, limit: 1000 }).map((entry) => ({ service, serviceIndex, entry }));
}

async function followAllLogs() {
  if (!process.stdout.isTTY || !existsSync(statePath)) {
    throw new Error('Scry-All needs an active Tarot shell. Start it with npm run tarot.');
  }
  const positions = new Map();
  let stopped = false;
  let timer = null;
  const load = () => {
    try { return JSON.parse(readFileSync(statePath, 'utf8')); } catch { return null; }
  };
  const initial = load();
  const initialServices = initial?.services || [];
  const activeServices = initialServices.filter((service) => service.owned || ['starting', 'live'].includes(service.state));
  const history = activeServices.flatMap((service) => readDurableEntries(service, initialServices.indexOf(service)))
    .sort((left, right) => (left.entry.capturedAt || 0) - (right.entry.capturedAt || 0) || (left.entry.sequence || 0) - (right.entry.sequence || 0));
  initialServices.forEach((service) => {
    const path = serviceLogPath(service);
    positions.set(service.id, existsSync(path) ? readFileSync(path).length : 0);
  });
  process.stdout.write(`${paint(String(initial?.accentColor || accentColor), `◌ SCRY-ALL / ${initial?.projectName?.toUpperCase() || projectName.toUpperCase()} · live combined output`)}\n`);
  process.stdout.write(`${paint('2', '  Native scrollback stream · Ctrl-C returns to Tarot · lines are labeled by Scry slot')}\n`);
  initialServices.forEach((service, index) => process.stdout.write(`${portalServiceLine(service, index, false)}\n`));
  if (history.length) {
    process.stdout.write(`${paint(String(initial?.accentColor || accentColor), '  REPLAY · captured output since the current Tarot-managed start')}\n`);
    history.forEach(({ service, serviceIndex, entry }) => {
      process.stdout.write(`${paint(entry.stream === 'error' ? '91' : '2', formatAllLogEntry(service, serviceIndex, entry))}\n`);
    });
  } else {
    process.stdout.write(`${paint('2', '  No captured history yet. Restart a service through Tarot to attach its output stream.')}\n`);
  }
  const drawNewEntries = () => {
    const state = load();
    if (!state) return;
    (state.services || []).forEach((service, serviceIndex) => {
      const path = serviceLogPath(service);
      if (!existsSync(path)) return;
      const content = readFileSync(path);
      const previous = positions.get(service.id) || 0;
      const offset = content.length < previous ? 0 : previous;
      positions.set(service.id, content.length);
      content.subarray(offset).toString('utf8').split(/\r?\n/).filter(Boolean).forEach((line) => {
        try {
          const entry = JSON.parse(line);
          process.stdout.write(`${paint(entry.stream === 'error' ? '91' : '2', formatAllLogEntry(service, serviceIndex, entry))}\n`);
        } catch {}
      });
    });
  };
  await new Promise((resolveFollow) => {
    const finish = () => {
      if (stopped) return;
      stopped = true;
      clearInterval(timer);
      process.off('SIGINT', finish);
      process.stdout.write(`${paint('2', 'Scry-All relay closed.')}\n`);
      resolveFollow();
    };
    process.on('SIGINT', finish);
    timer = setInterval(drawNewEntries, 200);
    drawNewEntries();
  });
}

function renderScryPortal(state, view, focused) {
  const width = Math.max(32, process.stdout.columns || 80);
  const rows = Math.max(10, process.stdout.rows || 24);
  const services = state.services || [];
  const running = services.filter((service) => !service.monitorOnly && ['live', 'observed'].includes(service.state)).length;
  const selected = services[focused] || services[0];
  const line = (value, color = '2') => paint(color, clip(value, width - 2));
  const heading = line(`✦ TAROT / ${state.projectName?.toUpperCase() || 'PROJECT'} · SCRY PORTAL · ${running}/${services.filter((service) => !service.monitorOnly).length} services`, String(state.accentColor || accentColor));
  if (view === 'status') {
    return [
      heading,
      line('  STATUS RELAY  ·  live service presence', '35'),
      ...services.map((service, index) => portalServiceLine(service, index, false)),
      '',
      line('  [a] recent all-service relay   [1–9] inspect logs   [q / Esc] return to shell', String(state.accentColor || accentColor)),
    ].join('\n');
  }
  if (view === 'all') {
    return [
      heading,
      line('  ◌ SCRY-ALL  ·  recent interleaved output · use scry-all for uncropped native follow mode', String(state.accentColor || accentColor)),
      ...renderAllServiceLogs(state, rows, line),
      '',
      line('  [1–9] focus one stream   [s] status   [a] refresh all   [q / Esc] return to shell', String(state.accentColor || accentColor)),
    ].join('\n');
  }
  const entries = selected?.logs?.slice(-Math.max(3, rows - 7)) || [];
  const output = entries.length
    ? entries.map((entry) => line(`${entry.stream === 'error' ? '!' : '·'} ${entry.message || entry}`, entry.stream === 'error' ? '91' : '2'))
    : [line(selected?.owned ? '· No output captured yet — this service is running quietly.' : '· No live stream is attached. Restart through Tarot to capture a new stream.')];
  return [
    heading,
    line(`  ◌ SCRY ${focused + 1} / ${selected?.label || 'No service'} :${selected?.port || '—'}`, String(state.accentColor || accentColor)),
    ...output,
    '',
    line('  [1–9] switch stream   [a] all-service relay   [s] status   [q / Esc] return to shell', String(state.accentColor || accentColor)),
  ].join('\n');
}

async function openScryPortal(initialView = 'status') {
  if (!process.stdin.isTTY || !process.stdout.isTTY || !existsSync(statePath)) {
    throw new Error('Scry Portal needs an active Tarot shell. Start it with npm run tarot.');
  }
  let view = initialView === 'all' ? 'all' : 'status';
  let focused = 0;
  let closed = false;
  const draw = () => {
    if (closed) return;
    try {
      const state = JSON.parse(readFileSync(statePath, 'utf8'));
      process.stdout.write(`\x1b[H\x1b[2J${renderScryPortal(state, view, focused)}\n`);
    } catch {
      process.stdout.write('\x1b[H\x1b[2JScry Portal is waiting for Tarot state…\n');
    }
  };
  await new Promise((resolvePortal) => {
    const finish = () => {
      if (closed) return;
      closed = true;
      clearInterval(timer);
      process.stdin.off('data', onKey);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\x1b[?25h\x1b[?1049l');
      resolvePortal();
    };
    const onKey = (chunk) => {
      for (const key of chunk.toString()) {
      if (key === 'q' || key === 'Q' || key === '\u0003' || key === '\u001b') return finish();
      if (key === 's' || key === 'S') { view = 'status'; draw(); return; }
      if (key === 'a' || key === 'A') { view = 'all'; draw(); return; }
      if (/^[1-9]$/.test(key)) { focused = Number(key) - 1; view = 'logs'; draw(); }
      }
    };
    process.stdout.write('\x1b[?1049h\x1b[?25l');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', onKey);
    const timer = setInterval(draw, 750);
    draw();
  });
}

function writeShellConfig() {
  mkdirSync(shellDirectory, { recursive: true });
  writeFileSync(join(shellDirectory, '.zshrc'), `
setopt NO_BEEP NO_NOMATCH
function tarot() { command node "$TAROT_DOCK_SCRIPT" control "$@"; }
function awaken() {
  if [[ "$1" == '--scry' || "$1" == '--follow' ]]; then
    tarot awaken
    command node "$TAROT_DOCK_SCRIPT" follow-all
  else
    tarot awaken "$@"
  fi
}
function raise() { awaken "$@"; }
function status() { tarot status; }
function deck() { tarot deck; }
function scry() { if (( $# )); then tarot scry "$@"; else command node "$TAROT_DOCK_SCRIPT" portal; fi; }
function scry-all() { command node "$TAROT_DOCK_SCRIPT" follow-all; }
function view() { tarot view "$@"; }
function logs() { tarot logs "$@"; }
function help() { tarot help; }
function start() { tarot start "$@"; }
function stop() { tarot stop "$@"; }
function restart() { tarot restart "$@"; }
function ports() { tarot ports; }
function links() { tarot links; }
function tarot-select() { tarot select "$@"; }
function copy() { tarot copy "$@"; }
function c() { tarot copy lan; }
function C() { tarot copy lan; }
${[...services.keys()].length ? addresses().map((_, index) => `function ${index + 1}() { tarot copy ${index + 1}; }`).join('\n') : ''}
function mongo() { tarot mongo "$@"; }
function banish() { tarot banish; }
function farewell() { tarot farewell; exit; }
setopt PROMPT_SUBST
typeset -g TAROT_PROMPT_SIGIL="$TAROT_SIGIL"
typeset -g TAROT_PROMPT_STATUS=""
typeset -g TAROT_PROMPT_BASE=""
typeset -g TAROT_WARP_ACTIVE=0
typeset -g TAROT_WARP_FRAME=0
function tarot_prompt_frame() {
  local length=\${#TAROT_SIGIL}
  TAROT_WARP_FRAME=$(( (TAROT_WARP_FRAME + 1) % length ))
  TAROT_PROMPT_SIGIL="\${TAROT_SIGIL:$TAROT_WARP_FRAME}\${TAROT_SIGIL:0:$TAROT_WARP_FRAME}"
  if (( TAROT_WARP_ACTIVE )); then
    local cores=(◒ ◓ ◑ ◐)
    local core="\${cores[$(( (TAROT_WARP_FRAME % \${#cores}) + 1 ))]}"
    TAROT_PROMPT_STATUS="\${TAROT_PROMPT_BASE% active} $core"
  else
    TAROT_PROMPT_STATUS="\${TAROT_PROMPT_BASE% quiet}"
  fi
}
function tarot_prompt_refresh() {
  TAROT_PROMPT_BASE="$(tarot prompt 2>/dev/null)"
  [[ "$TAROT_PROMPT_BASE" == *"active" ]] && TAROT_WARP_ACTIVE=1 || TAROT_WARP_ACTIVE=0
  tarot_prompt_frame
}
precmd_functions+=(tarot_prompt_refresh)
PROMPT='%F{$TAROT_ACCENT_COLOR}tarot@$TAROT_PROJECT%f %F{$TAROT_ACCENT_COLOR}[$TAROT_PROMPT_SIGIL]%f %F{$TAROT_ACCENT_COLOR} $TAROT_PROMPT_STATUS%f %F{$TAROT_ACCENT_COLOR}❯%f '
RPROMPT=''
`);
}

function publicService(service, index) {
  const safe = publicServiceState(service, index);
  const route = String(service.route || '/');
  const suffix = route.startsWith('/') ? route : `/${route}`;
  const lan = serviceLan(service);
  const hostname = computerLanHostname();
  const networkAddresses = Object.values(os.networkInterfaces()).flat().filter((item) => item?.family === 'IPv4' && !item.internal);
  const accessUrls = service.port && ['http', 'https'].includes(service.protocol)
    ? [
      { label: 'localhost', url: `${service.protocol}://localhost:${service.port}${suffix}` },
      ...(lan.enabled && lan.adapter && hostname ? [{ label: hostname, url: `${service.protocol}://${hostname}:${service.port}${suffix}` }] : []),
      ...(lan.enabled && lan.adapter ? networkAddresses.map((network) => ({ label: 'LAN IP', url: `${service.protocol}://${network.address}:${service.port}${suffix}` })) : []),
    ]
    : [];
  return {
    ...safe,
    id: service.id,
    controlId: `${manifest.projectId}:${service.id}`,
    scrySlot: index + 1,
    logs: service.logs.slice(-24),
    accessUrls,
  };
}

function agentSnapshot() {
  return {
    ok: true,
    agent: { state: 'available', pid: process.pid, socket: socketPath, startedAt: process.uptime() },
    project: { projectId: manifest.projectId, projectName, profile: profileName, tarotVersion: manifest.tarotVersion || manifest.version || '' },
    services: [...services.values()].map(publicService),
    addresses: addresses(),
  };
}

function boundedLogs(reference, requestedLines = 200) {
  const service = resolveService(reference);
  if (!service) return { ok: false, error: `Unknown service: ${reference}.` };
  const lines = Math.min(1000, Math.max(1, Number(requestedLines) || 200));
  const path = serviceLogPath(service);
  const entries = existsSync(path)
    ? readLogEntries(path, { runId: service.runId, limit: lines })
    : service.logs.slice(-lines);
  return { ok: true, serviceId: service.id, name: service.label, lines, entries };
}

function serviceDependents(serviceId) {
  return [...services.values()].filter((service) => (service.dependsOn || []).includes(serviceId));
}

async function fleetAction(request = {}) {
  const action = String(request.action || '').toLowerCase();
  const selectedIds = [...new Set((request.serviceIds || []).map(String))];
  const selected = selectedIds.length ? selectedIds : [...services.keys()];
  const results = [];
  if (!['awaken', 'banish', 'restart'].includes(action)) return { ok: false, error: `Unsupported fleet action: ${action}.`, results };
  if (action === 'banish') {
    const targetSet = new Set(selected);
    for (const serviceId of selected) {
      const service = services.get(serviceId);
      if (!service) { results.push({ serviceId, status: 'failed', message: `Unknown service: ${serviceId}.` }); continue; }
      if (service.monitorOnly) { results.push({ serviceId, status: 'skipped', message: `${service.label} is monitor-only.` }); continue; }
      const liveDependents = serviceDependents(serviceId).filter((dependent) => ['live', 'observed', 'starting'].includes(dependent.state) && !targetSet.has(dependent.id));
      if (liveDependents.length) {
        results.push({ serviceId, status: 'blocked', message: `${service.label} remains running because ${liveDependents.map((dependent) => dependent.label).join(', ')} still depends on it.` });
        continue;
      }
      results.push({ serviceId, status: 'succeeded', message: await stop(serviceId) });
    }
  } else {
    for (const serviceId of selected) {
      const service = services.get(serviceId);
      if (!service) { results.push({ serviceId, status: 'failed', message: `Unknown service: ${serviceId}.` }); continue; }
      if (service.monitorOnly) { results.push({ serviceId, status: 'skipped', message: `${service.label} is monitor-only.` }); continue; }
      if (action === 'restart') await stop(serviceId);
      results.push(...await startWithDependencies(serviceId));
    }
  }
  await refresh();
  return { ok: !results.some((result) => ['failed', 'blocked'].includes(result.status)), action, results, snapshot: agentSnapshot() };
}

async function handleAgentMessage(message = {}) {
  if (message.kind !== 'fleet') return { legacy: true, body: `${await control(message.parts || [])}\n` };
  if (message.operation === 'snapshot') { await refresh(); return agentSnapshot(); }
  if (message.operation === 'logs') return boundedLogs(message.serviceId, message.lines);
  if (message.operation === 'action') return enqueueAction(() => fleetAction(message));
  return { ok: false, error: `Unknown fleet operation: ${message.operation}.` };
}

async function requestControl(parts) {
  const response = await requestJsonLine(socketPath, { parts }, 120000);
  process.stdout.write(response.body || `${response.error || ''}\n`);
}

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  clearInterval(observationTimer);
  for (const service of [...services.values()].reverse()) if (service.process) await stop(service.id);
  heartbeatRegistry([...services.values()].map(({ process, logs, ...service }) => ({ ...service, owned: Boolean(process), logs: logs.slice(-24) })), true);
  try { rmSync(socketPath, { force: true }); } catch {}
  releaseLock();
}

export async function launchAgent() {
  await recoverExistingDock();
  acquireLock();
  await refresh();
  heartbeatRegistry([...services.values()].map(({ process, logs, ...service }) => ({ ...service, owned: Boolean(process), logs: logs.slice(-24) })), true);
  agentServer = net.createServer((connection) => attachJsonLineHandler(connection, handleAgentMessage));
  try { rmSync(socketPath, { force: true }); } catch {}
  await new Promise((resolveListen) => agentServer.listen(socketPath, resolveListen));
  chmodSync(socketPath, 0o600);
  observationTimer = setInterval(() => refresh().catch(() => {}), 2000);
  process.once('SIGTERM', async () => { await shutdown(); agentServer?.close(() => process.exit(0)); });
  process.once('SIGINT', () => {});
}

async function waitForAgent(timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await requestJsonLine(socketPath, { kind: 'fleet', operation: 'snapshot' });
      if (response.ok) return;
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error('Tarot agent did not become available. Run npm run tarot -- --recover to release a stale project lock.');
}

async function ensureAgentForShell() {
  try {
    const response = await requestJsonLine(socketPath, { kind: 'fleet', operation: 'snapshot' });
    if (response.ok) return;
  } catch {}
  mkdirSync(runtime, { recursive: true });
  const bootstrap = openSync(bootstrapLogPath, 'a', 0o600);
  const child = spawn(process.execPath, [agentScript, ...(recoverRequested ? ['--recover'] : [])], {
    cwd: root,
    detached: process.platform !== 'win32',
    stdio: ['ignore', bootstrap, bootstrap],
  });
  child.unref();
  closeSync(bootstrap);
  try {
    await waitForAgent(10000);
  } catch (error) {
    const tail = existsSync(bootstrapLogPath) ? readFileSync(bootstrapLogPath, 'utf8').split(/\r?\n/).filter(Boolean).slice(-12).join('\n') : '';
    throw new Error(`${error.message}${tail ? `\nAgent bootstrap tail:\n${tail}` : ''}`);
  }
}

async function launchDockClient() {
  writeShellConfig();
  await ensureAgentForShell();
  const shell = spawn(process.env.SHELL || '/bin/zsh', ['-i'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ZDOTDIR: shellDirectory, TAROT_DOCK_SCRIPT: dockScript, TAROT_PROJECT: projectName.toLowerCase(), TAROT_SIGIL: sigil, TAROT_ACCENT_COLOR: String(accentColor) },
  });
  shell.once('exit', () => {});
  // Ctrl-C belongs to the foreground command; do not forward it or tear down
  // the controller. Zsh remains the normal interactive job-control shell.
  process.on('SIGINT', () => {});
  process.once('SIGTERM', () => shell.kill('SIGTERM'));
}

const directInvocation = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (directInvocation) {
  if (process.argv[2] === 'control') requestControl(process.argv.slice(3)).catch(() => { console.error('Tarot Dock is not running. Start it with npm run tarot.'); process.exitCode = 1; });
  else if (process.argv[2] === 'agent') launchAgent().catch((error) => { console.error(`Tarot agent could not open: ${error.message}`); process.exitCode = 1; });
  else if (process.argv[2] === 'doctor') process.stdout.write(`${diagnosticsCommand(process.argv.slice(3))}\n`);
  else if (process.argv[2] === 'report') process.stdout.write(`${reportCommand(process.argv.slice(3))}\n`);
  else if (process.argv[2] === 'portal') openScryPortal(process.argv[3]).catch((error) => { console.error(`Scry Portal could not open: ${error.message}`); process.exitCode = 1; });
  else if (process.argv[2] === 'follow-all') followAllLogs().catch((error) => { console.error(`Scry-All could not open: ${error.message}`); process.exitCode = 1; });
  else if (process.argv[2] === 'render') process.stdout.write(`${renderDeck()}\n`);
  else launchDockClient().catch((error) => { console.error(`Tarot Dock could not open: ${error.message}`); process.exitCode = 1; });
}
