const MediaState = require('../models/MediaState');
const { enqueueMediaProcessingJobById } = require('./mediaJobService');

function toPositiveInteger(value, fallback, { min = 1, max = 500 } = {}) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}

let mediaStateModel = MediaState;
let enqueueMediaProcessingJobByIdRunner = enqueueMediaProcessingJobById;

async function getBatchImportReadySummary() {
  const readyCount = await mediaStateModel.countDocuments({
    sourceType: 'batch_import',
    processingStatus: 'ready_for_processing',
  });

  return {
    sourceType: 'batch_import',
    processingStatus: 'ready_for_processing',
    readyCount,
  };
}

async function enqueueBatchImportReadyMedia({ limit } = {}) {
  const safeLimit = toPositiveInteger(limit, 50, { min: 1, max: 500 });
  const records = await mediaStateModel.find({
    sourceType: 'batch_import',
    processingStatus: 'ready_for_processing',
  })
    .sort({ createdAt: 1, _id: 1 })
    .limit(safeLimit)
    .lean();

  let queuedCount = 0;
  let failedCount = 0;
  const jobIds = [];

  for (const record of records) {
    try {
      const queued = await enqueueMediaProcessingJobByIdRunner(record.mediaId);
      if (queued?.job?.id) {
        jobIds.push(queued.job.id);
      }
      queuedCount += 1;
    } catch {
      failedCount += 1;
    }
  }

  const readyCountRemaining = await mediaStateModel.countDocuments({
    sourceType: 'batch_import',
    processingStatus: 'ready_for_processing',
  });

  return {
    requestedCount: records.length,
    queuedCount,
    failedCount,
    jobIds,
    readyCountRemaining,
  };
}

function __setBatchImportedMediaHandlersForTests(handlers = {}) {
  if (handlers.mediaStateModel) {
    mediaStateModel = handlers.mediaStateModel;
  }
  if (typeof handlers.enqueueMediaProcessingJobById === 'function') {
    enqueueMediaProcessingJobByIdRunner = handlers.enqueueMediaProcessingJobById;
  }
}

function __resetBatchImportedMediaHandlersForTests() {
  mediaStateModel = MediaState;
  enqueueMediaProcessingJobByIdRunner = enqueueMediaProcessingJobById;
}

module.exports = {
  getBatchImportReadySummary,
  enqueueBatchImportReadyMedia,
  __setBatchImportedMediaHandlersForTests,
  __resetBatchImportedMediaHandlersForTests,
};
