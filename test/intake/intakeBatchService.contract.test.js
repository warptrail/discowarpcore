const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const { BATCHES_ROOT, ensureBatchStructure, getBatchLayout } = require('../../scripts/intakeWorkspace');
const intakeBatchService = require('../../backend/services/intakeBatchService');
const execFileAsync = promisify(execFile);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createInMemoryBatchModel() {
  const records = new Map();
  let nextId = 1;

  function getBatchIdFromFilter(filter = {}) {
    return String(filter?.['identity.batchId'] || '').trim();
  }

  function findRecordByFilter(filter = {}) {
    if (Array.isArray(filter?.$or)) {
      for (const clause of filter.$or) {
        const match = findRecordByFilter(clause);
        if (match) return match;
      }
      return null;
    }

    const batchId = getBatchIdFromFilter(filter);
    if (batchId && records.has(batchId)) {
      return records.get(batchId);
    }

    const objectId = String(filter?._id || '').trim();
    if (objectId) {
      return Array.from(records.values()).find((record) => String(record?._id || '') === objectId) || null;
    }

    return null;
  }

  return {
    async findOne(filter = {}) {
      const record = findRecordByFilter(filter);
      return record ? clone(record) : null;
    },
    async find() {
      return Array.from(records.values()).map((entry) => clone(entry));
    },
    async findOneAndUpdate(filter = {}, update = {}, options = {}) {
      const batchId =
        getBatchIdFromFilter(filter) ||
        String(update?.$set?.identity?.batchId || '').trim();
      if (!batchId) {
        throw new Error('batchId is required for in-memory batch model');
      }

      const existing = records.get(batchId);
      if (!existing && !options.upsert) {
        return null;
      }

      const next = {
        ...(existing ? clone(existing) : { _id: `batch_record_${nextId}` }),
        ...clone(update?.$set || {}),
      };
      nextId += 1;

      records.set(batchId, next);
      return clone(next);
    },
    async deleteOne(filter = {}) {
      const batchId = getBatchIdFromFilter(filter);
      if (!batchId || !records.has(batchId)) {
        return { deletedCount: 0 };
      }
      records.delete(batchId);
      return { deletedCount: 1 };
    },
    __getRecord(batchId) {
      const normalizedBatchId = String(batchId || '').trim();
      if (!normalizedBatchId || !records.has(normalizedBatchId)) return null;
      return clone(records.get(normalizedBatchId));
    },
  };
}

function createMutableModel(records = []) {
  const store = new Map(
    (Array.isArray(records) ? records : []).map((record) => [
      String(record?._id || record?.id),
      clone(record),
    ])
  );

  return {
    find(filter = {}) {
      const nextRecords = Array.from(store.values()).filter((record) => recordMatchesFilter(record, filter));
      return {
        select() {
          return {
            lean: async () => clone(nextRecords),
          };
        },
        lean: async () => clone(nextRecords),
      };
    },
    async deleteMany(filter = {}) {
      const toDelete = Array.from(store.values())
        .filter((record) => recordMatchesFilter(record, filter))
        .map((record) => String(record._id || record.id));
      toDelete.forEach((id) => store.delete(id));
      return { deletedCount: toDelete.length };
    },
    async updateMany(filter = {}, update = {}) {
      const matched = Array.from(store.values()).filter((record) => recordMatchesFilter(record, filter));
      matched.forEach((record) => {
        if (update?.$pull && update.$pull.items) {
          const currentItems = Array.isArray(record.items) ? record.items.map(String) : [];
          const pullValue = update.$pull.items;
          if (pullValue && typeof pullValue === 'object' && Array.isArray(pullValue.$in)) {
            const blocked = new Set(pullValue.$in.map(String));
            record.items = currentItems.filter((entry) => !blocked.has(String(entry)));
          } else {
            record.items = currentItems.filter((entry) => String(entry) !== String(pullValue));
          }
          store.set(String(record._id || record.id), clone(record));
        }
      });
      return { matchedCount: matched.length, modifiedCount: matched.length };
    },
    __getRecord(id) {
      const normalizedId = String(id || '');
      if (!store.has(normalizedId)) return null;
      return clone(store.get(normalizedId));
    },
    __all() {
      return Array.from(store.values()).map((entry) => clone(entry));
    },
  };
}

async function withExternalIntakeRoot(t) {
  const previousIntakeRoot = process.env.DISCOWARPCORE_INTAKE_ROOT;
  const externalRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'dwc-intake-root-'));
  process.env.DISCOWARPCORE_INTAKE_ROOT = externalRoot;
  t.after(async () => {
    if (previousIntakeRoot == null) {
      delete process.env.DISCOWARPCORE_INTAKE_ROOT;
    } else {
      process.env.DISCOWARPCORE_INTAKE_ROOT = previousIntakeRoot;
    }
    await fs.rm(externalRoot, { recursive: true, force: true });
  });
  return externalRoot;
}

function getRecordField(record, key) {
  return String(key || '')
    .split('.')
    .filter(Boolean)
    .reduce((value, segment) => (value == null ? undefined : value[segment]), record);
}

function matchesInCondition(value, values = []) {
  const normalizedValues = (Array.isArray(values) ? values : []).map(String);
  if (Array.isArray(value)) {
    return value.some((entry) => normalizedValues.includes(String(entry)));
  }
  return normalizedValues.includes(String(value));
}

function recordMatchesFilter(record, filter = {}) {
  if (!filter || typeof filter !== 'object') return true;

  if (Array.isArray(filter.$or) && filter.$or.length) {
    if (!filter.$or.some((entry) => recordMatchesFilter(record, entry))) {
      return false;
    }
  }

  for (const [key, value] of Object.entries(filter)) {
    if (key === '$or') continue;
    const recordValue = getRecordField(record, key);
    if (value && typeof value === 'object' && Array.isArray(value.$in)) {
      if (!matchesInCondition(recordValue, value.$in)) {
        return false;
      }
      continue;
    }
    if (Array.isArray(recordValue)) {
      if (!recordValue.map(String).includes(String(value))) {
        return false;
      }
      continue;
    }
    if (String(recordValue) !== String(value)) {
      return false;
    }
  }

  return true;
}

function createLeanModel(records = []) {
  return {
    find(filter = {}) {
      const nextRecords = (Array.isArray(records) ? records : [])
        .filter((record) => recordMatchesFilter(record, filter));
      return {
        select() {
          return {
            lean: async () => clone(nextRecords),
          };
        },
        lean: async () => clone(nextRecords),
      };
    },
  };
}

async function createTempFile(t, fileName, contents) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'dwc-intake-upload-'));
  t.after(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  const filePath = path.join(dir, fileName);
  await fs.writeFile(filePath, contents, 'utf8');
  return filePath;
}

async function createTempDir(t, prefix = 'dwc-intake-temp-') {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  t.after(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });
  return dir;
}

async function createZipFromDir(sourceDir, zipPath) {
  await execFileAsync('/usr/bin/zip', ['-qr', zipPath, '.'], { cwd: sourceDir });
}

function makeUpload(filePath, originalname) {
  return {
    path: filePath,
    originalname,
  };
}

async function writeBatchFiles(batchDir, { jsonText, csvText, imageNames = [] }) {
  const layout = await ensureBatchStructure(batchDir);
  await fs.writeFile(layout.mergedInventoryJson, jsonText, 'utf8');
  await fs.writeFile(layout.imageOrderCsv, csvText, 'utf8');
  for (const imageName of imageNames) {
    await fs.writeFile(path.join(layout.originalImagesDir, imageName), 'img', 'utf8');
  }
  return layout;
}

test('createIntakeBatch captures durable source filename provenance', async (t) => {
  intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  await withExternalIntakeRoot(t);
  intakeBatchService.__setIntakeBatchServiceHandlersForTests({
    batchModel: createInMemoryBatchModel(),
  });
  t.after(() => intakeBatchService.__resetIntakeBatchServiceHandlersForTests());

  const jsonPath = await createTempFile(t, 'engine-output.json', '{"items":[]}');
  const csvPath = await createTempFile(t, 'mapping.csv', 'index,file_name\n');
  const imagePath = await createTempFile(t, 'IMG_1001.jpg', 'img');

  const batch = await intakeBatchService.createIntakeBatch({
    name: 'garage-items',
    uploadedFiles: {
      jsonFile: [makeUpload(jsonPath, 'engine-output.json')],
      csvFile: [makeUpload(csvPath, 'mapping.csv')],
      images: [makeUpload(imagePath, 'IMG_1001.jpg')],
    },
  });

  t.after(async () => {
    await fs.rm(batch.batchDir, { recursive: true, force: true });
  });

  assert.equal(batch.batchName, 'garage-items');
  assert.match(batch.databaseId, /^batch_record_/);
  assert.equal(batch.sourceManifest.aiJsonOriginalFilename, 'engine-output.json');
  assert.equal(batch.sourceManifest.mappingCsvOriginalFilename, 'mapping.csv');
  assert.deepEqual(batch.sourceManifest.imageOriginalFilenames, ['IMG_1001.jpg']);
  assert.equal(batch.sourceManifest.imageCount, 1);
  assert.equal(batch.imagesIncluded, true);
  assert.equal(batch.validationStatus, 'not_validated');
  assert.equal(batch.importStatus, 'not_imported');
});

test('createSimpleJsonIntakeBatch stages a plain single-item JSON without images', async (t) => {
  intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  await withExternalIntakeRoot(t);
  intakeBatchService.__setIntakeBatchServiceHandlersForTests({
    batchModel: createInMemoryBatchModel(),
  });
  t.after(() => intakeBatchService.__resetIntakeBatchServiceHandlersForTests());

  const jsonPath = await createTempFile(t, 'massage-roller.json', JSON.stringify({
    name: 'Stainless Steel Therapy Massage Roller Ball',
    description: 'Phyya Rehab handheld massage roller ball with protective carrying case.',
    category: 'medical',
    tags: ['phyya rehab', 'massage roller', 'cold therapy'],
    quantity: 1,
    location: null,
    box: '115',
  }));

  const result = await intakeBatchService.createSimpleJsonIntakeBatch({
    uploadedJsonFile: makeUpload(jsonPath, 'massage-roller.json'),
  });

  const layout = getBatchLayout(result.batch.batchDir);
  const storedPayload = JSON.parse(await fs.readFile(layout.mergedInventoryJson, 'utf8'));

  assert.equal(result.ok, true);
  assert.equal(result.itemCount, 1);
  assert.equal(result.batch.batchName, 'Stainless Steel Therapy Massage Roller Ball');
  assert.equal(result.batch.sourceManifest.aiJsonOriginalFilename, 'massage-roller.json');
  assert.equal(result.batch.imagesIncluded, false);
  assert.equal(storedPayload.batchContext.source, 'simple_json_upload');
  assert.equal(storedPayload.batchContext.itemCount, 1);
  assert.equal(storedPayload.batchContext.box, '115');
  assert.equal(storedPayload.items[0].name, 'Stainless Steel Therapy Massage Roller Ball');
  assert.equal(storedPayload.items[0].box, '115');

  const validation = await intakeBatchService.validateIntakeBatch(result.batch.batchId);
  assert.equal(validation.batch.validationStatus, 'passed');
});

test('updateIntakeBatchName persists renamed batch label', async (t) => {
  intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  await withExternalIntakeRoot(t);
  intakeBatchService.__setIntakeBatchServiceHandlersForTests({
    batchModel: createInMemoryBatchModel(),
  });
  t.after(() => intakeBatchService.__resetIntakeBatchServiceHandlersForTests());

  const batch = await intakeBatchService.createIntakeBatch({
    name: 'simple',
  });
  t.after(async () => {
    await fs.rm(batch.batchDir, { recursive: true, force: true });
  });

  const renamed = await intakeBatchService.updateIntakeBatchName(batch.batchId, {
    name: 'Astrometrics shelf',
  });
  const reloaded = await intakeBatchService.getIntakeBatchById(batch.batchId);

  assert.equal(renamed.name, 'Astrometrics shelf');
  assert.equal(renamed.batchName, 'Astrometrics shelf');
  assert.equal(reloaded.name, 'Astrometrics shelf');
  await assert.rejects(
    () => intakeBatchService.updateIntakeBatchName(batch.batchId, { name: '   ' }),
    /Batch name is required/
  );
});

test('validateIntakeBatch passes with JSON and CSV only while treating images as optional', async (t) => {
  intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  intakeBatchService.__setIntakeBatchServiceHandlersForTests({
    batchModel: createInMemoryBatchModel(),
  });
  t.after(() => intakeBatchService.__resetIntakeBatchServiceHandlersForTests());

  const batchDir = path.join(BATCHES_ROOT, `test-batch-${Date.now()}-json-csv-only`);
  const layout = await writeBatchFiles(batchDir, {
    jsonText: JSON.stringify({
      items: [
        { name: 'One', imageKey: 'one' },
        { name: 'Two', imageKey: 'two' },
      ],
    }),
    csvText: [
      'index,file_name',
      '0,IMG_1001.jpg',
      '1,IMG_1002.jpg',
      '',
    ].join('\n'),
  });
  await fs.writeFile(
    layout.stateJson,
    JSON.stringify({
      identity: {
        batchId: path.basename(batchDir),
        batchName: 'json-csv-only',
        createdAt: new Date().toISOString(),
      },
      sourceManifest: {
        aiJsonOriginalFilename: 'engine-output.json',
        mappingCsvOriginalFilename: 'mapping.csv',
        imageOriginalFilenames: [],
        imageCount: 0,
        imagesIncluded: false,
      },
    }, null, 2),
    'utf8'
  );
  t.after(async () => {
    await fs.rm(batchDir, { recursive: true, force: true });
  });

  await intakeBatchService.__hydrateBatchRecordFromFilesystemForTests(batchDir);
  const result = await intakeBatchService.validateIntakeBatch(path.basename(batchDir));

  assert.equal(result.batch.validationStatus, 'passed');
  assert.equal(result.batch.imagesIncluded, false);
  assert.equal(result.batch.validationSnapshot.rowCount, 2);
  assert.equal(result.batch.validationSnapshot.readyCount, 0);
  assert.equal(result.batch.validationSnapshot.missingCount, 0);
  assert.equal(result.batch.validationSnapshot.warningCount, 1);
  assert.deepEqual(result.batch.validationSnapshot.validationErrors, []);
});

test('importIntakeBatch updates import snapshot only and works without images', async (t) => {
  intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  let receivedSourceBatchId = null;
  t.after(() => intakeBatchService.__resetIntakeBatchServiceHandlersForTests());

  intakeBatchService.__setIntakeBatchServiceHandlersForTests({
    batchModel: createInMemoryBatchModel(),
    importAiJsonItems: async (payload) => {
      receivedSourceBatchId = payload?.sourceBatchId || null;
      return {
        status: 'success',
        createdCount: 2,
        failedCount: 0,
        createdItemIds: ['item_a', 'item_b'],
        warnings: [],
        validationErrors: [],
        imageImportSummary: {
          requestedCount: 2,
          attachedCount: 0,
          missingCount: 0,
          ambiguousCount: 0,
          readyCount: 0,
        },
      };
    },
  });

  const batchDir = path.join(BATCHES_ROOT, `test-batch-${Date.now()}-import-no-images`);
  const layout = await writeBatchFiles(batchDir, {
    jsonText: JSON.stringify({
      items: [
        { name: 'One', imageKey: 'one' },
        { name: 'Two', imageKey: 'two' },
      ],
    }),
    csvText: [
      'index,file_name',
      '0,IMG_1001.jpg',
      '1,IMG_1002.jpg',
      '',
    ].join('\n'),
  });
  await fs.writeFile(
    layout.stateJson,
    JSON.stringify({
      identity: {
        batchId: path.basename(batchDir),
        batchName: 'import-no-images',
        createdAt: new Date().toISOString(),
      },
      sourceManifest: {
        aiJsonOriginalFilename: 'engine-output.json',
        mappingCsvOriginalFilename: 'mapping.csv',
        imageOriginalFilenames: [],
        imageCount: 0,
        imagesIncluded: false,
      },
    }, null, 2),
    'utf8'
  );
  t.after(async () => {
    await fs.rm(batchDir, { recursive: true, force: true });
  });

  await intakeBatchService.__hydrateBatchRecordFromFilesystemForTests(batchDir);
  await intakeBatchService.validateIntakeBatch(path.basename(batchDir));
  const result = await intakeBatchService.importIntakeBatch(path.basename(batchDir));

  assert.match(receivedSourceBatchId || '', /^batch_record_/);
  assert.equal(result.batch.validationStatus, 'passed');
  assert.equal(result.batch.importLifecycleStatus, 'success');
  assert.equal(result.batch.importStatus, 'imported');
  assert.equal(result.batch.importSnapshot.createdItemCount, 2);
  assert.equal(result.batch.importSnapshot.failedItemCount, 0);
  assert.deepEqual(result.batch.importSnapshot.importedItemIds, ['item_a', 'item_b']);
  assert.equal(result.batch.processingSummary.status, 'not_requested');
  assert.equal(result.importResult.status, 'success');
});

test('getIntakeBatchById normalizes legacy flat batch state for backward compatibility', async (t) => {
  intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  intakeBatchService.__setIntakeBatchServiceHandlersForTests({
    batchModel: createInMemoryBatchModel(),
  });
  t.after(() => intakeBatchService.__resetIntakeBatchServiceHandlersForTests());

  const batchDir = path.join(BATCHES_ROOT, `test-batch-${Date.now()}-legacy`);
  const layout = await ensureBatchStructure(batchDir);
  await fs.writeFile(
    layout.stateJson,
    JSON.stringify({
      name: 'legacy-batch',
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T01:00:00.000Z',
      importStatus: 'imported',
      importedAt: '2026-04-01T02:00:00.000Z',
      importResult: {
        createdCount: 3,
        failedCount: 0,
        createdItemIds: ['item_1', 'item_2', 'item_3'],
      },
      lastValidation: {
        ok: true,
        errors: [],
        totalItems: 3,
        itemsWithImageKeysCount: 3,
        csvSourceFilesCount: 3,
        originalImageFilesCount: 3,
        validatedAt: '2026-04-01T01:30:00.000Z',
      },
    }, null, 2),
    'utf8'
  );
  t.after(async () => {
    await fs.rm(batchDir, { recursive: true, force: true });
  });

  await intakeBatchService.__hydrateBatchRecordFromFilesystemForTests(batchDir);
  const batch = await intakeBatchService.getIntakeBatchById(path.basename(batchDir));

  assert.equal(batch.batchName, 'legacy-batch');
  assert.equal(batch.validationStatus, 'passed');
  assert.equal(batch.importLifecycleStatus, 'success');
  assert.equal(batch.importStatus, 'imported');
  assert.equal(batch.validation.ok, true);
  assert.equal(batch.importSnapshot.createdItemCount, 3);
  assert.deepEqual(batch.importSnapshot.importedItemIds, ['item_1', 'item_2', 'item_3']);
});

test('getIntakeBatchById accepts a Mongo batch record id for imported item source links', async (t) => {
  intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  await withExternalIntakeRoot(t);
  const batchModel = createInMemoryBatchModel();
  intakeBatchService.__setIntakeBatchServiceHandlersForTests({
    batchModel,
  });
  t.after(() => intakeBatchService.__resetIntakeBatchServiceHandlersForTests());

  const batch = await intakeBatchService.createIntakeBatch({
    name: 'source-link-batch',
  });
  const mongoRecordId = '6600000000000000000000aa';
  await batchModel.findOneAndUpdate(
    { 'identity.batchId': batch.batchId },
    {
      $set: {
        ...batchModel.__getRecord(batch.batchId),
        _id: mongoRecordId,
      },
    },
    { new: true, upsert: true }
  );

  const resolved = await intakeBatchService.getIntakeBatchById(mongoRecordId);

  assert.equal(resolved.databaseId, mongoRecordId);
  assert.equal(resolved.batchId, batch.batchId);
  assert.equal(resolved.batchName, 'source-link-batch');
});

test('deleteIntakeBatch archives the batch record and removes it from active listings', async (t) => {
  intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  await withExternalIntakeRoot(t);
  const batchModel = createInMemoryBatchModel();
  intakeBatchService.__setIntakeBatchServiceHandlersForTests({
    batchModel,
  });
  t.after(() => intakeBatchService.__resetIntakeBatchServiceHandlersForTests());

  const batch = await intakeBatchService.createIntakeBatch({
    name: 'archive-me',
  });

  await batchModel.findOneAndUpdate(
    { 'identity.batchId': batch.batchId },
    {
      $set: {
        ...batchModel.__getRecord(batch.batchId),
        importSnapshot: {
          status: 'success',
          importedAt: new Date().toISOString(),
          createdItemCount: 1,
          updatedItemCount: 0,
          skippedItemCount: 0,
          failedItemCount: 0,
          importedItemIds: ['item_1'],
          importErrorSummary: '',
        },
      },
    },
    { new: true, upsert: true }
  );

  const result = await intakeBatchService.deleteIntakeBatch(batch.batchId);
  const archived = await intakeBatchService.getIntakeBatchById(batch.batchId);
  const activeBatches = await intakeBatchService.listIntakeBatches();

  assert.equal(result.deleted, true);
  assert.equal(archived.archiveState.status, 'archived');
  assert.equal(typeof archived.archiveState.archivedAt, 'string');
  assert.equal(await fs.stat(archived.batchDir).catch(() => null), null);
  assert.equal(activeBatches.some((entry) => entry.batchId === batch.batchId), false);
});

test('permanentlyDeleteIntakeBatch removes the batch, linked items, and linked media state without archiving', async (t) => {
  intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  await withExternalIntakeRoot(t);
  const batchModel = createInMemoryBatchModel();
  const itemModel = createMutableModel([
    {
      _id: 'item_1',
      imagePath: '/media/items/display/item-1.webp',
      sourceBatchId: 'batch_record_1',
      image: {
        mediaId: 'med_1',
        original: { storagePath: 'items/original/item-1.jpg' },
        display: { storagePath: 'items/display/item-1.webp' },
        thumb: { storagePath: 'items/thumb/item-1.webp' },
      },
    },
    {
      _id: 'item_2',
      imagePath: '/media/items/display/item-2.webp',
      sourceBatchId: 'batch_record_1',
      image: {
        mediaId: 'med_2',
        original: { storagePath: 'items/original/item-2.jpg' },
        display: { storagePath: 'items/display/item-2.webp' },
        thumb: { storagePath: 'items/thumb/item-2.webp' },
      },
    },
  ]);
  const boxModel = createMutableModel([
    { _id: 'box_1', items: ['item_1', 'item_2'] },
  ]);
  const mediaStateModel = createMutableModel([
    { _id: 'media_1', mediaId: 'med_1' },
    { _id: 'media_2', mediaId: 'med_2' },
  ]);

  intakeBatchService.__setIntakeBatchServiceHandlersForTests({
    batchModel,
    itemModel,
    boxModel,
    mediaStateModel,
  });
  t.after(() => intakeBatchService.__resetIntakeBatchServiceHandlersForTests());

  const batch = await intakeBatchService.createIntakeBatch({
    name: 'destroy-me',
  });

  const result = await intakeBatchService.permanentlyDeleteIntakeBatch(batch.batchId);

  assert.equal(result.deleted, true);
  assert.equal(result.archived, false);
  assert.equal(result.deletedItemCount, 2);
  assert.equal(result.deletedMediaStateCount, 2);
  assert.equal(batchModel.__getRecord(batch.batchId), null);
  assert.equal(itemModel.__getRecord('item_1'), null);
  assert.equal(itemModel.__getRecord('item_2'), null);
  assert.deepEqual(boxModel.__getRecord('box_1')?.items || [], []);
  assert.equal(mediaStateModel.__getRecord('media_1'), null);
  assert.equal(mediaStateModel.__getRecord('media_2'), null);
  await assert.rejects(() => intakeBatchService.getIntakeBatchById(batch.batchId), /Batch not found/i);
});

test('getIntakeBatchById returns a paged imported-item ledger and does not mutate processing summary on read', async (t) => {
  intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  const batchModel = createInMemoryBatchModel();
  t.after(() => intakeBatchService.__resetIntakeBatchServiceHandlersForTests());

  const batchObjectId = '660000000000000000000021';
  const itemOneId = '660000000000000000000201';
  const itemTwoId = '660000000000000000000202';
  const itemThreeId = '660000000000000000000203';
  const batchDir = path.join(BATCHES_ROOT, `test-batch-${Date.now()}-paged-detail`);
  const layout = await ensureBatchStructure(batchDir);
  const persistedProcessingSummary = {
    status: 'queued',
    queuedCount: 7,
    completedCount: 1,
    failedCount: 0,
    lastRequestedAt: '2026-04-02T08:15:00.000Z',
  };

  await fs.writeFile(
    layout.stateJson,
    JSON.stringify({
      schemaVersion: 3,
      batchDir,
      identity: {
        batchId: path.basename(batchDir),
        batchName: 'paged-detail',
        createdAt: '2026-04-02T08:00:00.000Z',
        updatedAt: '2026-04-02T08:30:00.000Z',
      },
      importSnapshot: {
        status: 'success',
        importedAt: '2026-04-02T08:10:00.000Z',
        createdItemCount: 3,
        updatedItemCount: 0,
        skippedItemCount: 0,
        failedItemCount: 0,
        importedItemIds: [itemOneId, itemTwoId, itemThreeId],
      },
      archiveState: {
        status: 'archived',
        archivedAt: '2026-04-02T08:40:00.000Z',
        archiveReason: 'operator archive',
      },
      processingSummary: persistedProcessingSummary,
    }, null, 2),
    'utf8'
  );
  t.after(async () => {
    await fs.rm(batchDir, { recursive: true, force: true });
  });

  intakeBatchService.__setIntakeBatchServiceHandlersForTests({
    batchModel,
    itemModel: createLeanModel([
      {
        _id: itemOneId,
        name: 'Alpha',
        sourceBatchId: batchObjectId,
        createdAt: '2026-04-02T08:01:00.000Z',
        imagePath: '/tmp/items/original/alpha.jpg',
        image: { mediaId: 'media-alpha', originalName: 'alpha.jpg' },
      },
      {
        _id: itemTwoId,
        name: 'Beta',
        sourceBatchId: batchObjectId,
        createdAt: '2026-04-02T08:02:00.000Z',
        imagePath: '/tmp/items/original/beta.jpg',
        image: { mediaId: 'media-beta', originalName: 'beta.jpg' },
      },
      {
        _id: itemThreeId,
        name: 'Gamma',
        sourceBatchId: batchObjectId,
        createdAt: '2026-04-02T08:03:00.000Z',
        imagePath: '/tmp/items/original/gamma.jpg',
        image: { mediaId: 'media-gamma', originalName: 'gamma.jpg' },
      },
    ]),
    boxModel: createLeanModel([]),
    mediaStateModel: {
      find() {
        return {
          lean: async () => [],
        };
      },
    },
  });

  await intakeBatchService.__hydrateBatchRecordFromFilesystemForTests(batchDir);
  const detail = await intakeBatchService.getIntakeBatchById(path.basename(batchDir), {
    includeImportedItems: true,
    importedItemsLimit: 2,
    importedItemsOffset: 1,
    importedItemsSort: 'created',
  });

  const persistedRecord = batchModel.__getRecord(path.basename(batchDir));

  assert.equal(detail.archiveState.status, 'archived');
  assert.equal(detail.processingSummary.status, persistedProcessingSummary.status);
  assert.equal(detail.processingSummary.queuedCount, persistedProcessingSummary.queuedCount);
  assert.equal(detail.importedItemsPage.total, 3);
  assert.equal(detail.importedItemsPage.limit, 2);
  assert.equal(detail.importedItemsPage.offset, 1);
  assert.equal(detail.importedItemsPage.hasMore, false);
  assert.deepEqual(
    detail.importedItemsPage.items.map((item) => item.id),
    [itemTwoId, itemOneId]
  );
  assert.deepEqual(persistedRecord.processingSummary, persistedProcessingSummary);
});

test('processIntakeBatchSelectedItems queues only eligible imported items and preserves archival batch semantics', async (t) => {
  intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  t.after(() => intakeBatchService.__resetIntakeBatchServiceHandlersForTests());

  const batchObjectId = '660000000000000000000001';
  const itemOneId = '660000000000000000000101';
  const itemTwoId = '660000000000000000000102';
  const itemThreeId = '660000000000000000000103';
  const batchDir = path.join(BATCHES_ROOT, `test-batch-${Date.now()}-process-selected`);
  const layout = await ensureBatchStructure(batchDir);
  await fs.writeFile(
    layout.stateJson,
    JSON.stringify({
      schemaVersion: 3,
      batchDir,
      identity: {
        batchId: path.basename(batchDir),
        batchName: 'process-selected',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      sourceManifest: {
        aiJsonOriginalFilename: 'engine-output.json',
        mappingCsvOriginalFilename: 'mapping.csv',
        imageOriginalFilenames: ['one.jpg', 'two.jpg'],
        imageCount: 2,
        imagesIncluded: true,
      },
      importSnapshot: {
        status: 'success',
        importedAt: new Date().toISOString(),
        createdItemCount: 3,
        updatedItemCount: 0,
        skippedItemCount: 0,
        failedItemCount: 0,
        importedItemIds: [itemOneId, itemTwoId, itemThreeId],
        importErrorSummary: '',
      },
      processingSummary: {
        status: 'not_requested',
        queuedCount: 0,
        completedCount: 0,
        failedCount: 0,
        lastRequestedAt: null,
      },
    }, null, 2),
    'utf8'
  );
  t.after(async () => {
    await fs.rm(batchDir, { recursive: true, force: true });
  });

  const batchRecord = {
    _id: batchObjectId,
    schemaVersion: 3,
    batchDir,
    identity: {
      batchId: path.basename(batchDir),
      batchName: 'process-selected',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    sourceManifest: {
      aiJsonOriginalFilename: 'engine-output.json',
      mappingCsvOriginalFilename: 'mapping.csv',
      collageOriginalFilename: '',
      imageOriginalFilenames: ['one.jpg', 'two.jpg'],
      imageCount: 2,
      imagesIncluded: true,
      storedFilePaths: {},
    },
    validationSnapshot: {
      status: 'passed',
      validatedAt: new Date().toISOString(),
      totalItems: 3,
      itemsWithImageKeysCount: 2,
      rowCount: 3,
      readyCount: 2,
      missingCount: 0,
      ambiguousCount: 0,
      warningCount: 0,
      errorCount: 0,
      csvSourceFilesCount: 3,
      originalImageFilesCount: 2,
      validationErrors: [],
      validationWarnings: [],
    },
    importSnapshot: {
      status: 'success',
      importedAt: new Date().toISOString(),
      createdItemCount: 3,
      updatedItemCount: 0,
      skippedItemCount: 0,
      failedItemCount: 0,
      importedItemIds: [itemOneId, itemTwoId, itemThreeId],
      importErrorSummary: '',
    },
    archiveState: {
      status: 'archived',
      archivedAt: new Date().toISOString(),
      archiveReason: 'archived_by_user',
      sourceFilesDeletedAt: new Date().toISOString(),
    },
    processingSummary: {
      status: 'not_requested',
      queuedCount: 0,
      completedCount: 0,
      failedCount: 0,
      lastRequestedAt: null,
    },
  };
  const batchModel = {
    record: clone(batchRecord),
    async findOne(filter = {}) {
      return String(filter?.['identity.batchId'] || '') === String(this.record?.identity?.batchId || '')
        ? clone(this.record)
        : null;
    },
    async find() {
      return [clone(this.record)];
    },
    async findOneAndUpdate(_filter = {}, update = {}) {
      this.record = {
        ...clone(this.record),
        ...clone(update?.$set || {}),
      };
      return clone(this.record);
    },
  };

  const items = [
    {
      _id: itemOneId,
      name: 'Queue me',
      sourceBatchId: batchObjectId,
      item_status: 'active',
      image: {
        mediaId: 'media-1',
        originalName: 'one.jpg',
        original: {
          storagePath: 'items/original/one.jpg',
          url: '/media/items/original/one.jpg',
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: itemTwoId,
      name: 'Already done',
      sourceBatchId: batchObjectId,
      item_status: 'active',
      image: {
        mediaId: 'media-2',
        originalName: 'two.jpg',
        original: {
          storagePath: 'items/original/two.jpg',
          url: '/media/items/original/two.jpg',
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: itemThreeId,
      name: 'Unavailable',
      sourceBatchId: batchObjectId,
      item_status: 'active',
      image: {
        mediaId: '',
        originalName: '',
        original: {
          storagePath: '',
          url: '',
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  const mediaStates = [
    {
      mediaId: 'media-1',
      originalPath: '/tmp/items/original/one.jpg',
      processingStatus: 'ready_for_processing',
      sourceType: 'batch_import',
      processedAt: null,
    },
    {
      mediaId: 'media-2',
      originalPath: '/tmp/items/original/two.jpg',
      processingStatus: 'completed',
      sourceType: 'batch_import',
      processedAt: new Date().toISOString(),
    },
  ];
  const mediaStateModel = {
    find(filter = {}) {
      const ids = Array.isArray(filter?.$or?.[0]?.mediaId?.$in) ? filter.$or[0].mediaId.$in.map(String) : [];
      const rows = mediaStates.filter((entry) => !ids.length || ids.includes(String(entry.mediaId)));
      return {
        lean: async () => clone(rows),
      };
    },
  };
  const observedQueueRequests = [];

  intakeBatchService.__setIntakeBatchServiceHandlersForTests({
    batchModel,
    itemModel: createLeanModel(items),
    boxModel: createLeanModel([]),
    mediaStateModel,
    ensureItemMediaState: async (itemId) => {
      if (String(itemId) === itemOneId) {
        return { mediaId: 'media-1' };
      }
      if (String(itemId) === itemTwoId) {
        return { mediaId: 'media-2' };
      }
      return { mediaId: '' };
    },
    enqueueMediaProcessingJobById: async (mediaId, _outputPath, renderTokens, _forceReprocess, context) => {
      observedQueueRequests.push({
        mediaId,
        renderTokens,
        context,
      });
      if (String(mediaId) === 'media-1') {
        mediaStates[0] = {
          ...mediaStates[0],
          processingStatus: 'queued',
        };
        return {
          job: {
            id: 'job-1',
            processingState: {
              processingStatus: 'queued',
            },
          },
          queueStatus: {
            queued: 1,
          },
        };
      }
      return {
        skipped: true,
        skipReason: 'already_complete',
        processingState: {
          processingStatus: 'completed',
        },
      };
    },
  });

  const result = await intakeBatchService.processIntakeBatchSelectedItems(path.basename(batchDir), {
    itemIds: [itemOneId, itemTwoId, itemThreeId],
    renderTokens: {
      mode: 'explicit',
      background: 'midnight',
      glow: 'arc',
      accent: 'cyanCore',
    },
  });

  assert.equal(result.processingRequest.queuedCount, 1);
  assert.equal(result.processingRequest.skippedAlreadyProcessedCount, 1);
  assert.equal(result.processingRequest.skippedMissingOriginalCount, 1);
  assert.equal(result.batch.archiveState.status, 'archived');
  assert.equal(result.batch.processingSummary.status, 'queued');
  assert.equal(result.batch.processingSummary.queuedCount, 1);
  assert.deepEqual(result.processingRequest.renderTokens, {
    mode: 'explicit',
    background: 'midnight',
    glow: 'arc',
  });
  assert.deepEqual(observedQueueRequests, [{
    mediaId: 'media-1',
    renderTokens: {
      mode: 'explicit',
      background: 'midnight',
      glow: 'arc',
    },
    context: {
      batchId: path.basename(batchDir),
    },
  }]);
  assert.equal(Array.isArray(result.batch.importedItemsPage?.items), true);
  assert.equal(result.batch.importedItemsPage.items.find((item) => item.id === itemOneId)?.processing?.status, 'queued');
  assert.equal(result.batch.importedItemsPage.items.find((item) => item.id === itemTwoId)?.processing?.status, 'processed');
  assert.equal(result.batch.importedItemsPage.items.find((item) => item.id === itemThreeId)?.processing?.status, 'unavailable');
});

test('listIntakeBatches does not auto-scan external intake folders', async (t) => {
  intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  const externalRoot = await withExternalIntakeRoot(t);
  t.after(async () => {
    intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  });

  intakeBatchService.__setIntakeBatchServiceHandlersForTests({
    batchModel: createInMemoryBatchModel(),
  });

  const batchDir = path.join(externalRoot, 'garage-alpha');
  await fs.mkdir(batchDir, { recursive: true });
  await fs.writeFile(path.join(batchDir, 'engine-output.json'), JSON.stringify({ items: [] }), 'utf8');

  const batches = await intakeBatchService.listIntakeBatches();
  assert.equal(batches.find((entry) => entry.batchId === 'garage-alpha'), undefined);
});

test('getIntakeBatchById does not hydrate directly from external intake folders', async (t) => {
  intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  const externalRoot = await withExternalIntakeRoot(t);
  t.after(async () => {
    intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  });

  intakeBatchService.__setIntakeBatchServiceHandlersForTests({
    batchModel: createInMemoryBatchModel(),
  });

  const batchDir = path.join(externalRoot, 'garage-alpha');
  await fs.mkdir(batchDir, { recursive: true });
  await fs.writeFile(path.join(batchDir, 'engine-output.json'), JSON.stringify({ items: [] }), 'utf8');

  await assert.rejects(
    () => intakeBatchService.getIntakeBatchById('garage-alpha'),
    /Batch not found/i
  );
});

test('validate/import writes receipt into external intake folder and marks safeToDelete on success', async (t) => {
  intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  const externalRoot = await withExternalIntakeRoot(t);
  t.after(async () => {
    intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  });

  const batchModel = createInMemoryBatchModel();
  intakeBatchService.__setIntakeBatchServiceHandlersForTests({
    batchModel,
    itemModel: createLeanModel([]),
    boxModel: createLeanModel([]),
    mediaStateModel: createLeanModel([]),
    importAiJsonItems: async () => ({
      status: 'success',
      createdCount: 1,
      failedCount: 0,
      createdItemIds: ['created-item-1'],
      validationErrors: [],
    }),
  });

  const batchDir = path.join(externalRoot, 'garage-beta');
  await fs.mkdir(batchDir, { recursive: true });
  await fs.writeFile(
    path.join(batchDir, 'engine-output.json'),
    JSON.stringify({ items: [{ name: 'Lamp shade' }] }),
    'utf8'
  );

  await intakeBatchService.__hydrateBatchRecordFromFilesystemForTests(batchDir);
  const validated = await intakeBatchService.validateIntakeBatch('garage-beta');
  assert.equal(validated.batch.validationStatus, 'passed');

  const imported = await intakeBatchService.importIntakeBatch('garage-beta');
  assert.equal(imported.batch.importLifecycleStatus, 'success');

  const receipt = JSON.parse(
    await fs.readFile(path.join(batchDir, 'discowarpcore_batch_receipt.json'), 'utf8')
  );

  assert.equal(receipt.app, 'discowarpcore');
  assert.equal(receipt.batchFolderName, 'garage-beta');
  assert.equal(receipt.status, 'imported');
  assert.equal(receipt.safeToDelete, true);
  assert.ok(receipt.validatedAt);
  assert.ok(receipt.importedAt);
  assert.ok(receipt.batchRecordId);
});

test('persisted batch with missing local folder is flagged and can recreate the staging folder', async (t) => {
  intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  const externalRoot = await withExternalIntakeRoot(t);
  const batchModel = createInMemoryBatchModel();
  intakeBatchService.__setIntakeBatchServiceHandlersForTests({ batchModel });
  t.after(() => intakeBatchService.__resetIntakeBatchServiceHandlersForTests());

  const batchDir = path.join(externalRoot, 'garage-missing');
  await fs.mkdir(batchDir, { recursive: true });
  await fs.writeFile(path.join(batchDir, 'engine-output.json'), JSON.stringify({ items: [] }), 'utf8');

  await intakeBatchService.__hydrateBatchRecordFromFilesystemForTests(batchDir);
  const created = await intakeBatchService.getIntakeBatchById('garage-missing');
  assert.equal(created.localFolderMissing, false);

  await fs.rm(batchDir, { recursive: true, force: true });

  const missing = await intakeBatchService.getIntakeBatchById('garage-missing');
  assert.equal(missing.localFolderMissing, true);
  assert.equal(missing.localFolderPresent, false);

  const recreated = await intakeBatchService.recreateIntakeBatchLocalFolder('garage-missing');
  assert.equal(recreated.recreated, true);
  assert.equal(recreated.batch.localFolderMissing, false);
  assert.notEqual(await fs.stat(batchDir).catch(() => null), null);
});

test('ingestIntakeBatchPackage creates, validates, imports, and returns receipt advice', async (t) => {
  intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  await withExternalIntakeRoot(t);
  let receivedSourceBatchId = null;
  intakeBatchService.__setIntakeBatchServiceHandlersForTests({
    batchModel: createInMemoryBatchModel(),
    importAiJsonItems: async (payload) => {
      receivedSourceBatchId = payload?.sourceBatchId || null;
      return {
        status: 'success',
        createdCount: 1,
        failedCount: 0,
        createdItemIds: ['item_pkg_1'],
        validationErrors: [],
      };
    },
  });
  t.after(() => intakeBatchService.__resetIntakeBatchServiceHandlersForTests());

  const jsonPath = await createTempFile(t, 'engine-output.json', JSON.stringify({ items: [{ name: 'Desk lamp' }] }));
  const result = await intakeBatchService.ingestIntakeBatchPackage({
    manifest: JSON.stringify({
      batchFolderName: 'desk-lamp-pass',
      batchLabel: 'desk-lamp-pass',
      packageVersion: 1,
    }),
    uploadedFiles: {
      jsonFile: [makeUpload(jsonPath, 'engine-output.json')],
    },
  });

  assert.equal(result.packageIngest.status, 'imported');
  assert.equal(result.packageIngest.autoValidate, true);
  assert.equal(result.packageIngest.autoImport, true);
  assert.equal(result.batch.validationStatus, 'passed');
  assert.equal(result.batch.importLifecycleStatus, 'success');
  assert.equal(result.receiptAdvice.safeToDelete, true);
  assert.equal(result.receiptAdvice.status, 'imported');
  assert.equal(result.receiptAdvice.batchId, result.batch.batchId);
  assert.match(String(receivedSourceBatchId || ''), /^batch_record_/);
});

test('ingestIntakeBatchPackageArchiveFromFile stages batch_manifest package', async (t) => {
  intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  await withExternalIntakeRoot(t);
  intakeBatchService.__setIntakeBatchServiceHandlersForTests({
    batchModel: createInMemoryBatchModel(),
  });
  t.after(() => intakeBatchService.__resetIntakeBatchServiceHandlersForTests());

  const fixtureDir = await createTempDir(t, 'dwc-package-fixture-');
  const imagesDir = path.join(fixtureDir, 'images');
  await fs.mkdir(imagesDir, { recursive: true });
  await fs.writeFile(path.join(imagesDir, 'IMG_1001.jpg'), 'img-1', 'utf8');
  await fs.writeFile(path.join(imagesDir, 'IMG_1002.jpg'), 'img-2', 'utf8');
  await fs.writeFile(
    path.join(fixtureDir, 'batch_manifest.json'),
    JSON.stringify({
      packageVersion: 2,
      app: 'discowarpcore',
      batchLabel: 'garage shelf 1',
      target: {
        location: 'garage',
        box: '701',
      },
      items: [
        {
          imageFile: 'IMG_1001.jpg',
          imageKey: 'IMG_1001',
          name: 'Lamp',
          description: 'desk lamp',
          category: 'miscellaneous',
          tags: [],
          quantity: 1,
        },
        {
          imageFile: 'IMG_1002.jpg',
          imageKey: 'IMG_1002',
          name: 'Cable',
          description: 'coiled cable',
          category: 'electronics',
          tags: ['cable'],
          quantity: 1,
        },
      ],
    }),
    'utf8'
  );

  const zipDir = await createTempDir(t, 'dwc-package-zip-');
  const zipPath = path.join(zipDir, 'garage-shelf-1.zip');
  await createZipFromDir(fixtureDir, zipPath);

  const result = await intakeBatchService.ingestIntakeBatchPackageArchiveFromFile(zipPath, {
    originalPackageFilename: 'garage-shelf-1.zip',
  });

  assert.equal(result.ok, true);
  assert.equal(result.requiredAssetsFound, true);
  assert.equal(result.batch.packageSnapshot.originalPackageFilename, 'garage-shelf-1.zip');
  assert.equal(result.batch.packageSnapshot.manifest.app, 'discowarpcore');
  assert.equal(result.batch.packageSnapshot.manifest.packageVersion, 1);
  assert.equal(result.batch.packageSnapshot.structureSummary.hasBatchManifest, true);
  assert.equal(result.batch.packageSnapshot.structureSummary.hasManifest, true);
  assert.equal(result.batch.packageSnapshot.structureSummary.hasAiJson, true);
  assert.equal(result.batch.packageSnapshot.structureSummary.hasMappingCsv, true);
  assert.equal(result.batch.packageSnapshot.structureSummary.imageCount, 2);
  assert.equal(result.batch.sourceManifest.aiJsonOriginalFilename, 'ai_intake.json');
  assert.equal(result.batch.sourceManifest.mappingCsvOriginalFilename, 'image_mapping.csv');
  assert.equal(result.batch.imagesIncluded, true);
  assert.equal(result.nextStepSuggestion, 'Package staged successfully. Validate the batch before import.');
});

test('batch_manifest package without destination requires explicit destination review', async (t) => {
  intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  await withExternalIntakeRoot(t);
  intakeBatchService.__setIntakeBatchServiceHandlersForTests({
    batchModel: createInMemoryBatchModel(),
  });
  t.after(() => intakeBatchService.__resetIntakeBatchServiceHandlersForTests());

  const fixtureDir = await createTempDir(t, 'dwc-package-fixture-');
  const imagesDir = path.join(fixtureDir, 'images');
  await fs.mkdir(imagesDir, { recursive: true });
  await fs.writeFile(path.join(imagesDir, 'IMG_2001.jpg'), 'img-1', 'utf8');
  await fs.writeFile(
    path.join(fixtureDir, 'batch_manifest.json'),
    JSON.stringify({
      packageVersion: 2,
      app: 'discowarpcore',
      batchLabel: 'garage unknowns',
      items: [
        {
          imageFile: 'IMG_2001.jpg',
          imageKey: 'IMG_2001',
          name: 'Unknown cable',
          category: 'electronics',
          quantity: 1,
        },
      ],
    }),
    'utf8'
  );

  const zipDir = await createTempDir(t, 'dwc-package-zip-');
  const zipPath = path.join(zipDir, 'garage-unknowns.zip');
  await createZipFromDir(fixtureDir, zipPath);

  const result = await intakeBatchService.ingestIntakeBatchPackageArchiveFromFile(zipPath, {
    originalPackageFilename: 'garage-unknowns.zip',
  });

  assert.equal(result.ok, true);
  assert.equal(result.batch.destinationDefaults.reviewRequired, true);
  await assert.rejects(
    () => intakeBatchService.validateIntakeBatch(result.batch.batchId),
    /destination must be reviewed/i
  );

  const reviewedBatch = await intakeBatchService.updateIntakeBatchDestination(result.batch.batchId, {
    location: '',
    box: '',
  });
  assert.equal(reviewedBatch.destinationDefaults.reviewed, true);
  assert.equal(reviewedBatch.destinationDefaults.reviewRequired, false);
  assert.equal(reviewedBatch.destinationDefaults.location, '');
  assert.equal(reviewedBatch.destinationDefaults.box, '');

  const validation = await intakeBatchService.validateIntakeBatch(result.batch.batchId);
  assert.equal(validation.batch.validationStatus, 'passed');
});

test('ingestIntakeBatchPackageArchiveFromFile rejects obsolete three-file package layout', async (t) => {
  intakeBatchService.__resetIntakeBatchServiceHandlersForTests();
  await withExternalIntakeRoot(t);
  intakeBatchService.__setIntakeBatchServiceHandlersForTests({
    batchModel: createInMemoryBatchModel(),
  });
  t.after(() => intakeBatchService.__resetIntakeBatchServiceHandlersForTests());

  const fixtureDir = await createTempDir(t, 'dwc-package-fixture-');
  const imagesDir = path.join(fixtureDir, 'images');
  await fs.mkdir(imagesDir, { recursive: true });
  await fs.writeFile(
    path.join(fixtureDir, 'manifest.json'),
    JSON.stringify({
      packageVersion: 1,
      app: 'discowarpcore',
      batchLabel: 'obsolete package',
      files: { aiIntakeJson: 'ai_intake.json', imageMappingCsv: 'image_mapping.csv', imagesDir: 'images' },
    }),
    'utf8'
  );
  await fs.writeFile(
    path.join(fixtureDir, 'ai_intake.json'),
    JSON.stringify({
      batchContext: { source: 'ai_json_import' },
      items: [{ name: 'Lamp', category: 'household', notes: 'top shelf' }],
    }),
    'utf8'
  );
  await fs.writeFile(path.join(fixtureDir, 'image_mapping.csv'), 'index,file_name\n1,IMG_1001.jpg\n', 'utf8');
  await fs.writeFile(path.join(imagesDir, 'IMG_1001.jpg'), 'img-1', 'utf8');

  const zipDir = await createTempDir(t, 'dwc-package-zip-');
  const zipPath = path.join(zipDir, 'obsolete-package.zip');
  await createZipFromDir(fixtureDir, zipPath);

  const result = await intakeBatchService.ingestIntakeBatchPackageArchiveFromFile(zipPath, {
    originalPackageFilename: 'obsolete-package.zip',
  });

  assert.equal(result.ok, false);
  assert.equal(result.requiredAssetsFound, false);
  assert.equal(result.packageStructureSummary.hasBatchManifest, false);
  assert.match(result.errors.join(' '), /batch_manifest\.json/);
  assert.match(result.errors.join(' '), /Obsolete package files/);
});
