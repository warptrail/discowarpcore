const test = require('node:test');
const assert = require('node:assert/strict');

const entityMediaService = require('../../backend/services/entityMediaService');
const {
  postItemProcessImageApi,
  getItemMediaStatusApi,
  patchItemActiveVariantApi,
} = require('../../backend/controllers/entityMediaController');

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('item media resolution prefers mediaId lookup when present', async (t) => {
  entityMediaService.__resetEntityMediaHandlersForTests();
  t.after(() => entityMediaService.__resetEntityMediaHandlersForTests());

  entityMediaService.__setEntityMediaHandlersForTests({
    loadItemById: async () => ({
      _id: '507f191e810c19729de860ea',
      image: {
        mediaId: 'med_item_1',
        original: { storagePath: 'items/original/item-1.jpg' },
      },
      imagePath: '',
    }),
    getMediaStateById: async (mediaId) => ({
      mediaId,
      originalPath: '/tmp/items/original/item-1.jpg',
      processedPath: '/tmp/items/processed/item-1.webp',
      displayPath: '/tmp/items/display/item-1.webp',
      thumbPath: '/tmp/items/thumb/item-1.webp',
      activeVariant: 'processed',
      processingStatus: 'completed',
      processingError: null,
      processedAt: '2026-03-31T00:00:00.000Z',
    }),
    getMediaStateByOriginalPath: async () => {
      throw new Error('unexpected originalPath lookup');
    },
  });

  const state = await entityMediaService.getItemMediaState('507f191e810c19729de860ea');
  assert.equal(state.mediaId, 'med_item_1');
  assert.equal(state.processingStatus, 'completed');
  assert.equal(state.activeVariant, 'processed');
});

test('POST item process-image endpoint enqueues media job with mediaId', async (t) => {
  entityMediaService.__resetEntityMediaHandlersForTests();
  t.after(() => entityMediaService.__resetEntityMediaHandlersForTests());

  const updates = [];
  const seenRenderTokens = [];

  entityMediaService.__setEntityMediaHandlersForTests({
    loadItemById: async () => ({
      _id: '507f191e810c19729de860eb',
      image: {
        mediaId: '',
        original: { storagePath: 'items/original/item-2.jpg' },
      },
      imagePath: '',
    }),
    getMediaStateById: async () => null,
    getMediaStateByOriginalPath: async () => null,
    ensureMediaStateByOriginalPath: async () => ({
      mediaId: 'med_item_2',
      originalPath: '/tmp/items/original/item-2.jpg',
      processedPath: '',
      displayPath: '',
      thumbPath: '',
      activeVariant: 'original',
      processingStatus: 'idle',
      processingError: null,
      processedAt: null,
    }),
    setItemMediaId: async (itemId, mediaId) => {
      updates.push({ itemId, mediaId });
    },
    enqueueMediaProcessingJobById: async (mediaId, _outputPath, renderTokens) => {
      seenRenderTokens.push(renderTokens);
      return {
        job: {
          id: 'job_item_2',
          mediaId,
          renderTokens,
          processingState: { processingStatus: 'queued' },
        },
        queueStatus: { queuedCount: 1, activeWorkers: 0 },
      };
    },
  });

  const req = {
    params: { itemId: '507f191e810c19729de860eb' },
    body: {
      renderTokens: {
        background: 'midnight',
        glow: 'arc',
        accent: 'cyanCore',
      },
    },
  };
  const res = createMockRes();
  await postItemProcessImageApi(req, res);

  assert.equal(res.statusCode, 202);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.data.mediaId, 'med_item_2');
  assert.equal(res.body.data.jobId, 'job_item_2');
  assert.equal(res.body.data.processingStatus, 'queued');
  assert.deepEqual(res.body.data.renderTokens, {
    mode: 'explicit',
    background: 'midnight',
    glow: 'arc',
    accent: 'cyanCore',
  });
  assert.equal(updates.length, 1);
  assert.deepEqual(seenRenderTokens[0], {
    background: 'midnight',
    glow: 'arc',
    accent: 'cyanCore',
  });
  assert.deepEqual(updates[0], {
    itemId: '507f191e810c19729de860eb',
    mediaId: 'med_item_2',
  });
});

test('item media-status response includes frontend polling fields', async (t) => {
  entityMediaService.__resetEntityMediaHandlersForTests();
  t.after(() => entityMediaService.__resetEntityMediaHandlersForTests());

  entityMediaService.__setEntityMediaHandlersForTests({
    loadItemById: async () => ({
      _id: '507f191e810c19729de860ec',
      image: {
        mediaId: 'med_item_3',
        original: { storagePath: 'items/original/item-3.jpg' },
      },
      imagePath: '',
    }),
    getMediaStateById: async () => ({
      mediaId: 'med_item_3',
      originalPath: '/tmp/items/original/item-3.jpg',
      processedPath: '/tmp/items/processed/item-3.webp',
      displayPath: '/tmp/items/display/item-3.webp',
      thumbPath: '/tmp/items/thumb/item-3.webp',
      activeVariant: 'processed',
      processingStatus: 'completed',
      processingError: null,
      processedAt: '2026-03-31T00:00:00.000Z',
    }),
  });

  const req = {
    params: { itemId: '507f191e810c19729de860ec' },
  };
  const res = createMockRes();
  await getItemMediaStatusApi(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.deepEqual(Object.keys(res.body.data).sort(), [
    'activeVariant',
    'displayPath',
    'mediaId',
    'originalPath',
    'processedAt',
    'processedPath',
    'processingError',
    'processingStatus',
    'renderTokens',
    'thumbPath',
  ]);
});

test('legacy path-based entity records can enqueue via resolved mediaId', async (t) => {
  entityMediaService.__resetEntityMediaHandlersForTests();
  t.after(() => entityMediaService.__resetEntityMediaHandlersForTests());

  const calls = {
    byPath: 0,
    ensured: 0,
    enqueuedMediaId: '',
    setMediaId: 0,
  };

  entityMediaService.__setEntityMediaHandlersForTests({
    loadItemById: async () => ({
      _id: '507f191e810c19729de860ed',
      image: {
        mediaId: '',
        original: { storagePath: 'items/original/legacy.jpg' },
      },
      imagePath: '',
    }),
    getMediaStateById: async () => null,
    getMediaStateByOriginalPath: async () => {
      calls.byPath += 1;
      return {
        mediaId: 'med_legacy_1',
        originalPath: '/tmp/items/original/legacy.jpg',
        processedPath: '/tmp/items/processed/legacy.webp',
        displayPath: '/tmp/items/display/legacy.webp',
        thumbPath: '/tmp/items/thumb/legacy.webp',
        activeVariant: 'processed',
        processingStatus: 'completed',
        processingError: null,
        processedAt: '2026-03-31T00:00:00.000Z',
      };
    },
    ensureMediaStateByOriginalPath: async () => {
      calls.ensured += 1;
      throw new Error('unexpected ensureMediaStateByOriginalPath call');
    },
    setItemMediaId: async () => {
      calls.setMediaId += 1;
    },
    enqueueMediaProcessingJobById: async (mediaId) => {
      calls.enqueuedMediaId = mediaId;
      return {
        job: {
          id: 'job_legacy_1',
          mediaId,
          processingState: { processingStatus: 'queued' },
        },
        queueStatus: { queuedCount: 1 },
      };
    },
  });

  const result = await entityMediaService.enqueueItemMediaProcessing(
    '507f191e810c19729de860ed'
  );

  assert.equal(result.mediaId, 'med_legacy_1');
  assert.equal(result.jobId, 'job_legacy_1');
  assert.equal(result.processingStatus, 'queued');
  assert.equal(calls.byPath, 1);
  assert.equal(calls.ensured, 0);
  assert.equal(calls.enqueuedMediaId, 'med_legacy_1');
  assert.equal(calls.setMediaId, 1);
});

test('PATCH item active-variant switches to processed when available', async (t) => {
  entityMediaService.__resetEntityMediaHandlersForTests();
  t.after(() => entityMediaService.__resetEntityMediaHandlersForTests());

  entityMediaService.__setEntityMediaHandlersForTests({
    loadItemById: async () => ({
      _id: '507f191e810c19729de860ef',
      image: {
        mediaId: 'med_variant_1',
        original: { storagePath: 'items/original/item-variant.jpg' },
      },
      imagePath: '',
    }),
    getMediaStateById: async () => ({
      mediaId: 'med_variant_1',
      originalPath: '/tmp/items/original/item-variant.jpg',
      processedPath: '/tmp/items/processed/item-variant.webp',
      displayPath: '/tmp/items/display/item-variant.webp',
      thumbPath: '/tmp/items/thumb/item-variant.webp',
      activeVariant: 'original',
      processingStatus: 'completed',
      processingError: null,
      processedAt: '2026-03-31T00:00:00.000Z',
    }),
    setActiveVariantById: async () => ({
      mediaId: 'med_variant_1',
      originalPath: '/tmp/items/original/item-variant.jpg',
      processedPath: '/tmp/items/processed/item-variant.webp',
      displayPath: '/tmp/items/display/item-variant.webp',
      thumbPath: '/tmp/items/thumb/item-variant.webp',
      activeVariant: 'processed',
      processingStatus: 'completed',
      processingError: null,
      processedAt: '2026-03-31T00:00:00.000Z',
    }),
  });

  const req = {
    params: { itemId: '507f191e810c19729de860ef' },
    body: { activeVariant: 'processed' },
  };
  const res = createMockRes();
  await patchItemActiveVariantApi(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.data.activeVariant, 'processed');
});

test('item media processing resolves source from image.original.storagePath before imagePath', async (t) => {
  entityMediaService.__resetEntityMediaHandlersForTests();
  t.after(() => entityMediaService.__resetEntityMediaHandlersForTests());

  const calls = {
    byPath: [],
    ensurePath: '',
  };

  entityMediaService.__setEntityMediaHandlersForTests({
    loadItemById: async () => ({
      _id: '507f191e810c19729de860f0',
      image: {
        mediaId: '',
        original: { storagePath: 'items/original/hammer-landscape.jpg' },
      },
      imagePath: '/media/items/display/hammer-square.webp',
    }),
    getMediaStateById: async () => null,
    getMediaStateByOriginalPath: async (originalPath) => {
      calls.byPath.push(originalPath);
      return null;
    },
    ensureMediaStateByOriginalPath: async (originalPath) => {
      calls.ensurePath = originalPath;
      return {
        mediaId: 'med_hammer_1',
        originalPath,
        processedPath: '',
        displayPath: '',
        thumbPath: '',
        activeVariant: 'original',
        processingStatus: 'idle',
        processingError: null,
        processedAt: null,
      };
    },
    setItemMediaId: async () => {},
    enqueueMediaProcessingJobById: async () => ({
      job: {
        id: 'job_hammer_1',
        mediaId: 'med_hammer_1',
        processingState: { processingStatus: 'queued' },
      },
      queueStatus: { queuedCount: 1 },
    }),
  });

  const result = await entityMediaService.enqueueItemMediaProcessing(
    '507f191e810c19729de860f0'
  );

  assert.equal(result.mediaId, 'med_hammer_1');
  assert.equal(calls.ensurePath, 'items/original/hammer-landscape.jpg');
  assert.equal(calls.byPath[0], 'items/original/hammer-landscape.jpg');
});
