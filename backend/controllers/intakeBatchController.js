const {
  listIntakeBatches,
  getIntakeBatchById,
  createIntakeBatch,
  updateIntakeBatchAssets,
  updateIntakeBatchDestination,
  updateIntakeBatchName,
  validateIntakeBatch,
  stageIntakeBatch,
  importIntakeBatch,
  ingestIntakeBatchPackage,
  ingestIntakeBatchPackageArchiveFromFile,
  processIntakeBatchSelectedItems,
  deleteIntakeBatch,
  permanentlyDeleteIntakeBatch,
  recreateIntakeBatchLocalFolder,
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

function parsePositiveInt(value, fallback, { min = 1, max = 500 } = {}) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}

function parseNonNegativeInt(value, fallback, { min = 0, max = 1000000 } = {}) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}

function parseBooleanFlag(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

async function getIntakeBatchesApi(req, res) {
  try {
    const includeArchived =
      String(req.query?.includeArchived || '').trim().toLowerCase() === '1' ||
      String(req.query?.includeArchived || '').trim().toLowerCase() === 'true';
    const batches = await listIntakeBatches({ includeArchived });
    return res.status(200).json({ ok: true, batches });
  } catch (error) {
    return sendError(res, error, 'Failed to list intake batches.');
  }
}

async function getIntakeBatchApi(req, res) {
  try {
    const itemsLimit = parsePositiveInt(req.query?.itemsLimit, 50, { min: 1, max: 500 });
    const itemsOffset = parseNonNegativeInt(req.query?.itemsOffset, 0, { min: 0, max: 1000000 });
    const itemsSort = String(req.query?.itemsSort || '').trim().toLowerCase();
    const batch = await getIntakeBatchById(req.params.batchId, {
      includeImportedItems: true,
      importedItemsLimit: itemsLimit,
      importedItemsOffset: itemsOffset,
      importedItemsSort: itemsSort,
    });
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

async function postIngestIntakeBatchPackageApi(req, res) {
  try {
    const uploadedPackage = req.file;
    if (!uploadedPackage?.path) {
      throw new Error('packageFile zip upload is required.');
    }
    const result = await ingestIntakeBatchPackageArchiveFromFile(uploadedPackage.path, {
      originalPackageFilename: uploadedPackage.originalname,
    });
    return res.status(result?.ok ? 201 : 400).json(result);
  } catch (error) {
    return sendError(res, error, 'Failed to ingest intake batch package.');
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

async function postUpdateIntakeBatchDestinationApi(req, res) {
  try {
    const batch = await updateIntakeBatchDestination(req.params.batchId, {
      location: req.body?.location,
      box: req.body?.box,
    });
    return res.status(200).json({ ok: true, batch });
  } catch (error) {
    return sendError(res, error, 'Failed to update intake batch destination.');
  }
}

async function patchRenameIntakeBatchApi(req, res) {
  try {
    const batch = await updateIntakeBatchName(req.params.batchId, {
      name: req.body?.name,
    });
    return res.status(200).json({ ok: true, batch });
  } catch (error) {
    return sendError(res, error, 'Failed to rename intake batch.');
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

async function postProcessIntakeBatchSelectedItemsApi(req, res) {
  const batchId = String(req.params?.batchId || '').trim();
  try {
    const result = await processIntakeBatchSelectedItems(batchId, {
      itemIds: req.body?.itemIds,
      renderTokens: req.body?.renderTokens,
    });
    return res.status(202).json({ ok: true, ...result });
  } catch (error) {
    return sendError(res, error, 'Failed to queue selected batch items for processing.');
  }
}

async function deleteIntakeBatchApi(req, res) {
  try {
    const result = await deleteIntakeBatch(req.params.batchId);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return sendError(res, error, 'Failed to archive intake batch.');
  }
}

async function deleteIntakeBatchPermanentlyApi(req, res) {
  try {
    const result = await permanentlyDeleteIntakeBatch(req.params.batchId);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return sendError(res, error, 'Failed to permanently delete intake batch.');
  }
}

async function postRecreateIntakeBatchLocalFolderApi(req, res) {
  try {
    const result = await recreateIntakeBatchLocalFolder(req.params.batchId);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return sendError(res, error, 'Failed to recreate local staging folder.');
  }
}

module.exports = {
  getIntakeBatchesApi,
  getIntakeBatchApi,
  postIngestIntakeBatchPackageApi,
  postCreateIntakeBatchApi,
  postUpdateIntakeBatchAssetsApi,
  postUpdateIntakeBatchDestinationApi,
  patchRenameIntakeBatchApi,
  postValidateIntakeBatchApi,
  postStageIntakeBatchApi,
  postImportIntakeBatchApi,
  postIngestIntakeBatchPackageApi,
  postProcessIntakeBatchSelectedItemsApi,
  deleteIntakeBatchApi,
  deleteIntakeBatchPermanentlyApi,
  postRecreateIntakeBatchLocalFolderApi,
};
