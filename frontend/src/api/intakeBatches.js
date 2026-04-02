import { API_BASE } from './API_BASE';

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

async function readJson(response) {
  return response.json().catch(() => ({}));
}

function buildError(body, fallbackMessage, status) {
  const error = new Error(body?.error || body?.message || fallbackMessage);
  error.status = status;
  error.responseBody = body;
  return error;
}

function buildNetworkError(error, fallbackMessage, requestPath) {
  const next = new Error(
    `${fallbackMessage}. Backend API unavailable for ${requestPath}. Check the backend dev server and Vite proxy.`
  );
  next.cause = error;
  next.status = 0;
  next.isNetworkError = true;
  next.requestPath = requestPath;
  return next;
}

async function fetchJson(requestPath, options = {}, fallbackMessage = 'Request failed') {
  let response;
  try {
    response = await fetch(`${API_BASE}${requestPath}`, options);
  } catch (error) {
    throw buildNetworkError(error, fallbackMessage, requestPath);
  }

  const body = await readJson(response);
  if (!response.ok) {
    throw buildError(body, fallbackMessage, response.status);
  }
  return body;
}

function normalizeBatch(batch = {}) {
  return {
    id: toTrimmed(batch.id),
    batchDir: toTrimmed(batch.batchDir),
    name: toTrimmed(batch.name),
    createdAt: batch.createdAt || null,
    updatedAt: batch.updatedAt || null,
    importedAt: batch.importedAt || null,
    importStatus: toTrimmed(batch.importStatus) || 'not_imported',
    importResult: batch.importResult || null,
    hasJsonFile: Boolean(batch.hasJsonFile),
    hasCsvFile: Boolean(batch.hasCsvFile),
    hasCollageFile: Boolean(batch.hasCollageFile),
    hasMappingCsv: Boolean(batch.hasMappingCsv),
    originalImagesCount: Number(batch.originalImagesCount) || 0,
    stagedImagesCount: Number(batch.stagedImagesCount) || 0,
    validation:
      batch.validation && typeof batch.validation === 'object'
        ? {
            ok: Boolean(batch.validation.ok),
            errors: Array.isArray(batch.validation.errors) ? batch.validation.errors : [],
            totalItems: Number(batch.validation.totalItems) || 0,
            itemsWithImageKeysCount: Number(batch.validation.itemsWithImageKeysCount) || 0,
            csvSourceFilesCount: Number(batch.validation.csvSourceFilesCount) || 0,
            originalImageFilesCount: Number(batch.validation.originalImageFilesCount) || 0,
            validatedAt: batch.validation.validatedAt || null,
          }
        : null,
  };
}

function appendAsset(formData, fieldName, file) {
  if (!file) return;
  const fileName = file?.webkitRelativePath || file?.name || fieldName;
  formData.append(fieldName, file, fileName);
}

function appendImages(formData, files = []) {
  (Array.isArray(files) ? files : []).forEach((file) => {
    const fileName = file?.webkitRelativePath || file?.name || 'image';
    formData.append('images', file, fileName);
  });
}

export async function fetchIntakeBatches({ signal } = {}) {
  const body = await fetchJson('/api/intake-batches', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  }, 'Failed to load intake batches');
  return Array.isArray(body?.batches) ? body.batches.map(normalizeBatch) : [];
}

export async function createIntakeBatch(
  { name = '', imageFiles = [], jsonFile = null, csvFile = null, collageFile = null } = {},
  { signal } = {}
) {
  const formData = new FormData();
  if (toTrimmed(name)) formData.append('name', toTrimmed(name));
  appendImages(formData, imageFiles);
  appendAsset(formData, 'jsonFile', jsonFile);
  appendAsset(formData, 'csvFile', csvFile);
  appendAsset(formData, 'collageFile', collageFile);

  const body = await fetchJson('/api/intake-batches', {
    method: 'POST',
    body: formData,
    signal,
  }, 'Failed to create intake batch');
  return normalizeBatch(body?.batch || null);
}

export async function updateIntakeBatchAssets(
  batchId,
  { imageFiles = [], jsonFile = null, csvFile = null, collageFile = null } = {},
  { signal } = {}
) {
  const formData = new FormData();
  appendImages(formData, imageFiles);
  appendAsset(formData, 'jsonFile', jsonFile);
  appendAsset(formData, 'csvFile', csvFile);
  appendAsset(formData, 'collageFile', collageFile);

  const body = await fetchJson(`/api/intake-batches/${encodeURIComponent(batchId)}/assets`, {
    method: 'POST',
    body: formData,
    signal,
  }, 'Failed to update intake batch assets');
  return normalizeBatch(body?.batch || null);
}

async function postBatchAction(batchId, action, { signal } = {}) {
  const body = await fetchJson(`/api/intake-batches/${encodeURIComponent(batchId)}/${action}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    signal,
  }, `Failed to ${action} batch`);
  return {
    batch: normalizeBatch(body?.batch || null),
    validation: body?.validation || null,
    stageResult: body?.stageResult || null,
    importResult: body?.importResult || null,
  };
}

export function validateIntakeBatch(batchId, opts = {}) {
  return postBatchAction(batchId, 'validate', opts);
}

export function stageIntakeBatch(batchId, opts = {}) {
  return postBatchAction(batchId, 'stage', opts);
}

export function importIntakeBatch(batchId, opts = {}) {
  return postBatchAction(batchId, 'import', opts);
}

export async function deleteIntakeBatch(batchId, { signal } = {}) {
  const body = await fetchJson(`/api/intake-batches/${encodeURIComponent(batchId)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    signal,
  }, 'Failed to delete intake batch');
  return body;
}
