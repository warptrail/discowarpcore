#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const localRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const apply = args.includes('--apply');
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

if (!existsSync(manifestPath)) {
  fail(`No tarot.manifest.json found in ${targetRoot}. Initialize and describe that project's services before syncing.`);
} else if (!existsSync(packagePath)) {
  fail(`No package.json found in ${targetRoot}. Tarot's Node Dock needs a package script.`);
} else {
  const targetManifest = readJson(manifestPath);
  const sourceRoot = sourceOverride
    ? resolve(sourceOverride)
    : targetArgument
      ? localRoot
      : targetManifest.sync?.source && targetManifest.sync.source !== 'self'
        ? resolve(targetManifest.sync.source)
        : localRoot;
  const releasePath = resolve(sourceRoot, 'tarot-port.release.json');
  if (!existsSync(releasePath)) {
    fail(`No Tarot release found at ${sourceRoot}. Use --source /path/to/deckone or sync from DeckOne.`);
  } else {
    const release = readJson(releasePath);
    const targetPackage = readJson(packagePath);
    const planned = release.files.map((file) => {
      const source = resolve(sourceRoot, file);
      const destination = resolve(targetRoot, file);
      return { file, source, destination, state: !existsSync(destination) ? 'add' : digest(source) === digest(destination) ? 'current' : 'update' };
    });
    const tarotScript = 'node scripts/tarot-dock.mjs';
    const updaterScript = 'node scripts/tarot-update.mjs';
    const scriptConflict = targetPackage.scripts?.tarot && targetPackage.scripts.tarot !== tarotScript;
    const changed = planned.some((item) => item.state !== 'current') || targetManifest.tarotVersion !== release.version || targetPackage.scripts?.['tarot:update'] !== updaterScript || (!scriptConflict && targetPackage.scripts?.tarot !== tarotScript);

    console.log(`Tarot Port ${release.version} (${release.channel})`);
    console.log(`source  ${sourceRoot}`);
    console.log(`target  ${targetRoot}`);
    planned.forEach((item) => console.log(`${item.state.padEnd(7)} ${item.file}`));
    console.log(scriptConflict ? `conflict package.json scripts.tarot = ${targetPackage.scripts.tarot}` : 'ready   package.json Tarot commands');

    if (!apply) {
      console.log(changed ? '\nDry run only. Re-run with --apply to write this update.' : '\nAlready current.');
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
      targetManifest.tarotVersion = release.version;
      targetManifest.sync = {
        source: sourceRoot,
        channel: release.channel,
        baseVersion: release.version,
        updatedAt: new Date().toISOString(),
      };
      targetPackage.scripts = { ...(targetPackage.scripts || {}), 'tarot:update': updaterScript };
      if (!scriptConflict || forceScript) targetPackage.scripts.tarot = tarotScript;
      writeFileSync(manifestPath, `${JSON.stringify(targetManifest, null, 2)}\n`);
      writeFileSync(packagePath, `${JSON.stringify(targetPackage, null, 2)}\n`);
      console.log(`\nUpdated safely. Backup: ${backupRoot}`);
      console.log('Run npm run tarot in the target project.');
    }
  }
}
