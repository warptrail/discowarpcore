const path = require('node:path');
const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const net = require('node:net');
const mongoose = require('mongoose');
const { assertDevelopmentResetTarget, resolveMongoUri } = require('./resetShared');
const { normalizeLocationInput } = require('../services/locationService');
const { locationStructureKey } = require('../utils/locationName');

const INDEX_KEY = { room: 1, vicinity: 1, specifics: 1, exactSpot: 1 };
const INDEX_NAME = 'room_1_vicinity_1_specifics_1_exactSpot_1';
const isKey = (index, key) => JSON.stringify(index.key) === JSON.stringify(key);

function findConflicts(locations) {
  const seen = new Map();
  const conflicts = [];
  for (const location of locations) {
    try {
      normalizeLocationInput(location);
      const key = locationStructureKey(location);
      if (seen.has(key)) conflicts.push({ ids: [String(seen.get(key)), String(location._id)], reason: 'Duplicate normalized path' });
      else seen.set(key, location._id);
    } catch (error) {
      conflicts.push({ ids: [String(location._id)], reason: error.message });
    }
  }
  return conflicts;
}

async function migrate(db, { apply = false, backupRoot = path.resolve(__dirname, '../../var/backups/location-exact-spot') } = {}) {
  const collection = db.collection('locations');
  const locations = await collection.find().toArray();
  const indexes = await collection.listIndexes().toArray().catch((error) => {
    if (error.code === 26) return [];
    throw error;
  });
  const conflicts = findConflicts(locations);
  const pending = locations.filter((entry) => entry.exactSpot == null).length;
  const report = { database: db.databaseName, apply, locations: locations.length, pending, conflicts };
  if (conflicts.length || !apply) return report;

  const assignments = await db.collection('boxes').find({}, { projection: { _id: 1, locationId: 1 } }).toArray();
  await fs.mkdir(backupRoot, { recursive: true });
  const snapshotPath = path.join(backupRoot, `${Date.now()}-${randomUUID()}.json`);
  await fs.writeFile(snapshotPath, mongoose.mongo.BSON.EJSON.stringify({ database: db.databaseName, locations, indexes, assignments }, null, 2), { flag: 'wx', mode: 0o600 });

  // The CLI must run while the development API is stopped through its owner.
  await collection.updateMany({ exactSpot: null }, { $set: { exactSpot: '' } });
  await collection.createIndex(INDEX_KEY, { name: INDEX_NAME, unique: true, collation: { locale: 'en', strength: 2 } });
  const nextIndexes = await collection.listIndexes().toArray();
  const replacement = nextIndexes.find((index) => index.name === INDEX_NAME);
  if (!replacement?.unique || !isKey(replacement, INDEX_KEY) || replacement.collation?.strength !== 2) {
    throw new Error(`Four-tier index verification failed; snapshot: ${snapshotPath}`);
  }
  for (const index of nextIndexes) {
    if (isKey(index, { room: 1, vicinity: 1, specifics: 1 }) && index.unique) await collection.dropIndex(index.name);
  }
  const after = await collection.find().toArray();
  const afterAssignments = await db.collection('boxes').find({}, { projection: { _id: 1, locationId: 1 } }).toArray();
  const serialize = (entries) => mongoose.mongo.BSON.EJSON.stringify([...entries].sort((a, b) => String(a._id).localeCompare(String(b._id))));
  const expected = locations.map((entry) => ({ ...entry, exactSpot: entry.exactSpot ?? '' }));
  if (serialize(expected) !== serialize(after) || serialize(assignments) !== serialize(afterAssignments)) {
    throw new Error(`Record or assignment verification failed; snapshot: ${snapshotPath}`);
  }
  return { ...report, snapshotPath, verified: true };
}

async function assertApiStopped() {
  const listening = await new Promise((resolve, reject) => {
    const socket = net.connect({ host: '127.0.0.1', port: 7610 });
    socket.setTimeout(2000);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', (error) => {
      socket.destroy();
      if (error.code === 'ECONNREFUSED') resolve(false);
      else reject(error);
    });
    socket.once('timeout', () => { socket.destroy(); reject(new Error('Could not verify that dev API is stopped')); });
  });
  if (listening) throw new Error('Stop the development backend through Tarot before --apply; then awaken it after migration.');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => !['--apply', '--dry-run'].includes(arg)) || (args.includes('--apply') && args.includes('--dry-run'))) {
    throw new Error('Usage: node backend/scripts/migrate-location-exact-spot.js [--dry-run | --apply]');
  }
  const uri = resolveMongoUri();
  const target = assertDevelopmentResetTarget(uri);
  if (args.includes('--apply')) await assertApiStopped();
  const client = new mongoose.mongo.MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const report = await migrate(client.db(target.databaseName), { apply: args.includes('--apply') });
    console.log(JSON.stringify(report, null, 2));
    if (report.conflicts.length) process.exitCode = 1;
  } finally { await client.close(); }
}
if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
module.exports = { migrate, findConflicts };
