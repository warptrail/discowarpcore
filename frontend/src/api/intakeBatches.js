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

function normalizeImportedBatchItem(entry = {}) {
  const processing =
    entry.processing && typeof entry.processing === 'object'
      ? {
          status: toTrimmed(entry.processing.status) || 'not_requested',
          mediaStatus: toTrimmed(entry.processing.mediaStatus) || 'ready_for_processing',
          isProcessable: Boolean(entry.processing.isProcessable),
          isProcessed: Boolean(entry.processing.isProcessed),
          isUnavailable: Boolean(entry.processing.isUnavailable),
          isInFlight: Boolean(entry.processing.isInFlight),
          canRetry: Boolean(entry.processing.canRetry),
          sourceType: toTrimmed(entry.processing.sourceType),
          processedAt: entry.processing.processedAt || null,
          processingError: entry.processing.processingError || null,
          activeVariant: toTrimmed(entry.processing.activeVariant),
          hasProcessedOutput: Boolean(entry.processing.hasProcessedOutput),
          processedUrl: toTrimmed(entry.processing.processedUrl),
        }
      : {
          status: 'not_requested',
          mediaStatus: 'ready_for_processing',
          isProcessable: false,
          isProcessed: false,
          isUnavailable: false,
          isInFlight: false,
          canRetry: false,
          sourceType: '',
          processedAt: null,
          processingError: null,
          activeVariant: '',
          hasProcessedOutput: false,
          processedUrl: '',
        };

  return {
    id: toTrimmed(entry.id),
    name: toTrimmed(entry.name),
    location: toTrimmed(entry.location),
    itemStatus: toTrimmed(entry.itemStatus) || 'active',
    orphanedAt: entry.orphanedAt || null,
    createdAt: entry.createdAt || null,
    updatedAt: entry.updatedAt || null,
    currentBox:
      entry.currentBox && typeof entry.currentBox === 'object'
        ? {
            id: toTrimmed(entry.currentBox.id),
            boxId: toTrimmed(entry.currentBox.boxId),
            label: toTrimmed(entry.currentBox.label),
          }
        : null,
    sourceBatchId: toTrimmed(entry.sourceBatchId),
    image:
      entry.image && typeof entry.image === 'object'
        ? {
            mediaId: toTrimmed(entry.image.mediaId),
            originalName: toTrimmed(entry.image.originalName),
            originalUrl: toTrimmed(entry.image.originalUrl),
            displayUrl: toTrimmed(entry.image.displayUrl),
            thumbUrl: toTrimmed(entry.image.thumbUrl),
            preferredUrl: toTrimmed(entry.image.preferredUrl),
          }
        : {
            mediaId: '',
            originalName: '',
            originalUrl: '',
            displayUrl: '',
            thumbUrl: '',
            preferredUrl: '',
          },
    processing,
  };
}

function normalizeImportedItemsPage(page = {}, fallbackItems = []) {
  const rawItems = Array.isArray(page?.items)
    ? page.items
    : Array.isArray(fallbackItems)
      ? fallbackItems
      : [];
  const items = rawItems.map(normalizeImportedBatchItem);
  const total =
    page?.total != null
      ? Number(page.total) || 0
      : items.length;
  const limit =
    page?.limit != null
      ? Number(page.limit) || 0
      : items.length;
  const offset = page?.offset != null ? Number(page.offset) || 0 : 0;

  return {
    items,
    total,
    limit,
    offset,
    hasMore: page?.hasMore != null ? Boolean(page.hasMore) : offset + items.length < total,
    sort: toTrimmed(page?.sort) || 'name',
  };
}

function normalizeBatch(batch = {}) {
  const importedItemsPage = normalizeImportedItemsPage(batch.importedItemsPage, batch.importedItems);
  const importedItems = importedItemsPage.items;
  const sourceManifest =
    batch.sourceManifest && typeof batch.sourceManifest === 'object'
      ? {
          aiJsonOriginalFilename: toTrimmed(batch.sourceManifest.aiJsonOriginalFilename),
          mappingCsvOriginalFilename: toTrimmed(batch.sourceManifest.mappingCsvOriginalFilename),
          collageOriginalFilename: toTrimmed(batch.sourceManifest.collageOriginalFilename),
          imageOriginalFilenames: Array.isArray(batch.sourceManifest.imageOriginalFilenames)
            ? batch.sourceManifest.imageOriginalFilenames
                .map((entry) => toTrimmed(entry))
                .filter(Boolean)
            : [],
          imageCount: Number(batch.sourceManifest.imageCount) || 0,
          imagesIncluded: Boolean(batch.sourceManifest.imagesIncluded),
          storedFilePaths:
            batch.sourceManifest.storedFilePaths &&
            typeof batch.sourceManifest.storedFilePaths === 'object'
              ? { ...batch.sourceManifest.storedFilePaths }
              : {},
        }
      : {
          aiJsonOriginalFilename: '',
          mappingCsvOriginalFilename: '',
          collageOriginalFilename: '',
          imageOriginalFilenames: [],
          imageCount: 0,
          imagesIncluded: false,
          storedFilePaths: {},
        };

  const validationSnapshot =
    batch.validationSnapshot && typeof batch.validationSnapshot === 'object'
      ? {
          status: toTrimmed(batch.validationSnapshot.status) || 'not_validated',
          validatedAt: batch.validationSnapshot.validatedAt || null,
          totalItems: Number(batch.validationSnapshot.totalItems) || 0,
          itemsWithImageKeysCount: Number(batch.validationSnapshot.itemsWithImageKeysCount) || 0,
          rowCount: Number(batch.validationSnapshot.rowCount) || 0,
          readyCount: Number(batch.validationSnapshot.readyCount) || 0,
          missingCount: Number(batch.validationSnapshot.missingCount) || 0,
          ambiguousCount: Number(batch.validationSnapshot.ambiguousCount) || 0,
          warningCount: Number(batch.validationSnapshot.warningCount) || 0,
          errorCount: Number(batch.validationSnapshot.errorCount) || 0,
          csvSourceFilesCount: Number(batch.validationSnapshot.csvSourceFilesCount) || 0,
          originalImageFilesCount: Number(batch.validationSnapshot.originalImageFilesCount) || 0,
          validationErrors: Array.isArray(batch.validationSnapshot.validationErrors)
            ? batch.validationSnapshot.validationErrors
            : [],
          validationWarnings: Array.isArray(batch.validationSnapshot.validationWarnings)
            ? batch.validationSnapshot.validationWarnings
            : [],
        }
      : {
          status: 'not_validated',
          validatedAt: null,
          totalItems: 0,
          itemsWithImageKeysCount: 0,
          rowCount: 0,
          readyCount: 0,
          missingCount: 0,
          ambiguousCount: 0,
          warningCount: 0,
          errorCount: 0,
          csvSourceFilesCount: 0,
          originalImageFilesCount: 0,
          validationErrors: [],
          validationWarnings: [],
        };

  const importSnapshot =
    batch.importSnapshot && typeof batch.importSnapshot === 'object'
      ? {
          status: toTrimmed(batch.importSnapshot.status) || 'not_imported',
          importedAt: batch.importSnapshot.importedAt || null,
          createdItemCount: Number(batch.importSnapshot.createdItemCount) || 0,
          updatedItemCount: Number(batch.importSnapshot.updatedItemCount) || 0,
          skippedItemCount: Number(batch.importSnapshot.skippedItemCount) || 0,
          failedItemCount: Number(batch.importSnapshot.failedItemCount) || 0,
          importedItemIds: Array.isArray(batch.importSnapshot.importedItemIds)
            ? batch.importSnapshot.importedItemIds
            : [],
          importErrorSummary: toTrimmed(batch.importSnapshot.importErrorSummary),
        }
      : {
          status: 'not_imported',
          importedAt: null,
          createdItemCount: 0,
          updatedItemCount: 0,
          skippedItemCount: 0,
          failedItemCount: 0,
          importedItemIds: [],
          importErrorSummary: '',
        };

  const processingSummary =
    batch.processingSummary && typeof batch.processingSummary === 'object'
      ? {
          status: toTrimmed(batch.processingSummary.status) || 'not_requested',
          queuedCount: Number(batch.processingSummary.queuedCount) || 0,
          completedCount: Number(batch.processingSummary.completedCount) || 0,
          failedCount: Number(batch.processingSummary.failedCount) || 0,
          lastRequestedAt: batch.processingSummary.lastRequestedAt || null,
        }
      : {
          status: 'not_requested',
          queuedCount: 0,
          completedCount: 0,
          failedCount: 0,
          lastRequestedAt: null,
        };

  const archiveState =
    batch.archiveState && typeof batch.archiveState === 'object'
      ? {
          status: toTrimmed(batch.archiveState.status) || 'active',
          archivedAt: batch.archiveState.archivedAt || null,
          archiveReason: toTrimmed(batch.archiveState.archiveReason),
          sourceFilesDeletedAt: batch.archiveState.sourceFilesDeletedAt || null,
        }
      : {
          status: 'active',
          archivedAt: null,
          archiveReason: '',
          sourceFilesDeletedAt: null,
      };

  const localReceipt =
    batch.localReceipt && typeof batch.localReceipt === 'object'
      ? {
          path: toTrimmed(batch.localReceipt.path),
          app: toTrimmed(batch.localReceipt.app),
          receiptVersion: Number(batch.localReceipt.receiptVersion) || 0,
          batchFolderName: toTrimmed(batch.localReceipt.batchFolderName),
          status: toTrimmed(batch.localReceipt.status),
          safeToDelete: Boolean(batch.localReceipt.safeToDelete),
          validatedAt: batch.localReceipt.validatedAt || null,
          importedAt: batch.localReceipt.importedAt || null,
          batchRecordId: toTrimmed(batch.localReceipt.batchRecordId),
          batchLabel: toTrimmed(batch.localReceipt.batchLabel),
          productionTarget: toTrimmed(batch.localReceipt.productionTarget),
          summaryCounts:
            batch.localReceipt.summaryCounts && typeof batch.localReceipt.summaryCounts === 'object'
              ? { ...batch.localReceipt.summaryCounts }
              : {},
          updatedAt: batch.localReceipt.updatedAt || null,
        }
      : null;

  const packageSnapshot =
    batch.packageSnapshot && typeof batch.packageSnapshot === 'object'
      ? {
          ingestedAt: batch.packageSnapshot.ingestedAt || null,
          originalPackageFilename: toTrimmed(batch.packageSnapshot.originalPackageFilename),
          manifest:
            batch.packageSnapshot.manifest && typeof batch.packageSnapshot.manifest === 'object'
              ? { ...batch.packageSnapshot.manifest }
              : null,
          structureSummary:
            batch.packageSnapshot.structureSummary &&
            typeof batch.packageSnapshot.structureSummary === 'object'
              ? { ...batch.packageSnapshot.structureSummary }
              : null,
        }
      : null;
  const packageStructureSummary =
    packageSnapshot?.structureSummary && typeof packageSnapshot.structureSummary === 'object'
      ? packageSnapshot.structureSummary
      : null;

  const hasImageCount =
    Number(sourceManifest.imageCount) > 0
    || Number(batch.originalImagesCount) > 0
    || Number(packageStructureSummary?.imageCount) > 0;
  const imagesIncluded =
    batch.imagesIncluded != null
      ? Boolean(batch.imagesIncluded)
      : sourceManifest.imagesIncluded != null
        ? Boolean(sourceManifest.imagesIncluded)
        : packageStructureSummary?.imagesIncluded != null
          ? Boolean(packageStructureSummary.imagesIncluded)
        : hasImageCount;
  const aiJsonPresent =
    batch.aiJsonPresent != null
      ? Boolean(batch.aiJsonPresent)
      : Boolean(sourceManifest.aiJsonOriginalFilename)
        || Boolean(batch.hasJsonFile)
        || Boolean(packageStructureSummary?.hasAiJson);
  const mappingCsvPresent =
    batch.mappingCsvPresent != null
      ? Boolean(batch.mappingCsvPresent)
      : Boolean(sourceManifest.mappingCsvOriginalFilename)
        || Boolean(batch.hasCsvFile)
        || Boolean(packageStructureSummary?.hasMappingCsv);

  return {
    id: toTrimmed(batch.id),
    batchId: toTrimmed(batch.batchId || batch.id),
    batchDir: toTrimmed(batch.batchDir),
    name: toTrimmed(batch.name),
    batchName: toTrimmed(batch.batchName || batch.name),
    createdAt: batch.createdAt || null,
    updatedAt: batch.updatedAt || null,
    importedAt: batch.importedAt || null,
    importStatus: toTrimmed(batch.importStatus) || 'not_imported',
    importLifecycleStatus: toTrimmed(batch.importLifecycleStatus) || importSnapshot.status,
    validationStatus: toTrimmed(batch.validationStatus) || validationSnapshot.status,
    imagesIncluded,
    aiJsonPresent,
    mappingCsvPresent,
    mappingRequired: Boolean(batch.mappingRequired),
    importResult: batch.importResult || null,
    archiveState,
    isArchived: archiveState.status === 'archived',
    hasJsonFile: Boolean(batch.hasJsonFile),
    hasCsvFile: Boolean(batch.hasCsvFile),
    hasMappingCsv: Boolean(batch.hasMappingCsv),
    originalImagesCount: Number(batch.originalImagesCount) || 0,
    stagedImagesCount: Number(batch.stagedImagesCount) || 0,
    localFolderPresent: batch.localFolderPresent != null ? Boolean(batch.localFolderPresent) : true,
    localFolderMissing: batch.localFolderMissing != null ? Boolean(batch.localFolderMissing) : false,
    localReceipt,
    packageSnapshot,
    localFolderName: toTrimmed(batch.localFolderName),
    localFolderPath: toTrimmed(batch.localFolderPath),
    sourceManifest,
    validationSnapshot,
    importSnapshot,
    processingSummary,
    importedItemsPage,
    importedItems,
    importedItemCount:
      batch.importedItemCount != null
        ? Number(batch.importedItemCount) || 0
        : importedItemsPage.total,
    validation:
      batch.validation && typeof batch.validation === 'object'
        ? {
            ok: Boolean(batch.validation.ok),
            errors: Array.isArray(batch.validation.errors) ? batch.validation.errors : [],
            validationWarnings: Array.isArray(batch.validation.validationWarnings)
              ? batch.validation.validationWarnings
              : Array.isArray(batch.validation.warnings)
                ? batch.validation.warnings
                : [],
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

export async function fetchIntakeBatches({ signal, includeArchived = false } = {}) {
  const params = new URLSearchParams();
  if (includeArchived) params.set('includeArchived', 'true');
  const requestPath = `/api/intake-batches${params.toString() ? `?${params.toString()}` : ''}`;
  const body = await fetchJson(requestPath, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  }, 'Failed to load intake batches');
  return Array.isArray(body?.batches) ? body.batches.map(normalizeBatch) : [];
}

export async function fetchIntakeBatchById(
  batchId,
  {
    signal,
    itemsLimit = 50,
    itemsOffset = 0,
    itemsSort = 'name',
  } = {}
) {
  const normalizedBatchId = toTrimmed(batchId);
  if (!normalizedBatchId) throw new Error('batchId is required');
  const params = new URLSearchParams();
  params.set('itemsLimit', String(Number(itemsLimit) || 50));
  params.set('itemsOffset', String(Number(itemsOffset) || 0));
  params.set('itemsSort', toTrimmed(itemsSort) || 'name');
  const requestPath = `/api/intake-batches/${encodeURIComponent(normalizedBatchId)}${
    params.toString() ? `?${params.toString()}` : ''
  }`;

  const body = await fetchJson(
    requestPath,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    },
    'Failed to load intake batch'
  );

  return normalizeBatch(body?.batch || null);
}

export async function createIntakeBatch(
  { name = '', imageFiles = [], jsonFile = null, csvFile = null } = {},
  { signal } = {}
) {
  const formData = new FormData();
  if (toTrimmed(name)) formData.append('name', toTrimmed(name));
  appendImages(formData, imageFiles);
  appendAsset(formData, 'jsonFile', jsonFile);
  appendAsset(formData, 'csvFile', csvFile);

  const body = await fetchJson('/api/intake-batches', {
    method: 'POST',
    body: formData,
    signal,
  }, 'Failed to create intake batch');
  return normalizeBatch(body?.batch || null);
}

export async function uploadIntakeBatchPackage(
  packageFile,
  { signal } = {}
) {
  if (!packageFile) {
    throw new Error('A .zip batch package is required.');
  }

  const formData = new FormData();
  appendAsset(formData, 'packageFile', packageFile);

  const body = await fetchJson('/api/intake-batches/package', {
    method: 'POST',
    body: formData,
    signal,
  }, 'Failed to upload intake batch package');

  return {
    ok: Boolean(body?.ok),
    batch: normalizeBatch(body?.batch || null),
    packageStructureSummary:
      body?.packageStructureSummary && typeof body.packageStructureSummary === 'object'
        ? { ...body.packageStructureSummary }
        : null,
    requiredAssetsFound: Boolean(body?.requiredAssetsFound),
    imagePresenceCount: Number(body?.imagePresenceCount) || 0,
    warnings: Array.isArray(body?.warnings) ? body.warnings : [],
    errors: Array.isArray(body?.errors) ? body.errors : [],
    nextStepSuggestion: toTrimmed(body?.nextStepSuggestion),
  };
}

export async function updateIntakeBatchAssets(
  batchId,
  { imageFiles = [], jsonFile = null, csvFile = null } = {},
  { signal } = {}
) {
  const formData = new FormData();
  appendImages(formData, imageFiles);
  appendAsset(formData, 'jsonFile', jsonFile);
  appendAsset(formData, 'csvFile', csvFile);

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

export async function processIntakeBatchSelectedItems(
  batchId,
  itemIds = [],
  { signal, renderTokens } = {}
) {
  const normalizedBatchId = toTrimmed(batchId);
  if (!normalizedBatchId) throw new Error('batchId is required');

  const normalizedItemIds = Array.isArray(itemIds)
    ? itemIds.map((entry) => toTrimmed(entry)).filter(Boolean)
    : [];

  const body = await fetchJson(
    `/api/intake-batches/${encodeURIComponent(normalizedBatchId)}/process-selected`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        itemIds: normalizedItemIds,
        ...(renderTokens ? { renderTokens } : {}),
      }),
    },
    'Failed to queue selected batch items for processing'
  );

  return {
    batch: normalizeBatch(body?.batch || null),
    processingRequest:
      body?.processingRequest && typeof body.processingRequest === 'object'
        ? {
            selectedItemCount: Number(body.processingRequest.selectedItemCount) || 0,
            processableItemCount: Number(body.processingRequest.processableItemCount) || 0,
            queuedCount: Number(body.processingRequest.queuedCount) || 0,
            skippedAlreadyProcessedCount:
              Number(body.processingRequest.skippedAlreadyProcessedCount) || 0,
            skippedMissingOriginalCount:
              Number(body.processingRequest.skippedMissingOriginalCount) || 0,
            skippedInFlightCount: Number(body.processingRequest.skippedInFlightCount) || 0,
            failedCount: Number(body.processingRequest.failedCount) || 0,
            renderTokens:
              body.processingRequest.renderTokens &&
              typeof body.processingRequest.renderTokens === 'object'
                ? {
                    mode: toTrimmed(body.processingRequest.renderTokens.mode) || 'explicit',
                    background: toTrimmed(body.processingRequest.renderTokens.background),
                    glow: toTrimmed(body.processingRequest.renderTokens.glow),
                    accent: toTrimmed(body.processingRequest.renderTokens.accent),
                  }
                : null,
            jobIds: Array.isArray(body.processingRequest.jobIds)
              ? body.processingRequest.jobIds.map((entry) => toTrimmed(entry)).filter(Boolean)
              : [],
            failures: Array.isArray(body.processingRequest.failures)
              ? body.processingRequest.failures
              : [],
          }
        : null,
  };
}

export async function archiveIntakeBatch(batchId, { signal } = {}) {
  const body = await fetchJson(`/api/intake-batches/${encodeURIComponent(batchId)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    signal,
  }, 'Failed to archive intake batch');
  return {
    ...body,
    batch: normalizeBatch(body?.batch || null),
  };
}

export const deleteIntakeBatch = archiveIntakeBatch;

export async function permanentlyDeleteIntakeBatch(batchId, { signal } = {}) {
  const body = await fetchJson(`/api/intake-batches/${encodeURIComponent(batchId)}/permanent`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    signal,
  }, 'Failed to permanently delete intake batch');

  return {
    ...body,
    batchId: toTrimmed(body?.batchId),
    batchName: toTrimmed(body?.batchName),
    deletedItemCount: Number(body?.deletedItemCount) || 0,
    deletedMediaStateCount: Number(body?.deletedMediaStateCount) || 0,
    deletedMediaFileCount: Number(body?.deletedMediaFileCount) || 0,
  };
}

export async function recreateIntakeBatchLocalFolder(batchId, { signal } = {}) {
  const body = await fetchJson(`/api/intake-batches/${encodeURIComponent(batchId)}/recreate-local-folder`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    signal,
  }, 'Failed to recreate local staging folder');

  return {
    batch: normalizeBatch(body?.batch || null),
    recreated: Boolean(body?.recreated),
  };
}

export function getImportBatchHref(batchId) {
  const normalizedBatchId = toTrimmed(batchId);
  if (!normalizedBatchId) return '/import';
  return `/import?batch=${encodeURIComponent(normalizedBatchId)}`;
}
