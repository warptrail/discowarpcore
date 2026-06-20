#!/usr/bin/env node

const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const TARGET_DB = process.env.SYNC_TARGET_DB || 'discowarpcore';
const SOURCE_DB = process.env.SYNC_SOURCE_DB || process.argv[2] || '';
const MODE = process.env.SYNC_MODE || process.argv[3] || 'preflight';
const LOCAL_MEDIA_ROOT = path.resolve(__dirname, '..', 'media');
const REMOTE_MEDIA_ROOT = process.env.SYNC_REMOTE_MEDIA_ROOT
  || '/home/warptrail/discowarpcore/backend/media';

const COLLECTIONS = [
  'locations',
  'batches',
  'boxes',
  'mediastates',
  'items',
  'decluttersessions',
  'decluttersessionitems',
  'eventlogs',
];

function usage() {
  return [
    'Usage:',
    '  SYNC_SOURCE_DB=discowarpcore_neonazoth_sync_YYYYMMDDHHMMSS node backend/scripts/sync-neonazoth-staging-into-local.js preflight',
    '  SYNC_SOURCE_DB=discowarpcore_neonazoth_sync_YYYYMMDDHHMMSS node backend/scripts/sync-neonazoth-staging-into-local.js apply',
    '',
    'The source DB should be a local staging restore of NeonAzoth production.',
  ].join('\n');
}

function getBaseMongoUri() {
  const uri = process.env.MONGO_URI || `mongodb://127.0.0.1:27017/${TARGET_DB}`;
  const parsed = new URL(uri);
  parsed.pathname = '/';
  parsed.search = '';
  return parsed.toString();
}

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

function lower(value) {
  return toTrimmed(value).toLowerCase();
}

function objectIdKey(value) {
  if (!value) return '';
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === 'object' && typeof value.toString === 'function') {
    const next = value.toString();
    return mongoose.isValidObjectId(next) ? next : '';
  }
  return mongoose.isValidObjectId(value) ? String(value) : '';
}

function cloneDoc(value) {
  if (value instanceof mongoose.Types.ObjectId) {
    return new mongoose.Types.ObjectId(value.toString());
  }
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) return value.map((entry) => cloneDoc(entry));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, cloneDoc(child)])
    );
  }
  return value;
}

function remapDeep(value, idMap) {
  if (value instanceof mongoose.Types.ObjectId) {
    return idMap.get(value.toString()) || value;
  }
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map((entry) => remapDeep(entry, idMap));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, remapDeep(child, idMap)])
    );
  }
  if (typeof value === 'string') {
    const mapped = idMap.get(value);
    return mapped ? mapped.toString() : value;
  }
  return value;
}

function remapDoc(doc, idMap) {
  const next = remapDeep(cloneDoc(doc), idMap);
  const oldId = objectIdKey(doc._id);
  if (oldId && idMap.has(oldId)) next._id = idMap.get(oldId);
  return next;
}

function mediaPathToLocal(value) {
  const text = toTrimmed(value);
  if (!text) return text;
  if (text.startsWith(`${REMOTE_MEDIA_ROOT}/`)) {
    return path.join(LOCAL_MEDIA_ROOT, text.slice(REMOTE_MEDIA_ROOT.length + 1));
  }
  return text;
}

function normalizeMediaStatePaths(doc) {
  return {
    ...doc,
    originalPath: mediaPathToLocal(doc.originalPath),
    processedPath: mediaPathToLocal(doc.processedPath),
    displayPath: mediaPathToLocal(doc.displayPath),
    thumbPath: mediaPathToLocal(doc.thumbPath),
  };
}

function locationKey(doc) {
  return lower(doc?.name);
}

function batchKey(doc) {
  return toTrimmed(doc?.identity?.batchId);
}

function boxKey(doc) {
  return toTrimmed(doc?.box_id);
}

function mediaStateKeys(doc) {
  return [
    toTrimmed(doc?.mediaId) ? `media:${toTrimmed(doc.mediaId)}` : '',
    toTrimmed(doc?.originalPath) ? `path:${mediaPathToLocal(doc.originalPath)}` : '',
  ].filter(Boolean);
}

function itemKey(doc) {
  const mediaId = toTrimmed(doc?.image?.mediaId);
  if (mediaId) return `media:${mediaId}`;
  const storagePath = toTrimmed(doc?.image?.original?.storagePath);
  if (storagePath) return `original:${storagePath}`;
  const name = lower(doc?.name);
  const createdAt = doc?.createdAt ? new Date(doc.createdAt).toISOString() : '';
  return name && createdAt ? `name-created:${name}|${createdAt}` : '';
}

function declutterSessionKey(doc) {
  return `${lower(doc?.name)}|${lower(doc?.status)}|${doc?.createdAt ? new Date(doc.createdAt).toISOString() : ''}`;
}

function declutterSessionItemKey(doc, idMap = new Map()) {
  const sessionId = objectIdKey(idMap.get(objectIdKey(doc?.sessionId)) || doc?.sessionId);
  const itemId = objectIdKey(idMap.get(objectIdKey(doc?.itemId)) || doc?.itemId);
  return `${sessionId}|${itemId}`;
}

function eventKey(doc) {
  const createdAt = doc?.created_at ? new Date(doc.created_at).toISOString() : '';
  return [
    createdAt,
    toTrimmed(doc?.event_type),
    toTrimmed(doc?.entity_type),
    toTrimmed(doc?.entity_label),
    toTrimmed(doc?.summary),
  ].join('|');
}

function byKey(docs, keyFn) {
  const map = new Map();
  for (const doc of docs) {
    const key = keyFn(doc);
    if (key && !map.has(key)) map.set(key, doc);
  }
  return map;
}

async function loadCollection(db, name) {
  const exists = await db.listCollections({ name }).hasNext();
  if (!exists) return [];
  return db.collection(name).find({}).toArray();
}

async function loadAll(db) {
  const result = new Map();
  for (const collection of COLLECTIONS) {
    result.set(collection, await loadCollection(db, collection));
  }
  return result;
}

function mapExistingAndMissing({ sourceDocs, targetDocs, keyFn, idMap }) {
  const targetByKey = byKey(targetDocs, keyFn);
  const missing = [];
  for (const source of sourceDocs) {
    const sourceId = objectIdKey(source._id);
    const key = keyFn(source);
    const existing = key ? targetByKey.get(key) : null;
    if (sourceId && existing?._id) {
      idMap.set(sourceId, existing._id);
    } else if (sourceId) {
      const newId = new mongoose.Types.ObjectId();
      idMap.set(sourceId, newId);
      missing.push(source);
    }
  }
  return missing;
}

function mapMediaStates({ sourceDocs, targetDocs, idMap }) {
  const targetKeys = new Set(targetDocs.flatMap(mediaStateKeys));
  const missing = [];
  for (const source of sourceDocs) {
    const sourceId = objectIdKey(source._id);
    const keys = mediaStateKeys(source);
    const exists = keys.some((key) => targetKeys.has(key));
    if (sourceId && exists) {
      const target = targetDocs.find((doc) =>
        mediaStateKeys(doc).some((key) => keys.includes(key))
      );
      if (target?._id) idMap.set(sourceId, target._id);
    } else if (sourceId) {
      idMap.set(sourceId, new mongoose.Types.ObjectId());
      missing.push(source);
    }
  }
  return missing;
}

function buildPlan(source, target) {
  const idMap = new Map();

  const missingLocations = mapExistingAndMissing({
    sourceDocs: source.get('locations') || [],
    targetDocs: target.get('locations') || [],
    keyFn: locationKey,
    idMap,
  });

  const missingBatches = mapExistingAndMissing({
    sourceDocs: source.get('batches') || [],
    targetDocs: target.get('batches') || [],
    keyFn: batchKey,
    idMap,
  });

  const missingBoxes = mapExistingAndMissing({
    sourceDocs: source.get('boxes') || [],
    targetDocs: target.get('boxes') || [],
    keyFn: boxKey,
    idMap,
  });

  const missingMediaStates = mapMediaStates({
    sourceDocs: source.get('mediastates') || [],
    targetDocs: target.get('mediastates') || [],
    idMap,
  });

  const missingItems = mapExistingAndMissing({
    sourceDocs: source.get('items') || [],
    targetDocs: target.get('items') || [],
    keyFn: itemKey,
    idMap,
  });

  const missingDeclutterSessions = mapExistingAndMissing({
    sourceDocs: source.get('decluttersessions') || [],
    targetDocs: target.get('decluttersessions') || [],
    keyFn: declutterSessionKey,
    idMap,
  });

  const targetDeclutterItemKeys = new Set(
    (target.get('decluttersessionitems') || []).map((doc) => declutterSessionItemKey(doc))
  );
  const missingDeclutterSessionItems = (source.get('decluttersessionitems') || []).filter((doc) => {
    const key = declutterSessionItemKey(doc, idMap);
    if (!key || targetDeclutterItemKeys.has(key)) return false;
    const sourceId = objectIdKey(doc._id);
    if (sourceId) idMap.set(sourceId, new mongoose.Types.ObjectId());
    return true;
  });

  const targetEventKeys = new Set((target.get('eventlogs') || []).map(eventKey));
  const missingEventLogs = (source.get('eventlogs') || []).filter((doc) => {
    const key = eventKey(doc);
    if (!key || targetEventKeys.has(key)) return false;
    const sourceId = objectIdKey(doc._id);
    if (sourceId) idMap.set(sourceId, new mongoose.Types.ObjectId());
    return true;
  });

  const remappedBoxes = missingBoxes.map((doc) => remapDoc(doc, idMap));
  const remappedItems = missingItems.map((doc) => remapDoc(doc, idMap));
  const remappedMediaStates = missingMediaStates
    .map((doc) => remapDoc(doc, idMap))
    .map(normalizeMediaStatePaths);

  const boxMembershipAdds = [];
  const targetBoxesByBoxId = byKey(target.get('boxes') || [], boxKey);
  for (const sourceBox of source.get('boxes') || []) {
    const targetBoxId = objectIdKey(idMap.get(objectIdKey(sourceBox._id)));
    const existingTargetBox = targetBoxesByBoxId.get(boxKey(sourceBox));
    if (!targetBoxId || !existingTargetBox) continue;
    const targetItemIds = new Set((existingTargetBox.items || []).map(objectIdKey));
    const itemIdsToAdd = (sourceBox.items || [])
      .map((itemId) => idMap.get(objectIdKey(itemId)))
      .filter(Boolean)
      .map((itemId) => new mongoose.Types.ObjectId(itemId.toString()))
      .filter((itemId) => !targetItemIds.has(itemId.toString()));
    if (itemIdsToAdd.length) {
      boxMembershipAdds.push({ boxId: existingTargetBox._id, itemIds: itemIdsToAdd });
    }
  }

  return {
    idMap,
    docs: {
      locations: missingLocations.map((doc) => remapDoc(doc, idMap)),
      batches: missingBatches.map((doc) => remapDoc(doc, idMap)),
      boxes: remappedBoxes,
      mediastates: remappedMediaStates,
      items: remappedItems,
      decluttersessions: missingDeclutterSessions.map((doc) => remapDoc(doc, idMap)),
      decluttersessionitems: missingDeclutterSessionItems.map((doc) => remapDoc(doc, idMap)),
      eventlogs: missingEventLogs.map((doc) => remapDoc(doc, idMap)),
    },
    boxMembershipAdds,
  };
}

function printPlan(plan, source, target) {
  console.log(`[sync] source=${SOURCE_DB}`);
  console.log(`[sync] target=${TARGET_DB}`);
  console.log('');
  console.log('Collection counts:');
  for (const collection of COLLECTIONS) {
    console.log(`- ${collection}: source=${(source.get(collection) || []).length} target=${(target.get(collection) || []).length}`);
  }
  console.log('');
  console.log('Planned inserts:');
  for (const collection of COLLECTIONS) {
    console.log(`- ${collection}: ${(plan.docs[collection] || []).length}`);
  }
  console.log(`- box membership updates: ${plan.boxMembershipAdds.length}`);
  if (plan.docs.boxes.length) {
    console.log('');
    console.log('New boxes:');
    for (const box of plan.docs.boxes) {
      console.log(`- ${box.box_id}: ${box.label}`);
    }
  }
}

async function insertIfAny(db, collection, docs) {
  if (!docs.length) return 0;
  await db.collection(collection).insertMany(docs, { ordered: true });
  return docs.length;
}

async function applyPlan(targetDb, plan) {
  const inserted = {};
  for (const collection of COLLECTIONS) {
    inserted[collection] = await insertIfAny(targetDb, collection, plan.docs[collection] || []);
  }
  let membershipUpdates = 0;
  for (const update of plan.boxMembershipAdds) {
    await targetDb.collection('boxes').updateOne(
      { _id: update.boxId },
      { $addToSet: { items: { $each: update.itemIds } } }
    );
    membershipUpdates += 1;
  }
  console.log('');
  console.log('Sync applied.');
  for (const collection of COLLECTIONS) {
    console.log(`- inserted ${collection}: ${inserted[collection]}`);
  }
  console.log(`- updated box memberships: ${membershipUpdates}`);
}

async function main() {
  const sourceDbName = toTrimmed(SOURCE_DB);
  const targetDbName = toTrimmed(TARGET_DB);
  const mode = toTrimmed(MODE);

  if (!sourceDbName || sourceDbName === targetDbName || !['preflight', 'apply'].includes(mode)) {
    console.error(usage());
    process.exit(1);
  }

  const conn = await mongoose.createConnection(getBaseMongoUri(), {
    dbName: targetDbName,
  }).asPromise();

  try {
    const admin = conn.client.db().admin();
    const dbs = await admin.listDatabases();
    const names = new Set(dbs.databases.map((db) => db.name));
    if (!names.has(sourceDbName)) throw new Error(`Source database not found: ${sourceDbName}`);

    const sourceDb = conn.client.db(sourceDbName);
    const targetDb = conn.client.db(targetDbName);
    const source = await loadAll(sourceDb);
    const target = await loadAll(targetDb);
    const plan = buildPlan(source, target);
    printPlan(plan, source, target);

    if (mode === 'apply') {
      await applyPlan(targetDb, plan);
    }
  } finally {
    await conn.close();
  }
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exit(1);
});
