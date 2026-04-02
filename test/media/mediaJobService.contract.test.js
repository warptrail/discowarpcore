const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { MEDIA_ERROR_CODES } = require('../../backend/services/mediaErrors');
const mediaJobService = require('../../backend/services/mediaJobService');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test('enqueue + polling completes queued media job', async (t) => {
  mediaJobService.__resetMediaJobServiceForTests();
  t.after(() => mediaJobService.__resetMediaJobServiceForTests());

  mediaJobService.__setMediaJobConfigForTests({
    concurrency: 1,
    maxQueueLength: 10,
  });

  const observed = {
    queueRenderTokens: null,
    processRenderTokens: null,
  };

  mediaJobService.__setMediaJobHandlersForTests({
    queueMediaProcessing: async (inputPath, outputPath, renderTokens) => {
      observed.queueRenderTokens = renderTokens;
      return {
        mediaId: 'med_a1',
        inputPath,
        outputPath: outputPath || `${inputPath}.webp`,
        renderTokens,
        processingState: {
          mediaId: 'med_a1',
          originalPath: inputPath,
          processedPath: outputPath || `${inputPath}.webp`,
          processingStatus: 'queued',
          renderTokens,
        },
      };
    },
    queueMediaProcessingById: async (mediaId, outputPath) => ({
      mediaId,
      inputPath: '/tmp/a.jpg',
      outputPath: outputPath || '/tmp/a.webp',
      processingState: {
        mediaId,
        originalPath: '/tmp/a.jpg',
        processedPath: outputPath || '/tmp/a.webp',
        processingStatus: 'queued',
      },
    }),
    processImageWithObjectGlow: async (inputPath, outputPath, options) => {
      observed.processRenderTokens = options?.renderTokens || null;
      await delay(10);
      return {
        result: {
          status: 'ok',
          inputPath,
          outputPath,
          renderTokens: options?.renderTokens || null,
        },
        processingState: {
          mediaId: 'med_a1',
          originalPath: inputPath,
          processedPath: outputPath,
          processingStatus: 'completed',
          renderTokens: options?.renderTokens || null,
        },
      };
    },
    processImageWithObjectGlowById: async (mediaId, outputPath, renderTokens) => {
      observed.processRenderTokens = renderTokens || null;
      await delay(10);
      return {
        result: {
          status: 'ok',
          inputPath: '/tmp/a.jpg',
          outputPath,
          renderTokens: renderTokens || null,
        },
        processingState: {
          mediaId,
          originalPath: '/tmp/a.jpg',
          processedPath: outputPath,
          processingStatus: 'completed',
          renderTokens: renderTokens || null,
        },
      };
    },
    getMediaStateByOriginalPath: async (originalPath) => ({
      mediaId: 'med_a1',
      originalPath,
      processingStatus: 'queued',
    }),
    getMediaStateById: async (mediaId) => ({
      mediaId,
      originalPath: '/tmp/a.jpg',
      processingStatus: 'queued',
    }),
  });

  const enqueue = await mediaJobService.enqueueMediaProcessingJob({
    inputPath: '/tmp/a.jpg',
    outputPath: '/tmp/a.webp',
    renderTokens: {
      background: 'midnight',
      glow: 'arc',
      accent: 'cyanCore',
    },
  });

  assert.equal(enqueue.job.status, 'queued');
  assert.equal(enqueue.job.operation, 'process_with_object_glow');
  assert.equal(enqueue.job.mediaId, 'med_a1');
  assert.deepEqual(enqueue.job.renderTokens, {
    mode: 'explicit',
    background: 'midnight',
    glow: 'arc',
    accent: 'cyanCore',
  });

  const idle = await mediaJobService.__waitForIdleForTests(2000);
  assert.equal(idle, true);

  const polled = await mediaJobService.getMediaJobStatus(enqueue.job.id);
  assert.equal(polled.job.status, 'completed');
  assert.equal(polled.job.attemptCount, 1);
  assert.equal(polled.job.mediaId, 'med_a1');
  assert.equal(polled.job.processingState.processingStatus, 'completed');
  assert.deepEqual(observed.queueRenderTokens, {
    mode: 'explicit',
    background: 'midnight',
    glow: 'arc',
    accent: 'cyanCore',
  });
  assert.deepEqual(observed.processRenderTokens, {
    mode: 'explicit',
    background: 'midnight',
    glow: 'arc',
    accent: 'cyanCore',
  });
});

test('enqueue rejects invalid render tokens with MEDIA_INVALID_INPUT', async (t) => {
  mediaJobService.__resetMediaJobServiceForTests();
  t.after(() => mediaJobService.__resetMediaJobServiceForTests());

  await assert.rejects(
    () => mediaJobService.enqueueMediaProcessingJob({
      inputPath: '/tmp/a.jpg',
      outputPath: '/tmp/a.webp',
      renderTokens: {
        background: 'not-a-real-token',
        glow: 'arc',
        accent: 'cyanCore',
      },
    }),
    (error) => {
      assert.equal(error.code, MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT);
      assert.match(String(error.message || ''), /Invalid background token/);
      return true;
    }
  );
});

test('enqueue accepts random render-token mode and preserves mode in job record', async (t) => {
  mediaJobService.__resetMediaJobServiceForTests();
  t.after(() => mediaJobService.__resetMediaJobServiceForTests());

  mediaJobService.__setMediaJobHandlersForTests({
    queueMediaProcessing: async (inputPath, outputPath, renderTokens) => ({
      mediaId: 'med_rand_1',
      inputPath,
      outputPath: outputPath || `${inputPath}.webp`,
      renderTokens,
      processingState: {
        mediaId: 'med_rand_1',
        originalPath: inputPath,
        processedPath: outputPath || `${inputPath}.webp`,
        processingStatus: 'queued',
        renderTokens,
      },
    }),
  });

  const enqueue = await mediaJobService.enqueueMediaProcessingJob({
    inputPath: '/tmp/random.jpg',
    outputPath: '/tmp/random.webp',
    renderTokens: {
      mode: 'random',
    },
  });

  assert.equal(enqueue.job.renderTokens.mode, 'random');
  assert.ok(enqueue.job.renderTokens.background);
  assert.ok(enqueue.job.renderTokens.glow);
  assert.ok(enqueue.job.renderTokens.accent);
});

test('worker concurrency is bounded', async (t) => {
  mediaJobService.__resetMediaJobServiceForTests();
  t.after(() => mediaJobService.__resetMediaJobServiceForTests());

  mediaJobService.__setMediaJobConfigForTests({
    concurrency: 2,
    maxQueueLength: 20,
  });

  let active = 0;
  let maxActive = 0;

  mediaJobService.__setMediaJobHandlersForTests({
    queueMediaProcessing: async (inputPath, outputPath) => ({
      mediaId: `med_${path.basename(inputPath, '.jpg')}`,
      inputPath,
      outputPath: outputPath || `${inputPath}.webp`,
      processingState: {
        mediaId: `med_${path.basename(inputPath, '.jpg')}`,
        originalPath: inputPath,
        processedPath: outputPath || `${inputPath}.webp`,
        processingStatus: 'queued',
      },
    }),
    processImageWithObjectGlowById: async (_mediaId, outputPath, _renderTokens) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await delay(25);
      active -= 1;
      return {
        result: { status: 'ok', inputPath: '/tmp/unused.jpg', outputPath },
        processingState: {
          mediaId: 'med_any',
          originalPath: '/tmp/unused.jpg',
          processedPath: outputPath,
          processingStatus: 'completed',
        },
      };
    },
    getMediaStateByOriginalPath: async (originalPath) => ({
      mediaId: `med_${path.basename(originalPath, '.jpg')}`,
      originalPath,
      processingStatus: 'queued',
    }),
    getMediaStateById: async (mediaId) => ({
      mediaId,
      originalPath: '/tmp/unused.jpg',
      processingStatus: 'queued',
    }),
  });

  await Promise.all(
    [1, 2, 3, 4, 5].map((index) =>
      mediaJobService.enqueueMediaProcessingJob({
        inputPath: `/tmp/c${index}.jpg`,
        outputPath: `/tmp/c${index}.webp`,
      })
    )
  );

  const idle = await mediaJobService.__waitForIdleForTests(4000);
  assert.equal(idle, true);
  assert.ok(maxActive <= 2);
});

test('queue rejects when max queue length is reached', async (t) => {
  mediaJobService.__resetMediaJobServiceForTests();
  t.after(() => mediaJobService.__resetMediaJobServiceForTests());

  mediaJobService.__setMediaJobConfigForTests({
    concurrency: 1,
    maxQueueLength: 1,
  });

  mediaJobService.__setMediaJobHandlersForTests({
    queueMediaProcessing: async (inputPath, outputPath) => ({
      mediaId: `med_${path.basename(inputPath, '.jpg')}`,
      inputPath,
      outputPath: outputPath || `${inputPath}.webp`,
      processingState: {
        mediaId: `med_${path.basename(inputPath, '.jpg')}`,
        originalPath: inputPath,
        processedPath: outputPath || `${inputPath}.webp`,
        processingStatus: 'queued',
      },
    }),
    processImageWithObjectGlow: async () => {
      await delay(100);
      return {
        result: { status: 'ok' },
        processingState: {
          processingStatus: 'completed',
        },
      };
    },
    getMediaStateByOriginalPath: async () => ({
      mediaId: 'med_any',
      processingStatus: 'queued',
    }),
    getMediaStateById: async (mediaId) => ({
      mediaId,
      originalPath: '/tmp/any.jpg',
      processingStatus: 'queued',
    }),
  });

  await mediaJobService.enqueueMediaProcessingJob({
    inputPath: '/tmp/q1.jpg',
    outputPath: '/tmp/q1.webp',
  });

  await assert.rejects(
    () =>
      mediaJobService.enqueueMediaProcessingJob({
        inputPath: '/tmp/q2.jpg',
        outputPath: '/tmp/q2.webp',
      }),
    (error) => {
      assert.equal(error.code, MEDIA_ERROR_CODES.MEDIA_JOB_QUEUE_FULL);
      return true;
    }
  );
});

test('enqueueMediaProcessingJobById dedupes by mediaId', async (t) => {
  mediaJobService.__resetMediaJobServiceForTests();
  t.after(() => mediaJobService.__resetMediaJobServiceForTests());

  mediaJobService.__setMediaJobConfigForTests({
    concurrency: 1,
    maxQueueLength: 10,
  });

  mediaJobService.__setMediaJobHandlersForTests({
    queueMediaProcessingById: async (mediaId, outputPath) => ({
      mediaId,
      inputPath: '/tmp/by-id.jpg',
      outputPath: outputPath || '/tmp/by-id.webp',
      processingState: {
        mediaId,
        originalPath: '/tmp/by-id.jpg',
        processedPath: outputPath || '/tmp/by-id.webp',
        processingStatus: 'queued',
      },
    }),
    processImageWithObjectGlowById: async () => {
      await delay(50);
      return {
        result: { status: 'ok' },
        processingState: {
          mediaId: 'med_dedupe',
          originalPath: '/tmp/by-id.jpg',
          processedPath: '/tmp/by-id.webp',
          processingStatus: 'completed',
        },
      };
    },
    getMediaStateById: async (mediaId) => ({
      mediaId,
      originalPath: '/tmp/by-id.jpg',
      processingStatus: 'queued',
    }),
  });

  const first = await mediaJobService.enqueueMediaProcessingJobById('med_dedupe', '/tmp/by-id.webp');
  const second = await mediaJobService.enqueueMediaProcessingJobById('med_dedupe', '/tmp/by-id.webp');

  assert.equal(first.job.id, second.job.id);
});
