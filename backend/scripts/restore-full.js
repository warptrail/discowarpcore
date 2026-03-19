const path = require('path');
const fs = require('fs/promises');
const { execSync } = require('child_process');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { MEDIA_ROOT } = require('../config/media');

const APP_NAME = 'discowarpcore';
const DATABASE_NAME = 'discowarpcore';

function formatTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('') + `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function quoteShell(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function toProjectRelative(targetPath) {
  return path.relative(process.cwd(), targetPath).replace(/\\/g, '/');
}

function usageMessage() {
  return `Usage: npm run restore:full -- dump/discowarpcore-backup-YYYYMMDD-HHmmss.tar.gz`;
}

function assertInsideDirectory(parentDir, childDir, label) {
  const parentResolved = path.resolve(parentDir);
  const childResolved = path.resolve(childDir);
  const isInside =
    childResolved === parentResolved ||
    childResolved.startsWith(`${parentResolved}${path.sep}`);

  if (!isInside) {
    throw new Error(`Refusing to delete ${label} outside allowed directory.`);
  }
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectory(targetPath) {
  const stat = await fs.stat(targetPath);
  if (!stat.isDirectory()) {
    throw new Error(`Expected directory but found: ${targetPath}`);
  }
}

async function copyDirectoryRecursive(sourceDir, targetDir) {
  await fs.mkdir(targetDir, { recursive: true });
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirectoryRecursive(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile()) {
      await fs.copyFile(sourcePath, targetPath);
      continue;
    }

    throw new Error(`Unsupported backup entry type: ${sourcePath}`);
  }
}

async function hasRequiredBackupShape(candidateDir) {
  const manifestPath = path.join(candidateDir, 'manifest.json');
  const mongoPath = path.join(candidateDir, 'mongo');
  const mediaPath = path.join(candidateDir, 'media');

  if (!(await pathExists(manifestPath))) return false;
  if (!(await pathExists(mongoPath))) return false;
  if (!(await pathExists(mediaPath))) return false;

  try {
    await ensureDirectory(mongoPath);
    await ensureDirectory(mediaPath);
    return true;
  } catch {
    return false;
  }
}

async function findBackupRoot(extractionDir) {
  const entries = await fs.readdir(extractionDir, { withFileTypes: true });
  const candidateDirs = [extractionDir];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      candidateDirs.push(path.join(extractionDir, entry.name));
    }
  }

  const matches = [];
  for (const candidate of candidateDirs) {
    if (await hasRequiredBackupShape(candidate)) {
      matches.push(candidate);
    }
  }

  if (matches.length !== 1) {
    throw new Error(
      `Invalid backup archive layout. Expected exactly one backup root with manifest.json, mongo/, media/. Found: ${matches.length}.`,
    );
  }

  return matches[0];
}

async function parseAndValidateManifest(manifestPath) {
  let manifestRaw;
  try {
    manifestRaw = await fs.readFile(manifestPath, 'utf8');
  } catch (err) {
    throw new Error(`Failed to read manifest: ${manifestPath}`);
  }

  let manifest;
  try {
    manifest = JSON.parse(manifestRaw);
  } catch {
    throw new Error(`Invalid JSON in manifest: ${manifestPath}`);
  }

  const looksValid =
    manifest?.app === APP_NAME &&
    manifest?.backupType === 'full' &&
    manifest?.database === DATABASE_NAME &&
    manifest?.includes?.mongo === true &&
    manifest?.includes?.media === true;

  if (!looksValid) {
    throw new Error(
      `Manifest validation failed. Expected ${APP_NAME} full backup for database ${DATABASE_NAME}.`,
    );
  }

  return manifest;
}

async function main() {
  const archiveArg = process.argv[2];
  if (!archiveArg || !String(archiveArg).trim()) {
    console.error(usageMessage());
    process.exit(1);
  }

  const archivePath = path.resolve(process.cwd(), archiveArg);
  const archiveStat = await fs.stat(archivePath).catch(() => null);
  if (!archiveStat?.isFile()) {
    console.error(`Backup archive not found: ${archivePath}`);
    process.exit(1);
  }

  const timestamp = formatTimestamp();
  const dumpDir = path.resolve(process.cwd(), 'dump');
  const tempRestoreDir = path.join(dumpDir, `tmp-restore-${timestamp}`);
  const liveMediaPath = path.resolve(MEDIA_ROOT);
  const liveMediaParent = path.dirname(liveMediaPath);

  let backupRootDir = '';
  let preRestoreMediaBackupPath = '';
  let dbRestoreSucceeded = false;
  let tempWorkspaceCreated = false;
  let mediaRestoreStarted = false;

  try {
    await fs.mkdir(dumpDir, { recursive: true });
    await fs.mkdir(tempRestoreDir, { recursive: true });
    tempWorkspaceCreated = true;

    execSync(
      `tar -xzf ${quoteShell(archivePath)} -C ${quoteShell(tempRestoreDir)}`,
      { stdio: 'inherit' },
    );

    backupRootDir = await findBackupRoot(tempRestoreDir);

    const manifestPath = path.join(backupRootDir, 'manifest.json');
    const mongoDir = path.join(backupRootDir, 'mongo');
    const mediaDir = path.join(backupRootDir, 'media');
    const mongoDbDumpDir = path.join(mongoDir, DATABASE_NAME);

    await parseAndValidateManifest(manifestPath);
    await ensureDirectory(mongoDir);
    await ensureDirectory(mediaDir);
    await ensureDirectory(mongoDbDumpDir);

    console.log(`[restore] archive=${archivePath}`);
    console.log(`[restore] db=${DATABASE_NAME}`);
    console.log(`[restore] media=${liveMediaPath}`);

    execSync(
      `mongorestore --drop --db ${DATABASE_NAME} ${quoteShell(mongoDbDumpDir)}`,
      { stdio: 'inherit' },
    );
    dbRestoreSucceeded = true;

    mediaRestoreStarted = true;
    await fs.mkdir(liveMediaParent, { recursive: true });

    if (await pathExists(liveMediaPath)) {
      preRestoreMediaBackupPath = path.join(
        dumpDir,
        `pre-restore-media-${timestamp}`,
      );
      await fs.rename(liveMediaPath, preRestoreMediaBackupPath);
    }

    await copyDirectoryRecursive(mediaDir, liveMediaPath);

    assertInsideDirectory(dumpDir, tempRestoreDir, 'temporary restore workspace');
    await fs.rm(tempRestoreDir, { recursive: true, force: true });

    console.log('Restore completed successfully.');
    console.log(`- Restored archive: ${toProjectRelative(archivePath)}`);
    console.log(`- Restored database: ${DATABASE_NAME}`);
    console.log(`- Restored media path: ${liveMediaPath}`);
    if (preRestoreMediaBackupPath) {
      console.log(
        `- Pre-restore media safety backup: ${toProjectRelative(preRestoreMediaBackupPath)}`,
      );
    } else {
      console.log('- Pre-restore media safety backup: not created (no existing media dir)');
    }
  } catch (err) {
    if (dbRestoreSucceeded && mediaRestoreStarted) {
      console.error('❌ Partial restore failure.');
      console.error(
        'Database restore succeeded, but media restore failed. Investigate and complete media recovery before using the app.',
      );
      if (preRestoreMediaBackupPath) {
        console.error(
          `Existing media safety backup retained at: ${toProjectRelative(preRestoreMediaBackupPath)}`,
        );
      }
    } else {
      console.error('❌ Full restore failed before completion.');
    }

    if (tempWorkspaceCreated) {
      console.error(
        `Temporary restore workspace retained: ${toProjectRelative(tempRestoreDir)}`,
      );
    }

    if (err?.message) {
      console.error(`Restore failed: ${err.message}`);
    } else {
      console.error(err);
    }

    process.exit(1);
  }
}

main();
