#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
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
let selectedAddress = 0;
let lockOwned = false;
let shuttingDown = false;
let animationTimer = null;
let observationTimer = null;
let warpFrame = 0;

function paint(code, value) {
  return process.stdout.isTTY ? `\u001b[${code}m${value}\u001b[0m` : value;
}

function clip(value, width) {
  return value.length > width ? `${value.slice(0, Math.max(0, width - 1))}…` : value;
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
  if (service.command === 'npm') return { command: process.platform === 'win32' ? 'npm.cmd' : 'npm', args: service.args || [], cwd: root };
  if (service.cwdEnv) {
    const cwd = process.env[service.cwdEnv] || '/Volumes/Luna/Developer-Luna/warp_gen';
    if (!existsSync(cwd)) return { error: `${service.cwdEnv} is not set and the default provider path was not found.` };
    return { command: resolve(cwd, 'bin/warp-gen-server'), args: service.args || [], cwd };
  }
  return { command: service.command, args: service.args || [], cwd: root };
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
  const hostname = os.hostname().trim().replace(/\.$/, '');
  const computer = hostname && hostname !== 'localhost' && !net.isIP(hostname) ? (hostname.includes('.') ? hostname : `${hostname}.local`) : null;
  const networks = Object.values(os.networkInterfaces()).flat().filter((item) => item?.family === 'IPv4' && !item.internal);
  return [
    { label: 'localhost', url: `http://localhost:${port}/` },
    ...(computer ? [{ label: computer, url: `http://${computer}:${port}/` }] : []),
    { label: 'LAN IP', url: `http://${networks[0]?.address || '127.0.0.1'}:${port}/` },
  ];
}

function persist() {
  const publicServices = [...services.values()].map(({ process, logs, ...service }) => ({ ...service, owned: Boolean(process) }));
  writeFileSync(statePath, JSON.stringify({ projectName, profile: profile.label || profileName.toUpperCase(), sigil, accentColor, selectedAddress, services: publicServices, addresses: addresses() }, null, 2));
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
  const childEnvironment = { ...process.env, DECKONE_TAROT_ACTIVE: '1' };
  if (withoutMongo) childEnvironment.TAROT_WITHOUT_MONGO = '1';
  const child = spawn(command.command, command.args, {
    cwd: command.cwd,
    detached: process.platform !== 'win32',
    env: childEnvironment,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  service.process = child;
  const log = (chunk) => { service.logs.push(...chunk.toString().split(/\r?\n/).filter(Boolean)); service.logs = service.logs.slice(-8); };
  child.stdout.on('data', log); child.stderr.on('data', log);
  child.once('exit', (code) => { service.process = null; service.state = code === 0 ? 'quiet' : 'error'; if (code !== 0) service.error = `Exited (${code}).`; persist(); });
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if ((await listeners(service.port)).length) { service.state = 'live'; persist(); return `${service.label} awakened on :${service.port}.`; }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  service.state = 'error'; service.error = `No listener appeared on :${service.port}.`; persist();
  return `${service.label} did not become reachable.`;
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

async function copy(index) {
  if (Number.isInteger(index) && addresses()[index]) selectedAddress = index;
  const address = addresses()[selectedAddress] || addresses()[0];
  const command = process.platform === 'darwin' ? 'pbcopy' : 'xclip';
  const args = process.platform === 'darwin' ? [] : ['-selection', 'clipboard'];
  const child = spawn(command, args, { stdio: ['pipe', 'ignore', 'ignore'] });
  child.stdin.end(address.url);
  persist();
  return `Copied ${address.label}: ${address.url}`;
}

async function control(parts) {
  const [verb = 'status', argument] = parts;
  if (verb === 'awaken' || verb === 'raise') {
    if (!(await ensureMongo()) && !withoutMongo) return mongoFailureMessage();
    const outcomes = [];
    for (const service of services.values()) if (service.autostart && !service.monitorOnly) outcomes.push(await start(service.id));
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
  if (verb === 'status' || verb === 'scry') { await refresh(); return [...services.values()].map((service) => `${service.label}: ${service.state} :${service.port}${service.error ? ` · ${service.error}` : ''}`).join('\n'); }
  if (verb === 'ports') return [...services.values()].map((service) => `${service.label.padEnd(22)} :${service.port}  ${service.notes || ''}`).join('\n');
  if (verb === 'links') return addresses().map((address, index) => `${index + 1}. ${address.label}: ${address.url}`).join('\n');
  if (verb === 'select') { const index = Number(argument) - 1; if (!addresses()[index]) return 'Choose address 1, 2, or 3.'; selectedAddress = index; persist(); return `Selected ${addresses()[index].label}.`; }
  if (verb === 'copy') return copy(argument ? Number(argument) - 1 : undefined);
  if (verb === 'help') return 'Tarot: awaken · status · mongo [start] · start <service> · stop [service] · banish · restart <service> · ports · links · select <1|2|3> · copy [1|2|3] · farewell. Start with --without-mongo to bypass the database.';
  if (verb === 'farewell') { await shutdown(); return 'Tarot released its services.'; }
  return `Unknown Tarot command: ${verb}. Try tarot help.`;
}

function drawHeader() {
  if (!process.stdout.isTTY || !existsSync(statePath)) return;
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  const width = Math.max(60, Math.min(process.stdout.columns || 88, 110));
  const bar = '─'.repeat(width - 2);
  const running = state.services.filter((service) => !service.monitorOnly && (service.owned || service.verified) && ['live', 'observed'].includes(service.state)).length;
  const observed = state.services.filter((service) => !service.monitorOnly && !service.owned && !service.verified && service.state === 'observed').length;
  const total = state.services.filter((service) => !service.monitorOnly).length;
  const active = running > 0;
  const rotatedSigil = active ? `${state.sigil.slice(warpFrame % state.sigil.length)}${state.sigil.slice(0, warpFrame % state.sigil.length)}` : state.sigil;
  const online = active ? `${['◒', '◓', '◑', '◐'][warpFrame % 4]} warp core` : '· dormant';
  const items = state.services.map((service) => {
    const live = ['live', 'observed'].includes(service.state);
    const external = !service.owned && !service.verified && service.state === 'observed';
    const status = service.monitorOnly ? (live ? 'system' : service.state) : external ? 'external' : service.owned ? 'Tarot' : service.verified ? 'DeckOne' : service.state;
    const color = service.state === 'error' ? '91' : live ? (external || service.monitorOnly ? '96' : '92') : '2';
    const marker = live ? '●' : service.state === 'error' ? '×' : '○';
    return `${paint(color, `${marker} ${service.label}:${service.port}`)} ${paint('2', `[${status}]`)}`;
  }).join('  ·  ');
  const links = state.addresses.map((address, index) => `${index + 1} ${address.label}`).join('   ');
  const serviceSummary = `${running}/${total} DeckOne services${observed ? ` · ${observed} external` : ''}`;
  const lines = [
    paint('35', `┌${bar}┐`),
    `│ ${paint(String(state.accentColor || accentColor), `TAROT / ${state.projectName.toUpperCase()}`)}  ${paint('2', '·')} ${paint(active ? String(state.accentColor || accentColor) : '2', rotatedSigil)}  ${paint('2', '·')} ${paint(String(state.accentColor || accentColor), serviceSummary)}  ${paint('2', '·')} ${paint(active ? String(state.accentColor || accentColor) : '2', online)}`,
    paint('35', `├${bar}┤`),
    `  ${paint('2', clip(items, width - 4))}`,
    `  ${paint('2', clip(`LINKS  ${links}   · tarot select <1–3> · copy`, width - 4))}`,
    paint('35', `└${bar}┘`),
  ];
  const rows = Math.max(process.stdout.rows || 24, lines.length + 2);
  process.stdout.write('\x1b7\x1b[r\x1b[H');
  lines.forEach((line) => process.stdout.write(`\x1b[2K${line}\n`));
  process.stdout.write(`\x1b[${lines.length + 1};${rows}r\x1b8`);
}

function writeShellConfig() {
  mkdirSync(shellDirectory, { recursive: true });
  writeFileSync(join(shellDirectory, '.zshrc'), `
setopt NO_BEEP NO_NOMATCH
function tarot() { command node "$TAROT_DOCK_SCRIPT" control "$@"; }
function awaken() { tarot awaken; }
function raise() { tarot awaken; }
function status() { tarot status; }
function scry() { tarot status; }
function start() { tarot start "$@"; }
function stop() { tarot stop "$@"; }
function restart() { tarot restart "$@"; }
function ports() { tarot ports; }
function links() { tarot links; }
function tarot-select() { tarot select "$@"; }
function copy() { tarot copy "$@"; }
function mongo() { tarot mongo "$@"; }
function banish() { tarot banish; }
function farewell() { tarot farewell; exit; }
function precmd() { command node "$TAROT_DOCK_SCRIPT" render 2>/dev/null; }
function TRAPWINCH() { command node "$TAROT_DOCK_SCRIPT" render 2>/dev/null; }
PROMPT="%F{$TAROT_ACCENT_COLOR}tarot@$TAROT_PROJECT%f %F{$TAROT_ACCENT_COLOR}[$TAROT_SIGIL]%f %F{$TAROT_ACCENT_COLOR}❯%f "
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
  clearInterval(animationTimer);
  clearInterval(observationTimer);
  for (const service of [...services.values()].reverse()) if (service.process) await stop(service.id);
  try { rmSync(socketPath, { force: true }); } catch {}
  releaseLock();
}

async function launchDock() {
  acquireLock();
  writeShellConfig();
  await ensureMongo();
  await refresh();
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
  drawHeader();
  process.stdout.write('\x1b[7;1H');
  observationTimer = setInterval(() => refresh().catch(() => {}), 2000);
  animationTimer = setInterval(() => { warpFrame += 1; drawHeader(); }, 700);
  const shell = spawn(process.env.SHELL || '/bin/zsh', ['-i'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ZDOTDIR: shellDirectory, TAROT_DOCK_SCRIPT: dockScript, TAROT_PROJECT: projectName.toLowerCase(), TAROT_SIGIL: sigil, TAROT_ACCENT_COLOR: String(accentColor) },
  });
  shell.once('exit', async () => { server.close(); await shutdown(); });
  process.once('SIGINT', () => shell.kill('SIGINT'));
  process.once('SIGTERM', () => shell.kill('SIGTERM'));
}

if (process.argv[2] === 'control') requestControl(process.argv.slice(3)).catch(() => { console.error('Tarot Dock is not running. Start it with npm run tarot.'); process.exitCode = 1; });
else if (process.argv[2] === 'render') drawHeader();
else launchDock().catch((error) => { console.error(`Tarot Dock could not open: ${error.message}`); process.exitCode = 1; });
