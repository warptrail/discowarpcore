const path = require('path');
const fs = require('fs/promises');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { MEDIA_ROOT, ensureMediaDirs } = require('../config/media');

const DATABASE_NAME = 'discowarpcore';
const CONFIRM_FLAG = '--yes-delete-everything';

function usageMessage() {
  return `Usage: npm run reset:hard -- ${CONFIRM_FLAG}`;
}

function resolveMongoUri() {
  return process.env.MONGO_URI || `mongodb://127.0.0.1:27017/${DATABASE_NAME}`;
}

function assertSafeMediaPath(mediaPath, { dumpDir }) {
  const resolvedMediaPath = path.resolve(mediaPath);
  const resolvedDumpDir = path.resolve(dumpDir);
  const rootPath = path.parse(resolvedMediaPath).root;

  if (!path.isAbsolute(resolvedMediaPath)) {
    throw new Error(`Resolved media path is not absolute: ${resolvedMediaPath}`);
  }

  if (resolvedMediaPath === rootPath) {
    throw new Error(`Refusing to delete filesystem root: ${resolvedMediaPath}`);
  }

  if (path.basename(resolvedMediaPath) !== 'media') {
    throw new Error(
      `Refusing to wipe non-media directory. Resolved path must end with "media": ${resolvedMediaPath}`,
    );
  }

  const touchesDump =
    resolvedMediaPath === resolvedDumpDir ||
    resolvedMediaPath.startsWith(`${resolvedDumpDir}${path.sep}`);

  if (touchesDump) {
    throw new Error(`Refusing to wipe anything under dump/: ${resolvedMediaPath}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.includes(CONFIRM_FLAG)) {
    console.error('❌ Refusing to run destructive reset without explicit confirmation flag.');
    console.error(usageMessage());
    process.exit(1);
  }

  const mongoUri = resolveMongoUri();
  const dumpDir = path.resolve(process.cwd(), 'dump');
  const liveMediaPath = path.resolve(MEDIA_ROOT);

  assertSafeMediaPath(liveMediaPath, { dumpDir });

  let dbDropped = false;
  let mediaWiped = false;
  let mediaRecreated = false;

  try {
    console.log(`[reset] db=${DATABASE_NAME}`);
    console.log(`[reset] mongoUri=${mongoUri}`);
    console.log(`[reset] media=${liveMediaPath}`);

    await mongoose.connect(mongoUri, { dbName: DATABASE_NAME });
    await mongoose.connection.db.dropDatabase();
    dbDropped = true;
    console.log(`✅ Dropped database: ${DATABASE_NAME}`);

    await fs.rm(liveMediaPath, { recursive: true, force: true });
    mediaWiped = true;
    console.log(`✅ Wiped media directory: ${liveMediaPath}`);

    ensureMediaDirs();
    mediaRecreated = true;
    console.log(`✅ Recreated media directory structure at: ${liveMediaPath}`);

    console.log('Hard reset completed.');
    console.log(`- database dropped: ${dbDropped}`);
    console.log(`- media wiped: ${mediaWiped}`);
    console.log(`- media directory recreated: ${mediaRecreated}`);
  } catch (err) {
    console.error('❌ Hard reset failed.');
    console.error(`- database dropped: ${dbDropped}`);
    console.error(`- media wiped: ${mediaWiped}`);
    console.error(`- media directory recreated: ${mediaRecreated}`);
    if (err?.message) {
      console.error(`Error: ${err.message}`);
    } else {
      console.error(err);
    }
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.disconnect();
      } catch {
        // ignore disconnect errors during shutdown
      }
    }
  }
}

main();
