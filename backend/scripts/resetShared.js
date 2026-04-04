const path = require('path');
const fs = require('fs/promises');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { MEDIA_ROOT, ensureMediaDirs } = require('../config/media');
const {
  INTAKE_ROOT,
  BATCHES_ROOT,
  getExternalIntakeRoot,
} = require('../../scripts/intakeWorkspace');

const DATABASE_NAME = 'discowarpcore';
const STANDARD_CONFIRM_FLAG = '--yes-reset-db-and-intake';
const HARD_CONFIRM_FLAG = '--yes-delete-everything';

function resolveMongoUri() {
  return process.env.MONGO_URI || `mongodb://127.0.0.1:27017/${DATABASE_NAME}`;
}

function assertSafeRepoPath(targetPath, expectedSegments) {
  const resolvedTargetPath = path.resolve(targetPath);
  const rootPath = path.parse(resolvedTargetPath).root;

  if (!path.isAbsolute(resolvedTargetPath)) {
    throw new Error(`Resolved path is not absolute: ${resolvedTargetPath}`);
  }

  if (resolvedTargetPath === rootPath) {
    throw new Error(`Refusing to delete filesystem root: ${resolvedTargetPath}`);
  }

  const actualSegments = resolvedTargetPath.split(path.sep).filter(Boolean);
  const tail = actualSegments.slice(-expectedSegments.length);

  if (tail.join('/') !== expectedSegments.join('/')) {
    throw new Error(
      `Refusing to wipe unexpected path. Expected suffix "${expectedSegments.join('/')}", got "${resolvedTargetPath}"`,
    );
  }
}

async function dropDatabase(mongoUri) {
  await mongoose.connect(mongoUri, { dbName: DATABASE_NAME });
  await mongoose.connection.db.dropDatabase();
}

async function wipeIntakeState() {
  assertSafeRepoPath(INTAKE_ROOT, ['var', 'intake']);
  const externalIntakeRoot = path.resolve(getExternalIntakeRoot());

  if (externalIntakeRoot !== INTAKE_ROOT) {
    const expectedExternalSegments = ['Intake', 'discowarpcore'];
    const actualSegments = externalIntakeRoot.split(path.sep).filter(Boolean);
    const tail = actualSegments.slice(-expectedExternalSegments.length);

    if (tail.join('/') !== expectedExternalSegments.join('/')) {
      throw new Error(
        `Refusing to wipe unexpected external intake path: ${externalIntakeRoot}`,
      );
    }
  }

  await fs.rm(INTAKE_ROOT, { recursive: true, force: true });
  await fs.mkdir(BATCHES_ROOT, { recursive: true });

  if (externalIntakeRoot !== INTAKE_ROOT) {
    await fs.rm(externalIntakeRoot, { recursive: true, force: true });
    await fs.mkdir(externalIntakeRoot, { recursive: true });
  }

  return {
    repoIntakeRoot: INTAKE_ROOT,
    repoBatchesRoot: BATCHES_ROOT,
    externalIntakeRoot,
  };
}

async function wipeMediaState() {
  const liveMediaPath = path.resolve(MEDIA_ROOT);
  const dumpDir = path.resolve(process.cwd(), 'dump');

  if (!path.isAbsolute(liveMediaPath)) {
    throw new Error(`Resolved media path is not absolute: ${liveMediaPath}`);
  }

  if (liveMediaPath === path.parse(liveMediaPath).root) {
    throw new Error(`Refusing to delete filesystem root: ${liveMediaPath}`);
  }

  if (path.basename(liveMediaPath) !== 'media') {
    throw new Error(
      `Refusing to wipe non-media directory. Resolved path must end with "media": ${liveMediaPath}`,
    );
  }

  const touchesDump =
    liveMediaPath === dumpDir ||
    liveMediaPath.startsWith(`${dumpDir}${path.sep}`);

  if (touchesDump) {
    throw new Error(`Refusing to wipe anything under dump/: ${liveMediaPath}`);
  }

  await fs.rm(liveMediaPath, { recursive: true, force: true });
  ensureMediaDirs();

  return liveMediaPath;
}

async function disconnectMongooseQuietly() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors during shutdown
  }
}

module.exports = {
  DATABASE_NAME,
  STANDARD_CONFIRM_FLAG,
  HARD_CONFIRM_FLAG,
  INTAKE_ROOT,
  BATCHES_ROOT,
  getExternalIntakeRoot,
  MEDIA_ROOT,
  resolveMongoUri,
  dropDatabase,
  wipeIntakeState,
  wipeMediaState,
  disconnectMongooseQuietly,
};
