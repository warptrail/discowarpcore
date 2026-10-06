const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const mongoose = require('mongoose');
const { migrate } = require('../backend/scripts/migrate-location-exact-spot');

test('isolated MongoDB migration preserves references, reruns safely and replaces uniqueness', { skip: process.env.LOCAL_MONGO_TEST !== '1' }, async () => {
  const client = new mongoose.mongo.MongoClient('mongodb://127.0.0.1:27017', { serverSelectionTimeoutMS: 5000 });
  const db = client.db(`location_exact_spot_${process.pid}_${Date.now()}_test`);
  const backupRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'location-exact-spot-test-'));
  try {
    await client.connect();
    const id = new mongoose.Types.ObjectId();
    const legacy = { _id: id, room: 'Office', vicinity: 'Closet', specifics: 'Top shelf' };
    await db.collection('locations').insertOne(legacy);
    await db.collection('locations').createIndex({ room: 1, vicinity: 1, specifics: 1 }, { unique: true });
    await db.collection('boxes').insertOne({ box_id: 'test', locationId: id });
    const dry = await migrate(db);
    assert.equal(dry.pending, 1);
    assert.equal((await db.collection('locations').findOne({ _id: id })).exactSpot, undefined);
    const result = await migrate(db, { apply: true, backupRoot });
    assert.equal(result.verified, true);
    const snapshot = mongoose.mongo.BSON.EJSON.parse(await fs.readFile(result.snapshotPath, 'utf8'));
    assert.equal(snapshot.locations[0].exactSpot, undefined);
    assert.equal(String(snapshot.assignments[0].locationId), String(id));
    assert.equal((await migrate(db, { apply: true, backupRoot })).verified, true);
    assert.equal(String((await db.collection('boxes').findOne()).locationId), String(id));
    await db.collection('locations').insertOne({ room: 'Office', vicinity: 'Closet', specifics: 'Top shelf', exactSpot: 'Behind bin' });
    await db.collection('locations').insertOne({ room: 'Office', vicinity: 'Closet', specifics: 'Top shelf', exactSpot: 'Right' });
    await assert.rejects(db.collection('locations').insertOne({ room: 'office', vicinity: 'closet', specifics: 'top shelf', exactSpot: 'BEHIND BIN' }), (error) => error.code === 11000);
    const indexes = await db.collection('locations').listIndexes().toArray();
    assert.equal(indexes.some((index) => Object.keys(index.key).length === 3), false);
  } finally {
    await db.dropDatabase();
    await client.close();
    await fs.rm(backupRoot, { recursive: true, force: true });
  }
});
