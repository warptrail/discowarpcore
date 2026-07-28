#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const localRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const bootstrap = args.includes('--bootstrap');
const verifyOnly = args.includes('--verify');
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
    sync: { source: sourceRoot, channel: release.channel, baseVersion: release.version },
  };
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
    const recordedSource = targetRoot === sourceRoot ? 'self' : sourceRoot;
    const planned = release.files.map((file) => {
      const source = resolve(sourceRoot, file);
      const destination = resolve(targetRoot, file);
      return { file, source, destination, state: !existsSync(destination) ? 'add' : digest(source) === digest(destination) ? 'current' : 'update' };
    });
    const tarotScript = 'node scripts/tarot-dock.mjs';
    const updaterScript = 'node scripts/tarot-update.mjs';
    const scriptConflict = targetPackage.scripts?.tarot && targetPackage.scripts.tarot !== tarotScript;
    const metadataCurrent = targetManifest.version === release.version && targetManifest.tarotVersion === release.version && targetManifest.sync?.source === recordedSource && targetManifest.sync?.channel === release.channel && targetManifest.sync?.baseVersion === release.version;
    const scriptsCurrent = !scriptConflict && targetPackage.scripts?.tarot === tarotScript && targetPackage.scripts?.['tarot:update'] === updaterScript;
    const filesCurrent = planned.every((item) => item.state === 'current');
    const changed = !existingManifest || !filesCurrent || !metadataCurrent || !scriptsCurrent;

    console.log(`Tarot Port ${release.version} (${release.channel})`);
    console.log(`source  ${sourceRoot}`);
    console.log(`target  ${targetRoot}`);
    if (!existingManifest) console.log('add     tarot.manifest.json (bootstrap skeleton)');
    planned.forEach((item) => console.log(`${item.state.padEnd(7)} ${item.file}`));
    console.log(scriptConflict ? `conflict package.json scripts.tarot = ${targetPackage.scripts.tarot}` : scriptsCurrent ? 'current package.json Tarot commands' : 'update  package.json Tarot commands');

    if (verifyOnly) {
      if (filesCurrent && metadataCurrent && scriptsCurrent) console.log('\nVerification passed: target is byte-aligned with the declared master release.');
      else fail('Verification failed: target is not fully synchronized with the declared master release.');
    } else if (!apply) {
      console.log(changed ? '\nDry run only. Re-run with --apply to write this update.' : '\nAlready current and byte-aligned.');
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
      targetPackage.scripts = { ...(targetPackage.scripts || {}), 'tarot:update': updaterScript };
      if (!scriptConflict || forceScript) targetPackage.scripts.tarot = tarotScript;
      writeFileSync(manifestPath, `${JSON.stringify(targetManifest, null, 2)}\n`);
      writeFileSync(packagePath, `${JSON.stringify(targetPackage, null, 2)}\n`);

      const verified = planned.every((item) => existsSync(item.destination) && digest(item.source) === digest(item.destination));
      if (!verified) fail(`Update wrote files but post-update checksum verification failed. Restore from ${backupRoot}.`);
      else {
        console.log(`\nUpdated and checksum-verified. Backup: ${backupRoot}`);
        console.log(existingManifest ? 'Run npm run tarot in the target project.' : 'Configure the new manifest services before running npm run tarot.');
      }
    }
  }
}
