#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  appendFileSync,
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
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runtime = resolve(root, '.runtime');
const manifest = JSON.parse(readFileSync(resolve(root, 'tarot.manifest.json'), 'utf8'));
const profileName = process.argv.includes('production') ? 'production' : 'development';
const profile = manifest.profiles?.[profileName] || manifest.profiles.development;
const withoutMongo = process.argv.includes('--without-mongo') || process.env.TAROT_WITHOUT_MONGO === '1';
const projectName = manifest.displayName || manifest.projectId || 'Tarot project';
const socketPath = resolve(runtime, 'tarot-dock.sock');
const lockPath = resolve(runtime, 'tarot-dock.lock');
const statePath = resolve(runtime, 'tarot-dock-state.json');
const logsDirectory = resolve(runtime, 'tarot-logs');
const shellDirectory = resolve(runtime, 'tarot-dock-shell');
const dockScript = resolve(root, 'scripts/tarot-dock.mjs');
const sigilSymbols = ['⌁', '⋮', '⟡', '◌', '╳', '∷', '◇', '⊹', '◈', '░', '▒', '▓'];
const terminalPalette = [31, 32, 33, 34, 35, 36, 91, 92, 93, 94, 95, 96];
const hash = createHash('sha256').update(projectName).digest();
const sigil = Array.from({ length: 8 }, (_, index) => sigilSymbols[hash[index] % sigilSymbols.length]).join('');
const requestedAccent = Number(manifest.branding?.terminalColor);
const accentColor = terminalPalette.includes(requestedAccent) ? requestedAccent : terminalPalette[hash[8] % terminalPalette.length];
const services = new Map((profile.services || []).map((service) => [service.id, {
  ...service,
  state: 'quiet',
  process: null,
  verified: false,
  logs: [],
  error: '',
}]));
let selectedAddress = 2;
let viewMode = 'status';
let logServiceId = '';
let lockOwned = false;
let shuttingDown = false;
let observationTimer = null;
let lastHeartbeatAt = 0;
let warpFrame = 0;
let logSequence = 0;

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
    writeFileSync(descriptor, String(process.pid));
    closeSync(descriptor);
    lockOwned = true;
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const pid = Number(existsSync(lockPath) ? readFileSync(lockPath, 'utf8').trim() : 0);
    try { process.kill(pid, 0); throw new Error('Tarot Dock is already running in this project.'); } catch (processError) {
      if (processError.message.includes('already running')) throw processError;
      unlinkSync(lockPath);
      acquireLock();
    }
  }
}

function releaseLock() {
  if (!lockOwned) return;
  try { if (Number(readFileSync(lockPath, 'utf8').trim()) === process.pid) unlinkSync(lockPath); } catch {}
  lockOwned = false;
}

function resolveCommand(service) {
  const env = Object.fromEntries(Object.entries(service.env || {}).map(([key, value]) => [key, String(value)]));
  const configuredCwd = resolve(root, service.cwd || '.');
  if (!configuredCwd.startsWith(`${root}/`) && configuredCwd !== root) return { error: `${service.label || service.id} has a working directory outside this project.` };
  if (!existsSync(configuredCwd)) return { error: `${service.label || service.id} working directory was not found: ${service.cwd || '.'}` };
  const lan = serviceLan(service);
  const commandArgs = applyLanBinding(service, normalizeNpmPrefix(service, service.args || [], configuredCwd), env, lan);
  if (service.command === 'npm') return { command: process.platform === 'win32' ? 'npm.cmd' : 'npm', args: commandArgs, cwd: configuredCwd, env };
  if (service.cwdEnv) {
    const cwd = process.env[service.cwdEnv] || '/Volumes/Luna/Developer-Luna/warp_gen';
    if (!existsSync(cwd)) return { error: `${service.cwdEnv} is not set and the default provider path was not found.` };
    return { command: resolve(cwd, 'bin/warp-gen-server'), args: commandArgs, cwd, env };
  }
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

function applyLanBinding(service, args, env, lan) {
  if (!lan.enabled || !lan.adapter) return [...args];
  if (lan.adapter === 'env') {
    env.HOST ||= lan.host;
    env.TAROT_LAN_HOST ||= lan.host;
    return [...args];
  }
  if (lan.adapter === 'uvicorn') return args.includes('--host') ? [...args] : [...args, '--host', lan.host];
  if (lan.adapter === 'vite') {
    if (args.includes('--host')) return [...args];
    return args.includes('--') ? [...args, '--host', lan.host] : [...args, '--', '--host', lan.host];
  }
  return [...args];
}

async function listeners(port) {
  const result = await run('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fp']);
  const pids = [...new Set([...result.stdout.matchAll(/^p(\d+)$/gm)].map((match) => Number(match[1])))];
  return Promise.all(pids.map(async (pid) => {
    const [command, cwd] = await Promise.all([
      run('ps', ['-p', String(pid), '-o', 'command=']),
      run('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn']),
    ]);
    return { pid, command: command.stdout.trim(), cwd: (cwd.stdout.split(/\r?\n/).find((line) => line.startsWith('n')) || '').slice(1) };
  }));
}

function belongsTo(serviceCommand, listener) {
  if (!listener.cwd) return false;
  const expected = resolve(serviceCommand.cwd);
  const actual = resolve(listener.cwd);
  return actual === expected || actual.startsWith(`${expected}/`);
}

async function refresh() {
  await Promise.all([...services.values()].map(async (service) => {
    const activeListeners = await listeners(service.port);
    if (service.monitorOnly) {
      service.verified = false;
      if (withoutMongo && service.protocol === 'mongodb') service.state = 'bypassed';
      else if (activeListeners.length) service.state = 'observed';
      else if (service.state !== 'error') service.state = 'quiet';
      return;
    }
    const command = resolveCommand(service);
    service.verified = !command.error && activeListeners.length > 0 && activeListeners.every((listener) => belongsTo(command, listener));
    if (!service.process) {
      service.state = activeListeners.length ? 'observed' : 'quiet';
      if (service.state === 'observed') service.error = '';
    }
  }));
  persist();
}

async function ensureMongo() {
  const mongo = [...services.values()].find((service) => service.protocol === 'mongodb');
  if (!mongo) return true;
  if (withoutMongo) {
    mongo.state = 'bypassed';
    mongo.error = 'Bypassed by --without-mongo.';
    persist();
    return true;
  }
  if ((await listeners(mongo.port)).length) {
    mongo.state = 'observed';
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
  mongo.state = 'starting';
  mongo.error = '';
  persist();
  const started = await run(command, args, { cwd: root });
  if (started.error || started.code !== 0) {
    mongo.state = 'error';
    mongo.error = [started.stderr.trim(), started.stdout.trim(), started.error?.message].filter(Boolean).join(' · ') || `Could not run ${command} ${args.join(' ')}.`;
    persist();
    return false;
  }
  const attempts = Math.ceil((mongo.startupTimeoutMs || 30000) / 500);
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if ((await listeners(mongo.port)).length) {
      mongo.state = 'observed';
      persist();
      return true;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  mongo.state = 'error';
  mongo.error = `MongoDB did not listen on :${mongo.port} after its start command.`;
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
  if (!reference) return Math.max(0, available.findIndex((address) => address.label === 'LAN IP'));
  if (/^\d+$/.test(reference)) return Number(reference) - 1;
  const value = reference.toLowerCase();
  if (['local', 'localhost', 'l'].includes(value)) return available.findIndex((address) => address.label === 'localhost');
  if (['computer', 'host', 'hostname', 'c'].includes(value)) return available.findIndex((address) => address.label !== 'localhost' && address.label !== 'LAN IP');
  if (['lan', 'network', 'n'].includes(value)) return available.findIndex((address) => address.label === 'LAN IP');
  return -1;
}

function persist() {
  const publicServices = [...services.values()].map(({ process, logs, ...service }) => ({ ...service, owned: Boolean(process), logs: logs.slice(-24) }));
  writeFileSync(statePath, JSON.stringify({ projectName, profile: profile.label || profileName.toUpperCase(), sigil, accentColor, selectedAddress, viewMode, logServiceId, services: publicServices, addresses: addresses() }, null, 2));
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
  if (!child?.pid) return;
  try { process.kill(-child.pid, signal); } catch { try { child.kill(signal); } catch {} }
}

async function releasePort(service, command) {
  const activeListeners = await listeners(service.port);
  const unknown = activeListeners.filter((listener) => !belongsTo(command, listener));
  if (unknown.length) return `:${service.port} belongs to unverified ${unknown.map((item) => `PID ${item.pid}`).join(', ')}; left untouched.`;
  for (const listener of activeListeners) {
    try { process.kill(listener.pid, 'SIGTERM'); } catch {}
  }
  for (let attempt = 0; attempt < 16; attempt += 1) {
    if (!(await listeners(service.port)).length) return null;
    await new Promise((resolveWait) => setTimeout(resolveWait, 125));
  }
  return `Could not release :${service.port} from the prior verified ${service.label} process.`;
}

async function serviceReady(service) {
  const healthPath = String(service.healthPath || '/');
  const path = healthPath.startsWith('/') ? healthPath : `/${healthPath}`;
  try {
    const response = await fetch(`http://127.0.0.1:${service.port}${path}`, {
      signal: AbortSignal.timeout(1000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function start(serviceId) {
  const service = services.get(serviceId);
  if (!service) return `Unknown service: ${serviceId}.`;
  if (service.monitorOnly) return `${service.label} is observed only; Tarot will not start or stop it.`;
  if (service.process) return `${service.label} is already Tarot-owned.`;
  if (service.dependsOn?.includes('mongodb') && !(await ensureMongo()) && !withoutMongo) {
    return 'MongoDB could not be started. Fix the MongoDB service or restart Tarot with npm run tarot -- --without-mongo.';
  }
  const command = resolveCommand(service);
  if (command.error) return command.error;
  const portProblem = await releasePort(service, command);
  if (portProblem) { service.state = 'error'; service.error = portProblem; persist(); return portProblem; }
  service.state = 'starting'; service.error = ''; service.logs = [];
  mkdirSync(logsDirectory, { recursive: true });
  writeFileSync(serviceLogPath(service), '');
  const childEnvironment = { ...process.env, ...command.env, DECKONE_TAROT_ACTIVE: '1' };
  if (withoutMongo) childEnvironment.TAROT_WITHOUT_MONGO = '1';
  const child = spawn(command.command, command.args, {
    cwd: command.cwd,
    detached: process.platform !== 'win32',
    env: childEnvironment,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  service.process = child;
  const log = (stream) => (chunk) => {
    const entries = chunk.toString().split(/\r?\n/).filter(Boolean).map((message) => ({ message, stream, capturedAt: Date.now(), sequence: ++logSequence }));
    service.logs.push(...entries);
    service.logs = service.logs.slice(-24);
    if (entries.length) appendFileSync(serviceLogPath(service), `${entries.map((entry) => JSON.stringify(entry)).join('\n')}\n`);
    persist();
  };
  child.stdout.on('data', log('out')); child.stderr.on('data', log('error'));
  child.once('exit', (code) => {
    service.process = null;
    service.state = code === 0 ? 'quiet' : 'error';
    if (code !== 0) {
      service.error = `Exited (${code}).`;
      service.logs.push({ message: service.error, stream: 'error' });
    }
    persist();
  });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if ((await listeners(service.port)).length && await serviceReady(service)) {
      service.state = 'live';
      persist();
      return `${service.label} awakened on :${service.port}.`;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  service.state = 'error';
  service.error = `Service did not pass ${service.healthPath || '/'} on :${service.port}.`;
  persist();
  return `${service.label} did not become healthy.`;
}

async function stop(serviceId) {
  const service = services.get(serviceId);
  if (!service) return `Unknown service: ${serviceId}.`;
  if (service.monitorOnly) return `${service.label} is observed only; it stays under system ownership.`;
  if (!service.process) {
    const command = resolveCommand(service);
    if (command.error) return command.error;
    const activeListeners = await listeners(service.port);
    const verified = activeListeners.length > 0 && activeListeners.every((listener) => belongsTo(command, listener));
    if (!verified) return `${service.label} is not a verified DeckOne service, so it was left running.`;
    const portProblem = await releasePort(service, command);
    if (portProblem) return portProblem;
    service.verified = false;
    service.state = 'quiet';
    persist();
    return `${service.label} released from its verified DeckOne provider.`;
  }
  stopTree(service.process);
  service.process = null; service.verified = false; service.state = 'quiet'; persist();
  return `${service.label} released.`;
}

async function copy(reference) {
  const index = addressIndex(reference);
  if (!addresses()[index]) return `Unknown link choice: ${reference}. Try local, computer, lan, or 1–${addresses().length}.`;
  selectedAddress = index;
  const address = addresses()[index];
  const command = process.platform === 'darwin' ? 'pbcopy' : 'xclip';
  const args = process.platform === 'darwin' ? [] : ['-selection', 'clipboard'];
  const child = spawn(command, args, { stdio: ['pipe', 'ignore', 'ignore'] });
  child.stdin.end(address.url);
  persist();
  return `Copied ${address.label}: ${address.url}`;
}

async function control(parts) {
  const [verb = 'status', argument] = parts;
  // Legacy hooks are deliberately no-ops. A normal shell must never have a
  // reserved scroll region or be repainted above a running command.
  if (verb === 'reflow' || verb === 'redraw') return '';
  if (verb === 'awaken' || verb === 'raise') {
    if (!(await ensureMongo()) && !withoutMongo) return mongoFailureMessage();
    const outcomes = [];
    const pending = new Map([...services.values()].filter((service) => service.autostart && !service.monitorOnly).map((service) => [service.id, service]));
    while (pending.size) {
      const ready = [...pending.values()].filter((service) => (service.dependsOn || []).every((dependency) => {
        const required = services.get(dependency);
        return !pending.has(dependency) && (!required || ['live', 'observed'].includes(required.state));
      }));
      if (!ready.length) {
        outcomes.push(...[...pending.values()].map((service) => {
          const unavailable = (service.dependsOn || []).find((dependency) => !services.has(dependency) || !['live', 'observed'].includes(services.get(dependency)?.state));
          return unavailable
            ? `${service.label} could not start because dependency ${unavailable} is unavailable.`
            : `${service.label} could not start because its declared dependencies form a cycle.`;
        }));
        break;
      }
      for (const service of ready) {
        outcomes.push(await start(service.id));
        pending.delete(service.id);
      }
    }
    await refresh(); return outcomes.join('\n');
  }
  if (verb === 'start') return start(argument);
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
      const verified = Boolean(service.process) || (activeListeners.length > 0 && activeListeners.every((listener) => belongsTo(command, listener)));
      if (verified) outcomes.push(await stop(service.id));
    }
    await refresh();
    return outcomes.length ? outcomes.join('\n') : 'No verified DeckOne services were running.';
  }
  if (verb === 'restart') { await stop(argument); return start(argument); }
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
  if (verb === 'help') return [
    paint(String(accentColor), `✦ TAROT GUIDE / ${projectName.toUpperCase()}`),
    paint('35', '  AWAKEN  awaken · awaken --scry · start <service> · restart <service> · stop [service] · banish'),
    paint('35', '  OBSERVE scry = status portal · scry-all = live all-service relay · scry <1–n> / logs <1–n> = snapshot'),
    paint('35', '  MAP     status · deck · ports · links'),
    paint('35', '  RELAYS  1–3 + Return = copy link · C / c = copy LAN · copy <local|computer|lan>'),
    paint('35', '  SYSTEM  mongo [start] · farewell = release Tarot services and close'),
    paint('2', '  Scry Portal keys: [1–9] logs · [a] all-service relay · [s] status · [q / Esc] return to shell'),
  ].join('\n');
  if (verb === 'farewell') { await shutdown(); return 'Tarot released its services.'; }
  return `Unknown Tarot command: ${verb}. Try tarot help.`;
}

function servicePresentation(service, index) {
  const live = ['live', 'observed'].includes(service.state);
  const external = !service.owned && !service.verified && service.state === 'observed';
  const owner = service.monitorOnly ? 'SYSTEM' : external ? 'UNKNOWN' : service.owned ? 'TAROT' : service.verified ? 'DECKONE' : 'IDLE';
  const status = service.state === 'error' ? 'ERROR' : live ? 'ONLINE' : service.state === 'starting' ? 'WAKING' : service.state === 'bypassed' ? 'BYPASS' : 'QUIET';
  const color = service.state === 'error' ? '91' : live ? (external || service.monitorOnly ? '96' : '92') : '2';
  const marker = live ? '●' : service.state === 'error' ? '×' : '○';
  const lan = serviceLan(service);
  const lanState = service.monitorOnly ? '' : lan.adapter ? `  LAN / ${lan.enabled ? 'READY' : 'OFF'}` : lan.enabled ? '  LAN / MANUAL' : '';
  return paint(color, `${marker} ${index + 1} · ${service.label} :${service.port}  ${status}  OWNER / ${owner}${lanState}${service.error ? ` · ${service.error}` : ''}`);
}

function liveSummary() {
  const managed = [...services.values()].filter((service) => !service.monitorOnly);
  const running = managed.filter((service) => (service.owned || service.verified) && ['live', 'observed'].includes(service.state)).length;
  const external = managed.filter((service) => !service.owned && !service.verified && service.state === 'observed').length;
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
  return readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean).flatMap((line) => {
    try { return [{ service, serviceIndex, entry: JSON.parse(line) }]; } catch { return []; }
  });
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
  const history = initialServices.flatMap((service, serviceIndex) => readDurableEntries(service, serviceIndex))
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

async function requestControl(parts) {
  const response = await new Promise((resolveResponse, rejectResponse) => {
    const client = net.createConnection(socketPath);
    let body = '';
    client.once('error', rejectResponse);
    client.on('data', (chunk) => { body += chunk; });
    client.once('end', () => resolveResponse(body));
    client.once('connect', () => client.write(JSON.stringify({ parts })));
  });
  process.stdout.write(response);
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

async function launchDock() {
  acquireLock();
  writeShellConfig();
  await ensureMongo();
  await refresh();
  heartbeatRegistry([...services.values()].map(({ process, logs, ...service }) => ({ ...service, owned: Boolean(process), logs: logs.slice(-24) })), true);
  const server = net.createServer((connection) => {
    let body = '';
    connection.once('data', async (chunk) => {
      body += chunk;
      try { const message = JSON.parse(body); connection.end(`${await control(message.parts || [])}\n`); }
      catch (error) { connection.end(`Tarot command failed: ${error.message}\n`); }
    });
  });
  try { rmSync(socketPath, { force: true }); } catch {}
  await new Promise((resolveListen) => server.listen(socketPath, resolveListen));
  observationTimer = setInterval(() => refresh().catch(() => {}), 2000);
  const shell = spawn(process.env.SHELL || '/bin/zsh', ['-i'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ZDOTDIR: shellDirectory, TAROT_DOCK_SCRIPT: dockScript, TAROT_PROJECT: projectName.toLowerCase(), TAROT_SIGIL: sigil, TAROT_ACCENT_COLOR: String(accentColor) },
  });
  shell.once('exit', async () => { server.close(); await shutdown(); });
  // Ctrl-C belongs to the foreground command; do not forward it or tear down
  // the controller. Zsh remains the normal interactive job-control shell.
  process.on('SIGINT', () => {});
  process.once('SIGTERM', () => shell.kill('SIGTERM'));
}

if (process.argv[2] === 'control') requestControl(process.argv.slice(3)).catch(() => { console.error('Tarot Dock is not running. Start it with npm run tarot.'); process.exitCode = 1; });
else if (process.argv[2] === 'portal') openScryPortal(process.argv[3]).catch((error) => { console.error(`Scry Portal could not open: ${error.message}`); process.exitCode = 1; });
else if (process.argv[2] === 'follow-all') followAllLogs().catch((error) => { console.error(`Scry-All could not open: ${error.message}`); process.exitCode = 1; });
else if (process.argv[2] === 'render') process.stdout.write(`${renderDeck()}\n`);
else launchDock().catch((error) => { console.error(`Tarot Dock could not open: ${error.message}`); process.exitCode = 1; });
