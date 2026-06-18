const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const Batch = require('../models/Batch');
const Item = require('../models/Item');
const Box = require('../models/Box');
const MediaState = require('../models/MediaState');
const {
  REPO_ROOT,
  BATCHES_ROOT,
  RECEIPT_FILENAME,
  createBatchId,
  ensureBatchStructure,
  getExternalIntakeRoot,
  getBatchLayout,
  toTrimmed,
} = require('../../scripts/intakeWorkspace');
const { toAbsoluteMediaPath } = require('../config/media');
const { summarizeBatch, validateBatchSummary } = require('../../scripts/validate_intake_batch');
const { stageBatchImages } = require('../../scripts/stage_imagekey_files');
const { importAiJsonItems } = require('./aiJsonImportService');
const { ensureItemMediaState } = require('./entityMediaService');
const { enqueueMediaProcessingJobById } = require('./mediaJobService');
const { collectImageStoragePaths } = require('./imageMetadataService');
const { safeDeleteMediaFiles } = require('../utils/mediaCleanup');
const {
  DEFAULT_RENDER_TOKENS,
  validateRenderTokens,
} = require('./renderTokenContract');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic']);
const JSON_EXTENSIONS = new Set(['.json']);
const CSV_EXTENSIONS = new Set(['.csv']);
const RECEIPT_VERSION = 1;
const RECEIPT_APP_NAME = 'discowarpcore';
const PRODUCTION_TARGET = 'mongo-batch-provenance-and-server-media';
const PACKAGE_FILES = Object.freeze({
  batchManifest: 'batch_manifest.json',
  manifest: 'manifest.json',
  aiIntakeJson: 'ai_intake.json',
  importReadyJson: 'import_ready.json',
  collageManifestJson: 'collage_manifest.json',
  legacyCsv: 'image_mapping.csv',
  imageOrderCsv: 'image_order.csv',
  orderCsv: 'order.csv',
  legacyImagesDir: 'images',
  rawImagesDir: 'raw_images',
  originalImagesDir: 'original_images',
});

const VALIDATION_STATUSES = new Set(['not_validated', 'passed', 'failed']);
const IMPORT_STATUSES = new Set(['not_imported', 'success', 'failed']);
const PROCESSING_STATUSES = new Set([
  'not_requested',
  'queued',
  'in_progress',
  'partial',
  'complete',
  'failed',
]);
const ARCHIVE_STATUSES = new Set(['active', 'archived']);

let stageBatchImagesRunner = stageBatchImages;
let importAiJsonItemsRunner = importAiJsonItems;
let batchModel = Batch;
let itemModel = Item;
let boxModel = Box;
let mediaStateModel = MediaState;
let ensureItemMediaStateRunner = ensureItemMediaState;
let enqueueMediaProcessingJobByIdRunner = enqueueMediaProcessingJobById;
const execFileAsync = promisify(execFile);
const PACKAGE_TEMP_ROOT = path.join(os.tmpdir(), 'dwc-package-ingest');

function logIntakeBatchEvent(event, details = {}) {
  console.info(`[intakeBatchService] ${event}`, details);
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function toPlainObject(value) {
  if (!value) return null;
  if (typeof value.toObject === 'function') {
    return value.toObject({ depopulate: true });
  }
  return value;
}

function fileExists(filePath) {
  return fs.access(filePath).then(() => true).catch(() => false);
}

function inferMimeType(fileName) {
  const ext = path.extname(String(fileName || '')).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.heic') return 'image/heic';
  return '';
}

function toArrayOfTrimmedStrings(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => toTrimmed(entry))
    .filter(Boolean);
}

function toIsoStringOrNull(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function toNonNegativeInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function normalizeValidationStatus(value) {
  const normalized = toTrimmed(value).toLowerCase();
  return VALIDATION_STATUSES.has(normalized) ? normalized : 'not_validated';
}

function normalizeImportStatus(value) {
  const normalized = toTrimmed(value).toLowerCase();
  return IMPORT_STATUSES.has(normalized) ? normalized : 'not_imported';
}

function normalizeProcessingStatus(value) {
  const normalized = toTrimmed(value).toLowerCase();
  return PROCESSING_STATUSES.has(normalized) ? normalized : 'not_requested';
}

function normalizeArchiveStatus(value) {
  const normalized = toTrimmed(value).toLowerCase();
  return ARCHIVE_STATUSES.has(normalized) ? normalized : 'active';
}

function toRepoRelativePath(filePath) {
  const normalized = toTrimmed(filePath);
  if (!normalized) return '';
  const relative = path.relative(REPO_ROOT, path.resolve(normalized));
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    return normalized;
  }
  return relative.replace(/\\/g, '/');
}

function resolveStoredPath(filePath, { batchDir = '' } = {}) {
  const normalized = toTrimmed(filePath);
  if (!normalized) return '';
  if (path.isAbsolute(normalized)) {
    return normalized;
  }

  const fromRepo = path.resolve(REPO_ROOT, normalized);
  if (batchDir && normalized.startsWith('.')) {
    return path.resolve(batchDir, normalized);
  }
  return fromRepo;
}

async function safeReadJson(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function hasTextValue(value) {
  return Boolean(toTrimmed(value));
}

function summarizeIntakeDestinationDefaults(payload = null, { reviewEnabled = false } = {}) {
  if (!isPlainObject(payload)) {
    return {
      location: '',
      box: '',
      reviewed: false,
      itemLocationCount: 0,
      itemBoxCount: 0,
      itemCount: 0,
      reviewRequired: false,
    };
  }

  const batchContext = isPlainObject(payload.batchContext) ? payload.batchContext : {};
  const items = Array.isArray(payload.items) ? payload.items : [];
  const itemLocationCount = items.filter((item) => hasTextValue(item?.location)).length;
  const itemBoxCount = items.filter((item) => hasTextValue(item?.box)).length;
  const location = toTrimmed(batchContext.location);
  const box = toTrimmed(batchContext.box);
  const reviewed = Boolean(batchContext.destinationReviewed);
  const hasManifestDestination = Boolean(location || box || itemLocationCount || itemBoxCount);

  return {
    location,
    box,
    reviewed,
    itemLocationCount,
    itemBoxCount,
    itemCount: items.length,
    reviewRequired: Boolean(reviewEnabled) && items.length > 0 && !reviewed && !hasManifestDestination,
  };
}

async function readBatchDestinationDefaults(paths = {}, { reviewEnabled = false } = {}) {
  if (!paths.aiJsonPath || !await fileExists(paths.aiJsonPath)) {
    return summarizeIntakeDestinationDefaults(null, { reviewEnabled });
  }
  const payload = await safeReadJson(paths.aiJsonPath, null);
  return summarizeIntakeDestinationDefaults(payload, { reviewEnabled });
}

function deepMerge(baseValue, patchValue) {
  if (patchValue === undefined) {
    return baseValue;
  }
  if (!isPlainObject(baseValue) || !isPlainObject(patchValue)) {
    return patchValue;
  }

  const next = { ...baseValue };
  for (const [key, value] of Object.entries(patchValue)) {
    next[key] = deepMerge(baseValue[key], value);
  }
  return next;
}

function defaultBatchState(batchDir) {
  const resolvedBatchDir = path.resolve(batchDir);
  const batchId = path.basename(resolvedBatchDir);
  const layout = getBatchLayout(resolvedBatchDir);
  return {
    databaseId: '',
    schemaVersion: 3,
    batchDir: resolvedBatchDir,
    identity: {
      batchId,
      batchName: batchId,
      createdAt: null,
      updatedAt: null,
    },
    sourceManifest: {
      aiJsonOriginalFilename: '',
      mappingCsvOriginalFilename: '',
      imageOriginalFilenames: [],
      imageCount: 0,
      imagesIncluded: false,
      storedFilePaths: {
        aiJsonPath: toRepoRelativePath(layout.mergedInventoryJson),
        mappingCsvPath: toRepoRelativePath(layout.imageOrderCsv),
        originalImagesDirPath: toRepoRelativePath(layout.originalImagesDir),
        stagedImagesDirPath: toRepoRelativePath(layout.stagedImagesDir),
        imageKeyMappingCsvPath: toRepoRelativePath(layout.imageKeyMappingCsv),
      },
    },
    validationSnapshot: {
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
    },
    importSnapshot: {
      status: 'not_imported',
      importedAt: null,
      createdItemCount: 0,
      updatedItemCount: 0,
      skippedItemCount: 0,
      failedItemCount: 0,
      importedItemIds: [],
      importErrorSummary: '',
    },
    archiveState: {
      status: 'active',
      archivedAt: null,
      archiveReason: '',
      sourceFilesDeletedAt: null,
    },
    processingSummary: {
      status: 'not_requested',
      queuedCount: 0,
      completedCount: 0,
      failedCount: 0,
      lastRequestedAt: null,
    },
  };
}

function normalizeValidationSnapshot(rawValue = {}, legacyValue = {}) {
  const source = isPlainObject(rawValue) ? rawValue : {};
  const legacy = isPlainObject(legacyValue) ? legacyValue : {};
  const legacyErrors = Array.isArray(legacy.errors) ? legacy.errors : [];
  const legacyWarnings = Array.isArray(legacy.warnings) ? legacy.warnings : [];
  const status =
    source.status != null
      ? normalizeValidationStatus(source.status)
      : legacy.ok === true
        ? 'passed'
        : legacy.ok === false || legacyErrors.length > 0
          ? 'failed'
          : 'not_validated';

  const validationErrors = toArrayOfTrimmedStrings(
    source.validationErrors != null ? source.validationErrors : legacy.errors
  );
  const validationWarnings = toArrayOfTrimmedStrings(
    source.validationWarnings != null ? source.validationWarnings : legacy.warnings
  );

  return {
    status,
    validatedAt: toIsoStringOrNull(source.validatedAt || legacy.validatedAt),
    totalItems: toNonNegativeInteger(
      source.totalItems != null ? source.totalItems : legacy.totalItems,
      0
    ),
    itemsWithImageKeysCount: toNonNegativeInteger(
      source.itemsWithImageKeysCount != null
        ? source.itemsWithImageKeysCount
        : legacy.itemsWithImageKeysCount,
      0
    ),
    rowCount: toNonNegativeInteger(
      source.rowCount != null ? source.rowCount : legacy.csvSourceFilesCount,
      0
    ),
    readyCount: toNonNegativeInteger(source.readyCount, 0),
    missingCount: toNonNegativeInteger(source.missingCount, 0),
    ambiguousCount: toNonNegativeInteger(source.ambiguousCount, 0),
    warningCount: toNonNegativeInteger(
      source.warningCount != null ? source.warningCount : validationWarnings.length,
      validationWarnings.length
    ),
    errorCount: toNonNegativeInteger(
      source.errorCount != null ? source.errorCount : validationErrors.length,
      validationErrors.length
    ),
    csvSourceFilesCount: toNonNegativeInteger(
      source.csvSourceFilesCount != null ? source.csvSourceFilesCount : legacy.csvSourceFilesCount,
      0
    ),
    originalImageFilesCount: toNonNegativeInteger(
      source.originalImageFilesCount != null
        ? source.originalImageFilesCount
        : legacy.originalImageFilesCount,
      0
    ),
    validationErrors,
    validationWarnings,
  };
}

function normalizeImportSnapshot(rawValue = {}, legacyState = {}) {
  const source = isPlainObject(rawValue) ? rawValue : {};
  const legacyImportResult = isPlainObject(legacyState.importResult) ? legacyState.importResult : {};
  const legacyStatus = toTrimmed(legacyState.importStatus).toLowerCase();
  const normalizedStatus =
    source.status != null
      ? normalizeImportStatus(source.status)
      : legacyStatus === 'success' || legacyStatus === 'imported'
        ? 'success'
        : legacyStatus === 'failed' || legacyStatus === 'partial_success'
          ? 'failed'
          : 'not_imported';

  const importErrorSummary = toTrimmed(
    source.importErrorSummary ||
    legacyImportResult.errorSummary ||
    (normalizedStatus === 'failed' && Array.isArray(legacyImportResult.validationErrors)
      ? legacyImportResult.validationErrors
          .slice(0, 3)
          .map((entry) => toTrimmed(entry?.message || entry))
          .filter(Boolean)
          .join(' | ')
      : '')
  );

  return {
    status: normalizedStatus,
    importedAt: toIsoStringOrNull(source.importedAt || legacyState.importedAt),
    createdItemCount: toNonNegativeInteger(
      source.createdItemCount != null ? source.createdItemCount : legacyImportResult.createdCount,
      0
    ),
    updatedItemCount: toNonNegativeInteger(source.updatedItemCount, 0),
    skippedItemCount: toNonNegativeInteger(source.skippedItemCount, 0),
    failedItemCount: toNonNegativeInteger(
      source.failedItemCount != null ? source.failedItemCount : legacyImportResult.failedCount,
      0
    ),
    importedItemIds: toArrayOfTrimmedStrings(
      source.importedItemIds != null ? source.importedItemIds : legacyImportResult.createdItemIds
    ),
    importErrorSummary,
  };
}

function normalizeProcessingSummary(rawValue = {}) {
  const source = isPlainObject(rawValue) ? rawValue : {};
  return {
    status: normalizeProcessingStatus(source.status),
    queuedCount: toNonNegativeInteger(source.queuedCount, 0),
    completedCount: toNonNegativeInteger(source.completedCount, 0),
    failedCount: toNonNegativeInteger(source.failedCount, 0),
    lastRequestedAt: toIsoStringOrNull(source.lastRequestedAt),
  };
}

function normalizeArchiveState(rawValue = {}) {
  const source = isPlainObject(rawValue) ? rawValue : {};
  return {
    status: normalizeArchiveStatus(source.status),
    archivedAt: toIsoStringOrNull(source.archivedAt),
    archiveReason: toTrimmed(source.archiveReason),
    sourceFilesDeletedAt: toIsoStringOrNull(source.sourceFilesDeletedAt),
  };
}

function normalizePackageSnapshot(rawValue = {}) {
  const source = isPlainObject(rawValue) ? rawValue : {};
  return {
    ingestedAt: toIsoStringOrNull(source.ingestedAt),
    originalPackageFilename: toTrimmed(source.originalPackageFilename),
    manifest: isPlainObject(source.manifest) ? source.manifest : {},
    structureSummary: isPlainObject(source.structureSummary) ? source.structureSummary : {},
  };
}

function normalizeSourceManifest(rawValue = {}, legacyState = {}, batchDir) {
  const source = isPlainObject(rawValue) ? rawValue : {};
  const layout = getBatchLayout(batchDir);
  const storedFilePaths = {
    aiJsonPath: toTrimmed(source?.storedFilePaths?.aiJsonPath) || toRepoRelativePath(layout.mergedInventoryJson),
    mappingCsvPath: toTrimmed(source?.storedFilePaths?.mappingCsvPath) || toRepoRelativePath(layout.imageOrderCsv),
    collagePath: toTrimmed(source?.storedFilePaths?.collagePath) || toRepoRelativePath(layout.collageImage),
    originalImagesDirPath:
      toTrimmed(source?.storedFilePaths?.originalImagesDirPath) || toRepoRelativePath(layout.originalImagesDir),
    stagedImagesDirPath:
      toTrimmed(source?.storedFilePaths?.stagedImagesDirPath) || toRepoRelativePath(layout.stagedImagesDir),
    imageKeyMappingCsvPath:
      toTrimmed(source?.storedFilePaths?.imageKeyMappingCsvPath) || toRepoRelativePath(layout.imageKeyMappingCsv),
  };

  const imageOriginalFilenames = toArrayOfTrimmedStrings(source.imageOriginalFilenames);
  const imageCount =
    source.imageCount != null
      ? toNonNegativeInteger(source.imageCount, imageOriginalFilenames.length)
      : imageOriginalFilenames.length;

  return {
    aiJsonOriginalFilename: toTrimmed(source.aiJsonOriginalFilename || legacyState.aiJsonOriginalFilename),
    mappingCsvOriginalFilename: toTrimmed(
      source.mappingCsvOriginalFilename || legacyState.mappingCsvOriginalFilename
    ),
    collageOriginalFilename: toTrimmed(
      source.collageOriginalFilename || legacyState.collageOriginalFilename
    ),
    imageOriginalFilenames,
    imageCount,
    imagesIncluded:
      typeof source.imagesIncluded === 'boolean'
        ? source.imagesIncluded
        : imageCount > 0,
    storedFilePaths,
  };
}

function normalizeBatchState(rawState = {}, batchDir) {
  const resolvedBatchDir = path.resolve(batchDir);
  const defaults = defaultBatchState(resolvedBatchDir);
  const raw = isPlainObject(rawState) ? rawState : {};
  const identitySource = isPlainObject(raw.identity) ? raw.identity : {};

  const identity = {
    batchId: path.basename(resolvedBatchDir),
    batchName: toTrimmed(identitySource.batchName || raw.name) || path.basename(resolvedBatchDir),
    createdAt: toIsoStringOrNull(identitySource.createdAt || raw.createdAt),
    updatedAt: toIsoStringOrNull(identitySource.updatedAt || raw.updatedAt),
  };

  const state = {
    databaseId: toTrimmed(raw._id || raw.id),
    schemaVersion: Math.max(3, toNonNegativeInteger(raw.schemaVersion, 3)),
    batchDir: toTrimmed(raw.batchDir) || resolvedBatchDir,
    identity,
    sourceManifest: normalizeSourceManifest(raw.sourceManifest, raw, resolvedBatchDir),
    validationSnapshot: normalizeValidationSnapshot(
      raw.validationSnapshot,
      raw.lastValidation
    ),
    importSnapshot: normalizeImportSnapshot(raw.importSnapshot, raw),
    archiveState: normalizeArchiveState(raw.archiveState),
    processingSummary: normalizeProcessingSummary(raw.processingSummary),
    packageSnapshot: normalizePackageSnapshot(raw.packageSnapshot),
  };

  return deepMerge(defaults, state);
}

function toPersistedBatchState(state = {}) {
  const normalized = normalizeBatchState(state, state.batchDir);
  return {
    schemaVersion: normalized.schemaVersion,
    batchDir: normalized.batchDir,
    identity: normalized.identity,
    sourceManifest: normalized.sourceManifest,
    validationSnapshot: normalized.validationSnapshot,
    importSnapshot: normalized.importSnapshot,
    archiveState: normalized.archiveState,
    processingSummary: normalized.processingSummary,
    packageSnapshot: normalized.packageSnapshot,
  };
}

async function writeBatchStateMirror(batchDir, state) {
  if (!batchDir) return;
  const batchDirExists = await fileExists(batchDir);
  if (!batchDirExists) return;
  const layout = getBatchLayout(batchDir);
  await fs.writeFile(
    layout.stateJson,
    `${JSON.stringify(toPersistedBatchState(state), null, 2)}\n`,
    'utf8'
  );
}

async function findBatchRecordByBatchId(batchId) {
  const normalizedBatchId = toTrimmed(batchId);
  if (!normalizedBatchId) return null;

  const lookupClauses = [{ 'identity.batchId': normalizedBatchId }];
  if (mongoose.Types.ObjectId.isValid(normalizedBatchId)) {
    lookupClauses.push({ _id: normalizedBatchId });
  }

  const record = await batchModel.findOne(
    lookupClauses.length > 1 ? { $or: lookupClauses } : lookupClauses[0]
  );
  if (!record) return null;
  return normalizeBatchState(toPlainObject(record), record.batchDir || path.join(BATCHES_ROOT, batchId));
}

async function findAllBatchRecords() {
  const records = await batchModel.find({});
  return (Array.isArray(records) ? records : [])
    .map((record) => {
      const raw = toPlainObject(record);
      const batchDir = raw?.batchDir || path.join(BATCHES_ROOT, raw?.identity?.batchId || '');
      return normalizeBatchState(raw, batchDir);
    });
}

async function persistBatchState(state) {
  const normalized = normalizeBatchState(state, state.batchDir);
  const now = new Date().toISOString();
  normalized.identity.updatedAt = now;
  if (!normalized.identity.createdAt) {
    normalized.identity.createdAt = now;
  }

  const record = await batchModel.findOneAndUpdate(
    { 'identity.batchId': normalized.identity.batchId },
    { $set: toPersistedBatchState(normalized) },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  const saved = normalizeBatchState(
    toPlainObject(record),
    normalized.batchDir
  );
  await writeBatchStateMirror(saved.batchDir, saved);
  return saved;
}

async function hydrateBatchRecordFromFilesystem(batchDir, patch = {}) {
  const resolvedBatchDir = path.resolve(batchDir);
  const layout = getBatchLayout(resolvedBatchDir);
  const legacyState = (await safeReadJson(layout.stateJson, {})) || {};
  const merged = normalizeBatchState(deepMerge(legacyState, patch), resolvedBatchDir);
  return persistBatchState(merged);
}

async function ensureBatchRecord(batchDir, patch = undefined) {
  const resolvedBatchDir = path.resolve(batchDir);
  const batchId = path.basename(resolvedBatchDir);
  const existing = await findBatchRecordByBatchId(batchId);
  if (!existing) {
    return hydrateBatchRecordFromFilesystem(resolvedBatchDir, patch || {});
  }
  if (patch === undefined) {
    return existing;
  }
  return persistBatchState(deepMerge(existing, patch));
}

async function writeBatchState(batchDir, patch = {}) {
  const existing = await ensureBatchRecord(batchDir);
  return persistBatchState(deepMerge(existing, patch));
}

async function readBatchState(batchDir) {
  return ensureBatchRecord(batchDir);
}

async function listFilesystemBatchDirs(rootDir) {
  try {
    await fs.mkdir(rootDir, { recursive: true });
    const entries = await fs.readdir(rootDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(rootDir, entry.name));
  } catch {
    return [];
  }
}

async function migrateFilesystemBatchesToDatabase() {
  const filesystemBatchDirs = [
    ...await listFilesystemBatchDirs(getExternalIntakeRoot()),
    ...await listFilesystemBatchDirs(BATCHES_ROOT),
  ];
  await Promise.all(
    filesystemBatchDirs.map((batchDir) => ensureBatchRecord(batchDir))
  );
}

async function countFiles(dirPath, allowedExtensions = null) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => (
        allowedExtensions
          ? allowedExtensions.has(path.extname(name).toLowerCase())
          : true
      )).length;
  } catch {
    return 0;
  }
}

async function listFiles(dirPath, allowedExtensions = null) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => (
        allowedExtensions
          ? allowedExtensions.has(path.extname(name).toLowerCase())
          : true
      ))
      .sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
}

function pickPreferredFile(candidates = [], preferredNames = []) {
  const safeCandidates = Array.isArray(candidates) ? candidates : [];
  if (!safeCandidates.length) return '';

  for (const preferredName of preferredNames) {
    const match = safeCandidates.find((candidate) => (
      path.basename(candidate).toLowerCase() === String(preferredName || '').toLowerCase()
    ));
    if (match) return match;
  }

  return [...safeCandidates].sort((left, right) => left.localeCompare(right))[0] || '';
}

async function detectBatchPackageAssets(batchDir) {
  const resolvedBatchDir = path.resolve(batchDir);
  const layout = getBatchLayout(resolvedBatchDir);
  const receiptPath = path.join(resolvedBatchDir, RECEIPT_FILENAME);
  let rootEntries = [];

  try {
    rootEntries = await fs.readdir(resolvedBatchDir, { withFileTypes: true });
  } catch {
    rootEntries = [];
  }

  const rootFiles = rootEntries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);

  const jsonCandidates = rootFiles
    .filter((name) => JSON_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .filter((name) => !['batch_state.json', RECEIPT_FILENAME].includes(name));
  const csvCandidates = rootFiles
    .filter((name) => CSV_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .filter((name) => path.basename(name).toLowerCase() !== 'imagekey_mapping.csv');
  const rootImageNames = rootFiles
    .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((left, right) => left.localeCompare(right));
  const legacyImageNames = await listFiles(layout.originalImagesDir, IMAGE_EXTENSIONS);

  const aiJsonPath = pickPreferredFile(
    jsonCandidates.map((name) => path.join(resolvedBatchDir, name)),
    ['merged_inventory_batch.json', 'engine-output.json']
  );
  const mappingCsvPath = pickPreferredFile(
    csvCandidates.map((name) => path.join(resolvedBatchDir, name)),
    ['image_order.csv', 'mapping.csv']
  );

  const imageDir = rootImageNames.length ? resolvedBatchDir : layout.originalImagesDir;
  const imageOriginalFilenames = rootImageNames.length ? rootImageNames : legacyImageNames;

  return {
    aiJsonPath,
    mappingCsvPath,
    imageDir,
    imageOriginalFilenames,
    imageCount: imageOriginalFilenames.length,
    imagesIncluded: imageOriginalFilenames.length > 0,
    imageKeyMappingCsvPath: layout.imageKeyMappingCsv,
    receiptPath,
  };
}

async function resolveBatchOperationalPaths(state) {
  const batchDir = path.resolve(state.batchDir);
  const layout = getBatchLayout(batchDir);
  const detected = await detectBatchPackageAssets(batchDir);
  const stored = state?.sourceManifest?.storedFilePaths || {};
  const aiJsonPath = await fileExists(resolveStoredPath(stored.aiJsonPath, { batchDir }))
    ? resolveStoredPath(stored.aiJsonPath, { batchDir })
    : detected.aiJsonPath;
  const mappingCsvPath = await fileExists(resolveStoredPath(stored.mappingCsvPath, { batchDir }))
    ? resolveStoredPath(stored.mappingCsvPath, { batchDir })
    : detected.mappingCsvPath;
  const imageDirCandidate = resolveStoredPath(stored.originalImagesDirPath, { batchDir });
  const imageDir = (imageDirCandidate && await fileExists(imageDirCandidate))
    ? imageDirCandidate
    : detected.imageDir;
  const receiptPath = detected.receiptPath;

  return {
    batchDir,
    layout,
    aiJsonPath,
    mappingCsvPath,
    imageDir,
    imageOriginalFilenames: detected.imageOriginalFilenames,
    imageCount: detected.imageCount,
    imagesIncluded: detected.imagesIncluded,
    receiptPath,
  };
}

async function moveUploadedFile(sourcePath, destinationPath) {
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.rename(sourcePath, destinationPath);
}

async function cleanupUploadedFiles(files = []) {
  await Promise.allSettled(
    files.map((file) => {
      const filePath = toTrimmed(file?.path);
      if (!filePath) return Promise.resolve();
      return fs.rm(filePath, { force: true });
    })
  );
}

function normalizeZipEntryPath(entryPath) {
  return String(entryPath || '').replace(/\\/g, '/').replace(/^\.?\//, '');
}

function isUnsafeZipEntry(entryPath) {
  const normalized = normalizeZipEntryPath(entryPath);
  return (
    !normalized ||
    normalized.startsWith('/') ||
    normalized.split('/').some((segment) => segment === '..')
  );
}

function shouldIgnoreZipEntry(entryPath) {
  const normalized = normalizeZipEntryPath(entryPath);
  if (!normalized) return true;
  if (normalized.startsWith('__MACOSX/')) return true;
  return normalized.split('/').some((segment) => segment.startsWith('.'));
}

async function listZipEntries(zipFilePath) {
  const { stdout } = await execFileAsync('/usr/bin/zipinfo', ['-1', zipFilePath]);
  return String(stdout || '')
    .split('\n')
    .map((line) => normalizeZipEntryPath(line))
    .filter(Boolean);
}

async function unzipArchive(zipFilePath, destinationDir) {
  await fs.mkdir(destinationDir, { recursive: true });
  await execFileAsync('/usr/bin/unzip', ['-qq', zipFilePath, '-d', destinationDir]);
}

function flattenUploadedFiles(uploadedFiles = {}) {
  const groups = Object.values(uploadedFiles || {});
  return groups.flatMap((group) => (Array.isArray(group) ? group : []));
}

async function buildSourceManifestPatch(batchDir, existingManifest = {}, uploadedFiles = {}) {
  const paths = await resolveBatchOperationalPaths({ batchDir, sourceManifest: existingManifest });
  const jsonFile = uploadedFiles.jsonFile?.[0] || null;
  const csvFile = uploadedFiles.csvFile?.[0] || null;
  const imageOriginalFilenames = paths.imageOriginalFilenames.length
    ? paths.imageOriginalFilenames
    : toArrayOfTrimmedStrings(existingManifest.imageOriginalFilenames);

  return {
    aiJsonOriginalFilename:
      toTrimmed(jsonFile?.originalname)
      || path.basename(paths.aiJsonPath || '')
      || toTrimmed(existingManifest.aiJsonOriginalFilename),
    mappingCsvOriginalFilename:
      toTrimmed(csvFile?.originalname)
      || path.basename(paths.mappingCsvPath || '')
      || toTrimmed(existingManifest.mappingCsvOriginalFilename),
    imageOriginalFilenames,
    imageCount: imageOriginalFilenames.length,
    imagesIncluded: imageOriginalFilenames.length > 0,
    storedFilePaths: {
      aiJsonPath: toRepoRelativePath(paths.aiJsonPath),
      mappingCsvPath: toRepoRelativePath(paths.mappingCsvPath),
      originalImagesDirPath: toRepoRelativePath(paths.imageDir),
      stagedImagesDirPath: toRepoRelativePath(paths.layout.stagedImagesDir),
      imageKeyMappingCsvPath: toRepoRelativePath(paths.layout.imageKeyMappingCsv),
    },
  };
}

function toCompatValidation(snapshot) {
  if (!snapshot || snapshot.status === 'not_validated') return null;
  return {
    ok: snapshot.status === 'passed',
    errors: [...snapshot.validationErrors],
    warnings: [...snapshot.validationWarnings],
    totalItems: snapshot.totalItems,
    itemsWithImageKeysCount: snapshot.itemsWithImageKeysCount,
    csvSourceFilesCount: snapshot.csvSourceFilesCount,
    originalImageFilesCount: snapshot.originalImageFilesCount,
    rowCount: snapshot.rowCount,
    readyCount: snapshot.readyCount,
    missingCount: snapshot.missingCount,
    ambiguousCount: snapshot.ambiguousCount,
    warningCount: snapshot.warningCount,
    errorCount: snapshot.errorCount,
    validatedAt: snapshot.validatedAt,
  };
}

function toCompatImportResult(snapshot) {
  if (!snapshot || snapshot.status === 'not_imported') return null;
  return {
    status: snapshot.status,
    createdCount: snapshot.createdItemCount,
    updatedCount: snapshot.updatedItemCount,
    skippedCount: snapshot.skippedItemCount,
    failedCount: snapshot.failedItemCount,
    createdItemIds: [...snapshot.importedItemIds],
    errorSummary: snapshot.importErrorSummary || '',
  };
}

function assertBatchActive(batch) {
  if (batch?.archiveState?.status === 'archived') {
    throw new Error('Archived batches are read-only.');
  }
}

function toObjectIdString(value) {
  const normalized = toTrimmed(value);
  return normalized && mongoose.isValidObjectId(normalized) ? normalized : '';
}

function toObjectIdStrings(values = []) {
  return Array.from(new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => toObjectIdString(value))
      .filter(Boolean)
  ));
}

function resolveItemOriginalStoragePath(item = {}) {
  return (
    toTrimmed(item?.image?.original?.storagePath) ||
    toTrimmed(item?.image?.storagePath) ||
    ''
  );
}

function resolveItemOriginalAbsolutePath(item = {}) {
  const storagePath = resolveItemOriginalStoragePath(item);
  if (storagePath) {
    return toAbsoluteMediaPath(storagePath);
  }
  return '';
}

function toMediaStateLookupKeyFromItem(item = {}) {
  return (
    toTrimmed(item?.image?.mediaId) ||
    resolveItemOriginalAbsolutePath(item) ||
    ''
  );
}

function normalizeLedgerProcessingStatus(mediaState, item = {}) {
  const rawStatus = toTrimmed(mediaState?.processingStatus).toLowerCase();
  const hasOriginalImage = Boolean(
    resolveItemOriginalStoragePath(item) ||
    toTrimmed(item?.imagePath) ||
    toTrimmed(item?.image?.original?.url)
  );

  if (!hasOriginalImage) {
    return {
      status: 'unavailable',
      mediaStatus: rawStatus || 'missing',
      isProcessable: false,
      isProcessed: false,
      isUnavailable: true,
      isInFlight: false,
      canRetry: false,
    };
  }

  if (rawStatus === 'completed') {
    return {
      status: 'processed',
      mediaStatus: rawStatus,
      isProcessable: false,
      isProcessed: true,
      isUnavailable: false,
      isInFlight: false,
      canRetry: false,
    };
  }

  if (rawStatus === 'queued') {
    return {
      status: 'queued',
      mediaStatus: rawStatus,
      isProcessable: false,
      isProcessed: false,
      isUnavailable: false,
      isInFlight: true,
      canRetry: false,
    };
  }

  if (rawStatus === 'processing') {
    return {
      status: 'processing',
      mediaStatus: rawStatus,
      isProcessable: false,
      isProcessed: false,
      isUnavailable: false,
      isInFlight: true,
      canRetry: false,
    };
  }

  if (rawStatus === 'failed') {
    return {
      status: 'failed',
      mediaStatus: rawStatus,
      isProcessable: true,
      isProcessed: false,
      isUnavailable: false,
      isInFlight: false,
      canRetry: true,
    };
  }

  return {
    status: 'not_requested',
    mediaStatus: rawStatus || 'ready_for_processing',
    isProcessable: true,
    isProcessed: false,
    isUnavailable: false,
    isInFlight: false,
    canRetry: false,
  };
}

function toImportedItemLedgerEntry(item, mediaState, boxByItemId = new Map()) {
  const processing = normalizeLedgerProcessingStatus(mediaState, item);
  const itemId = toTrimmed(item?._id);
  const originalUrl =
    toTrimmed(item?.image?.original?.url) ||
    toTrimmed(item?.imagePath);
  const displayUrl = toTrimmed(item?.image?.display?.url);
  const thumbUrl = toTrimmed(item?.image?.thumb?.url);
  const processedUrl = toTrimmed(mediaState?.processedPath);
  const boxRef = itemId ? boxByItemId.get(itemId) || null : null;

  return {
    id: itemId,
    name: toTrimmed(item?.name) || 'Unnamed item',
    location: toTrimmed(item?.location),
    itemStatus: toTrimmed(item?.item_status) || 'active',
    orphanedAt: item?.orphanedAt || null,
    createdAt: item?.createdAt || null,
    updatedAt: item?.updatedAt || null,
    currentBox: boxRef,
    sourceBatchId: toTrimmed(item?.sourceBatchId) || null,
    image: {
      mediaId: toTrimmed(item?.image?.mediaId),
      originalName: toTrimmed(item?.image?.originalName),
      originalUrl,
      displayUrl,
      thumbUrl,
      preferredUrl: displayUrl || thumbUrl || originalUrl,
    },
    processing: {
      ...processing,
      sourceType: toTrimmed(mediaState?.sourceType).toLowerCase() || '',
      processedAt: mediaState?.processedAt || null,
      processingError: mediaState?.processingError || null,
      activeVariant: toTrimmed(mediaState?.activeVariant),
      hasProcessedOutput: Boolean(
        toTrimmed(mediaState?.processedPath) ||
        toTrimmed(mediaState?.displayPath) ||
        toTrimmed(mediaState?.thumbPath)
      ),
      processedUrl,
    },
  };
}

function deriveBatchProcessingSummary(importedItems = [], existingSummary = {}, overrides = {}) {
  const items = Array.isArray(importedItems) ? importedItems : [];
  const queuedCount = items.filter((item) =>
    ['queued', 'processing'].includes(item?.processing?.status)
  ).length;
  const processingCount = items.filter((item) => item?.processing?.status === 'processing').length;
  const completedCount = items.filter((item) => item?.processing?.status === 'processed').length;
  const failedCount = items.filter((item) => item?.processing?.status === 'failed').length;
  const notRequestedCount = items.filter((item) => item?.processing?.status === 'not_requested').length;
  const unavailableCount = items.filter((item) => item?.processing?.status === 'unavailable').length;

  let status = 'not_requested';
  if (queuedCount > 0) {
    status = processingCount > 0 ? 'in_progress' : 'queued';
  } else if (completedCount > 0 && failedCount === 0 && notRequestedCount === 0 && unavailableCount === 0) {
    status = 'complete';
  } else if (failedCount > 0 && completedCount === 0 && notRequestedCount === 0 && unavailableCount === 0) {
    status = 'failed';
  } else if (completedCount > 0 || failedCount > 0) {
    status = 'partial';
  }

  return normalizeProcessingSummary({
    status,
    queuedCount,
    completedCount,
    failedCount,
    lastRequestedAt: overrides.lastRequestedAt ?? existingSummary?.lastRequestedAt ?? null,
  });
}

function processingSummariesEqual(left = {}, right = {}) {
  return (
    normalizeProcessingStatus(left?.status) === normalizeProcessingStatus(right?.status) &&
    toNonNegativeInteger(left?.queuedCount, 0) === toNonNegativeInteger(right?.queuedCount, 0) &&
    toNonNegativeInteger(left?.completedCount, 0) === toNonNegativeInteger(right?.completedCount, 0) &&
    toNonNegativeInteger(left?.failedCount, 0) === toNonNegativeInteger(right?.failedCount, 0) &&
    toIsoStringOrNull(left?.lastRequestedAt) === toIsoStringOrNull(right?.lastRequestedAt)
  );
}

function buildReceiptSummaryCounts(batch = {}) {
  return {
    rowCount: toNonNegativeInteger(batch?.validationSnapshot?.rowCount, 0),
    readyCount: toNonNegativeInteger(batch?.validationSnapshot?.readyCount, 0),
    missingCount: toNonNegativeInteger(batch?.validationSnapshot?.missingCount, 0),
    warningCount: toNonNegativeInteger(batch?.validationSnapshot?.warningCount, 0),
    errorCount: toNonNegativeInteger(batch?.validationSnapshot?.errorCount, 0),
    createdItemCount: toNonNegativeInteger(batch?.importSnapshot?.createdItemCount, 0),
    failedItemCount: toNonNegativeInteger(batch?.importSnapshot?.failedItemCount, 0),
    imageCount: toNonNegativeInteger(batch?.sourceManifest?.imageCount, 0),
  };
}

async function readBatchReceipt(batchDir) {
  const receiptPath = path.join(path.resolve(batchDir), RECEIPT_FILENAME);
  const receipt = await safeReadJson(receiptPath, null);
  if (!isPlainObject(receipt)) {
    return null;
  }
  return {
    path: receiptPath,
    app: toTrimmed(receipt.app),
    receiptVersion: toNonNegativeInteger(receipt.receiptVersion, 0),
    batchFolderName: toTrimmed(receipt.batchFolderName),
    status: toTrimmed(receipt.status),
    safeToDelete: Boolean(receipt.safeToDelete),
    validatedAt: toIsoStringOrNull(receipt.validatedAt),
    importedAt: toIsoStringOrNull(receipt.importedAt),
    batchRecordId: toTrimmed(receipt.batchRecordId),
    batchLabel: toTrimmed(receipt.batchLabel),
    productionTarget: toTrimmed(receipt.productionTarget),
    summaryCounts: isPlainObject(receipt.summaryCounts) ? receipt.summaryCounts : {},
    updatedAt: toIsoStringOrNull(receipt.updatedAt),
  };
}

async function writeBatchReceipt(batch, {
  status = '',
  safeToDelete = false,
} = {}) {
  const resolvedBatch = batch?.batchDir ? batch : await getIntakeBatchById(batch?.batchId || batch?.id || '');
  const receiptPath = path.join(path.resolve(resolvedBatch.batchDir), RECEIPT_FILENAME);
  const payload = {
    app: RECEIPT_APP_NAME,
    receiptVersion: RECEIPT_VERSION,
    batchFolderName: path.basename(resolvedBatch.batchDir),
    status: toTrimmed(status) || 'pending',
    safeToDelete: Boolean(safeToDelete),
    validatedAt: toIsoStringOrNull(resolvedBatch.validationSnapshot?.validatedAt),
    importedAt: toIsoStringOrNull(resolvedBatch.importSnapshot?.importedAt),
    batchRecordId: toTrimmed(resolvedBatch.databaseId),
    batchLabel: toTrimmed(resolvedBatch.batchName || resolvedBatch.name || path.basename(resolvedBatch.batchDir)),
    productionTarget: PRODUCTION_TARGET,
    summaryCounts: buildReceiptSummaryCounts(resolvedBatch),
    updatedAt: new Date().toISOString(),
  };

  await fs.writeFile(receiptPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return payload;
}

function normalizeLedgerSort(value) {
  const normalized = toTrimmed(value).toLowerCase();
  if (normalized === 'created') return 'created';
  if (normalized === 'status') return 'status';
  return 'name';
}

function parseBooleanFlag(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  const normalized = toTrimmed(value).toLowerCase();
  if (!normalized) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function toBoundedPositiveInteger(value, fallback, { min = 1, max = 500 } = {}) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}

function toBoundedNonNegativeInteger(value, fallback, { min = 0, max = 100000 } = {}) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}

async function loadCurrentBoxRefsForItems(itemIds = []) {
  const normalizedIds = toObjectIdStrings(itemIds);
  if (!normalizedIds.length) return new Map();

  const boxes = await boxModel.find({ items: { $in: normalizedIds } })
    .select('_id box_id label items')
    .lean();

  const byItemId = new Map();
  for (const box of Array.isArray(boxes) ? boxes : []) {
    const boxRef = {
      id: toTrimmed(box?._id),
      boxId: toTrimmed(box?.box_id),
      label: toTrimmed(box?.label) || `Box ${toTrimmed(box?.box_id) || ''}`.trim() || 'Box',
    };
    for (const itemId of Array.isArray(box?.items) ? box.items : []) {
      const normalizedItemId = toObjectIdString(itemId);
      if (!normalizedItemId || byItemId.has(normalizedItemId)) continue;
      byItemId.set(normalizedItemId, boxRef);
    }
  }

  return byItemId;
}

async function buildImportedItemsLedger(
  state,
  {
    selectedItemIds = null,
    limit = null,
    offset = 0,
    sort = 'name',
  } = {}
) {
  const batchDatabaseId = toObjectIdString(state?.databaseId);
  const importedItemIds = toObjectIdStrings(state?.importSnapshot?.importedItemIds);
  const requestedItemIds = selectedItemIds == null ? null : toObjectIdStrings(selectedItemIds);
  const safeSort = normalizeLedgerSort(sort);
  const safeOffset = toBoundedNonNegativeInteger(offset, 0, { min: 0, max: 1000000 });
  const safeLimit =
    limit == null ? null : toBoundedPositiveInteger(limit, 50, { min: 1, max: 500 });

  if (!batchDatabaseId && !importedItemIds.length) {
    return {
      items: [],
      total: 0,
      limit: safeLimit == null ? 0 : safeLimit,
      offset: safeOffset,
      hasMore: false,
    };
  }

  const membershipClauses = [];
  if (batchDatabaseId) {
    membershipClauses.push({ sourceBatchId: batchDatabaseId });
  }
  if (importedItemIds.length) {
    membershipClauses.push({ _id: { $in: importedItemIds } });
  }

  const query = membershipClauses.length === 1 ? membershipClauses[0] : { $or: membershipClauses };
  if (requestedItemIds?.length) {
    query._id = { $in: requestedItemIds };
  }

  const matchingItems = await itemModel.find(query)
    .select('_id name location item_status orphanedAt createdAt updatedAt sourceBatchId image imagePath')
    .lean();

  if (!matchingItems.length) {
    return {
      items: [],
      total: 0,
      limit: safeLimit == null ? 0 : safeLimit,
      offset: safeOffset,
      hasMore: false,
    };
  }

  const importedIdOrder = new Map(importedItemIds.map((itemId, index) => [itemId, index]));
  let mediaByKey = null;

  if (safeSort === 'status') {
    const lookupKeys = Array.from(new Set(
      matchingItems
        .map((item) => toMediaStateLookupKeyFromItem(item))
        .filter(Boolean)
    ));
    const mediaIdKeys = lookupKeys.filter((value) => !value.includes(path.sep));
    const originalPathKeys = lookupKeys.filter((value) => value.includes(path.sep));
    const mediaStateQueryClauses = [
      ...(mediaIdKeys.length ? [{ mediaId: { $in: mediaIdKeys } }] : []),
      ...(originalPathKeys.length ? [{ originalPath: { $in: originalPathKeys } }] : []),
    ];
    const mediaStates = mediaStateQueryClauses.length
      ? await mediaStateModel.find({ $or: mediaStateQueryClauses }).lean()
      : [];

    mediaByKey = new Map();
    for (const mediaState of Array.isArray(mediaStates) ? mediaStates : []) {
      const mediaId = toTrimmed(mediaState?.mediaId);
      const originalPath = toTrimmed(mediaState?.originalPath);
      if (mediaId) {
        mediaByKey.set(mediaId, mediaState);
      }
      if (originalPath) {
        mediaByKey.set(originalPath, mediaState);
      }
    }
  }

  const sortedItems = [...matchingItems].sort((left, right) => {
    if (safeSort === 'created') {
      const leftTime = new Date(left?.createdAt || 0).getTime();
      const rightTime = new Date(right?.createdAt || 0).getTime();
      if (leftTime !== rightTime) return rightTime - leftTime;
    } else if (safeSort === 'status') {
      const leftStatus = normalizeLedgerProcessingStatus(
        mediaByKey?.get(toMediaStateLookupKeyFromItem(left)) || null,
        left
      ).status;
      const rightStatus = normalizeLedgerProcessingStatus(
        mediaByKey?.get(toMediaStateLookupKeyFromItem(right)) || null,
        right
      ).status;
      const statusCompare = leftStatus.localeCompare(rightStatus);
      if (statusCompare !== 0) return statusCompare;
    } else {
      const nameCompare = String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
        sensitivity: 'base',
        numeric: true,
      });
      if (nameCompare !== 0) return nameCompare;
    }

    const leftId = toTrimmed(left?._id);
    const rightId = toTrimmed(right?._id);
    const leftRank = importedIdOrder.has(leftId) ? importedIdOrder.get(leftId) : Number.MAX_SAFE_INTEGER;
    const rightRank = importedIdOrder.has(rightId) ? importedIdOrder.get(rightId) : Number.MAX_SAFE_INTEGER;
    if (leftRank !== rightRank) return leftRank - rightRank;
    return String(leftId).localeCompare(String(rightId));
  });

  const total = sortedItems.length;
  const pagedItems = safeLimit == null
    ? sortedItems
    : sortedItems.slice(safeOffset, safeOffset + safeLimit);
  const boxByItemId = await loadCurrentBoxRefsForItems(pagedItems.map((item) => item?._id));
  if (!mediaByKey) {
    const mediaLookupKeys = Array.from(new Set(
      pagedItems
        .map((item) => toMediaStateLookupKeyFromItem(item))
        .filter(Boolean)
    ));
    const mediaIdKeys = mediaLookupKeys.filter((value) => !value.includes(path.sep));
    const originalPathKeys = mediaLookupKeys.filter((value) => value.includes(path.sep));
    const mediaStateQueryClauses = [
      ...(mediaIdKeys.length ? [{ mediaId: { $in: mediaIdKeys } }] : []),
      ...(originalPathKeys.length ? [{ originalPath: { $in: originalPathKeys } }] : []),
    ];
    const mediaStates = mediaStateQueryClauses.length
      ? await mediaStateModel.find({ $or: mediaStateQueryClauses }).lean()
      : [];

    mediaByKey = new Map();
    for (const mediaState of Array.isArray(mediaStates) ? mediaStates : []) {
      const mediaId = toTrimmed(mediaState?.mediaId);
      const originalPath = toTrimmed(mediaState?.originalPath);
      if (mediaId) {
        mediaByKey.set(mediaId, mediaState);
      }
      if (originalPath) {
        mediaByKey.set(originalPath, mediaState);
      }
    }
  }

  const items = pagedItems.map((item) => {
    const mediaState = mediaByKey.get(toMediaStateLookupKeyFromItem(item)) || null;
    return toImportedItemLedgerEntry(item, mediaState, boxByItemId);
  });

  return {
    items,
    total,
    limit: safeLimit == null ? total : safeLimit,
    offset: safeOffset,
    hasMore: safeLimit == null ? false : safeOffset + items.length < total,
    sort: safeSort,
  };
}

async function summarizeIntakeBatch(
  batchDir,
  {
    includeImportedItems = false,
    importedItemsLimit = null,
    importedItemsOffset = 0,
    importedItemsSort = 'name',
  } = {}
) {
  const state = await readBatchState(batchDir);
  const paths = await resolveBatchOperationalPaths(state);
  const layout = paths.layout;

  let batchStats = null;
  try {
    batchStats = await fs.stat(state.batchDir);
  } catch {
    batchStats = null;
  }

  const hasJsonFile = await fileExists(paths.aiJsonPath);
  const hasCsvFile = await fileExists(paths.mappingCsvPath);
  const hasMappingCsv = await fileExists(layout.imageKeyMappingCsv);
  const originalImagesCount = paths.imageCount;
  const stagedImagesCount = await countFiles(layout.stagedImagesDir, IMAGE_EXTENSIONS);
  const localReceipt = await readBatchReceipt(state.batchDir);
  const mappingRequired = originalImagesCount > 0;
  const localFolderPresent = await fileExists(state.batchDir);

  const createdAt = state.identity.createdAt || batchStats?.birthtime?.toISOString?.() || null;
  const updatedAt = state.identity.updatedAt || batchStats?.mtime?.toISOString?.() || null;
  const validation = toCompatValidation(state.validationSnapshot);
  const importResult = toCompatImportResult(state.importSnapshot);
  const importStatusCompat =
    state.importSnapshot.status === 'success'
      ? 'imported'
      : state.importSnapshot.status;
  const sourceManifest = {
    ...state.sourceManifest,
    aiJsonOriginalFilename:
      toTrimmed(state.sourceManifest?.aiJsonOriginalFilename) || path.basename(paths.aiJsonPath || ''),
    mappingCsvOriginalFilename:
      toTrimmed(state.sourceManifest?.mappingCsvOriginalFilename) || path.basename(paths.mappingCsvPath || ''),
    imageOriginalFilenames: paths.imageOriginalFilenames,
    imageCount: paths.imageCount,
    imagesIncluded: paths.imagesIncluded,
    storedFilePaths: {
      ...(state.sourceManifest?.storedFilePaths || {}),
      aiJsonPath: toRepoRelativePath(paths.aiJsonPath),
      mappingCsvPath: toRepoRelativePath(paths.mappingCsvPath),
      originalImagesDirPath: toRepoRelativePath(paths.imageDir),
      stagedImagesDirPath: toRepoRelativePath(layout.stagedImagesDir),
      imageKeyMappingCsvPath: toRepoRelativePath(layout.imageKeyMappingCsv),
    },
  };
  const destinationDefaults = await readBatchDestinationDefaults(paths, {
    reviewEnabled: Boolean(state.packageSnapshot?.structureSummary?.hasBatchManifest),
  });
  const summary = {
    id: state.identity.batchId,
    batchId: state.identity.batchId,
    databaseId: state.databaseId,
    batchDir: state.batchDir,
    name: state.identity.batchName,
    batchName: state.identity.batchName,
    createdAt,
    updatedAt,
    identity: {
      ...state.identity,
      createdAt,
      updatedAt,
    },
    sourceManifest,
    destinationDefaults,
    validationSnapshot: state.validationSnapshot,
    importSnapshot: state.importSnapshot,
    archiveState: state.archiveState,
    processingSummary: state.processingSummary,
    packageSnapshot: state.packageSnapshot,
    validationStatus: state.validationSnapshot.status,
    importLifecycleStatus: state.importSnapshot.status,
    importStatus: importStatusCompat,
    imagesIncluded: Boolean(paths.imagesIncluded),
    aiJsonPresent: Boolean(sourceManifest.aiJsonOriginalFilename) || hasJsonFile,
    mappingCsvPresent: Boolean(sourceManifest.mappingCsvOriginalFilename) || hasCsvFile,
    mappingRequired,
    hasJsonFile,
    hasCsvFile,
    hasMappingCsv,
    originalImagesCount,
    stagedImagesCount,
    localFolderPresent,
    localFolderMissing: !localFolderPresent,
    localReceipt,
    localFolderName: path.basename(state.batchDir),
    localFolderPath: state.batchDir,
    importedAt: state.importSnapshot.importedAt,
    importResult,
    validation,
  };

  if (includeImportedItems) {
    const importedItemsPage = await buildImportedItemsLedger(state, {
      limit: importedItemsLimit,
      offset: importedItemsOffset,
      sort: importedItemsSort,
    });
    summary.importedItemsPage = importedItemsPage;
    summary.importedItemCount = importedItemsPage.total;
  }

  return summary;
}

async function listIntakeBatches({ includeArchived = false } = {}) {
  const records = await findAllBatchRecords();
  const batches = await Promise.all(
    records
      .filter((record) => includeArchived || record.archiveState.status !== 'archived')
      .map((record) => summarizeIntakeBatch(record.batchDir))
  );

  return batches.sort((left, right) => {
    const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
    const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
    return rightTime - leftTime;
  });
}

async function getIntakeBatchById(batchId, options = {}) {
  const normalized = path.basename(toTrimmed(batchId));
  if (!normalized) {
    throw new Error('batchId is required');
  }

  const existing = await findBatchRecordByBatchId(normalized);
  if (existing) {
    return summarizeIntakeBatch(existing.batchDir, options);
  }
  throw new Error(`Batch not found: ${normalized}`);
}

async function saveUploadedAssetsToBatch(batchDir, uploadedFiles = {}) {
  const layout = await ensureBatchStructure(batchDir);
  const state = await readBatchState(batchDir);
  assertBatchActive(state);
  const images = Array.isArray(uploadedFiles.images) ? uploadedFiles.images : [];
  const jsonFile = uploadedFiles.jsonFile?.[0] || null;
  const csvFile = uploadedFiles.csvFile?.[0] || null;

  try {
    for (const file of images) {
      const originalName = path.basename(String(file.originalname || '').replace(/\\/g, '/'));
      const ext = path.extname(originalName).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) {
        throw new Error(`Unsupported image extension for ${originalName}`);
      }
      await moveUploadedFile(file.path, path.join(layout.originalImagesDir, originalName));
    }

    if (jsonFile) {
      const ext = path.extname(String(jsonFile.originalname || '')).toLowerCase();
      if (!JSON_EXTENSIONS.has(ext)) {
        throw new Error('JSON file must end in .json');
      }
      await moveUploadedFile(jsonFile.path, layout.mergedInventoryJson);
    }

    if (csvFile) {
      const ext = path.extname(String(csvFile.originalname || '')).toLowerCase();
      if (!CSV_EXTENSIONS.has(ext)) {
        throw new Error('CSV file must end in .csv');
      }
      await moveUploadedFile(csvFile.path, layout.imageOrderCsv);
    }

  } catch (error) {
    await cleanupUploadedFiles(flattenUploadedFiles(uploadedFiles));
    throw error;
  }

  await writeBatchState(batchDir, {
    sourceManifest: await buildSourceManifestPatch(
      batchDir,
      state.sourceManifest,
      uploadedFiles
    ),
    archiveState: {
      status: 'active',
      archivedAt: null,
      archiveReason: '',
      sourceFilesDeletedAt: null,
    },
  });

  logIntakeBatchEvent('batch assets updated', {
    batchId: state.identity.batchId,
    jsonUpdated: Boolean(jsonFile),
    csvUpdated: Boolean(csvFile),
    uploadedImageCount: images.length,
  });

  return getIntakeBatchById(path.basename(batchDir));
}

async function createIntakeBatch({ name = '', uploadedFiles = {} } = {}) {
  const batchId = createBatchId(name || 'batch');
  const batchDir = path.join(getExternalIntakeRoot(), batchId);
  await ensureBatchStructure(batchDir);
  await writeBatchState(batchDir, {
    identity: {
      batchId,
      batchName: toTrimmed(name) || batchId,
      createdAt: new Date().toISOString(),
    },
    archiveState: {
      status: 'active',
      archivedAt: null,
      archiveReason: '',
      sourceFilesDeletedAt: null,
    },
  });

  if (flattenUploadedFiles(uploadedFiles).length) {
    const batch = await saveUploadedAssetsToBatch(batchDir, uploadedFiles);
    logIntakeBatchEvent('batch created', {
      batchId: batch.batchId,
      batchName: batch.batchName,
      imagesIncluded: batch.imagesIncluded,
    });
    return batch;
  }

  const batch = await summarizeIntakeBatch(batchDir);
  logIntakeBatchEvent('batch created', {
    batchId: batch.batchId,
    batchName: batch.batchName,
    imagesIncluded: batch.imagesIncluded,
  });
  return batch;
}

function normalizeSimpleJsonItem(rawItem = {}) {
  if (!isPlainObject(rawItem)) {
    throw new Error('Simple intake JSON item must be an object.');
  }

  const name = toTrimmed(rawItem.name);
  if (!name) {
    throw new Error('Simple intake JSON item name is required.');
  }

  return {
    name,
    description: toTrimmed(rawItem.description),
    category: toTrimmed(rawItem.category) || 'miscellaneous',
    tags: Array.isArray(rawItem.tags) ? rawItem.tags : [],
    quantity: rawItem.quantity == null ? 1 : rawItem.quantity,
    location: toTrimmed(rawItem.location) || null,
    box: toTrimmed(rawItem.box) || null,
  };
}

function normalizeSimpleJsonPayload(rawPayload = {}) {
  if (Array.isArray(rawPayload)) {
    const items = rawPayload.map((item) => normalizeSimpleJsonItem(item));
    if (!items.length) {
      throw new Error('Simple intake JSON array must contain at least one item.');
    }
    return {
      batchContext: {
        source: 'simple_json_upload',
        itemCount: items.length,
        location: null,
        box: null,
      },
      items,
    };
  }

  if (!isPlainObject(rawPayload)) {
    throw new Error('Simple intake JSON must be an object or an array of item objects.');
  }

  if (Array.isArray(rawPayload.items)) {
    const batchContext = isPlainObject(rawPayload.batchContext) ? rawPayload.batchContext : {};
    const items = rawPayload.items.map((item) => normalizeSimpleJsonItem(item));
    if (!items.length) {
      throw new Error('Simple intake JSON items must contain at least one item.');
    }
    const defaultLocation = toTrimmed(batchContext.location) || null;
    const defaultBox = toTrimmed(batchContext.box) || null;

    return {
      ...rawPayload,
      batchContext: {
        ...batchContext,
        source: toTrimmed(batchContext.source) || 'simple_json_upload',
        itemCount: items.length,
        location: defaultLocation,
        box: defaultBox,
      },
      items: items.map((item) => ({
        ...item,
        location: item.location || defaultLocation,
        box: item.box || defaultBox,
      })),
    };
  }

  const item = normalizeSimpleJsonItem(rawPayload);
  return {
    batchContext: {
      source: 'simple_json_upload',
      itemCount: 1,
      location: item.location,
      box: item.box,
    },
    items: [item],
  };
}

async function createSimpleJsonIntakeBatch({ uploadedJsonFile = null } = {}) {
  if (!uploadedJsonFile?.path) {
    throw new Error('jsonFile upload is required.');
  }

  try {
    const ext = path.extname(String(uploadedJsonFile.originalname || '')).toLowerCase();
    if (!JSON_EXTENSIONS.has(ext)) {
      throw new Error('Simple intake upload must be a .json file.');
    }

    let rawPayload;
    try {
      rawPayload = JSON.parse(await fs.readFile(uploadedJsonFile.path, 'utf8'));
    } catch (error) {
      throw new Error(`Invalid simple intake JSON: ${error?.message || 'Unable to parse JSON.'}`);
    }

    const payload = normalizeSimpleJsonPayload(rawPayload);
    const firstItemName = toTrimmed(payload.items?.[0]?.name);
    const itemCount = Array.isArray(payload.items) ? payload.items.length : 0;
    const batchName =
      itemCount === 1 && firstItemName
        ? firstItemName
        : path.basename(String(uploadedJsonFile.originalname || 'simple-json'), ext);

    await fs.writeFile(uploadedJsonFile.path, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    const batch = await createIntakeBatch({
      name: batchName,
      uploadedFiles: {
        jsonFile: [uploadedJsonFile],
      },
    });

    logIntakeBatchEvent('simple json batch created', {
      batchId: batch.batchId,
      batchName: batch.batchName,
      itemCount,
    });

    return {
      ok: true,
      batch,
      itemCount,
      warnings: [],
      nextStepSuggestion: 'Simple JSON staged successfully. Validate the batch before import.',
    };
  } catch (error) {
    await cleanupUploadedFiles([uploadedJsonFile]);
    throw error;
  }
}

async function updateIntakeBatchAssets(batchId, uploadedFiles = {}) {
  const batch = await getIntakeBatchById(batchId);
  return saveUploadedAssetsToBatch(batch.batchDir, uploadedFiles);
}

async function updateIntakeBatchDestination(batchId, { location = null, box = null } = {}) {
  const batch = await getIntakeBatchById(batchId);
  assertBatchActive(batch);

  if (batch.importSnapshot?.status === 'success') {
    throw new Error('Destination defaults cannot be changed after a successful import.');
  }

  const paths = await resolveBatchOperationalPaths(batch);
  if (!paths.aiJsonPath || !await fileExists(paths.aiJsonPath)) {
    throw new Error('AI Intake Engine JSON is required before destination defaults can be reviewed.');
  }

  const payload = await safeReadJson(paths.aiJsonPath, null);
  if (!isPlainObject(payload)) {
    throw new Error('AI Intake Engine JSON must be an object before destination defaults can be reviewed.');
  }

  const normalizedLocation = toTrimmed(location) || null;
  const normalizedBox = toTrimmed(box) || null;
  const batchContext = isPlainObject(payload.batchContext) ? { ...payload.batchContext } : {};
  const items = Array.isArray(payload.items) ? payload.items : [];
  const nextItems = items.map((item) => {
    if (!isPlainObject(item)) return item;
    return {
      ...item,
      ...(normalizedLocation && !hasTextValue(item.location) ? { location: normalizedLocation } : {}),
      ...(normalizedBox && !hasTextValue(item.box) ? { box: normalizedBox } : {}),
    };
  });
  const nextPayload = {
    ...payload,
    batchContext: {
      ...batchContext,
      location: normalizedLocation,
      box: normalizedBox,
      destinationReviewed: true,
    },
    items: nextItems,
  };

  await fs.writeFile(paths.aiJsonPath, `${JSON.stringify(nextPayload, null, 2)}\n`, 'utf8');

  const defaults = defaultBatchState(batch.batchDir);
  await writeBatchState(batch.batchDir, {
    validationSnapshot: defaults.validationSnapshot,
    importSnapshot: defaults.importSnapshot,
  });

  logIntakeBatchEvent('batch destination reviewed', {
    batchId: batch.batchId,
    location: normalizedLocation,
    box: normalizedBox,
  });

  return getIntakeBatchById(batch.batchId, {
    includeImportedItems: true,
  });
}

async function updateIntakeBatchName(batchId, { name = '' } = {}) {
  const batch = await getIntakeBatchById(batchId);
  const nextName = toTrimmed(name);
  if (!nextName) {
    throw new Error('Batch name is required.');
  }

  await writeBatchState(batch.batchDir, {
    identity: {
      ...batch.identity,
      batchName: nextName,
    },
  });

  logIntakeBatchEvent('batch renamed', {
    batchId: batch.batchId,
    batchName: nextName,
  });

  return getIntakeBatchById(batch.batchId, {
    includeImportedItems: true,
  });
}

async function assertDestinationReviewResolved(batch, paths) {
  const destinationDefaults = await readBatchDestinationDefaults(paths, {
    reviewEnabled: Boolean(batch?.packageSnapshot?.structureSummary?.hasBatchManifest),
  });
  if (destinationDefaults.reviewRequired) {
    throw new Error('Batch destination must be reviewed before validation or import.');
  }
}

function buildFailedValidationSnapshot({
  existingSnapshot,
  errors = [],
  warnings = [],
  summary = null,
} = {}) {
  const validationWarnings = toArrayOfTrimmedStrings(warnings);
  const validationErrors = toArrayOfTrimmedStrings(errors);
  return {
    status: 'failed',
    validatedAt: new Date().toISOString(),
    totalItems: toNonNegativeInteger(summary?.totalItems, existingSnapshot?.totalItems || 0),
    itemsWithImageKeysCount: toNonNegativeInteger(
      summary?.itemsWithImageKeysCount,
      existingSnapshot?.itemsWithImageKeysCount || 0
    ),
    rowCount: toNonNegativeInteger(summary?.rowCount, existingSnapshot?.rowCount || 0),
    readyCount: toNonNegativeInteger(summary?.readyCount, 0),
    missingCount: toNonNegativeInteger(summary?.missingCount, 0),
    ambiguousCount: toNonNegativeInteger(summary?.ambiguousCount, 0),
    warningCount: validationWarnings.length,
    errorCount: validationErrors.length,
    csvSourceFilesCount: toNonNegativeInteger(
      summary?.csvSourceFilesCount,
      existingSnapshot?.csvSourceFilesCount || 0
    ),
    originalImageFilesCount: toNonNegativeInteger(summary?.originalImageFilesCount, 0),
    validationErrors,
    validationWarnings,
  };
}

async function validateIntakeBatch(batchId) {
  const batch = await getIntakeBatchById(batchId);
  assertBatchActive(batch);
  const paths = await resolveBatchOperationalPaths(batch);
  await assertDestinationReviewResolved(batch, paths);
  const startedAt = Date.now();
  logIntakeBatchEvent('batch validated start', {
    batchId: batch.batchId,
    batchDir: batch.batchDir,
    imagesIncluded: batch.imagesIncluded,
  });

  const missingErrors = [];
  if (!paths.aiJsonPath || !await fileExists(paths.aiJsonPath)) {
    missingErrors.push('AI Intake Engine JSON is required.');
  }
  if (paths.imagesIncluded && (!paths.mappingCsvPath || !await fileExists(paths.mappingCsvPath))) {
    missingErrors.push('Mapping CSV is required when images are included.');
  }

  if (missingErrors.length) {
    const snapshot = buildFailedValidationSnapshot({
      existingSnapshot: batch.validationSnapshot,
      errors: missingErrors,
    });
    await writeBatchState(batch.batchDir, {
      validationSnapshot: snapshot,
    });
    const nextBatch = await summarizeIntakeBatch(batch.batchDir);
    await writeBatchReceipt(nextBatch, {
      status: 'validation_failed',
      safeToDelete: false,
    });
    logIntakeBatchEvent('batch validated', {
      batchId: batch.batchId,
      status: snapshot.status,
      errorCount: snapshot.errorCount,
      warningCount: snapshot.warningCount,
      durationMs: Date.now() - startedAt,
    });
    return {
      batch: await summarizeIntakeBatch(batch.batchDir),
      validation: toCompatValidation(snapshot),
    };
  }

  let summary;
  try {
    summary = await summarizeBatch({
      jsonPath: paths.aiJsonPath,
      csvPath: paths.mappingCsvPath,
      sourceDir: paths.imageDir,
    });
  } catch (error) {
    const snapshot = buildFailedValidationSnapshot({
      existingSnapshot: batch.validationSnapshot,
      errors: [error?.message || 'Batch validation failed.'],
    });
    await writeBatchState(batch.batchDir, {
      validationSnapshot: snapshot,
    });
    const nextBatch = await summarizeIntakeBatch(batch.batchDir);
    await writeBatchReceipt(nextBatch, {
      status: 'validation_failed',
      safeToDelete: false,
    });
    logIntakeBatchEvent('batch validated', {
      batchId: batch.batchId,
      status: snapshot.status,
      errorCount: snapshot.errorCount,
      warningCount: snapshot.warningCount,
      durationMs: Date.now() - startedAt,
    });
    return {
      batch: await summarizeIntakeBatch(batch.batchDir),
      validation: toCompatValidation(snapshot),
    };
  }

  const validation = validateBatchSummary(summary);
  const snapshot = {
    status: validation.ok ? 'passed' : 'failed',
    validatedAt: new Date().toISOString(),
    totalItems: summary.totalItems,
    itemsWithImageKeysCount: summary.itemsWithImageKeysCount,
    rowCount: summary.rowCount,
    readyCount: summary.readyCount,
    missingCount: summary.missingCount,
    ambiguousCount: summary.ambiguousCount,
    warningCount: validation.warnings.length,
    errorCount: validation.errors.length,
    csvSourceFilesCount: summary.csvSourceFilesCount,
    originalImageFilesCount: summary.originalImageFilesCount,
    validationErrors: validation.errors,
    validationWarnings: validation.warnings,
  };

  await writeBatchState(batch.batchDir, {
    validationSnapshot: snapshot,
  });
  const summarizedBatch = await summarizeIntakeBatch(batch.batchDir);
  await writeBatchReceipt(summarizedBatch, {
    status: snapshot.status === 'passed' ? 'validated' : 'validation_failed',
    safeToDelete: false,
  });

  logIntakeBatchEvent('batch validated', {
    batchId: batch.batchId,
    status: snapshot.status,
    rowCount: snapshot.rowCount,
    readyCount: snapshot.readyCount,
    missingCount: snapshot.missingCount,
    ambiguousCount: snapshot.ambiguousCount,
    errorCount: snapshot.errorCount,
    warningCount: snapshot.warningCount,
    durationMs: Date.now() - startedAt,
  });

  return {
    batch: summarizedBatch,
    validation: toCompatValidation(snapshot),
  };
}

async function stageIntakeBatch(batchId) {
  const batch = await getIntakeBatchById(batchId);
  assertBatchActive(batch);
  const paths = await resolveBatchOperationalPaths(batch);
  await assertDestinationReviewResolved(batch, paths);
  const layout = paths.layout;
  const startedAt = Date.now();
  logIntakeBatchEvent('stage start', {
    batchId: batch.batchId,
    imagesIncluded: batch.imagesIncluded,
    stagedDir: layout.stagedImagesDir,
  });

  const result = await stageBatchImagesRunner({
    jsonPath: paths.aiJsonPath,
    csvPath: paths.mappingCsvPath,
    sourceDir: paths.imageDir,
    stagedDir: layout.stagedImagesDir,
    mappingCsvPath: layout.imageKeyMappingCsv,
  });

  await writeBatchState(batch.batchDir, {
    sourceManifest: {
      storedFilePaths: {
        imageKeyMappingCsvPath: toRepoRelativePath(layout.imageKeyMappingCsv),
      },
    },
  });

  logIntakeBatchEvent('stage success', {
    batchId: batch.batchId,
    stagedCount: result.stagedCount,
    itemsWithImageKeysCount: result.itemsWithImageKeysCount,
    sourceFilesCount: result.sourceFilesCount,
    durationMs: Date.now() - startedAt,
  });

  return {
    batch: await summarizeIntakeBatch(batch.batchDir),
    stageResult: {
      stagedCount: result.stagedCount,
      itemsWithImageKeysCount: result.itemsWithImageKeysCount,
      sourceFilesCount: result.sourceFilesCount,
    },
  };
}

function buildImportErrorSummary(result = {}, stageWarning = '') {
  const parts = [];
  if (stageWarning) parts.push(stageWarning);
  if (Array.isArray(result.validationErrors) && result.validationErrors.length) {
    parts.push(
      result.validationErrors
        .slice(0, 3)
        .map((entry) => toTrimmed(entry?.message || entry))
        .filter(Boolean)
        .join(' | ')
    );
  }
  return parts.filter(Boolean).join(' | ');
}

async function importIntakeBatch(batchId) {
  const batch = await getIntakeBatchById(batchId);
  assertBatchActive(batch);
  const paths = await resolveBatchOperationalPaths(batch);
  await assertDestinationReviewResolved(batch, paths);
  const layout = paths.layout;
  const startedAt = Date.now();
  const payload = await safeReadJson(paths.aiJsonPath, null);
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const itemsWithImageKeysCount = items.filter((item) => toTrimmed(item?.imageKey)).length;

  logIntakeBatchEvent('batch import started', {
    batchId: batch.batchId,
    batchDir: batch.batchDir,
    databaseId: batch.databaseId,
    itemCount: items.length,
    itemsWithImageKeysCount,
    imagesIncluded: batch.imagesIncluded,
    validationStatus: batch.validationStatus,
    pid: process.pid,
  });

  if (batch.validationStatus !== 'passed') {
    const error = new Error('Batch must pass validation before import.');
    await writeBatchReceipt(batch, {
      status: 'import_failed',
      safeToDelete: false,
    });
    throw error;
  }

  if (!paths.aiJsonPath || !await fileExists(paths.aiJsonPath)) {
    const error = new Error('AI Intake Engine JSON is required.');
    await writeBatchReceipt(batch, {
      status: 'import_failed',
      safeToDelete: false,
    });
    throw error;
  }

  if (paths.imagesIncluded && (!paths.mappingCsvPath || !await fileExists(paths.mappingCsvPath))) {
    const error = new Error('Mapping CSV is required when images are included.');
    await writeBatchReceipt(batch, {
      status: 'import_failed',
      safeToDelete: false,
    });
    throw error;
  }

  const jsonText = await fs.readFile(paths.aiJsonPath, 'utf8');
  let stageWarning = '';
  let importImages = [];

  if (itemsWithImageKeysCount > 0 && batch.imagesIncluded) {
    try {
      await stageIntakeBatch(batch.batchId);
      const stagedEntries = await fs.readdir(layout.stagedImagesDir, { withFileTypes: true });
      importImages = stagedEntries
        .filter((entry) => entry.isFile())
        .map((entry) => ({
          originalname: entry.name,
          path: path.join(layout.stagedImagesDir, entry.name),
          mimetype: inferMimeType(entry.name),
        }));
    } catch (error) {
      stageWarning = `Image staging skipped during import: ${error?.message || 'Unknown staging error.'}`;
      logIntakeBatchEvent('batch import staging skipped', {
        batchId: batch.batchId,
        reason: stageWarning,
      });
      importImages = [];
    }
  }

  let result;
  try {
    result = await importAiJsonItemsRunner({
      jsonText,
      importImages,
      sourceBatchId: batch.databaseId || null,
    });
  } catch (error) {
    await writeBatchReceipt(batch, {
      status: 'import_failed',
      safeToDelete: false,
    });
    throw error;
  }

  const importStatus = result.status === 'success' ? 'success' : 'failed';
  const importSnapshot = {
    status: importStatus,
    importedAt: new Date().toISOString(),
    createdItemCount: toNonNegativeInteger(result.createdCount, 0),
    updatedItemCount: 0,
    skippedItemCount: 0,
    failedItemCount: toNonNegativeInteger(result.failedCount, 0),
    importedItemIds: toArrayOfTrimmedStrings(result.createdItemIds),
    importErrorSummary: buildImportErrorSummary(result, stageWarning),
  };

  const persistedBatchState = await writeBatchState(batch.batchDir, {
    importSnapshot,
  });
  const importedLedger = await buildImportedItemsLedger(persistedBatchState, {
    limit: null,
    sort: 'name',
  });
  const nextProcessingSummary = deriveBatchProcessingSummary(
    importedLedger.items,
    persistedBatchState.processingSummary
  );
  if (!processingSummariesEqual(nextProcessingSummary, persistedBatchState.processingSummary)) {
    await writeBatchState(batch.batchDir, {
      processingSummary: nextProcessingSummary,
    });
  }

  if (importStatus === 'success') {
    const nextBatch = await summarizeIntakeBatch(batch.batchDir);
    await writeBatchReceipt(nextBatch, {
      status: 'imported',
      safeToDelete: true,
    });
    logIntakeBatchEvent('batch import completed', {
      batchId: batch.batchId,
      status: importStatus,
      createdItemCount: importSnapshot.createdItemCount,
      failedItemCount: importSnapshot.failedItemCount,
      durationMs: Date.now() - startedAt,
    });
  } else {
    const nextBatch = await summarizeIntakeBatch(batch.batchDir);
    await writeBatchReceipt(nextBatch, {
      status: 'import_failed',
      safeToDelete: false,
    });
    logIntakeBatchEvent('batch import failed', {
      batchId: batch.batchId,
      status: importStatus,
      createdItemCount: importSnapshot.createdItemCount,
      failedItemCount: importSnapshot.failedItemCount,
      errorSummary: importSnapshot.importErrorSummary,
      durationMs: Date.now() - startedAt,
    });
  }

  return {
    batch: await summarizeIntakeBatch(batch.batchDir),
    importResult: result,
  };
}

function normalizePackageManifest(rawManifest) {
  if (isPlainObject(rawManifest)) {
    return rawManifest;
  }

  const manifestText = toTrimmed(rawManifest);
  if (!manifestText) {
    return {};
  }

  try {
    const parsed = JSON.parse(manifestText);
    if (!isPlainObject(parsed)) {
      throw new Error('manifest must be a JSON object');
    }
    return parsed;
  } catch (error) {
    throw new Error(`Invalid package manifest: ${error?.message || 'Unable to parse manifest JSON.'}`);
  }
}

function buildPackageReceiptAdvice({ batch, validation = null, importResult = null, status = '' } = {}) {
  const nextStatus = toTrimmed(status)
    || (importResult?.status === 'success'
      ? 'imported'
      : batch?.validationStatus === 'passed'
        ? 'validated'
        : batch?.validationStatus === 'failed'
          ? 'validation_failed'
          : 'received');

  return {
    status: nextStatus,
    safeToDelete: nextStatus === 'imported',
    batchRecordId: toTrimmed(batch?.databaseId),
    batchId: toTrimmed(batch?.batchId),
    batchLabel: toTrimmed(batch?.batchName || batch?.name),
    validatedAt: batch?.validationSnapshot?.validatedAt || null,
    importedAt: batch?.importSnapshot?.importedAt || null,
    summaryCounts: buildReceiptSummaryCounts(batch || {}),
  };
}

function validateObservedPackageStructure(entries = []) {
  const warnings = [];
  const errors = [];
  const safeEntries = [];

  for (const entry of entries) {
    if (isUnsafeZipEntry(entry)) {
      errors.push(`Unsafe zip entry rejected: ${entry}`);
      continue;
    }
    if (shouldIgnoreZipEntry(entry)) {
      warnings.push(`Ignored zip entry: ${entry}`);
      continue;
    }
    safeEntries.push(normalizeZipEntryPath(entry));
  }

  const normalizedSet = new Set(safeEntries);
  const hasBatchManifest = normalizedSet.has(PACKAGE_FILES.batchManifest);
  const hasManifest = normalizedSet.has(PACKAGE_FILES.manifest);
  const hasAiIntakeJson = normalizedSet.has(PACKAGE_FILES.aiIntakeJson);
  const hasImportReadyJson = normalizedSet.has(PACKAGE_FILES.importReadyJson);
  const hasCollageManifestJson = normalizedSet.has(PACKAGE_FILES.collageManifestJson);
  const hasLegacyMappingCsv = normalizedSet.has(PACKAGE_FILES.legacyCsv);
  const hasImageOrderCsv = normalizedSet.has(PACKAGE_FILES.imageOrderCsv);
  const hasOrderCsv = normalizedSet.has(PACKAGE_FILES.orderCsv);
  const imageEntries = safeEntries.filter((entry) => (
    entry.startsWith(`${PACKAGE_FILES.legacyImagesDir}/`)
      && !entry.endsWith('/')
  ));
  const resolvedImagesDir = imageEntries.length ? PACKAGE_FILES.legacyImagesDir : '';

  if (!hasBatchManifest) {
    errors.push(`Missing required package file: ${PACKAGE_FILES.batchManifest}`);
  }

  const obsoleteRootEntries = [
    hasManifest ? PACKAGE_FILES.manifest : '',
    hasAiIntakeJson ? PACKAGE_FILES.aiIntakeJson : '',
    hasImportReadyJson ? PACKAGE_FILES.importReadyJson : '',
    hasLegacyMappingCsv ? PACKAGE_FILES.legacyCsv : '',
    hasImageOrderCsv ? PACKAGE_FILES.imageOrderCsv : '',
    hasOrderCsv ? PACKAGE_FILES.orderCsv : '',
  ].filter(Boolean);
  if (obsoleteRootEntries.length) {
    errors.push(
      `Obsolete package files are no longer accepted: ${obsoleteRootEntries.join(', ')}. Use ${PACKAGE_FILES.batchManifest}.`
    );
  }

  const unexpectedRootEntries = safeEntries.filter((entry) => {
    const root = entry.split('/')[0];
    return ![
      PACKAGE_FILES.batchManifest,
      PACKAGE_FILES.manifest,
      PACKAGE_FILES.aiIntakeJson,
      PACKAGE_FILES.importReadyJson,
      PACKAGE_FILES.collageManifestJson,
      PACKAGE_FILES.legacyCsv,
      PACKAGE_FILES.imageOrderCsv,
      PACKAGE_FILES.orderCsv,
      PACKAGE_FILES.legacyImagesDir,
    ].includes(root);
  });

  if (unexpectedRootEntries.length > 0) {
    warnings.push(`Unexpected root entries ignored: ${unexpectedRootEntries.join(', ')}`);
  }

  return {
    warnings,
    errors,
    summary: {
      entries: safeEntries,
      hasBatchManifest,
      hasManifest,
      hasAiJson: hasAiIntakeJson || hasImportReadyJson,
      hasAiIntakeJson,
      hasImportReadyJson,
      hasCollageManifestJson,
      hasMappingCsv: hasLegacyMappingCsv || hasImageOrderCsv || hasOrderCsv,
      hasLegacyMappingCsv,
      hasImageOrderCsv,
      hasOrderCsv,
      imagesIncluded: imageEntries.length > 0,
      imageCount: imageEntries.length,
      imageEntries,
      imagesDir: resolvedImagesDir,
      intakeJsonFile: '',
      mappingCsvFile: '',
      ignoredEntryCount: warnings.length,
    },
  };
}

function csvEscape(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

async function writePackageImageOrderCsv(items = [], csvPath) {
  const header = 'index,file_name\n';
  const body = items
    .map((item, index) => [
      index + 1,
      toTrimmed(item.imageFile),
    ].map(csvEscape).join(','))
    .join('\n');
  await fs.writeFile(csvPath, `${header}${body}${body ? '\n' : ''}`, 'utf8');
}

function normalizeBatchManifestItem(rawItem = {}, index = 0, defaults = {}) {
  if (!isPlainObject(rawItem)) {
    throw new Error(`batch_manifest.items[${index}] must be an object.`);
  }

  const imageFile = toTrimmed(rawItem.imageFile || rawItem.sourceFile);
  const imageKey = toTrimmed(rawItem.imageKey) || (imageFile ? path.basename(imageFile, path.extname(imageFile)) : '');
  const expectedImageKey = imageFile ? path.basename(imageFile, path.extname(imageFile)) : imageKey;
  const name = toTrimmed(rawItem.name);

  if (!imageFile) {
    throw new Error(`batch_manifest.items[${index}].imageFile is required.`);
  }
  if (!IMAGE_EXTENSIONS.has(path.extname(imageFile).toLowerCase())) {
    throw new Error(`batch_manifest.items[${index}].imageFile must be a supported image filename.`);
  }
  if (imageKey !== expectedImageKey) {
    throw new Error(
      `batch_manifest.items[${index}].imageKey must match image filename basename "${expectedImageKey}".`
    );
  }
  if (!name) {
    throw new Error(`batch_manifest.items[${index}].name is required.`);
  }

  return {
    imageFile,
    item: {
      name,
      description: toTrimmed(rawItem.description),
      category: toTrimmed(rawItem.category) || 'miscellaneous',
      tags: Array.isArray(rawItem.tags) ? rawItem.tags : [],
      quantity: rawItem.quantity == null ? 1 : rawItem.quantity,
      location: toTrimmed(rawItem.location) || defaults.location || null,
      box: toTrimmed(rawItem.box) || defaults.box || null,
      imageKey,
    },
  };
}

async function materializeBatchManifestPackage(extractionDir, structureSummary = {}) {
  const batchManifestPath = path.join(extractionDir, PACKAGE_FILES.batchManifest);
  const batchManifest = await safeReadJson(batchManifestPath, null);

  if (!isPlainObject(batchManifest)) {
    throw new Error(`${PACKAGE_FILES.batchManifest} must be a JSON object.`);
  }
  if (toTrimmed(batchManifest.app || 'discowarpcore') !== 'discowarpcore') {
    throw new Error('batch_manifest.app must be "discowarpcore" when provided.');
  }
  if (batchManifest.packageVersion != null && Number(batchManifest.packageVersion) !== 2) {
    throw new Error(`batch_manifest.packageVersion must be 2, got "${batchManifest.packageVersion}".`);
  }

  const rawItems = Array.isArray(batchManifest.items) ? batchManifest.items : [];
  if (!rawItems.length) {
    throw new Error('batch_manifest.items must contain at least one item.');
  }

  const defaults = {
    location: toTrimmed(batchManifest?.target?.location || batchManifest?.batchContext?.location),
    box: toTrimmed(batchManifest?.target?.box || batchManifest?.batchContext?.box),
  };
  const normalized = rawItems.map((item, index) => normalizeBatchManifestItem(item, index, defaults));
  const declaredImageFiles = normalized.map((entry) => entry.imageFile);
  const observedImageFiles = new Set(
    (structureSummary.imageEntries || []).map((entry) => path.basename(entry))
  );
  const missingImages = declaredImageFiles.filter((imageFile) => !observedImageFiles.has(imageFile));
  if (missingImages.length) {
    throw new Error(`batch_manifest references missing image file(s): ${missingImages.join(', ')}`);
  }

  const payload = {
    batchContext: {
      source: toTrimmed(batchManifest?.batchContext?.source || batchManifest?.source?.createdByTool) || 'vision_intake',
      itemCount: normalized.length,
      location: defaults.location || null,
      box: defaults.box || null,
    },
    items: normalized.map((entry) => entry.item),
  };
  await fs.writeFile(path.join(extractionDir, PACKAGE_FILES.aiIntakeJson), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await writePackageImageOrderCsv(normalized, path.join(extractionDir, PACKAGE_FILES.legacyCsv));

  const manifest = {
    packageVersion: 1,
    app: 'discowarpcore',
    batchLabel:
      toTrimmed(batchManifest.batchLabel)
      || toTrimmed(batchManifest.displayName)
      || toTrimmed(batchManifest.batchId)
      || path.basename(extractionDir),
    createdAt: toTrimmed(batchManifest.createdAt) || new Date().toISOString(),
    sourceMachine: toTrimmed(batchManifest.sourceMachine || batchManifest?.source?.sourceMachine),
    operator: toTrimmed(batchManifest.operator || batchManifest?.source?.operator),
    files: {
      aiIntakeJson: PACKAGE_FILES.aiIntakeJson,
      imageMappingCsv: PACKAGE_FILES.legacyCsv,
      imagesDir: structureSummary.imagesDir || PACKAGE_FILES.legacyImagesDir,
    },
    images: {
      included: true,
      count: normalized.length,
    },
    metadata: {
      createdByTool: toTrimmed(batchManifest?.source?.createdByTool) || 'batch_manifest',
      sourceFormat: PACKAGE_FILES.batchManifest,
    },
  };

  return {
    manifest,
    structureSummary: {
      ...structureSummary,
      hasManifest: true,
      hasAiJson: true,
      hasAiIntakeJson: true,
      hasMappingCsv: true,
      hasLegacyMappingCsv: true,
      intakeJsonFile: PACKAGE_FILES.aiIntakeJson,
      mappingCsvFile: PACKAGE_FILES.legacyCsv,
      hasBatchManifest: true,
      batchManifestFile: PACKAGE_FILES.batchManifest,
    },
  };
}

async function stageBatchFromPackageExtraction({
  extractionDir,
  originalPackageFilename = '',
  structureSummary = {},
  manifest = {},
}) {
  const intakeJsonFile = toTrimmed(structureSummary.intakeJsonFile) || PACKAGE_FILES.aiIntakeJson;
  const mappingCsvFile = toTrimmed(structureSummary.mappingCsvFile);
  const imagesDirName = toTrimmed(structureSummary.imagesDir);
  const uploadedFiles = {
    jsonFile: [{
      path: path.join(extractionDir, intakeJsonFile),
      originalname:
        toTrimmed(manifest?.metadata?.sourceJsonFilename)
        || toTrimmed(manifest?.artifacts?.importReady)
        || intakeJsonFile,
    }],
  };

  const csvPath = mappingCsvFile ? path.join(extractionDir, mappingCsvFile) : '';
  if (csvPath && await fileExists(csvPath)) {
    uploadedFiles.csvFile = [{
      path: csvPath,
      originalname:
        toTrimmed(manifest?.metadata?.sourceCsvFilename)
        || toTrimmed(manifest?.artifacts?.orderCsv)
        || mappingCsvFile,
    }];
  }

  const imagesDir = imagesDirName ? path.join(extractionDir, imagesDirName) : '';
  const imageEntries = imagesDir ? await listFiles(imagesDir, null) : [];
  if (imageEntries.length > 0) {
    uploadedFiles.images = imageEntries.map((entry) => ({
      path: path.join(imagesDir, entry),
      originalname: entry,
    }));
  }

  const batch = await createIntakeBatch({
    name:
      toTrimmed(manifest?.batchLabel)
      || toTrimmed(manifest?.displayName)
      || toTrimmed(manifest?.batchId)
      || path.basename(extractionDir),
    uploadedFiles,
  });

  await writeBatchState(batch.batchDir, {
    packageSnapshot: {
      ingestedAt: new Date().toISOString(),
      originalPackageFilename: toTrimmed(originalPackageFilename),
      manifest,
      structureSummary,
    },
  });

  return getIntakeBatchById(batch.batchId);
}

async function ingestIntakeBatchPackage({
  manifest = {},
  uploadedFiles = {},
  autoValidate = true,
  autoImport = true,
} = {}) {
  const normalizedManifest = normalizePackageManifest(manifest);
  const normalizedAutoValidate = parseBooleanFlag(autoValidate, true);
  const normalizedAutoImport = parseBooleanFlag(autoImport, true);
  const batchLabel =
    toTrimmed(normalizedManifest.batchLabel)
    || toTrimmed(normalizedManifest.batchFolderName)
    || 'batch';

  if (normalizedAutoImport && !normalizedAutoValidate) {
    throw new Error('autoImport requires autoValidate.');
  }

  const batch = await createIntakeBatch({
    name: batchLabel,
    uploadedFiles,
  });

  let nextBatch = batch;
  let validation = null;
  let importResult = null;
  let ingestStatus = 'received';

  if (normalizedAutoValidate) {
    const validationResult = await validateIntakeBatch(batch.batchId);
    nextBatch = validationResult.batch;
    validation = validationResult.validation;
    ingestStatus = nextBatch.validationStatus === 'passed' ? 'validated' : 'validation_failed';
  }

  if (normalizedAutoImport && nextBatch.validationStatus === 'passed') {
    const importResponse = await importIntakeBatch(nextBatch.batchId);
    nextBatch = importResponse.batch;
    importResult = importResponse.importResult;
    ingestStatus = importResult?.status === 'success' ? 'imported' : 'import_failed';
  }

  return {
    batch: nextBatch,
    validation,
    importResult,
    packageIngest: {
      status: ingestStatus,
      manifest: normalizedManifest,
      autoValidate: normalizedAutoValidate,
      autoImport: normalizedAutoImport,
    },
    receiptAdvice: buildPackageReceiptAdvice({
      batch: nextBatch,
      validation,
      importResult,
      status: ingestStatus,
    }),
  };
}

async function ingestIntakeBatchPackageArchiveFromFile(zipFilePath, {
  originalPackageFilename = '',
} = {}) {
  const absoluteZipPath = path.resolve(String(zipFilePath || ''));
  const uploadExists = await fileExists(absoluteZipPath);
  if (!uploadExists) {
    throw new Error(`Package zip not found: ${absoluteZipPath}`);
  }

  await fs.mkdir(PACKAGE_TEMP_ROOT, { recursive: true });
  const ingestRoot = await fs.mkdtemp(path.join(PACKAGE_TEMP_ROOT, 'package-'));
  const uploadedZipPath = path.join(ingestRoot, toTrimmed(originalPackageFilename) || path.basename(absoluteZipPath));
  const extractDir = path.join(ingestRoot, 'extracted');
  let cleanupSafe = false;

  logIntakeBatchEvent('package ingest received', {
    zipFilePath: absoluteZipPath,
    originalPackageFilename: toTrimmed(originalPackageFilename) || path.basename(absoluteZipPath),
  });

  try {
    await fs.mkdir(ingestRoot, { recursive: true });
    await fs.copyFile(absoluteZipPath, uploadedZipPath);

    const entries = await listZipEntries(uploadedZipPath);
    const structureValidation = validateObservedPackageStructure(entries);

    if (structureValidation.errors.length > 0) {
      logIntakeBatchEvent('package structure validation failed', {
        zipFilePath: absoluteZipPath,
        errors: structureValidation.errors,
      });
      return {
        ok: false,
        batchId: '',
        batchLabel: '',
        packageStructureSummary: structureValidation.summary,
        requiredAssetsFound: false,
        imagePresenceCount: structureValidation.summary.imageCount,
        warnings: structureValidation.warnings,
        errors: structureValidation.errors,
        nextStepSuggestion: 'Fix the package structure and try uploading again.',
      };
    }

    logIntakeBatchEvent('package unzip started', {
      zipFilePath: absoluteZipPath,
      ingestRoot,
    });
    await unzipArchive(uploadedZipPath, extractDir);
    logIntakeBatchEvent('package unzip completed', {
      zipFilePath: absoluteZipPath,
      extractDir,
    });

    let materializedPackage;
    try {
      materializedPackage = await materializeBatchManifestPackage(extractDir, structureValidation.summary);
    } catch (error) {
      logIntakeBatchEvent('package manifest validation failed', {
        zipFilePath: absoluteZipPath,
        errors: [error?.message || 'Invalid batch manifest.'],
      });
      return {
        ok: false,
        batchId: '',
        batchLabel: '',
        packageStructureSummary: structureValidation.summary,
        requiredAssetsFound: false,
        imagePresenceCount: structureValidation.summary.imageCount,
        warnings: structureValidation.warnings,
        errors: [error?.message || 'Invalid batch manifest.'],
        nextStepSuggestion: 'Fix the manifest contents and try uploading again.',
      };
    }

    const batch = await stageBatchFromPackageExtraction({
      extractionDir: extractDir,
      originalPackageFilename: toTrimmed(originalPackageFilename) || path.basename(absoluteZipPath),
      structureSummary: materializedPackage.structureSummary,
      manifest: materializedPackage.manifest,
    });

    cleanupSafe = true;
    logIntakeBatchEvent('batch staging record created from package', {
      batchId: batch.batchId,
      batchLabel: batch.batchName,
      originalPackageFilename: toTrimmed(originalPackageFilename) || path.basename(absoluteZipPath),
    });

    return {
      ok: true,
      batchId: batch.batchId,
      batchLabel: batch.batchName,
      batch,
      packageStructureSummary: materializedPackage.structureSummary,
      requiredAssetsFound: true,
      imagePresenceCount: materializedPackage.structureSummary.imageCount,
      warnings: structureValidation.warnings,
      errors: [],
      nextStepSuggestion: 'Package staged successfully. Validate the batch before import.',
    };
  } finally {
    if (cleanupSafe) {
      await fs.rm(ingestRoot, { recursive: true, force: true });
      logIntakeBatchEvent('package ingest temp cleanup completed', {
        ingestRoot,
      });
    } else {
      logIntakeBatchEvent('package ingest temp preserved for debugging', {
        ingestRoot,
      });
    }
  }
}

async function processIntakeBatchSelectedItems(batchId, {
  itemIds = [],
  renderTokens = undefined,
} = {}) {
  const batch = await getIntakeBatchById(batchId);
  const normalizedItemIds = Array.from(new Set(
    (Array.isArray(itemIds) ? itemIds : [])
      .map((value) => toTrimmed(value))
      .filter(Boolean)
  ));

  if (!normalizedItemIds.length) {
    throw new Error('Select at least one imported item to process.');
  }

  const validSelectedIds = toObjectIdStrings(normalizedItemIds);
  if (validSelectedIds.length !== normalizedItemIds.length) {
    throw new Error('One or more selected item ids are invalid.');
  }

  const batchState = await readBatchState(batch.batchDir);
  const selectedLedger = await buildImportedItemsLedger(batchState, {
    selectedItemIds: validSelectedIds,
    limit: null,
    sort: 'name',
  });
  const selectedItems = Array.isArray(selectedLedger?.items) ? selectedLedger.items : [];

  if (selectedItems.length !== validSelectedIds.length) {
    throw new Error('One or more selected items do not belong to this batch.');
  }

  const renderTokenValidation = validateRenderTokens(renderTokens, {
    fallbackTokens: DEFAULT_RENDER_TOKENS,
  });
  if (!renderTokenValidation.isValid) {
    throw new Error(renderTokenValidation.errors[0] || 'Invalid render token selection.');
  }
  const normalizedRenderTokens = renderTokenValidation.renderTokens;

  const processableItems = selectedItems.filter((item) => item?.processing?.isProcessable);
  let skippedAlreadyProcessedCount = selectedItems.filter(
    (item) => item?.processing?.status === 'processed'
  ).length;
  let skippedMissingOriginalCount = selectedItems.filter(
    (item) => item?.processing?.status === 'unavailable'
  ).length;
  let skippedInFlightCount = selectedItems.filter((item) =>
    ['queued', 'processing'].includes(item?.processing?.status)
  ).length;

  logIntakeBatchEvent('batch processing request received', {
    batchId: batch.batchId,
    databaseId: batch.databaseId,
    selectedItemCount: selectedItems.length,
    skippedAlreadyProcessedCount,
    skippedMissingOriginalCount,
    skippedInFlightCount,
    renderTokens: normalizedRenderTokens,
  });

  if (!processableItems.length) {
    throw new Error('No processable items selected. Already processed, unavailable, or already queued items were skipped.');
  }

  let queuedCount = 0;
  let failedCount = 0;
  const jobIds = [];
  const failures = [];

  for (const item of processableItems) {
    try {
      const mediaState = await ensureItemMediaStateRunner(item.id);
      if (!mediaState?.mediaId) {
        skippedMissingOriginalCount += 1;
        continue;
      }

      const queued = await enqueueMediaProcessingJobByIdRunner(
        mediaState.mediaId,
        undefined,
        normalizedRenderTokens,
        false,
        { batchId: batch.batchId }
      );

      if (queued?.skipped) {
        if (queued?.skipReason === 'already_complete') {
          skippedAlreadyProcessedCount += 1;
        } else {
          skippedInFlightCount += 1;
        }
        continue;
      }

      if (queued?.job?.id) {
        jobIds.push(queued.job.id);
      }
      queuedCount += 1;
    } catch (error) {
      failedCount += 1;
      failures.push({
        itemId: item.id,
        itemName: item.name,
        message: error?.message || 'Failed to queue processing.',
      });
    }
  }

  const lastRequestedAt = new Date().toISOString();
  const fullLedgerAfterQueue = await buildImportedItemsLedger(batchState, {
    limit: null,
    sort: 'name',
  });
  const nextProcessingSummary = deriveBatchProcessingSummary(
    fullLedgerAfterQueue.items,
    batch.processingSummary,
    { lastRequestedAt }
  );
  await writeBatchState(batch.batchDir, {
    processingSummary: nextProcessingSummary,
  });
  const nextBatch = await getIntakeBatchById(batchId, {
    includeImportedItems: true,
    importedItemsLimit: 50,
    importedItemsOffset: 0,
    importedItemsSort: 'name',
  });

  logIntakeBatchEvent('batch processing request completed', {
    batchId: batch.batchId,
    selectedItemCount: selectedItems.length,
    processableItemCount: processableItems.length,
    queuedCount,
    skippedAlreadyProcessedCount,
    skippedMissingOriginalCount,
    skippedInFlightCount,
    failedCount,
    renderTokens: normalizedRenderTokens,
  });

  return {
    batch: nextBatch,
    processingRequest: {
      selectedItemCount: selectedItems.length,
      processableItemCount: processableItems.length,
      queuedCount,
      skippedAlreadyProcessedCount,
      skippedMissingOriginalCount,
      skippedInFlightCount,
      failedCount,
      renderTokens: normalizedRenderTokens,
      jobIds,
      failures,
    },
  };
}

async function deleteIntakeBatch(batchId) {
  const batch = await getIntakeBatchById(batchId);
  if (batch.importLifecycleStatus !== 'success') {
    throw new Error('Only imported batches can be archived.');
  }
  const archivedAt = new Date().toISOString();

  await fs.rm(batch.batchDir, { recursive: true, force: true });
  await writeBatchState(batch.batchDir, {
    archiveState: {
      status: 'archived',
      archivedAt,
      archiveReason: 'archived_by_user',
      sourceFilesDeletedAt: archivedAt,
    },
  });

  return {
    id: batch.id,
    deleted: true,
    archived: true,
    batch: await summarizeIntakeBatch(batch.batchDir),
  };
}

async function findBatchOwnedItems(batch = {}) {
  const membershipClauses = [];
  const importedItemIds = toObjectIdStrings(batch?.importSnapshot?.importedItemIds);

  if (importedItemIds.length) {
    membershipClauses.push({ _id: { $in: importedItemIds } });
  }

  if (batch?.databaseId) {
    membershipClauses.push({ sourceBatchId: batch.databaseId });
  }

  if (!membershipClauses.length) {
    return [];
  }

  return itemModel.find({ $or: membershipClauses })
    .select('_id image imagePath sourceBatchId')
    .lean();
}

async function permanentlyDeleteIntakeBatch(batchId) {
  const batch = await getIntakeBatchById(batchId);
  const ownedItems = await findBatchOwnedItems(batch);
  const itemIds = ownedItems
    .map((item) => toTrimmed(item?._id || item?.id))
    .filter(Boolean);
  const mediaIds = ownedItems
    .map((item) => toTrimmed(item?.image?.mediaId))
    .filter(Boolean);
  const imagePaths = ownedItems.flatMap((item) => collectImageStoragePaths(item));

  if (itemIds.length) {
    await boxModel.updateMany(
      { items: { $in: itemIds } },
      { $pull: { items: { $in: itemIds } } }
    );
  }

  const mediaCleanup = await safeDeleteMediaFiles(imagePaths, {
    label: `batch-delete:${batch.batchId}`,
  });

  if (mediaIds.length) {
    await mediaStateModel.deleteMany({ mediaId: { $in: mediaIds } });
  }

  if (itemIds.length) {
    await itemModel.deleteMany({ _id: { $in: itemIds } });
  }

  await batchModel.deleteOne({ 'identity.batchId': batch.batchId });
  await fs.rm(batch.batchDir, { recursive: true, force: true });

  return {
    id: batch.id,
    deleted: true,
    archived: false,
    batchId: batch.batchId,
    batchName: batch.name,
    deletedItemCount: itemIds.length,
    deletedMediaStateCount: mediaIds.length,
    deletedMediaFileCount: mediaCleanup.deleted,
  };
}

async function recreateIntakeBatchLocalFolder(batchId) {
  const batch = await getIntakeBatchById(batchId);
  if (batch.isArchived) {
    throw new Error('Archived batches cannot recreate a local staging folder.');
  }

  await ensureBatchStructure(batch.batchDir);
  const nextBatch = await summarizeIntakeBatch(batch.batchDir);

  logIntakeBatchEvent('local staging folder recreated', {
    batchId: batch.batchId,
    batchDir: batch.batchDir,
  });

  return {
    batch: nextBatch,
    recreated: true,
  };
}

function __setIntakeBatchServiceHandlersForTests(handlers = {}) {
  if (handlers.batchModel) {
    batchModel = handlers.batchModel;
  }
  if (handlers.itemModel) {
    itemModel = handlers.itemModel;
  }
  if (handlers.boxModel) {
    boxModel = handlers.boxModel;
  }
  if (handlers.mediaStateModel) {
    mediaStateModel = handlers.mediaStateModel;
  }
  if (typeof handlers.stageBatchImages === 'function') {
    stageBatchImagesRunner = handlers.stageBatchImages;
  }
  if (typeof handlers.importAiJsonItems === 'function') {
    importAiJsonItemsRunner = handlers.importAiJsonItems;
  }
  if (typeof handlers.ensureItemMediaState === 'function') {
    ensureItemMediaStateRunner = handlers.ensureItemMediaState;
  }
  if (typeof handlers.enqueueMediaProcessingJobById === 'function') {
    enqueueMediaProcessingJobByIdRunner = handlers.enqueueMediaProcessingJobById;
  }
}

function __resetIntakeBatchServiceHandlersForTests() {
  batchModel = Batch;
  itemModel = Item;
  boxModel = Box;
  mediaStateModel = MediaState;
  stageBatchImagesRunner = stageBatchImages;
  importAiJsonItemsRunner = importAiJsonItems;
  ensureItemMediaStateRunner = ensureItemMediaState;
  enqueueMediaProcessingJobByIdRunner = enqueueMediaProcessingJobById;
}

module.exports = {
  listIntakeBatches,
  getIntakeBatchById,
  createIntakeBatch,
  createSimpleJsonIntakeBatch,
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
  __hydrateBatchRecordFromFilesystemForTests: hydrateBatchRecordFromFilesystem,
  __setIntakeBatchServiceHandlersForTests,
  __resetIntakeBatchServiceHandlersForTests,
};
