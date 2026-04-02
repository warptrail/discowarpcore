const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const MediaState = require('../../backend/models/MediaState');
const { MEDIA_ROOT } = require('../../backend/config/media');
const mediaProcessingService = require('../../backend/services/mediaProcessingService');
const { runMediaBatchOperation } = require('../../backend/services/mediaBatchService');
const { MEDIA_ERROR_CODES } = require('../../backend/services/mediaErrors');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toComparable(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }
  return value;
}

function matchCondition(actual, condition) {
  if (
    condition &&
    typeof condition === 'object' &&
    !Array.isArray(condition) &&
    !(condition instanceof Date)
  ) {
    for (const [op, expected] of Object.entries(condition)) {
      if (op === '$exists') {
        const exists = actual !== undefined;
        if (Boolean(expected) !== exists) return false;
        continue;
      }

      if (op === '$ne') {
        if (actual === expected) return false;
        continue;
      }

      if (op === '$nin') {
        if (Array.isArray(expected) && expected.includes(actual)) return false;
        continue;
      }

      if (op === '$gte') {
        if (!(toComparable(actual) >= toComparable(expected))) return false;
        continue;
      }

      if (op === '$lte') {
        if (!(toComparable(actual) <= toComparable(expected))) return false;
        continue;
      }

      if (!matchCondition(actual?.[op], expected)) return false;
    }

    return true;
  }

  return actual === condition;
}

function matchQuery(doc, query = {}) {
  const entries = Object.entries(query || {});
  for (const [key, value] of entries) {
    if (key === '$and') {
      if (!Array.isArray(value) || !value.every((part) => matchQuery(doc, part))) {
        return false;
      }
      continue;
    }

    if (key === '$or') {
      if (!Array.isArray(value) || !value.some((part) => matchQuery(doc, part))) {
        return false;
      }
      continue;
    }

    if (!matchCondition(doc[key], value)) {
      return false;
    }
  }

  return true;
}

function hasUpdatePathConflict(leftPath, rightPath) {
  if (leftPath === rightPath) return true;
  return (
    leftPath.startsWith(`${rightPath}.`) ||
    rightPath.startsWith(`${leftPath}.`)
  );
}

function assertNoMongoPathConflicts(update) {
  const setPaths = Object.keys(update?.$set || {});
  const setOnInsertPaths = Object.keys(update?.$setOnInsert || {});

  for (const leftPath of setPaths) {
    for (const rightPath of setOnInsertPaths) {
      if (hasUpdatePathConflict(leftPath, rightPath)) {
        const error = new Error(
          `Updating the path '${leftPath}' would create a conflict at '${rightPath}'`
        );
        error.code = 40;
        throw error;
      }
    }
  }
}

function installMediaStateMock() {
  const store = new Map();

  const originalMethods = {
    findOneAndUpdate: MediaState.findOneAndUpdate,
    findOne: MediaState.findOne,
    countDocuments: MediaState.countDocuments,
    find: MediaState.find,
  };

  MediaState.findOneAndUpdate = async function findOneAndUpdate(query, update) {
    assertNoMongoPathConflicts(update);

    const key = String(query.originalPath || '');
    const current = store.has(key) ? clone(store.get(key)) : {};
    const next = {
      ...current,
      ...(store.has(key) ? {} : clone(update?.$setOnInsert || {})),
      ...clone(update?.$set || {}),
    };

    if (!next.originalPath) {
      next.originalPath = key;
    }

    const now = new Date().toISOString();
    next.updatedAt = now;
    next.createdAt = next.createdAt || now;

    store.set(key, next);
    return {
      toObject() {
        return clone(next);
      },
    };
  };

  MediaState.findOne = function findOne(query) {
    if (query && Object.prototype.hasOwnProperty.call(query, 'mediaId')) {
      const target = String(query.mediaId || '');
      const row = [...store.values()].find((entry) => String(entry.mediaId || '') === target);
      return {
        async lean() {
          return row ? clone(row) : null;
        },
      };
    }

    const key = String(query.originalPath || '');
    return {
      async lean() {
        return store.has(key) ? clone(store.get(key)) : null;
      },
    };
  };

  MediaState.countDocuments = async function countDocuments(query) {
    return [...store.values()].filter((doc) => matchQuery(doc, query)).length;
  };

  MediaState.find = function find(query) {
    let rows = [...store.values()].filter((doc) => matchQuery(doc, query));

    const chain = {
      sort(sortSpec = {}) {
        const keys = Object.keys(sortSpec);
        rows.sort((a, b) => {
          for (const key of keys) {
            const direction = Number(sortSpec[key]) >= 0 ? 1 : -1;
            const left = toComparable(a[key]);
            const right = toComparable(b[key]);
            if (left < right) return -1 * direction;
            if (left > right) return 1 * direction;
          }
          return 0;
        });
        return chain;
      },
      limit(value) {
        rows = rows.slice(0, Math.max(0, Number(value) || 0));
        return chain;
      },
      async lean() {
        return rows.map((row) => clone(row));
      },
    };

    return chain;
  };

  return {
    store,
    restore() {
      MediaState.findOneAndUpdate = originalMethods.findOneAndUpdate;
      MediaState.findOne = originalMethods.findOne;
      MediaState.countDocuments = originalMethods.countDocuments;
      MediaState.find = originalMethods.find;
    },
  };
}

async function createTestImage(filePath, { width, height, rgb }) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: rgb[0], g: rgb[1], b: rgb[2] },
    },
  })
    .jpeg()
    .toFile(filePath);
}

async function createTempMediaDir() {
  await fs.mkdir(MEDIA_ROOT, { recursive: true });
  return fs.mkdtemp(path.join(MEDIA_ROOT, 'media-hardening-test-'));
}

test('media processing happy path persists completed state and artifacts', async (t) => {
  const stateMock = installMediaStateMock();
  t.after(() => stateMock.restore());
  t.after(() => mediaProcessingService.__resetObjectGlowRunnerForTests());

  const tempDir = await createTempMediaDir();
  t.after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const inputPath = path.join(tempDir, 'items', 'original', 'sample.jpg');
  const outputPath = path.join(tempDir, 'items', 'processed', 'sample.webp');
  await createTestImage(inputPath, { width: 80, height: 60, rgb: [220, 20, 60] });

  mediaProcessingService.__setObjectGlowRunnerForTests(async ({ inputPath: inPath, outputPath: outPath }) => {
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await sharp(inPath).webp().toFile(outPath);
    return {
      exitCode: 0,
      signal: null,
      stdout: `render_key=midnight-standard-cyanCore\nProcessed ${inPath} -> ${outPath}\n`,
      stderr: '',
    };
  });

  const outcome = await mediaProcessingService.processImageWithObjectGlow(inputPath, outputPath);

  assert.equal(outcome.processingState.processingStatus, 'completed');
  assert.equal(outcome.processingState.activeVariant, 'processed');
  assert.equal(outcome.processingState.displayDerivedFrom, 'processed');
  assert.equal(outcome.processingState.thumbDerivedFrom, 'processed');

  const processedStat = await fs.stat(outcome.processingState.processedPath);
  const displayStat = await fs.stat(outcome.processingState.displayPath);
  const thumbStat = await fs.stat(outcome.processingState.thumbPath);

  assert.equal(processedStat.isFile(), true);
  assert.equal(displayStat.isFile(), true);
  assert.equal(thumbStat.isFile(), true);
  assert.ok(processedStat.size > 0);
  assert.ok(displayStat.size > 0);
  assert.ok(thumbStat.size > 0);
});

test('media processing forwards render tokens and persists them', async (t) => {
  const stateMock = installMediaStateMock();
  t.after(() => stateMock.restore());
  t.after(() => mediaProcessingService.__resetObjectGlowRunnerForTests());

  const tempDir = await createTempMediaDir();
  t.after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const inputPath = path.join(tempDir, 'items', 'original', 'tokens.jpg');
  const outputPath = path.join(tempDir, 'items', 'processed', 'tokens.webp');
  await createTestImage(inputPath, { width: 72, height: 72, rgb: [40, 40, 180] });

  const observed = { renderTokens: null };
  mediaProcessingService.__setObjectGlowRunnerForTests(async ({ inputPath: inPath, outputPath: outPath, renderTokens }) => {
    observed.renderTokens = renderTokens;
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await sharp(inPath).webp().toFile(outPath);
    return {
      exitCode: 0,
      signal: null,
      stdout: `render_key=${renderTokens.background}-${renderTokens.glow}-${renderTokens.accent}\n`,
      stderr: '',
    };
  });

  const outcome = await mediaProcessingService.processImageWithObjectGlow(
    inputPath,
    outputPath,
    {
      renderTokens: {
        background: 'midnight',
        glow: 'arc',
        accent: 'cyanCore',
      },
    }
  );

  assert.deepEqual(observed.renderTokens, {
    mode: 'explicit',
    background: 'midnight',
    glow: 'arc',
    accent: 'cyanCore',
  });
  assert.deepEqual(outcome.processingState.renderTokens, {
    mode: 'explicit',
    background: 'midnight',
    glow: 'arc',
    accent: 'cyanCore',
  });
});

test('queueMediaProcessing sets queued state without Mongo update-path conflicts', async (t) => {
  const stateMock = installMediaStateMock();
  t.after(() => stateMock.restore());

  const tempDir = await createTempMediaDir();
  t.after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const inputPath = path.join(tempDir, 'items', 'original', 'queued.jpg');
  const outputPath = path.join(tempDir, 'items', 'processed', 'queued.webp');
  await createTestImage(inputPath, { width: 48, height: 48, rgb: [10, 120, 210] });

  const queued = await mediaProcessingService.queueMediaProcessing(inputPath, outputPath);

  assert.equal(queued.inputPath, inputPath);
  assert.equal(queued.outputPath, outputPath);
  assert.equal(queued.processingState.processingStatus, 'queued');
  assert.equal(queued.processingState.processedPath, outputPath);
  assert.match(queued.processingState.mediaId, /^med_[a-f0-9]+$/);
});

test('getMediaStateById and queueMediaProcessingById keep path compatibility', async (t) => {
  const stateMock = installMediaStateMock();
  t.after(() => stateMock.restore());

  const tempDir = await createTempMediaDir();
  t.after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const inputPath = path.join(tempDir, 'items', 'original', 'by-id.jpg');
  const outputPath = path.join(tempDir, 'items', 'processed', 'by-id.webp');
  await createTestImage(inputPath, { width: 64, height: 64, rgb: [80, 50, 200] });

  const queuedByPath = await mediaProcessingService.queueMediaProcessing(inputPath, outputPath);
  const mediaId = queuedByPath.processingState.mediaId;
  assert.match(mediaId, /^med_[a-f0-9]+$/);

  const fetchedById = await mediaProcessingService.getMediaStateById(mediaId);
  assert.equal(fetchedById.originalPath, inputPath);
  assert.equal(fetchedById.processedPath, outputPath);

  const queuedById = await mediaProcessingService.queueMediaProcessingById(mediaId, outputPath);
  assert.equal(queuedById.processingState.mediaId, mediaId);
  assert.equal(queuedById.inputPath, inputPath);
});

test('backfillMissingMediaIds assigns IDs to legacy MediaState records', async (t) => {
  const stateMock = installMediaStateMock();
  t.after(() => stateMock.restore());

  const tempDir = await createTempMediaDir();
  t.after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const originalPath = path.join(tempDir, 'items', 'original', 'legacy.jpg');
  await createTestImage(originalPath, { width: 22, height: 22, rgb: [1, 2, 3] });

  stateMock.store.set(originalPath, {
    originalPath,
    processedPath: '',
    activeVariant: 'original',
    processingStatus: 'idle',
    displayDerivedFrom: null,
    thumbDerivedFrom: null,
    processedAt: null,
  });

  const summary = await mediaProcessingService.backfillMissingMediaIds({ limit: 20 });
  assert.equal(summary.matchedCount, 1);
  assert.equal(summary.updatedCount, 1);

  const updated = stateMock.store.get(originalPath);
  assert.match(String(updated.mediaId || ''), /^med_[a-f0-9]+$/);
});

test('objectGlow success exit but missing output raises MEDIA_OUTPUT_MISSING', async (t) => {
  const stateMock = installMediaStateMock();
  t.after(() => stateMock.restore());
  t.after(() => mediaProcessingService.__resetObjectGlowRunnerForTests());

  const tempDir = await createTempMediaDir();
  t.after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const inputPath = path.join(tempDir, 'items', 'original', 'missing-output.jpg');
  const outputPath = path.join(tempDir, 'items', 'processed', 'missing-output.webp');
  await createTestImage(inputPath, { width: 40, height: 40, rgb: [40, 180, 120] });

  mediaProcessingService.__setObjectGlowRunnerForTests(async ({ inputPath: inPath, outputPath: outPath }) => ({
    exitCode: 0,
    signal: null,
    stdout: `Processed ${inPath} -> ${outPath}\n`,
    stderr: '',
  }));

  await assert.rejects(
    () => mediaProcessingService.processImageWithObjectGlow(inputPath, outputPath),
    (error) => {
      assert.equal(error.code, MEDIA_ERROR_CODES.MEDIA_OUTPUT_MISSING);
      assert.equal(error.processingState.processingStatus, 'failed');
      return true;
    }
  );
});

test('syncDerivedVariantsForMedia uses activeVariant source path', async (t) => {
  const stateMock = installMediaStateMock();
  t.after(() => stateMock.restore());

  const tempDir = await createTempMediaDir();
  t.after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const originalPath = path.join(tempDir, 'items', 'original', 'variant-check.jpg');
  const processedPath = path.join(tempDir, 'items', 'processed', 'variant-check.webp');

  await createTestImage(originalPath, { width: 120, height: 80, rgb: [255, 0, 0] });
  await fs.mkdir(path.dirname(processedPath), { recursive: true });
  await sharp({
    create: {
      width: 40,
      height: 20,
      channels: 3,
      background: { r: 0, g: 0, b: 255 },
    },
  })
    .webp()
    .toFile(processedPath);

  stateMock.store.set(originalPath, {
    originalPath,
    processedPath,
    activeVariant: 'processed',
    processingStatus: 'completed',
    displayPath: '',
    thumbPath: '',
    displayDerivedFrom: null,
    thumbDerivedFrom: null,
  });

  const fromProcessed = await mediaProcessingService.syncDerivedVariantsForMedia(originalPath);
  const displayFromProcessed = await sharp(fromProcessed.displayPath).metadata();
  assert.equal(displayFromProcessed.width, 40);

  stateMock.store.set(originalPath, {
    ...stateMock.store.get(originalPath),
    activeVariant: 'original',
  });

  const fromOriginal = await mediaProcessingService.syncDerivedVariantsForMedia(originalPath);
  const displayFromOriginal = await sharp(fromOriginal.displayPath).metadata();
  assert.equal(displayFromOriginal.width, 120);
});

test('runMediaBatchOperation dryRun returns planned records without mutation', async (t) => {
  const stateMock = installMediaStateMock();
  t.after(() => stateMock.restore());

  const tempDir = await createTempMediaDir();
  t.after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const originalPath = path.join(tempDir, 'items', 'original', 'dryrun.jpg');
  await createTestImage(originalPath, { width: 30, height: 30, rgb: [10, 10, 10] });

  stateMock.store.set(originalPath, {
    originalPath,
    processedPath: '',
    activeVariant: 'original',
    processingStatus: 'idle',
    displayDerivedFrom: null,
    thumbDerivedFrom: null,
    processedAt: null,
  });
  const before = clone(stateMock.store.get(originalPath));

  const summary = await runMediaBatchOperation({
    operation: 'process_missing_processed',
    dryRun: true,
    limit: 10,
  });

  assert.equal(summary.dryRun, true);
  assert.equal(summary.matchedCount, 1);
  assert.equal(summary.attemptedCount, 1);
  assert.equal(summary.succeededCount, 0);
  assert.equal(summary.failedCount, 0);
  assert.equal(summary.records[0].status, 'planned');
  assert.deepEqual(stateMock.store.get(originalPath), before);
});

test('runMediaBatchOperation applies limit while preserving matchedCount', async (t) => {
  const stateMock = installMediaStateMock();
  t.after(() => stateMock.restore());

  const tempDir = await createTempMediaDir();
  t.after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  for (let index = 1; index <= 3; index += 1) {
    const originalPath = path.join(tempDir, 'items', 'original', `limit-${index}.jpg`);
    await createTestImage(originalPath, { width: 20 + index, height: 20, rgb: [index, 0, 0] });
    stateMock.store.set(originalPath, {
      originalPath,
      processedPath: '',
      activeVariant: 'original',
      processingStatus: 'idle',
      displayDerivedFrom: null,
      thumbDerivedFrom: null,
      processedAt: null,
      updatedAt: new Date(Date.now() + index).toISOString(),
    });
  }

  const summary = await runMediaBatchOperation({
    operation: 'process_missing_processed',
    dryRun: true,
    limit: 2,
  });

  assert.equal(summary.matchedCount, 3);
  assert.equal(summary.attemptedCount, 2);
  assert.equal(summary.records.length, 2);
});
