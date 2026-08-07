#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const localRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const bootstrap = args.includes('--bootstrap');
const verifyOnly = args.includes('--verify');
const dryRun = args.includes('--dry-run');
// Updating is the normal action. --dry-run is the explicit no-write preview;
// --apply remains accepted for older documentation and scripts.
const apply = !verifyOnly && !dryRun;
const forceScript = args.includes('--force-script');
const sourceFlag = args.indexOf('--source');
const sourceOverride = sourceFlag >= 0 ? args[sourceFlag + 1] : '';
const targetArgument = args.find((argument, index) => !argument.startsWith('--') && !(sourceFlag >= 0 && index === sourceFlag + 1));
const targetRoot = resolve(targetArgument || localRoot);
const manifestPath = resolve(targetRoot, 'tarot.manifest.json');
const packagePath = resolve(targetRoot, 'package.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function digest(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 12);
}

function fail(message) {
  console.error(`Tarot update: ${message}`);
  process.exitCode = 1;
}

function starterManifest(targetPackage, release, sourceRoot) {
  const name = targetPackage.name || 'tarot-project';
  return {
    version: release.version,
    tarotVersion: release.version,
    projectId: name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'tarot-project',
    displayName: name,
    branding: {},
    profiles: {
      development: { label: 'DEV', services: [] },
      production: { label: 'PROD', services: [] },
    },
    registry: { url: process.env.TAROT_REGISTRY_URL || 'http://localhost:7609/api/port-index', status: 'pending', projectId: name },
    sync: { source: sourceRoot, channel: release.channel, baseVersion: release.version },
  };
}

function registryServices(manifest) {
  return (manifest.profiles?.development?.services || [])
    .filter((service) => !service.monitorOnly && Number.isInteger(Number(service.port)) && Number(service.port) >= 7610 && Number(service.port) <= 7999)
    .map((service) => ({
      serviceId: service.id,
      serviceName: service.label || service.id,
      role: service.role || service.id,
      port: Number(service.port),
      host: service.host || '0.0.0.0',
      protocol: service.protocol || 'http',
      rootPath: service.rootPath || '',
      notes: service.notes || '',
      adapter: service.portAdapter || {},
      temporary: Boolean(manifest.registry?.pendingRegistry),
    }));
}

function manifestServicePackage(targetRoot, service) {
  const serviceRoot = resolve(targetRoot, service.cwd || '.');
  const packagePath = resolve(serviceRoot, 'package.json');
  if (!serviceRoot.startsWith(`${targetRoot}/`) && serviceRoot !== targetRoot) return null;
  if (!existsSync(packagePath)) return null;
  try { return readJson(packagePath); } catch { return null; }
}

function frontendLanAdapter(service, targetRoot) {
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
  const script = manifestServicePackage(targetRoot, service)?.scripts?.[scriptName];
  const launch = String(script || '').toLowerCase();
  if (/\bvinext\b/.test(launch)) return 'vinext';
  if (/\bvite\b/.test(launch)) return 'vite';
  if (/\bnext\b/.test(launch)) return 'next';
  return /\breact-scripts\b/.test(launch) ? 'react-scripts' : '';
}

function migrateFrontendLanContracts(manifest, targetRoot) {
  if (manifest.network?.development?.lan?.enabled === false) return [];
  const migrated = [];
  for (const service of manifest.profiles?.development?.services || []) {
    const adapter = frontendLanAdapter(service, targetRoot);
    if (service.monitorOnly || service.lan || !adapter) continue;
    service.lan = { enabled: true, adapter, host: '0.0.0.0' };
    migrated.push(`${service.label || service.id} :${service.port}`);
  }
  return migrated;
}

function applyPortReassignment(manifest, targetRoot, allocation) {
  const service = manifest.profiles?.development?.services?.find((item) => item.id === allocation.serviceId);
  if (!service || Number(service.port) === Number(allocation.port)) return '';
  const adapter = service.portAdapter || allocation.adapter || {};
  if (!adapter.file || !adapter.match) throw new Error(`${service.label || service.id} moved from :${service.port} to :${allocation.port}, but no recorded portAdapter can rewrite its config.`);
  const configPath = resolve(targetRoot, adapter.file);
  if (!configPath.startsWith(`${targetRoot}/`) || !existsSync(configPath)) throw new Error(`Recorded portAdapter file is unavailable: ${adapter.file}`);
  const original = readFileSync(configPath, 'utf8');
  const matcher = new RegExp(adapter.match, 'm');
  if (!matcher.test(original)) throw new Error(`Recorded portAdapter match did not find a port in ${adapter.file}`);
  const backupRoot = resolve(targetRoot, '.tarot', 'backups', `registry-reassign-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  mkdirSync(backupRoot, { recursive: true });
  cpSync(configPath, resolve(backupRoot, relative(targetRoot, configPath)));
  const replacement = adapter.strategy === 'capture' ? `$1${allocation.port}` : String(allocation.port);
  writeFileSync(configPath, original.replace(matcher, replacement));
  service.port = allocation.port;
  return `${service.label || service.id} reassigned :${allocation.port}`;
}

async function syncRegistry(manifest, targetRoot, release) {
  const registry = manifest.registry || {};
  const baseUrl = String(registry.url || process.env.TAROT_REGISTRY_URL || 'http://localhost:7609/api/port-index').replace(/\/$/, '');
  const projectId = manifest.projectId;
  const payload = {
    projectId,
    projectName: manifest.displayName || projectId,
    rootPath: targetRoot,
    source: manifest.sync?.source || '',
    tarotVersion: release.version,
    syncChannel: manifest.sync?.channel || release.channel,
    services: registryServices(manifest),
  };
  try {
    const endpoint = payload.services.length ? 'allocate-batch' : 'register';
    const response = await fetch(`${baseUrl}/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(1500) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || `Registry returned ${response.status}`);
    const reassigned = (body.allocations || []).map((allocation) => applyPortReassignment(manifest, targetRoot, allocation)).filter(Boolean);
    manifest.registry = { ...registry, url: baseUrl, projectId, status: 'registered', lastSyncAt: new Date().toISOString(), lastError: '' };
    return `Registry: ${payload.services.length} development service${payload.services.length === 1 ? '' : 's'} synchronized.${reassigned.length ? ` ${reassigned.join('; ')}.` : ''}`;
  } catch (error) {
    manifest.registry = { ...registry, url: baseUrl, projectId, status: 'offline', pendingRegistry: true, lastSyncAt: new Date().toISOString(), lastError: error.message };
    return `Registry: offline — local Tarot remains runnable (${error.message}).`;
  }
}

if (!existsSync(packagePath)) {
  fail(`No package.json found in ${targetRoot}. Tarot's Node Dock needs a package script.`);
} else {
  const targetPackage = readJson(packagePath);
  const existingManifest = existsSync(manifestPath) ? readJson(manifestPath) : null;
  const sourceRoot = sourceOverride
    ? resolve(sourceOverride)
    : targetArgument
      ? localRoot
      : existingManifest?.sync?.source && existingManifest.sync.source !== 'self'
        ? resolve(existingManifest.sync.source)
        : localRoot;
  const releasePath = resolve(sourceRoot, 'tarot-port.release.json');
  if (!existsSync(releasePath)) {
    fail(`No Tarot release found at ${sourceRoot}. Use --source /path/to/deckone, or run the master updater with a target path.`);
  } else if (!existingManifest && !bootstrap) {
    fail(`No tarot.manifest.json found in ${targetRoot}. Use --bootstrap to add a safe empty Tarot manifest, then configure this project's services.`);
  } else {
    const release = readJson(releasePath);
    const targetManifest = existingManifest || starterManifest(targetPackage, release, sourceRoot);
    const viteLanMigrations = migrateFrontendLanContracts(targetManifest, targetRoot);
    const recordedSource = targetRoot === sourceRoot ? 'self' : sourceRoot;
    const planned = release.files.map((file) => {
      const source = resolve(sourceRoot, file);
      const destination = resolve(targetRoot, file);
      return { file, source, destination, state: !existsSync(destination) ? 'add' : digest(source) === digest(destination) ? 'current' : 'update' };
    });
    const tarotScript = 'node scripts/tarot-dock.mjs';
    const updaterScript = 'node scripts/tarot-update.mjs';
    const stormScript = 'python3 scripts/tarot-terminal-storm.py';
    const installerScript = 'node scripts/tarot-install.mjs . --reconfigure';
    const scriptConflict = targetPackage.scripts?.tarot && targetPackage.scripts.tarot !== tarotScript;
    const metadataCurrent = targetManifest.version === release.version && targetManifest.tarotVersion === release.version && targetManifest.sync?.source === recordedSource && targetManifest.sync?.channel === release.channel && targetManifest.sync?.baseVersion === release.version;
    const scriptsCurrent = !scriptConflict && targetPackage.scripts?.tarot === tarotScript && targetPackage.scripts?.['tarot:update'] === updaterScript && targetPackage.scripts?.['tarot:storm'] === stormScript && targetPackage.scripts?.['tarot:install'] === installerScript;
    const filesCurrent = planned.every((item) => item.state === 'current');
    const changed = !existingManifest || !filesCurrent || !metadataCurrent || !scriptsCurrent || viteLanMigrations.length > 0;

    console.log(`Tarot Port ${release.version} (${release.channel})`);
    console.log(`source  ${sourceRoot}`);
    console.log(`target  ${targetRoot}`);
    if (!existingManifest) console.log('add     tarot.manifest.json (bootstrap skeleton)');
    planned.forEach((item) => console.log(`${item.state.padEnd(7)} ${item.file}`));
    console.log(scriptConflict ? `conflict package.json scripts.tarot = ${targetPackage.scripts.tarot}` : scriptsCurrent ? 'current package.json Tarot commands' : 'update  package.json Tarot commands');
    viteLanMigrations.forEach((service) => console.log(`configure LAN frontend adapter for ${service}`));

    if (verifyOnly) {
      if (filesCurrent && metadataCurrent && scriptsCurrent) console.log('\nVerification passed: target is byte-aligned with the declared master release.');
      else fail('Verification failed: target is not fully synchronized with the declared master release.');
    } else if (!apply) {
      console.log(changed ? '\nDry run only. Remove --dry-run to write this update.' : '\nAlready current and byte-aligned.');
    } else if (!changed) {
      console.log('\nAlready current; nothing was written.');
    } else if (scriptConflict && !forceScript) {
      fail('Refusing to replace this project\'s existing npm run tarot command. Review it, then use --force-script only if replacement is intended.');
    } else {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupRoot = resolve(targetRoot, '.tarot', 'backups', stamp);
      mkdirSync(backupRoot, { recursive: true });
      [manifestPath, packagePath, ...planned.filter((item) => existsSync(item.destination)).map((item) => item.destination)].forEach((file) => {
        if (existsSync(file)) cpSync(file, resolve(backupRoot, relative(targetRoot, file)));
      });
      planned.forEach((item) => {
        mkdirSync(dirname(item.destination), { recursive: true });
        cpSync(item.source, item.destination);
      });
      targetManifest.version = release.version;
      targetManifest.tarotVersion = release.version;
      targetManifest.sync = { source: recordedSource, channel: release.channel, baseVersion: release.version, updatedAt: new Date().toISOString() };
      targetManifest.registry = { ...(targetManifest.registry || {}), url: targetManifest.registry?.url || process.env.TAROT_REGISTRY_URL || 'http://localhost:7609/api/port-index', projectId: targetManifest.projectId, status: targetManifest.registry?.status || 'pending' };
      targetPackage.scripts = { ...(targetPackage.scripts || {}), 'tarot:update': updaterScript, 'tarot:storm': stormScript, 'tarot:install': installerScript };
      if (!scriptConflict || forceScript) targetPackage.scripts.tarot = tarotScript;
      writeFileSync(manifestPath, `${JSON.stringify(targetManifest, null, 2)}\n`);
      writeFileSync(packagePath, `${JSON.stringify(targetPackage, null, 2)}\n`);

      const verified = planned.every((item) => existsSync(item.destination) && digest(item.source) === digest(item.destination));
      if (!verified) fail(`Update wrote files but post-update checksum verification failed. Restore from ${backupRoot}.`);
      else {
        const registryResult = targetRoot === sourceRoot ? 'Registry: master source uses its seeded allocations.' : await syncRegistry(targetManifest, targetRoot, release);
        writeFileSync(manifestPath, `${JSON.stringify(targetManifest, null, 2)}\n`);
        console.log(`\nUpdated and checksum-verified. Backup: ${backupRoot}`);
        console.log(registryResult);
        console.log(existingManifest ? 'Run npm run tarot in the target project.' : 'Configure the new manifest services before running npm run tarot.');
      }
    }
  }
}
