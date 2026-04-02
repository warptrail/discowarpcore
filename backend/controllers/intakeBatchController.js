const {
  listIntakeBatches,
  getIntakeBatchById,
  createIntakeBatch,
  updateIntakeBatchAssets,
  validateIntakeBatch,
  stageIntakeBatch,
  importIntakeBatch,
  deleteIntakeBatch,
} = require('../services/intakeBatchService');

function logIntakeBatchControllerEvent(event, details = {}) {
  console.info(`[intakeBatchController] ${event}`, details);
}

function sendError(res, error, fallbackMessage) {
  return res.status(400).json({
    ok: false,
    error: error?.message || fallbackMessage,
  });
}

async function getIntakeBatchesApi(_req, res) {
  try {
    const batches = await listIntakeBatches();
    return res.status(200).json({ ok: true, batches });
  } catch (error) {
    return sendError(res, error, 'Failed to list intake batches.');
  }
}

async function getIntakeBatchApi(req, res) {
  try {
    const batch = await getIntakeBatchById(req.params.batchId);
    return res.status(200).json({ ok: true, batch });
  } catch (error) {
    return sendError(res, error, 'Failed to load intake batch.');
  }
}

async function postCreateIntakeBatchApi(req, res) {
  try {
    const batch = await createIntakeBatch({
      name: req.body?.name,
      uploadedFiles: req.files,
    });
    return res.status(201).json({ ok: true, batch });
  } catch (error) {
    return sendError(res, error, 'Failed to create intake batch.');
  }
}

async function postUpdateIntakeBatchAssetsApi(req, res) {
  try {
    const batch = await updateIntakeBatchAssets(req.params.batchId, req.files);
    return res.status(200).json({ ok: true, batch });
  } catch (error) {
    return sendError(res, error, 'Failed to update intake batch assets.');
  }
}

async function postValidateIntakeBatchApi(req, res) {
  try {
    const result = await validateIntakeBatch(req.params.batchId);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return sendError(res, error, 'Failed to validate intake batch.');
  }
}

async function postStageIntakeBatchApi(req, res) {
  try {
    const result = await stageIntakeBatch(req.params.batchId);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return sendError(res, error, 'Failed to stage intake batch.');
  }
}

async function postImportIntakeBatchApi(req, res) {
  const batchId = String(req.params?.batchId || '').trim();
  const startedAt = Date.now();
  logIntakeBatchControllerEvent('import request start', {
    batchId,
    method: req.method,
    url: req.originalUrl,
    pid: process.pid,
  });
  try {
    const result = await importIntakeBatch(batchId);
    const statusCode =
      result.importResult?.status === 'success'
        ? 201
        : result.importResult?.status === 'partial_success'
          ? 207
          : 400;
    logIntakeBatchControllerEvent('import request complete', {
      batchId,
      statusCode,
      importStatus: result.importResult?.status || '',
      durationMs: Date.now() - startedAt,
      pid: process.pid,
    });
    return res.status(statusCode).json({ ok: statusCode < 400, ...result });
  } catch (error) {
    logIntakeBatchControllerEvent('import request failed', {
      batchId,
      durationMs: Date.now() - startedAt,
      pid: process.pid,
      error: error?.message || 'Failed to import intake batch.',
    });
    return sendError(res, error, 'Failed to import intake batch.');
  }
}

async function deleteIntakeBatchApi(req, res) {
  try {
    const result = await deleteIntakeBatch(req.params.batchId);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return sendError(res, error, 'Failed to delete intake batch.');
  }
}

module.exports = {
  getIntakeBatchesApi,
  getIntakeBatchApi,
  postCreateIntakeBatchApi,
  postUpdateIntakeBatchAssetsApi,
  postValidateIntakeBatchApi,
  postStageIntakeBatchApi,
  postImportIntakeBatchApi,
  deleteIntakeBatchApi,
};
