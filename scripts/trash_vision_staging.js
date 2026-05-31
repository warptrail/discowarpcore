#!/usr/bin/env node

const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const { parseArgs, toTrimmed } = require('./intakeWorkspace');

const DEFAULT_STAGING_DIR = path.join(os.homedir(), 'Desktop', 'item_staging_2');

function usageMessage() {
  return [
    'Usage:',
    '  npm run intake:trash-staging -- --yes',
    '',
    'Options:',
    '  --dir /abs/path/to/item_staging_2   Staging folder to empty.',
    '  --dry-run                          Show what would be moved.',
    '  --yes                              Required to move files to Trash.',
    '',
    `Default dir: ${DEFAULT_STAGING_DIR}`,
  ].join('\n');
}

function resolveUserPath(value, fallback) {
  const raw = toTrimmed(value);
  if (!raw) return path.resolve(fallback);
  if (raw === '~') return os.homedir();
  if (raw.startsWith('~/')) return path.join(os.homedir(), raw.slice(2));
  return path.resolve(raw);
}

function compactTimestamp(date = new Date()) {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0'),
  ];
  return `${parts[0]}${parts[1]}${parts[2]}_${parts[3]}${parts[4]}${parts[5]}`;
}

async function assertDirectory(targetDir) {
  const stats = await fs.stat(targetDir).catch(() => null);
  if (!stats || !stats.isDirectory()) {
    throw new Error(`Staging directory not found: ${targetDir}`);
  }
}

function assertSafeStagingDir(targetDir, { allowAnyDir = false } = {}) {
  const resolved = path.resolve(targetDir);
  const homeDir = path.resolve(os.homedir());
  const desktopDir = path.join(homeDir, 'Desktop');
  const baseName = path.basename(resolved).toLowerCase();
  const blocked = new Set([
    path.parse(resolved).root,
    homeDir,
    desktopDir,
    process.cwd(),
    path.resolve(process.cwd(), '..'),
  ]);

  if (blocked.has(resolved)) {
    throw new Error(`Refusing to trash broad directory: ${resolved}`);
  }

  if (!allowAnyDir && !baseName.includes('staging')) {
    throw new Error(
      `Refusing to trash "${resolved}" because the folder name does not include "staging". Use --allow-any-dir to override.`
    );
  }
}

async function listEntries(targetDir) {
  const entries = await fs.readdir(targetDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.name !== '.DS_Store')
    .map((entry) => ({
      name: entry.name,
      sourcePath: path.join(targetDir, entry.name),
      type: entry.isDirectory() ? 'directory' : entry.isFile() ? 'file' : 'entry',
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function uniqueTrashDir(targetDir) {
  const trashRoot = path.join(os.homedir(), '.Trash');
  await fs.mkdir(trashRoot, { recursive: true });
  const baseName = `${path.basename(targetDir)}_${compactTimestamp()}`;
  let candidate = path.join(trashRoot, baseName);
  let suffix = 1;
  while (await fs.access(candidate).then(() => true).catch(() => false)) {
    suffix += 1;
    candidate = path.join(trashRoot, `${baseName}_${suffix}`);
  }
  return candidate;
}

async function moveEntriesToTrash(targetDir, entries) {
  const trashDir = await uniqueTrashDir(targetDir);
  await fs.mkdir(trashDir, { recursive: true });
  for (const entry of entries) {
    await fs.rename(entry.sourcePath, path.join(trashDir, entry.name));
  }
  return trashDir;
}

async function main() {
  const args = parseArgs();
  if (args.help || args.h) {
    console.log(usageMessage());
    return;
  }

  const targetDir = resolveUserPath(args.dir, DEFAULT_STAGING_DIR);
  const dryRun = Boolean(args['dry-run']);
  const confirmed = Boolean(args.yes);
  await assertDirectory(targetDir);
  assertSafeStagingDir(targetDir, { allowAnyDir: Boolean(args['allow-any-dir']) });

  const entries = await listEntries(targetDir);
  console.log(`Vision staging reset: ${targetDir}`);
  console.log(`- entries: ${entries.length}`);
  entries.forEach((entry) => {
    console.log(`  - ${entry.name} (${entry.type})`);
  });

  if (!entries.length) {
    console.log('Nothing to move. Staging folder is already empty.');
    return;
  }

  if (dryRun) {
    console.log('Dry run only. Nothing was moved to Trash.');
    return;
  }

  if (!confirmed) {
    throw new Error('Refusing to move files without --yes. Re-run with --yes after reviewing the listed entries.');
  }

  const trashDir = await moveEntriesToTrash(targetDir, entries);
  console.log('Vision staging reset complete.');
  console.log(`- moved to Trash: ${trashDir}`);
  console.log(`- staging folder kept: ${targetDir}`);
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exitCode = 1;
});
