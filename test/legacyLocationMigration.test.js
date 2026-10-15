const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { MongoClient, ObjectId } = require('mongoose').mongo;
const manifest = require('../backend/scripts/migrations/legacy-location-map.json');
const { buildPlan, compileMappings, expectedSnapshot, sameSnapshot, assertRollbackSafe, fingerprint } = require('../backend/scripts/migrations/legacyLocationPlan');
const { readSnapshot, assertFourTierIndex, migrateLegacyLocations, rollbackLegacyLocations } = require('../backend/scripts/migrations/legacyLocationMigration');
const { parseArgs, assertMongoDatabase } = require('../backend/scripts/migrate-legacy-locations');

const id = (number) => new ObjectId(number.toString(16).padStart(24, '0'));
const index = { name: 'four_tier', key: { room: 1, vicinity: 1, specifics: 1, exactSpot: 1 }, unique: true,
  collation: { locale: 'en', strength: 2 } };
const empty = () => ({ locations: [], boxes: [], items: [], indexes: [index] });
function fixture() {
  return { ...empty(), locations: [{ _id: id(1), room: 'Garage', vicinity: 'North Shelf', specifics: 'Concrete Ledge', exactSpot: '' }],
    boxes: [{ _id: id(2), box_id: '001', location: 'Office Bookshelf', parentBox: id(3), items: [id(4)] },
      { _id: id(3), box_id: '091', locationId: id(1), location: '', items: [] },
      { _id: id(5), box_id: '500', locationId: null, location: '', items: [] }],
    items: [{ _id: id(4), name: 'Test', location: ' garage ', notes: 'Preserve', quantity: 2 },
      { _id: id(6), name: 'Unplaced', location: '' }] };
}

test('explicit mappings register all four fields without inventing missing details', () => {
  const plan = buildPlan(fixture(), manifest);
  assert.deepEqual(plan.pending, { locations: 2, boxes: 2, items: 1 });
  assert.equal(plan.conflicts.length, 0);
  assert.deepEqual(plan.inserts.find((location) => location.room === 'Office').vicinity, 'Bookshelf');
  const garage = plan.inserts.find((location) => location.room === 'Garage');
  assert.equal(garage.vicinity, '');
  assert.equal(garage.specifics, '');
  assert.equal(garage.exactSpot, '');
  const mappings = compileMappings(manifest);
  assert.equal(mappings.get('bedroom closet').target.room, 'Bedroom');
  assert.equal(mappings.get('bedroom closet').target.vicinity, 'Closet');
  assert.equal(mappings.get('office closet').target.vicinity, 'Closet');
});

test('Bedroom Closet legacy labels become Bedroom → Closet and remain idempotent', () => {
  const before = empty();
  before.boxes.push({ _id: id(20), box_id: '113', location: 'Bedroom Closet', items: [id(21)] });
  before.items.push({ _id: id(21), name: 'Test', location: 'bedroom closet' });
  const plan = buildPlan(before, manifest);
  assert.deepEqual(plan.conflicts, []);
  assert.equal(plan.inserts.length, 1);
  assert.equal(plan.inserts[0].room, 'Bedroom');
  assert.equal(plan.inserts[0].vicinity, 'Closet');
  const after = expectedSnapshot(before, plan);
  assert.equal(after.items[0].location, 'Bedroom · Closet');
  assert.deepEqual(after.boxes[0].locationId, plan.inserts[0]._id);
  assert.deepEqual(after.boxes[0].items, before.boxes[0].items);
  assert.deepEqual(buildPlan(after, manifest).pending, { locations: 0, boxes: 0, items: 0 });
});

test('only location fields change; IDs, parent/contents, metadata and unknowns survive', () => {
  const before = fixture();
  const after = expectedSnapshot(before, buildPlan(before, manifest));
  assert.deepEqual(after.boxes[0].items, before.boxes[0].items);
  assert.deepEqual(after.boxes[0].parentBox, before.boxes[0].parentBox);
  assert.deepEqual(after.boxes[1].locationId, id(1));
  assert.deepEqual(after.boxes[2], before.boxes[2]);
  assert.equal(after.items[0].notes, 'Preserve');
  assert.equal(after.items[0].quantity, 2);
  assert.equal(after.items[0].location, 'Garage');
  assert.deepEqual(after.items[1], before.items[1]);
});

test('second run is a no-op and canonical item strings resolve to registered paths', () => {
  const before = fixture();
  const after = expectedSnapshot(before, buildPlan(before, manifest));
  assert.deepEqual(buildPlan(after, manifest).pending, { locations: 0, boxes: 0, items: 0 });
  assert.deepEqual(buildPlan(after, manifest).conflicts, []);
  after.items.push({ _id: id(9), location: 'Garage · North Shelf · Concrete Ledge' });
  assert.deepEqual(buildPlan(after, manifest).conflicts, []);
});

test('unmapped labels fail closed instead of being guessed', () => {
  const before = empty();
  before.boxes.push({ _id: id(2), location: 'Mystery / Upstairs / Some shelf' });
  const plan = buildPlan(before, manifest);
  assert.match(plan.conflicts[0].reason, /Unmapped/);
  assert.equal(plan.changes.length, 0);
  assert.equal(plan.inserts.length, 0);
});

test('dangling or contradictory assignments are blocked, never overwritten', () => {
  const before = fixture();
  before.boxes[0].locationId = id(99);
  before.boxes[1].location = 'Office';
  const plan = buildPlan(before, manifest);
  assert.ok(plan.conflicts.some((entry) => entry.reason === 'Dangling locationId'));
  assert.ok(plan.conflicts.some((entry) => /disagrees/.test(entry.reason)));
  assert.equal(plan.changes.filter((change) => change.collection === 'boxes').length, 0);
});

test('normalized duplicates and invalid tier dependencies block the plan', () => {
  const before = fixture();
  before.locations.push({ ...before.locations[0], _id: id(7), room: ' garage ' });
  assert.match(buildPlan(before, manifest).conflicts[0].reason, /Duplicate/);
  assert.throws(() => compileMappings({ version: 1, entries: [{ source: 'Bad', target: { room: 'Office', exactSpot: 'Desk' } }] }), /Invalid/);
  assert.throws(() => compileMappings({ version: 1, entries: [{ source: 'Unknown', target: { room: 'Office' } }] }), /invented/);
  assert.throws(() => compileMappings({ version: 1, entries: [
    { source: 'a', target: { room: 'Office' } }, { source: 'A', target: { room: 'Garage' } },
  ] }), /Conflicting/);
});

test('rollback handles complete/partial applications and refuses unrelated later edits', () => {
  const before = fixture();
  const plan = buildPlan(before, manifest);
  const after = expectedSnapshot(before, plan);
  assert.doesNotThrow(() => assertRollbackSafe(after, before, plan));
  assert.doesNotThrow(() => assertRollbackSafe({ ...before, locations: after.locations }, before, plan));
  const edited = { ...after, items: after.items.map((item) => ({ ...item, notes: 'Later edit' })) };
  assert.throws(() => assertRollbackSafe(edited, before, plan), /later edits/);
  assert.throws(() => assertRollbackSafe({ ...after, locations: after.locations.slice(1) }, before, plan), /original locations/);
});

test('fingerprints ignore BSON document key/order differences but catch source edits', () => {
  const before = fixture();
  const reordered = { ...before, boxes: [...before.boxes].reverse().map((box) => Object.fromEntries(Object.entries(box).reverse())) };
  assert.equal(fingerprint(before, manifest), fingerprint(reordered, manifest));
  assert.ok(sameSnapshot(before, reordered));
  reordered.items = [{ ...before.items[0], notes: 'Changed' }, before.items[1]];
  assert.notEqual(fingerprint(before, manifest), fingerprint(reordered, manifest));
});

test('CLI requires exact target and a reviewed hash; unsafe/ambiguous arguments fail', () => {
  assert.equal(parseArgs(['--expected-database=dwc_test']).apply, false);
  assert.throws(() => parseArgs(['--expected-database=dwc_test', '--apply']), /expect-plan/);
  assert.throws(() => parseArgs(['--expected-database=dwc_test', '--apply', '--dry-run']), /Choose one/);
  assert.throws(() => parseArgs(['--expected-database=dwc_test', '--unknown=yes']), /Unknown/);
  assert.throws(() => assertMongoDatabase('mongodb://remote/dwc_test', 'dwc_test'), /loopback/);
  assert.throws(() => assertMongoDatabase('mongodb://127.0.0.1/production', 'dwc_test'), /exactly/);
  assert.throws(() => assertMongoDatabase('mongodb://127.0.0.1/dwc_test?dbName=production', 'dwc_test'), /loopback/);
  assert.throws(() => assertMongoDatabase('mongodb://127.0.0.1/dwc_test?DBNAME=production', 'dwc_test'), /loopback/);
  assert.throws(() => assertMongoDatabase('mongodb+srv://localhost/dwc_test', 'dwc_test'), /loopback/);
});

test('index preflight requires the four-tier case-insensitive uniqueness contract', () => {
  assert.doesNotThrow(() => assertFourTierIndex(empty()));
  assert.throws(() => assertFourTierIndex({ indexes: [] }), /schema\/index migration/);
  assert.throws(() => assertFourTierIndex({ indexes: [{ ...index, collation: { locale: 'en', strength: 3 } }] }), /schema\/index migration/);
  assert.throws(() => assertFourTierIndex({ indexes: [index, { name: 'name_1', key: { name: 1 }, unique: true }] }), /Unexpected unique/);
});

test('real local-copy rehearsal: backup, apply, rerun, rollback, failed backup and drift refusal',
  { skip: process.env.LOCAL_MONGO_TEST !== '1', timeout: 60000 }, async () => {
    const config = require('dotenv').parse(await fs.readFile(path.resolve(__dirname, '../backend/.env')));
    const source = new URL(config.MONGO_URI);
    const sourceDatabase = source.pathname.slice(1);
    assertMongoDatabase(config.MONGO_URI, sourceDatabase);
    assert.match(sourceDatabase, /_dev$/);
    const database = `dwc_legacy_${Date.now()}_${randomUUID().replaceAll('-', '')}_test`;
    const target = new URL(source);
    target.pathname = '/' + database;
    const uri = target.toString();
    assertMongoDatabase(uri, database);
    const client = new MongoClient(config.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    const backupRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'dwc-legacy-test-'));
    let created = false;
    try {
      await client.connect();
      const copy = await readSnapshot(client.db(sourceDatabase));
      const db = client.db(database);
      assert.equal(await db.collection('boxes').countDocuments(), 0);
      created = true;
      for (const collection of ['locations', 'boxes', 'items']) {
        if (copy[collection].length) await db.collection(collection).insertMany(copy[collection]);
      }
      for (const entry of copy.indexes.filter((entry) => entry.name !== '_id_')) {
        const { key, name, unique, collation, sparse, partialFilterExpression } = entry;
        await db.collection('locations').createIndex(key, { name, ...(unique ? { unique } : {}),
          ...(collation ? { collation } : {}), ...(sparse ? { sparse } : {}), ...(partialFilterExpression ? { partialFilterExpression } : {}) });
      }
      // Exercise real writes even when the source copy has already been migrated.
      // This test-only alias also checks a fully specified four-tier path.
      const testManifest = { ...manifest, entries: [...manifest.entries, {
        source: 'QA legacy shelf', target: { room: 'QA Room', vicinity: 'Cabinet', specifics: 'Shelf', exactSpot: 'Left' },
        reason: 'Isolated regression fixture, never used by the production CLI',
      }] };
      const fixtureItemId = new ObjectId();
      await db.collection('items').insertOne({ _id: fixtureItemId, name: 'QA location fixture', location: ' garage ', quantity: 1 });
      await db.collection('boxes').insertOne({ _id: new ObjectId(), box_id: 'QA-MIGRATION', label: 'QA fixture',
        location: 'QA legacy shelf', items: [fixtureItemId], parentBox: null });
      const before = await readSnapshot(db);
      const dry = await migrateLegacyLocations(db, { manifest: testManifest });
      assert.deepEqual(dry.conflicts, []);
      assert.ok(sameSnapshot(before, await readSnapshot(db)));
      const options = { manifest: testManifest, apply: true, uri, backupRoot, expectedFingerprint: dry.fingerprint };
      await assert.rejects(migrateLegacyLocations(db, { ...options, backup: async () => { throw new Error('Simulated backup failure'); } }), /backup failure/);
      assert.ok(sameSnapshot(before, await readSnapshot(db)));
      await assert.rejects(migrateLegacyLocations(db, { ...options, expectedFingerprint: '0'.repeat(64) }), /changed since/);
      const applied = await migrateLegacyLocations(db, options);
      assert.equal(applied.verified, true);
      assert.equal(applied.idempotent, true);
      const after = await readSnapshot(db);
      const rerun = await migrateLegacyLocations(db, { ...options, expectedFingerprint: (await migrateLegacyLocations(db, { manifest: testManifest })).fingerprint });
      assert.equal(rerun.noOp, true);
      assert.ok(sameSnapshot(after, await readSnapshot(db)));
      const itemId = after.items[0]._id;
      await db.collection('items').updateOne({ _id: itemId }, { $set: { qaLaterEdit: true } });
      await assert.rejects(rollbackLegacyLocations(db, { snapshotPath: applied.snapshotPath }), /later edits/);
      await db.collection('items').updateOne({ _id: itemId }, { $unset: { qaLaterEdit: '' } });
      const restored = await rollbackLegacyLocations(db, { snapshotPath: applied.snapshotPath, apply: true, uri, backupRoot });
      assert.equal(restored.verified, true);
      assert.ok(sameSnapshot(before, await readSnapshot(db)));
      console.log(JSON.stringify({ rehearsal: database, counts: dry.inventoryCounts, pending: dry.pending,
        backupRoot, backupVerified: true, applyVerified: true, rerunNoOp: true, rollbackVerified: true }));
    } finally {
      // Only this newly created, uniquely named disposable copy is removed.
      if (created) await client.db(database).dropDatabase();
      await client.close();
    }
  });
