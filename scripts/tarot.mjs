#!/usr/bin/env node

import { execFile, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const manifestPath = path.join(root, 'tarot.manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const profileName = process.env.TAROT_PROFILE || 'development';
const profile = manifest.profiles?.[profileName];
const children = new Map();
const cliArgs = process.argv.slice(2);
const withoutMongo = cliArgs.includes('--without-mongo');

if (!profile) {
  console.error(`Unknown Tarot profile: ${profileName}`);
  process.exit(1);
}

const services = profile.services || [];
const managedServices = services.filter((service) => !service.monitorOnly && service.command);
const serviceById = new Map(managedServices.map((service) => [service.id, service]));
const startOrder = [];
const visited = new Set();

function visit(service) {
  if (!service || visited.has(service.id)) return;
  visited.add(service.id);
  for (const dependencyId of service.dependencies || []) {
    visit(serviceById.get(dependencyId));
  }
  startOrder.push(service);
}

managedServices.forEach(visit);

function run(command, args) {
  return new Promise((resolve) => {
    execFile(command, args, { cwd: root, encoding: 'utf8', timeout: 4000 }, (error, stdout, stderr) => {
      resolve({ ok: !error, stdout: stdout || '', stderr: stderr || '' });
    });
  });
}

async function listenerFor(port) {
  const result = await run('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-F', 'pcua']);
  if (!result.ok || !result.stdout.trim()) return null;

  const fields = result.stdout.split('\n');
  const listener = {};
  for (const field of fields) {
    if (field.startsWith('p')) listener.pid = field.slice(1);
    if (field.startsWith('c')) listener.command = field.slice(1);
    if (field.startsWith('u')) listener.user = field.slice(1);
    if (field.startsWith('a')) listener.address = field.slice(1);
  }
  return listener.pid ? listener : null;
}

function serviceCwd(service) {
  return path.resolve(root, service.cwd || '.');
}

function serviceEnv(service) {
  return {
    ...process.env,
    ...(service.env || {}),
    TAROT_PROJECT_ID: manifest.projectId,
    TAROT_PROFILE: profileName,
  };
}

async function status() {
  console.log(`${manifest.displayName} // Tarot ${profile.label} // ${manifest.branding.sigil}`);
  for (const service of services) {
    const listener = await listenerFor(service.port);
    const state = listener ? `RUNNING pid=${listener.pid}` : 'QUIET';
    console.log(`${service.label.padEnd(24)} :${service.port} ${state}${service.monitorOnly ? ' (monitor-only)' : ''}`);
  }
}

async function links() {
  const interfaces = Object.values(os.networkInterfaces()).flatMap((items) => items || []);
  const lanAddresses = interfaces
    .filter((item) => item.family === 'IPv4' && !item.internal)
    .map((item) => item.address);
  for (const service of managedServices) {
    console.log(`${service.label}: http://localhost:${service.port}`);
    for (const address of lanAddresses) {
      console.log(`  LAN: http://${address}:${service.port}`);
    }
  }
}

async function startService(service) {
  const listener = await listenerFor(service.port);
  if (listener) {
    throw new Error(`${service.id} cannot start: port ${service.port} is occupied by ${listener.command || 'pid ' + listener.pid} (pid ${listener.pid}).`);
  }

  const child = spawn(service.command, service.args || [], {
    cwd: serviceCwd(service),
    env: serviceEnv(service),
    stdio: 'inherit',
  });
  children.set(service.id, child);
  child.once('exit', (code, signal) => {
    children.delete(service.id);
    if (code !== 0 && signal !== 'SIGTERM') {
      console.error(`${service.label} exited with ${signal || `code ${code}`}.`);
    }
  });
  console.log(`Started ${service.label} on :${service.port} (pid ${child.pid}).`);
}

async function ensureDependencies() {
  if (withoutMongo) {
    console.log('MongoDB check skipped (--without-mongo).');
    return;
  }

  for (const service of services.filter((entry) => entry.monitorOnly && entry.startCommand)) {
    if (await listenerFor(service.port)) continue;

    console.log(`Starting system dependency ${service.label}...`);
    const [command, ...args] = service.startCommand;
    const result = await run(command, args);
    if (!result.ok) {
      throw new Error(
        `${service.label} could not start: ${result.stderr.trim() || 'command failed'}`,
      );
    }

    const deadline = Date.now() + Number(service.startupTimeoutMs || 30000);
    while (Date.now() < deadline) {
      if (await listenerFor(service.port)) break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (!(await listenerFor(service.port))) {
      throw new Error(`${service.label} did not become ready on port ${service.port}.`);
    }
  }
}

async function stopService(service) {
  const child = children.get(service.id);
  if (child) {
    child.kill('SIGTERM');
    children.delete(service.id);
    console.log(`Stopped ${service.label}.`);
    return;
  }

  const listener = await listenerFor(service.port);
  if (listener) {
    console.log(`Did not stop ${service.label}: pid ${listener.pid} was not started by this Tarot process.`);
  }
}

async function start() {
  await ensureDependencies();
  for (const service of startOrder) {
    await startService(service);
  }
  await links();
}

async function stop() {
  for (const service of [...managedServices].reverse()) {
    await stopService(service);
  }
}

async function health() {
  for (const service of managedServices) {
    const url = `http://127.0.0.1:${service.port}${service.healthPath || ''}`;
    try {
      const response = await fetch(url);
      console.log(`${service.label}: ${response.ok ? 'OK' : `HTTP ${response.status}`} ${url}`);
    } catch (error) {
      console.log(`${service.label}: OFFLINE ${url} (${error.message})`);
    }
  }
}

function help() {
  console.log('Usage: npm run tarot [-- <command>]');
  console.log('Commands: start (default), stop, restart, status, links, health, help');
  console.log('Use --without-mongo to skip the monitor/start check for MongoDB.');
  console.log('Set TAROT_PROFILE=production for the production profile.');
}

const command = cliArgs.find((arg) => !arg.startsWith('--')) || 'start';
try {
  if (command === 'start') await start();
  else if (command === 'stop') await stop();
  else if (command === 'restart') {
    await stop();
    await start();
  } else if (command === 'status') await status();
  else if (command === 'links') await links();
  else if (command === 'health') await health();
  else if (command === 'help') help();
  else throw new Error(`Unknown command: ${command}`);
} catch (error) {
  console.error(`Tarot error: ${error.message}`);
  await stop();
  process.exitCode = 1;
}

async function shutdown() {
  await stop();
  process.exit(0);
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
