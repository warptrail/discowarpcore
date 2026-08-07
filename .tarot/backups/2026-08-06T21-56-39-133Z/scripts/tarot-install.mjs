#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { spawnSync } from 'node:child_process';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const localRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const reconfigure = args.includes('--reconfigure');
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const configIndex = args.indexOf('--config');
const sourceIndex = args.indexOf('--source');
const configArgument = configIndex >= 0 ? args[configIndex + 1] : '';
const sourceArgument = sourceIndex >= 0 ? args[sourceIndex + 1] : '';
const targetArgument = args.find((argument, index) => !argument.startsWith('--') && !(configIndex >= 0 && index === configIndex + 1) && !(sourceIndex >= 0 && index === sourceIndex + 1));
const targetRoot = resolve(targetArgument || '.');
const manifestPath = resolve(targetRoot, 'tarot.manifest.json');
const packagePath = resolve(targetRoot, 'package.json');

function usage() {
  return [
    'Tarot Port installer',
    '',
    'Interactive:',
    '  node /path/to/deckone/scripts/tarot-install.mjs /path/to/project',
    '',
    'Repeat or revise an installed project:',
    '  npm run tarot:install',
    '',
    'Non-interactive config file:',
    '  node scripts/tarot-install.mjs /path/to/project --config tarot.setup.json',
    '',
    'Options: --reconfigure  --dry-run  --force  --source /path/to/deckone',
  ].join('\n');
}

function fail(message) {
  console.error(`Tarot install: ${message}`);
  process.exitCode = 1;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function slug(value) {
  return String(value || 'tarot-project').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tarot-project';
}

function splitCommand(value) {
  const tokens = [];
  const matcher = /(?:[^\s"']+|"[^"]*"|'[^']*')+/g;
  for (const token of String(value || '').match(matcher) || []) tokens.push(token.replace(/^(?:"|')|(?:"|')$/g, ''));
  return tokens;
}

function sourceRoot(existingManifest) {
  const candidates = [
    sourceArgument && resolve(sourceArgument),
    localRoot,
    existingManifest?.sync?.source && existingManifest.sync.source !== 'self' && resolve(existingManifest.sync.source),
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(resolve(candidate, 'tarot-port.release.json')));
}

function listeningPorts() {
  const result = spawnSync('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN', '-Fn'], { encoding: 'utf8' });
  return new Set([...String(result.stdout || '').matchAll(/:(\d+)$/gm)].map((match) => Number(match[1])));
}

function inferredPort(value) {
  const match = String(value || '').match(/(?:--port\s+|(?:PORT|port)\s*[=:]\s*)(\d{2,5})/);
  return match ? Number(match[1]) : 0;
}

function shellLauncher() {
  return '#!/bin/sh\nexec node "$(dirname "$0")/tarot-dock.mjs" "$@"\n';
}

function starterManifest({ projectId, displayName, release, source, services, branding = {}, registry = {}, lanEnabled = true }) {
  return {
    version: release.version,
    tarotVersion: release.version,
    projectId,
    displayName,
    branding,
    primaryService: services.find((service) => service.protocol !== 'mongodb')?.id || '',
    network: {
      development: {
        lan: { enabled: lanEnabled, host: '0.0.0.0' },
      },
    },
    profiles: {
      development: { label: 'DEV', services },
      production: { label: 'PROD', services: [] },
    },
    registry: {
      url: registry.url || process.env.TAROT_REGISTRY_URL || 'http://localhost:7609/api/port-index',
      projectId,
      status: 'pending',
    },
    sync: { source, channel: release.channel, baseVersion: release.version },
  };
}

function detectCandidates(targetPackage) {
  const candidates = [];
  const addPackageCandidate = (manifest, cwd, label) => {
    const scripts = manifest?.scripts || {};
    const preferred = ['dev', 'dev:server', 'dev:api', 'start'].find((name) => scripts[name]);
    if (!preferred) return;
    const command = `npm run ${preferred}`;
    const launch = String(scripts[preferred]).toLowerCase();
    const lanAdapter = /\bvinext\b/.test(launch) ? 'vinext'
      : /\bvite\b/.test(launch) ? 'vite'
        : /\bnext\b/.test(launch) ? 'next'
          : /\breact-scripts\b/.test(launch) ? 'react-scripts' : '';
    candidates.push({ label, cwd, command, port: inferredPort(scripts[preferred]), lanAdapter });
  };
  addPackageCandidate(targetPackage, '.', targetPackage?.name || 'Node service');
  const frontendPath = resolve(targetRoot, 'frontend', 'package.json');
  if (existsSync(frontendPath)) addPackageCandidate(readJson(frontendPath), 'frontend', 'Frontend');
  if (existsSync(resolve(targetRoot, 'index.html')) && !candidates.some((candidate) => candidate.lanAdapter)) {
    candidates.push({ label: 'Static HTML site', cwd: '.', command: 'node scripts/tarot-static-server.mjs', port: 0, lanAdapter: 'static', note: 'Detected index.html without a recognized web launcher — Tarot can host it on the assigned LAN port.' });
  }
  if (targetPackage?.dependencies?.electron || targetPackage?.devDependencies?.electron) candidates.push({ label: 'Electron desktop app', cwd: '.', command: '', port: 0, note: 'Electron is a desktop shell, not a LAN server. Configure its Vite, Next, or other renderer separately.' });
  if (existsSync(resolve(targetRoot, 'pyproject.toml'))) candidates.push({ label: 'Python service', cwd: '.', command: '', port: 0, note: 'Detected pyproject.toml — enter its explicit launcher, e.g. python -m uvicorn module:app --reload.' });
  if (existsSync(resolve(targetRoot, 'requirements.txt'))) candidates.push({ label: 'Python service', cwd: '.', command: '', port: 0, note: 'Detected requirements.txt — enter its explicit launcher.' });
  return candidates;
}

async function interactiveManifest(existingManifest, release, source, targetPackage) {
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (label, fallback = '') => {
    const suffix = fallback ? ` [${fallback}]` : '';
    const answer = (await terminal.question(`${label}${suffix}: `)).trim();
    return answer || fallback;
  };
  const confirm = async (label, fallback = true) => {
    const answer = (await ask(`${label} (${fallback ? 'Y/n' : 'y/N'})`, '')).toLowerCase();
    return answer ? ['y', 'yes'].includes(answer) : fallback;
  };
  try {
    const defaultName = existingManifest?.displayName || targetPackage?.name || targetRoot.split('/').pop() || 'Tarot project';
    const displayName = await ask('Project display name', defaultName);
    const projectId = slug(await ask('Project id', existingManifest?.projectId || displayName));
    const lanEnabled = await confirm('Enable LAN access by default for recognized development servers?', true);
    const usedPorts = listeningPorts();
    const services = [];
    const candidates = detectCandidates(targetPackage);
    if (candidates.length) console.log('\nDetected possible launchers:');
    for (const candidate of candidates) {
      console.log(`  - ${candidate.label}: ${candidate.command || candidate.note}`);
      if (!candidate.command || !(await confirm(`Add ${candidate.label} as a Tarot-managed service?`, false))) continue;
      const service = await askService(ask, candidate, usedPorts, services, lanEnabled);
      services.push(service);
      usedPorts.add(service.port);
    }
    while (await confirm('Add another service?', services.length === 0)) {
      const service = await askService(ask, {}, usedPorts, services, lanEnabled);
      services.push(service);
      usedPorts.add(service.port);
    }
    if (await confirm('Monitor a system MongoDB service on :27017?', false)) services.push({ id: 'mongodb', label: 'MongoDB', port: 27017, protocol: 'mongodb', monitorOnly: true, startCommand: ['brew', 'services', 'start', 'mongodb-community'], startupTimeoutMs: 30000, notes: 'System-managed database; Tarot observes and never stops it.' });
    return starterManifest({ projectId, displayName, release, source, services, branding: existingManifest?.branding || {}, registry: existingManifest?.registry || {}, lanEnabled });
  } finally {
    terminal.close();
  }
}

function inferLanAdapter(command, args, candidate) {
  if (candidate.lanAdapter) return candidate.lanAdapter;
  const launch = [command, ...args].join(' ').toLowerCase();
  if (/\btarot-static-server\.mjs\b/.test(launch)) return 'static';
  if (/\bvinext\b/.test(launch)) return 'vinext';
  if (/\bnext\b/.test(launch)) return 'next';
  if (/\breact-scripts\b/.test(launch)) return 'react-scripts';
  if (/\buvicorn\b/.test(launch)) return 'uvicorn';
  if (/\bvite\b/.test(launch)) return 'vite';
  return '';
}

function withLanAdapter(service, lanEnabled) {
  if (!lanEnabled || service.monitorOnly || service.lan || !service.command) return service;
  const adapter = inferLanAdapter(service.command, service.args || [], {});
  return adapter ? { ...service, lan: { enabled: true, adapter, host: '0.0.0.0' } } : service;
}

async function askService(ask, candidate, usedPorts, existingServices, lanEnabled) {
  const label = await ask('Service label', candidate.label || 'Service');
  const id = slug(await ask('Service id', slug(label)));
  const commandLine = await ask('Launch command (executable and arguments)', candidate.command || '');
  const [command, ...args] = splitCommand(commandLine);
  if (!command) throw new Error(`${label} needs a launch command.`);
  const cwd = await ask('Working directory relative to project root', candidate.cwd || '.');
  const suggestedPort = candidate.port ? String(candidate.port) : '';
  const portText = await ask('Port (use the project manifest or DeckOne registry assignment)', suggestedPort);
  const port = Number(portText);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`${label} needs an explicit port from its project configuration or the DeckOne registry; Tarot will not guess one.`);
  if (usedPorts.has(port)) console.log(`  Warning: :${port} is currently listening or already selected. Tarot will not take over an unknown listener.`);
  const healthPath = await ask('Health path (blank = TCP check)', '/');
  const envLine = await ask('Environment values (KEY=value, comma-separated; blank = none)', '');
  const env = Object.fromEntries(envLine.split(',').map((part) => part.trim()).filter(Boolean).map((part) => {
    const splitAt = part.indexOf('=');
    return splitAt > 0 ? [part.slice(0, splitAt).trim(), part.slice(splitAt + 1).trim()] : [part, ''];
  }));
  const dependencyLine = await ask(`Depends on service ids (comma-separated; available: ${existingServices.map((service) => service.id).join(', ') || 'none'})`, '');
  const lanAdapter = inferLanAdapter(command, args, candidate);
  if (lanEnabled) console.log(lanAdapter ? `  LAN: Tarot will bind this ${lanAdapter} service to 0.0.0.0 at runtime.` : '  LAN: This launcher is not recognized; record a custom adapter before exposing it.');
  return {
    id,
    label,
    cwd,
    command,
    args,
    port,
    ...(healthPath ? { healthPath } : {}),
    ...(Object.keys(env).length ? { env } : {}),
    ...(lanAdapter ? { lan: { enabled: true, adapter: lanAdapter, host: '0.0.0.0' } } : {}),
    ...(dependencyLine ? { dependsOn: dependencyLine.split(',').map((item) => item.trim()).filter(Boolean) } : {}),
    autostart: true,
    notes: 'Configured by the Tarot installer.',
  };
}

function manifestFromConfig(config, existingManifest, release, source) {
  if (config.profiles?.development?.services) {
    const lanEnabled = config.network?.development?.lan?.enabled !== false;
    return {
      ...config,
      network: config.network || { development: { lan: { enabled: lanEnabled, host: '0.0.0.0' } } },
      profiles: {
        ...config.profiles,
        development: {
          ...config.profiles.development,
          services: config.profiles.development.services.map((service) => withLanAdapter(service, lanEnabled)),
        },
      },
      version: release.version,
      tarotVersion: release.version,
      projectId: slug(config.projectId || existingManifest?.projectId || config.displayName),
      sync: { ...(config.sync || {}), source, channel: release.channel, baseVersion: release.version },
      registry: { ...(existingManifest?.registry || {}), ...(config.registry || {}), projectId: slug(config.projectId || existingManifest?.projectId || config.displayName), status: config.registry?.status || 'pending' },
    };
  }
  const lanEnabled = config.network?.development?.lan?.enabled !== false;
  const services = (Array.isArray(config.services) ? config.services : []).map((service) => withLanAdapter(service, lanEnabled));
  if (!services.length) throw new Error('Config file needs either profiles.development.services or a top-level services array.');
  const displayName = config.displayName || existingManifest?.displayName || config.projectId || 'Tarot project';
  return starterManifest({ projectId: slug(config.projectId || existingManifest?.projectId || displayName), displayName, release, source, services, branding: config.branding || existingManifest?.branding || {}, registry: config.registry || existingManifest?.registry || {}, lanEnabled });
}

function backup(target, files) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupRoot = resolve(target, '.tarot', 'backups', `install-${stamp}`);
  mkdirSync(backupRoot, { recursive: true });
  files.filter(existsSync).forEach((file) => cpSync(file, resolve(backupRoot, relative(target, file))));
  return backupRoot;
}

async function install() {
  if (!existsSync(targetRoot)) throw new Error(`Target directory was not found: ${targetRoot}`);
  const existingManifest = existsSync(manifestPath) ? readJson(manifestPath) : null;
  if (existingManifest && !reconfigure) throw new Error('Tarot is already installed here. Run npm run tarot:install or pass --reconfigure to revise it.');
  const source = sourceRoot(existingManifest);
  if (!source) throw new Error('No Tarot master release was found. Pass --source /path/to/deckone.');
  const release = readJson(resolve(source, 'tarot-port.release.json'));
  const targetPackage = existsSync(packagePath) ? readJson(packagePath) : null;
  let config = null;
  if (configArgument) {
    const configPath = resolve(configArgument);
    if (!existsSync(configPath)) throw new Error(`Config file was not found: ${configPath}`);
    config = readJson(configPath);
  } else if (!process.stdin.isTTY) {
    throw new Error(`Interactive setup needs a terminal. Supply --config path/to/tarot.setup.json instead.\n\n${usage()}`);
  }
  const manifest = config
    ? manifestFromConfig(config, existingManifest, release, source)
    : await interactiveManifest(existingManifest, release, source, targetPackage);
  const payload = release.files.map((file) => ({ file, source: resolve(source, file), destination: resolve(targetRoot, file) }));
  const tarotScript = 'node scripts/tarot-dock.mjs';
  const existingTarot = targetPackage?.scripts?.tarot;
  if (existingTarot && existingTarot !== tarotScript && !force) throw new Error(`package.json already owns npm run tarot (${existingTarot}). Re-run with --force only after reviewing that command.`);
  console.log(`\nTarot Port ${release.version} (${release.channel})`);
  console.log(`source  ${source}`);
  console.log(`target  ${targetRoot}`);
  payload.forEach((item) => console.log(`${existsSync(item.destination) ? 'update' : 'add   '} ${item.file}`));
  console.log(`${existingManifest ? 'update' : 'add   '} tarot.manifest.json`);
  console.log(targetPackage ? 'update package.json Tarot commands' : 'add   scripts/tarot launcher (no package.json found)');
  if (dryRun) return console.log('\nDry run only. Remove --dry-run to write this installation.');
  const launcherPath = resolve(targetRoot, 'scripts', 'tarot');
  const backupRoot = backup(targetRoot, [manifestPath, packagePath, launcherPath, ...payload.map((item) => item.destination)]);
  payload.forEach((item) => {
    if (!existsSync(item.source)) throw new Error(`Master payload is missing ${item.file}.`);
    mkdirSync(dirname(item.destination), { recursive: true });
    cpSync(item.source, item.destination);
  });
  manifest.version = release.version;
  manifest.tarotVersion = release.version;
  manifest.sync = { ...(manifest.sync || {}), source, channel: release.channel, baseVersion: release.version, installedAt: new Date().toISOString() };
  manifest.registry = { ...(manifest.registry || {}), projectId: manifest.projectId, status: manifest.registry?.status || 'pending' };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  if (targetPackage) {
    targetPackage.scripts = {
      ...(targetPackage.scripts || {}),
      tarot: tarotScript,
      'tarot:update': 'node scripts/tarot-update.mjs',
      'tarot:storm': 'python3 scripts/tarot-terminal-storm.py',
      'tarot:install': 'node scripts/tarot-install.mjs . --reconfigure',
    };
    writeFileSync(packagePath, `${JSON.stringify(targetPackage, null, 2)}\n`);
  } else {
    mkdirSync(dirname(launcherPath), { recursive: true });
    writeFileSync(launcherPath, shellLauncher());
    chmodSync(launcherPath, 0o755);
  }
  const fingerprint = createHash('sha256').update(readFileSync(manifestPath)).digest('hex').slice(0, 12);
  console.log(`\nInstalled Tarot Port ${release.version}. Backup: ${backupRoot}`);
  console.log(`Manifest fingerprint: ${fingerprint}`);
  console.log(targetPackage ? 'Next: npm run tarot' : 'Next: ./scripts/tarot');
  console.log('First startup: awaken --scry');
}

install().catch((error) => fail(error.message));
