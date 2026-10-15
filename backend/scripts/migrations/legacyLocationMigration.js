const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID, createHash } = require('node:crypto');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { BSON } = require('mongoose').mongo;
const { buildPlan, fingerprint, expectedSnapshot, sameSnapshot, assertRollbackSafe, fieldState, fieldFilter, fieldUpdate, equal } = require('./legacyLocationPlan');

const runFile = promisify(execFile);
const INDEX_KEY = { room: 1, vicinity: 1, specifics: 1, exactSpot: 1 };
const digest = (text) => createHash('sha256').update(text).digest('hex');

async function readSnapshot(db) {
  const [locations, boxes, items, indexes] = await Promise.all([
    db.collection('locations').find().toArray(), db.collection('boxes').find().toArray(),
    db.collection('items').find().toArray(), db.collection('locations').listIndexes().toArray(),
  ]);
  return { locations, boxes, items, indexes };
}

function assertFourTierIndex(snapshot) {
  if (!snapshot.indexes.some((index) => equal(index.key, INDEX_KEY) && index.unique && index.collation?.strength === 2)) {
    throw new Error('Run the existing Exact Spot schema/index migration first; no indexes are changed by this script');
  }
  if (snapshot.indexes.some((index) => index.unique && index.name !== '_id_' && !equal(index.key, INDEX_KEY))) {
    throw new Error('Unexpected unique location index; review the existing schema migration before writing');
  }
}

function reportFor(db, plan) {
  return { database: db.databaseName, fingerprint: plan.fingerprint, inventoryCounts: plan.counts,
    pending: plan.pending, unknownUnchanged: plan.unknown, mappings: plan.mappings, conflicts: plan.conflicts };
}

async function backupDatabase(uri, root, payload, { dumpExecutable = 'mongodump' } = {}) {
  const directory = path.join(root, `${Date.now()}-${randomUUID()}`);
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const archive = path.join(directory, 'database.archive.gz');
  try {
    await runFile(dumpExecutable, ['--uri', uri, '--archive=' + archive, '--gzip'], { timeout: 120000, maxBuffer: 1024 * 1024 });
    await fs.chmod(archive, 0o600);
    if (!(await fs.stat(archive)).size) throw new Error('Empty archive');
    // Verify that the archive can be read without restoring any records.
    await runFile('mongorestore', ['--archive=' + archive, '--gzip', '--dryRun'], { timeout: 120000, maxBuffer: 1024 * 1024 });
  } catch {
    throw new Error(`Backup/archive verification failed; no migration writes were made. Directory: ${directory}`);
  }
  const snapshotPath = path.join(directory, 'snapshot.ejson');
  const text = BSON.EJSON.stringify(payload, null, 2, { relaxed: false });
  await fs.writeFile(snapshotPath, text, { flag: 'wx', mode: 0o600 });
  await fs.writeFile(snapshotPath + '.sha256', digest(text) + '\n', { flag: 'wx', mode: 0o600 });
  return { directory, archive, snapshotPath };
}

async function loadSavedSnapshot(filename, database) {
  const text = await fs.readFile(filename, 'utf8');
  const checksum = (await fs.readFile(filename + '.sha256', 'utf8')).trim();
  if (digest(text) !== checksum) throw new Error('Snapshot checksum mismatch');
  const payload = BSON.EJSON.parse(text, { relaxed: false });
  if (Number(payload.version) !== 1 || payload.kind !== 'legacy-location-migration' || payload.database !== database
    || Number(payload.plan?.version) !== 1 || fingerprint(payload.before, payload.manifest) !== payload.plan.fingerprint) {
    throw new Error('Snapshot version, database or source fingerprint mismatch');
  }
  // Plans are validated against the mapping and original data, not trusted blindly.
  const ids = payload.plan.inserts.map((document) => document._id);
  const now = payload.plan.inserts[0]?.createdAt || new Date();
  const rebuilt = buildPlan(payload.before, payload.manifest, { now, newId: () => ids.shift() });
  if (!equal(rebuilt, payload.plan)) throw new Error('Snapshot plan does not match its original records and mapping');
  return payload;
}

async function migrateLegacyLocations(db, { manifest, apply = false, expectedFingerprint, uri, backupRoot,
  backup = backupDatabase } = {}) {
  const before = await readSnapshot(db);
  assertFourTierIndex(before);
  const plan = buildPlan(before, manifest);
  const report = reportFor(db, plan);
  if (!apply || plan.conflicts.length) return { ...report, apply: false };
  if (!expectedFingerprint || expectedFingerprint !== plan.fingerprint) throw new Error('Source records or mapping changed since the reviewed dry run');
  if (!plan.inserts.length && !plan.changes.length) return { ...report, apply: true, verified: true, noOp: true };
  const saved = await backup(uri, backupRoot, { version: 1, kind: 'legacy-location-migration', database: db.databaseName,
    manifest, before, plan, createdAt: new Date() });
  if (!sameSnapshot(before, await readSnapshot(db))) throw new Error(`Database changed during backup; no migration writes made. Snapshot: ${saved.snapshotPath}`);
  try {
    for (const document of plan.inserts) await db.collection('locations').insertOne(document);
    for (const change of plan.changes) {
      const result = await db.collection(change.collection).updateOne(fieldFilter(change.id, change.before), fieldUpdate(change.after));
      if (result.matchedCount !== 1) throw new Error(`Concurrent edit: ${change.collection}/${change.id}`);
    }
    const after = await readSnapshot(db);
    if (!sameSnapshot(expectedSnapshot(before, plan), after)) throw new Error('Full record, membership, count or index verification failed');
    const secondPlan = buildPlan(after, manifest);
    if (secondPlan.conflicts.length || secondPlan.inserts.length || secondPlan.changes.length) throw new Error('Idempotence verification failed');
    return { ...report, ...saved, apply: true, verified: true, idempotent: true,
      afterCounts: { boxes: after.boxes.length, items: after.items.length, locations: after.locations.length } };
  } catch (error) {
    throw new Error(`${error.message}. Migration may be partial; keep the API stopped and use --rollback=${saved.snapshotPath}`);
  }
}

async function rollbackLegacyLocations(db, { snapshotPath, apply = false, uri, backupRoot, backup = backupDatabase } = {}) {
  const saved = await loadSavedSnapshot(snapshotPath, db.databaseName);
  const current = await readSnapshot(db);
  assertRollbackSafe(current, saved.before, saved.plan);
  const report = { database: db.databaseName, rollback: snapshotPath, apply, safe: true,
    plannedRestore: saved.plan.pending };
  if (!apply) return report;
  const safetyBackup = await backup(uri, backupRoot, { version: 1, kind: 'before-legacy-location-rollback',
    database: db.databaseName, current, originalSnapshot: snapshotPath });
  if (!sameSnapshot(current, await readSnapshot(db))) throw new Error('Database changed during rollback backup; no rollback writes made');
  try {
    for (const change of saved.plan.changes) {
      const document = await db.collection(change.collection).findOne({ _id: change.id });
      const state = fieldState(document, Object.keys(change.before));
      if (equal(state, change.before)) continue;
      const result = await db.collection(change.collection).updateOne(fieldFilter(change.id, change.after), fieldUpdate(change.before));
      if (result.matchedCount !== 1) throw new Error('Concurrent edit during rollback');
    }
    for (const location of saved.plan.inserts) {
      const document = await db.collection('locations').findOne({ _id: location._id });
      if (!document) continue;
      if (!equal(document, location)) throw new Error('A newly created location was edited during rollback');
      if (await db.collection('boxes').countDocuments({ locationId: location._id })) throw new Error('A new location is still referenced');
      const fields = fieldState(location, Object.keys(location).filter((field) => field !== '_id'));
      const filter = fieldFilter(location._id, fields);
      filter.$and.push({ $expr: { $eq: [{ $size: { $objectToArray: '$$ROOT' } }, Object.keys(location).length] } });
      const result = await db.collection('locations').deleteOne(filter);
      if (result.deletedCount !== 1) throw new Error('A new location changed during rollback');
    }
    if (!sameSnapshot(saved.before, await readSnapshot(db))) throw new Error('Rollback record/index verification failed');
    return { ...report, safetyBackup, verified: true };
  } catch (error) { throw new Error(`${error.message}. Keep the API stopped; rollback safety archive: ${safetyBackup.archive}`); }
}

module.exports = { readSnapshot, assertFourTierIndex, backupDatabase, loadSavedSnapshot, migrateLegacyLocations, rollbackLegacyLocations };
