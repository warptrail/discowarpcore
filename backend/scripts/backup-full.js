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

    throw new Error(`Unsupported media entry type: ${sourcePath}`);
  }
}

async function main() {
  const timestamp = formatTimestamp();
  const dumpDir = path.resolve(process.cwd(), 'dump');
  const tempWorkspaceName = `tmp-backup-${timestamp}`;
  const backupFolderName = `${APP_NAME}-backup-${timestamp}`;
  const archiveName = `${backupFolderName}.tar.gz`;

  const tempWorkspaceDir = path.join(dumpDir, tempWorkspaceName);
  const backupRootDir = path.join(tempWorkspaceDir, backupFolderName);
  const mongoOutputDir = path.join(backupRootDir, 'mongo');
  const mediaOutputDir = path.join(backupRootDir, 'media');
  const manifestPath = path.join(backupRootDir, 'manifest.json');
  const archivePath = path.join(dumpDir, archiveName);

  await fs.mkdir(dumpDir, { recursive: true });
  await fs.mkdir(mongoOutputDir, { recursive: true });
  await fs.mkdir(mediaOutputDir, { recursive: true });

  console.log(`[backup] db=${DATABASE_NAME}`);
  console.log(`[backup] media=${path.resolve(MEDIA_ROOT)}`);

  try {
    execSync(
      `mongodump --db ${DATABASE_NAME} --out ${quoteShell(mongoOutputDir)}`,
      { stdio: 'inherit' },
    );
  } catch (err) {
    console.error('❌ Mongo dump failed.');
    console.error(
      `Temporary backup workspace retained: ${toProjectRelative(tempWorkspaceDir)}`,
    );
    throw err;
  }

  const mediaSourceDir = path.resolve(MEDIA_ROOT);
  let mediaStat;

  try {
    mediaStat = await fs.stat(mediaSourceDir);
  } catch (err) {
    console.error(`❌ Media directory not found: ${mediaSourceDir}`);
    console.error(
      `Temporary backup workspace retained: ${toProjectRelative(tempWorkspaceDir)}`,
    );
    throw err;
  }

  if (!mediaStat.isDirectory()) {
    throw new Error(`Media path is not a directory: ${mediaSourceDir}`);
  }

  try {
    await copyDirectoryRecursive(mediaSourceDir, mediaOutputDir);
  } catch (err) {
    console.error('❌ Failed to copy media directory.');
    console.error(
      `Temporary backup workspace retained: ${toProjectRelative(tempWorkspaceDir)}`,
    );
    throw err;
  }

  const manifest = {
    app: APP_NAME,
    database: DATABASE_NAME,
    createdAt: new Date().toISOString(),
    backupType: 'full',
    includes: {
      mongo: true,
      media: true,
    },
  };

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  try {
    execSync(
      `tar -czf ${quoteShell(archivePath)} -C ${quoteShell(tempWorkspaceDir)} ${quoteShell(
        backupFolderName,
      )}`,
      { stdio: 'inherit' },
    );
  } catch (err) {
    console.error('❌ Failed to compress full backup archive.');
    console.error(
      `Temporary backup workspace retained: ${toProjectRelative(tempWorkspaceDir)}`,
    );
    throw err;
  }

  assertInsideDirectory(dumpDir, tempWorkspaceDir, 'temporary workspace');
  await fs.rm(tempWorkspaceDir, { recursive: true, force: true });

  console.log(`Backup created: ${toProjectRelative(archivePath)}`);
}

main().catch((err) => {
  if (err?.message) {
    console.error(`Full backup failed: ${err.message}`);
  }
  process.exit(1);
});
