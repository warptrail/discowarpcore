// Explicit NeonAzoth entry point. The development CLI continues to refuse production.
const fs = require('node:fs/promises');
const syncFs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { randomUUID } = require('node:crypto');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const mongoose = require('mongoose');
const ROOT = '/home/warptrail/discowarpcore';

function assertProductionTarget({ uri, expectedDatabase, hostname = os.hostname(), username = os.userInfo().username,
  platform = process.platform, cwd = process.cwd(), realRoot = syncFs.realpathSync(cwd) }) {
  if (platform !== 'linux' || hostname.split('.')[0].toLowerCase() !== 'neonazoth' || username !== 'warptrail' || cwd !== ROOT || realRoot !== ROOT) {
    throw new Error('Refusing production migration: wrong host, account or canonical app root');
  }
  const parsed = new URL(uri);
  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
  if (parsed.protocol !== 'mongodb:' || !['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname)
    || !expectedDatabase || database !== expectedDatabase || /(?:_dev|_test|test)$/i.test(database)
    || parsed.searchParams.has('dbName')) {
    throw new Error('Refusing production migration: expected database must match the configured loopback production target');
  }
  return database;
}

async function main() {
  require('dotenv').config({ path: path.join(ROOT, 'backend/.env'), quiet: true, override: true });
  const args = process.argv.slice(2);
  if (args.some(arg => !['--apply', '--dry-run'].includes(arg) && !/^--expected-database=[A-Za-z0-9_-]+$/.test(arg))
    || (args.includes('--apply') && args.includes('--dry-run'))
    || args.filter(arg => arg.startsWith('--expected-database=')).length !== 1) {
    throw new Error('Usage: migrate-location-exact-spot-production.js --expected-database=NAME [--dry-run | --apply]');
  }
  const expectedDatabase = args.find(arg => arg.startsWith('--expected-database=')).split('=')[1];
  const database = assertProductionTarget({ uri: process.env.MONGO_URI, expectedDatabase });
  const { migrate, assertApiStopped } = require('./migrate-location-exact-spot');
  const apply = args.includes('--apply');
  if (apply) await assertApiStopped(5002);
  const client = new mongoose.mongo.MongoClient(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db(database);
    const preflight = await migrate(db);
    if (preflight.conflicts.length || !apply) {
      console.log(JSON.stringify(preflight, null, 2));
      if (preflight.conflicts.length) process.exitCode = 1;
      return;
    }
    const backupRoot = path.join(ROOT, 'var/backups/location-exact-spot-production', `${Date.now()}-${randomUUID()}`);
    await fs.mkdir(backupRoot, { recursive: true, mode: 0o700 });
    const databaseArchive = path.join(backupRoot, 'database.archive.gz');
    // Back up all production collections and their indexes while writes are stopped.
    try {
      await promisify(execFile)('/usr/bin/mongodump', ['--uri', process.env.MONGO_URI, '--archive=' + databaseArchive, '--gzip'], { timeout: 120000, maxBuffer: 1024 * 1024 });
    } catch { throw new Error('Full production database backup failed; no location migration was applied'); }
    await fs.chmod(databaseArchive, 0o600);
    if (!(await fs.stat(databaseArchive)).size) throw new Error('Empty database backup; refusing migration');
    const counts = { boxes: await db.collection('boxes').countDocuments(), items: await db.collection('items').countDocuments() };
    const result = await migrate(db, { apply: true, backupRoot });
    const after = { boxes: await db.collection('boxes').countDocuments(), items: await db.collection('items').countDocuments() };
    if (JSON.stringify(counts) !== JSON.stringify(after)) throw new Error('Inventory counts changed during migration; inspect backup before continuing');
    console.log(JSON.stringify({ ...result, databaseArchive, inventoryCounts: after }, null, 2));
    if (!result.verified || result.conflicts.length) process.exitCode = 1;
  } finally { await client.close(); }
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { assertProductionTarget };
