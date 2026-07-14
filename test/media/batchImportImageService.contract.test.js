const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const sharp = require('sharp');

const batchImportImageService = require('../../backend/services/batchImportImageService');
const {
  buildImportImageLookup,
  resolveImportImageMatch,
  attachBatchImportImageToItem,
} = batchImportImageService;
const { MEDIA_ROOT } = require('../../backend/config/media');
const mediaProcessingService = require('../../backend/services/mediaProcessingService');

test('buildImportImageLookup groups import images by exact basename', () => {
  const lookup = buildImportImageLookup([
    { originalname: 'import-images/hammer.jpg', path: '/tmp/hammer-a.jpg' },
    { originalname: 'import-images/wrench.png', path: '/tmp/wrench.png' },
    { originalname: 'import-images/hammer.png', path: '/tmp/hammer-b.png' },
  ]);

  assert.equal((lookup.get('hammer') || []).length, 2);
  assert.equal((lookup.get('wrench') || []).length, 1);
});

test('resolveImportImageMatch reports missing and ambiguous matches clearly', () => {
  const lookup = buildImportImageLookup([
    { originalname: 'hammer.jpg', path: '/tmp/hammer-a.jpg' },
    { originalname: 'hammer.png', path: '/tmp/hammer-b.png' },
  ]);

  const missing = resolveImportImageMatch('wrench', lookup);
  assert.equal(missing.status, 'missing');

  const ambiguous = resolveImportImageMatch('hammer', lookup);
  assert.equal(ambiguous.status, 'ambiguous');
  assert.equal(ambiguous.matches.length, 2);
});

test('media processing service exports media-state upsert used by batch image imports', () => {
  assert.equal(
    typeof mediaProcessingService.upsertMediaStateByOriginalPath,
    'function'
  );
});

test('batch import synchronously creates transparent derivatives before attaching image', async (t) => {
  batchImportImageService.__resetBatchImportImageHandlersForTests();
  t.after(() => batchImportImageService.__resetBatchImportImageHandlersForTests());

  const sourceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dwc-batch-image-source-'));
  const sourcePath = path.join(sourceDir, 'transparent-cutout.png');
  await sharp({
    create: {
      width: 640,
      height: 400,
      channels: 4,
      background: { r: 20, g: 160, b: 220, alpha: 0.35 },
    },
  }).png().toFile(sourcePath);
  const sourceBytes = await fs.readFile(sourcePath);

  let attached = null;
  let retainedOriginalPath = '';
  batchImportImageService.__setBatchImportImageHandlersForTests({
    upsertMediaStateByOriginalPath: async (originalPath, update = {}) => {
      retainedOriginalPath = originalPath;
      return {
        mediaId: 'med_import_sync',
        originalPath,
        processingStatus: update.processingStatus || 'ready_for_processing',
      };
    },
    syncDerivedVariantsForMedia: async (originalPath) => {
      const baseName = path.parse(originalPath).name;
      const itemRoot = path.dirname(path.dirname(originalPath));
      const displayPath = path.join(itemRoot, 'display', `${baseName}.webp`);
      const thumbPath = path.join(itemRoot, 'thumb', `${baseName}.webp`);
      await Promise.all([
        fs.mkdir(path.dirname(displayPath), { recursive: true }),
        fs.mkdir(path.dirname(thumbPath), { recursive: true }),
      ]);
      await Promise.all([
        sharp(originalPath).resize({ width: 1600, height: 1600, fit: 'inside' }).webp().toFile(displayPath),
        sharp(originalPath).resize({ width: 320, height: 320, fit: 'inside' }).webp().toFile(thumbPath),
      ]);
      return {
        mediaId: 'med_import_sync',
        originalPath,
        displayPath,
        thumbPath,
        processingStatus: 'ready_for_processing',
      };
    },
    setItemImage: async (itemId, image) => {
      attached = { itemId, image };
      return { _id: itemId, image };
    },
  });

  t.after(async () => {
    await fs.rm(sourceDir, { recursive: true, force: true });
    if (retainedOriginalPath) {
      const baseName = path.parse(retainedOriginalPath).name;
      const itemRoot = path.dirname(path.dirname(retainedOriginalPath));
      await Promise.allSettled([
        fs.unlink(retainedOriginalPath),
        fs.unlink(path.join(itemRoot, 'display', `${baseName}.webp`)),
        fs.unlink(path.join(itemRoot, 'thumb', `${baseName}.webp`)),
      ]);
    }
  });

  const lookup = buildImportImageLookup([{
    originalname: 'transparent-cutout.png',
    path: sourcePath,
    mimetype: 'image/png',
  }]);
  const result = await attachBatchImportImageToItem({
    itemId: 'item_import_sync',
    imageKey: 'transparent-cutout',
    importImageLookup: lookup,
  });

  assert.equal(result.status, 'attached');
  assert.equal(attached.itemId, 'item_import_sync');
  assert.match(attached.image.thumb.url, /^\/media\/items\/thumb\//);
  assert.match(attached.image.display.url, /^\/media\/items\/display\//);
  assert.deepEqual(await fs.readFile(retainedOriginalPath), sourceBytes);
  const thumbMeta = await sharp(attached.image.thumb.storagePath
    ? path.join(MEDIA_ROOT, attached.image.thumb.storagePath)
    : '').metadata();
  assert.ok(thumbMeta.width <= 320);
  assert.equal(thumbMeta.hasAlpha, true);
});

test('batch import retains original but skips item attachment when derivatives fail', async (t) => {
  batchImportImageService.__resetBatchImportImageHandlersForTests();
  t.after(() => batchImportImageService.__resetBatchImportImageHandlersForTests());

  const sourceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dwc-batch-image-failure-'));
  const sourcePath = path.join(sourceDir, 'broken-derivative.png');
  await sharp({
    create: { width: 32, height: 32, channels: 4, background: { r: 1, g: 2, b: 3, alpha: 0.5 } },
  }).png().toFile(sourcePath);

  let retainedOriginalPath = '';
  let failedUpdate = null;
  let attachCalls = 0;
  batchImportImageService.__setBatchImportImageHandlersForTests({
    upsertMediaStateByOriginalPath: async (originalPath, update = {}) => {
      retainedOriginalPath = originalPath;
      if (update.processingStatus === 'failed') failedUpdate = update;
      return {
        mediaId: 'med_import_failed',
        originalPath,
        processingStatus: update.processingStatus || 'ready_for_processing',
      };
    },
    syncDerivedVariantsForMedia: async () => {
      const error = new Error('synthetic derivative failure');
      error.code = 'MEDIA_DERIVATIVE_SYNC_FAILED';
      throw error;
    },
    setItemImage: async () => {
      attachCalls += 1;
    },
  });

  t.after(async () => {
    await fs.rm(sourceDir, { recursive: true, force: true });
    if (retainedOriginalPath) await fs.rm(retainedOriginalPath, { force: true });
  });

  const result = await attachBatchImportImageToItem({
    itemId: 'item_import_failed',
    imageKey: 'broken-derivative',
    importImageLookup: buildImportImageLookup([{
      originalname: 'broken-derivative.png',
      path: sourcePath,
      mimetype: 'image/png',
    }]),
  });

  assert.equal(result.status, 'derivative_failed');
  assert.equal(result.mediaId, 'med_import_failed');
  assert.equal(result.processingStatus, 'failed');
  assert.equal(result.error.code, 'MEDIA_DERIVATIVE_SYNC_FAILED');
  assert.equal(attachCalls, 0);
  assert.equal(failedUpdate.processingStatus, 'failed');
  assert.equal((await fs.stat(retainedOriginalPath)).isFile(), true);
});
