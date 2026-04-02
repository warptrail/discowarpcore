const test = require('node:test');
const assert = require('node:assert/strict');

const batchImportedMediaService = require('../../backend/services/batchImportedMediaService');

test('batch-import ready summary counts ready_for_processing images', async (t) => {
  batchImportedMediaService.__resetBatchImportedMediaHandlersForTests();
  t.after(() => batchImportedMediaService.__resetBatchImportedMediaHandlersForTests());

  batchImportedMediaService.__setBatchImportedMediaHandlersForTests({
    mediaStateModel: {
      countDocuments: async (query) => {
        assert.deepEqual(query, {
          sourceType: 'batch_import',
          processingStatus: 'ready_for_processing',
        });
        return 3;
      },
    },
  });

  const summary = await batchImportedMediaService.getBatchImportReadySummary();
  assert.equal(summary.readyCount, 3);
  assert.equal(summary.sourceType, 'batch_import');
  assert.equal(summary.processingStatus, 'ready_for_processing');
});

test('batch-import process-ready enqueues ready media and reports remaining count', async (t) => {
  batchImportedMediaService.__resetBatchImportedMediaHandlersForTests();
  t.after(() => batchImportedMediaService.__resetBatchImportedMediaHandlersForTests());

  const calls = [];
  batchImportedMediaService.__setBatchImportedMediaHandlersForTests({
    mediaStateModel: {
      countDocuments: async () => 0,
      find() {
        return {
          sort() {
            return {
              limit() {
                return {
                  lean: async () => ([
                    { mediaId: 'med_batch_1' },
                    { mediaId: 'med_batch_2' },
                  ]),
                };
              },
            };
          },
        };
      },
    },
    enqueueMediaProcessingJobById: async (mediaId) => {
      calls.push(mediaId);
      return {
        job: { id: `job_${mediaId}` },
      };
    },
  });

  const result = await batchImportedMediaService.enqueueBatchImportReadyMedia({
    limit: 10,
  });

  assert.deepEqual(calls, ['med_batch_1', 'med_batch_2']);
  assert.equal(result.requestedCount, 2);
  assert.equal(result.queuedCount, 2);
  assert.equal(result.failedCount, 0);
  assert.equal(result.readyCountRemaining, 0);
  assert.deepEqual(result.jobIds, ['job_med_batch_1', 'job_med_batch_2']);
});
