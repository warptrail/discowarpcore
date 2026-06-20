#!/usr/bin/env node

const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const TARGET_DB = process.env.MERGE_TARGET_DB || 'discowarpcore';
const SOURCE_DB = process.env.MERGE_SOURCE_DB || process.argv[2] || '';
const MODE = process.env.MERGE_MODE || (
  ['preflight', 'apply'].includes(process.argv[2])
    ? process.argv[2]
    : process.argv[3]
) || 'preflight';

const KNOWN_COLLECTIONS = [
  'locations',
  'batches',
  'items',
  'boxes',
  'mediastates',
  'decluttersessions',
  'decluttersessionitems',
  'eventlogs',
];

function usage() {
  return [
    'Usage:',
    '  MERGE_SOURCE_DB=discowarpcore_moonshade_merge_YYYYMMDDHHMMSS node backend/scripts/merge-staged-db.js preflight',
    '  MERGE_SOURCE_DB=discowarpcore_moonshade_merge_YYYYMMDDHHMMSS node backend/scripts/merge-staged-db.js apply',
    '',
    'The staged source database must already exist on the same MongoDB server.',
  ].join('\n');
}

function getBaseMongoUri() {
  const uri = process.env.MONGO_URI || `mongodb://127.0.0.1:27017/${TARGET_DB}`;
  const parsed = new URL(uri);
  parsed.pathname = '/';
  parsed.search = '';
  return parsed.toString();
}

function normalizeBoxId(value) {
  return value == null ? '' : String(value).trim();
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

function cloneDoc(doc) {
  if (doc instanceof mongoose.Types.ObjectId) {
    return new mongoose.Types.ObjectId(doc.toString());
  }
  if (doc instanceof Date) {
    return new Date(doc.getTime());
  }
  if (Array.isArray(doc)) {
    return doc.map((entry) => cloneDoc(entry));
  }
  if (doc && typeof doc === 'object') {
    return Object.fromEntries(
      Object.entries(doc).map(([key, value]) => [key, cloneDoc(value)])
    );
  }
  return doc;
}

function mapObjectId(value, idMap) {
  const key = objectIdKey(value);
  const mapped = key ? idMap.get(key) : null;
  return mapped || value;
}

function remapDeep(value, idMap) {
  if (value instanceof mongoose.Types.ObjectId) {
    return mapObjectId(value, idMap);
  }
  if (value instanceof Date) return value;
  if (Array.isArray(value)) {
    return value.map((entry) => remapDeep(entry, idMap));
  }
  if (value && typeof value === 'object') {
    const next = {};
    for (const [key, child] of Object.entries(value)) {
      next[key] = remapDeep(child, idMap);
    }
    return next;
  }
  if (typeof value === 'string') {
    const mapped = idMap.get(value);
    return mapped ? mapped.toString() : value;
  }
  return value;
}

function remapDocument(doc, idMap) {
  const next = remapDeep(cloneDoc(doc), idMap);
  const oldId = objectIdKey(doc._id);
  if (oldId && idMap.has(oldId)) {
    next._id = idMap.get(oldId);
  }
  return next;
}

function buildObjectIdMap(docsByCollection, locationIdMap) {
  const idMap = new Map(locationIdMap);
  for (const collectionName of KNOWN_COLLECTIONS) {
    if (collectionName === 'locations') continue;
    for (const doc of docsByCollection.get(collectionName) || []) {
      const oldId = objectIdKey(doc._id);
      if (oldId && !idMap.has(oldId)) {
        idMap.set(oldId, new mongoose.Types.ObjectId());
      }
    }
  }
  return idMap;
}

async function loadCollection(db, collectionName) {
  const exists = await db.listCollections({ name: collectionName }).hasNext();
  if (!exists) return [];
  return db.collection(collectionName).find({}).toArray();
}

function valuesByField(docs, fieldPath) {
  const parts = fieldPath.split('.');
  const values = new Set();
  for (const doc of docs) {
    let cursor = doc;
    for (const part of parts) {
      cursor = cursor?.[part];
    }
    const value = cursor == null ? '' : String(cursor).trim();
    if (value) values.add(value);
  }
  return values;
}

function findOverlap(leftValues, rightValues) {
  return [...leftValues].filter((value) => rightValues.has(value)).sort();
}

async function analyze({ sourceDb, targetDb }) {
  const sourceDocs = new Map();
  const targetDocs = new Map();

  for (const collectionName of KNOWN_COLLECTIONS) {
    sourceDocs.set(collectionName, await loadCollection(sourceDb, collectionName));
    targetDocs.set(collectionName, await loadCollection(targetDb, collectionName));
  }

  const sourceBoxIds = new Set(
    (sourceDocs.get('boxes') || []).map((box) => normalizeBoxId(box.box_id)).filter(Boolean)
  );
  const targetBoxIds = new Set(
    (targetDocs.get('boxes') || []).map((box) => normalizeBoxId(box.box_id)).filter(Boolean)
  );
  const overlappingBoxIds = findOverlap(sourceBoxIds, targetBoxIds);

  const sourceBatchIds = valuesByField(sourceDocs.get('batches') || [], 'identity.batchId');
  const targetBatchIds = valuesByField(targetDocs.get('batches') || [], 'identity.batchId');
  const overlappingBatchIds = findOverlap(sourceBatchIds, targetBatchIds);

  const sourceMediaIds = valuesByField(sourceDocs.get('mediastates') || [], 'mediaId');
  const targetMediaIds = valuesByField(targetDocs.get('mediastates') || [], 'mediaId');
  const overlappingMediaIds = findOverlap(sourceMediaIds, targetMediaIds);

  const sourceOriginalPaths = valuesByField(sourceDocs.get('mediastates') || [], 'originalPath');
  const targetOriginalPaths = valuesByField(targetDocs.get('mediastates') || [], 'originalPath');
  const overlappingOriginalPaths = findOverlap(sourceOriginalPaths, targetOriginalPaths);

  return {
    sourceDocs,
    targetDocs,
    blockers: {
      overlappingBoxIds,
      overlappingBatchIds,
      overlappingMediaIds,
      overlappingOriginalPaths,
    },
    counts: Object.fromEntries(
      KNOWN_COLLECTIONS.map((collectionName) => [
        collectionName,
        {
          source: (sourceDocs.get(collectionName) || []).length,
          target: (targetDocs.get(collectionName) || []).length,
        },
      ])
    ),
  };
}

function hasBlockers(blockers) {
  return Object.values(blockers).some((values) => values.length > 0);
}

function printAnalysis(analysis) {
  console.log(`[merge] source=${SOURCE_DB}`);
  console.log(`[merge] target=${TARGET_DB}`);
  console.log('');
  console.log('Collection counts:');
  for (const [collectionName, counts] of Object.entries(analysis.counts)) {
    console.log(`- ${collectionName}: source=${counts.source} target=${counts.target}`);
  }
  console.log('');

  if (!hasBlockers(analysis.blockers)) {
    console.log('Preflight passed: no unique-key blockers found.');
    return;
  }

  console.log('Preflight blocked: unique-key collisions found.');
  for (const [label, values] of Object.entries(analysis.blockers)) {
    if (!values.length) continue;
    console.log(`- ${label}: ${values.slice(0, 20).join(', ')}${values.length > 20 ? ' ...' : ''}`);
  }
}

function buildLocationPlan(sourceLocations, targetLocations) {
  const targetByName = new Map(
    targetLocations
      .map((location) => [String(location.name || '').trim().toLowerCase(), location])
      .filter(([name]) => name)
  );
  const locationIdMap = new Map();
  const insertLocations = [];

  for (const location of sourceLocations) {
    const oldId = objectIdKey(location._id);
    if (!oldId) continue;

    const nameKey = String(location.name || '').trim().toLowerCase();
    const existing = nameKey ? targetByName.get(nameKey) : null;
    if (existing?._id) {
      locationIdMap.set(oldId, existing._id);
      continue;
    }

    const newId = new mongoose.Types.ObjectId();
    locationIdMap.set(oldId, newId);
    insertLocations.push({
      ...remapDeep(cloneDoc(location), locationIdMap),
      _id: newId,
    });
    if (nameKey) targetByName.set(nameKey, { ...location, _id: newId });
  }

  return { locationIdMap, insertLocations };
}

async function insertIfAny(targetDb, collectionName, docs, session) {
  if (!docs.length) return 0;
  const options = session ? { ordered: true, session } : { ordered: true };
  await targetDb.collection(collectionName).insertMany(docs, options);
  return docs.length;
}

async function applyMerge({ sourceDb, targetDb, analysis }) {
  const sourceLocations = analysis.sourceDocs.get('locations') || [];
  const targetLocations = analysis.targetDocs.get('locations') || [];
  const { locationIdMap, insertLocations } = buildLocationPlan(sourceLocations, targetLocations);
  const idMap = buildObjectIdMap(analysis.sourceDocs, locationIdMap);

  const plan = {
    locations: insertLocations,
  };

  for (const collectionName of KNOWN_COLLECTIONS) {
    if (collectionName === 'locations') continue;
    plan[collectionName] = (analysis.sourceDocs.get(collectionName) || []).map((doc) =>
      remapDocument(doc, idMap)
    );
  }

  const inserted = {};
  if (process.env.MERGE_USE_TRANSACTION === '1') {
    console.log('');
    console.log('Applying merge with MongoDB transaction support enabled.');
    const session = await targetDb.client.startSession();
    try {
      await session.withTransaction(async () => {
        for (const collectionName of KNOWN_COLLECTIONS) {
          inserted[collectionName] = await insertIfAny(
            targetDb,
            collectionName,
            plan[collectionName] || [],
            session
          );
        }
      });
    } finally {
      await session.endSession();
    }
  } else {
    console.log('');
    console.log('Applying merge with ordered inserts. A pre-merge full backup is required for recovery on standalone MongoDB.');
    for (const collectionName of KNOWN_COLLECTIONS) {
      inserted[collectionName] = await insertIfAny(
        targetDb,
        collectionName,
        plan[collectionName] || []
      );
    }
  }

  console.log('');
  console.log('Merge applied.');
  for (const [collectionName, count] of Object.entries(inserted)) {
    console.log(`- inserted ${collectionName}: ${count}`);
  }
}

async function main() {
  const mode = MODE;
  const sourceDbName = String(SOURCE_DB || '').trim();
  const targetDbName = String(TARGET_DB || '').trim();

  if (!sourceDbName || sourceDbName === targetDbName) {
    console.error(usage());
    process.exit(1);
  }
  if (!['preflight', 'apply'].includes(mode)) {
    console.error(`Invalid mode: ${mode}`);
    console.error(usage());
    process.exit(1);
  }

  const baseUri = getBaseMongoUri();
  const conn = await mongoose.createConnection(baseUri, {
    dbName: TARGET_DB,
  }).asPromise();

  try {
    const admin = conn.client.db().admin();
    const dbs = await admin.listDatabases();
    const names = new Set(dbs.databases.map((db) => db.name));
    if (!names.has(sourceDbName)) {
      throw new Error(`Source database not found: ${sourceDbName}`);
    }

    const sourceDb = conn.client.db(sourceDbName);
    const targetDb = conn.client.db(targetDbName);
    const analysis = await analyze({ sourceDb, targetDb });
    printAnalysis(analysis);

    if (hasBlockers(analysis.blockers)) {
      process.exit(2);
    }

    if (mode === 'apply') {
      await applyMerge({ sourceDb, targetDb, analysis });
    }
  } finally {
    await conn.close();
  }
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exit(1);
});
