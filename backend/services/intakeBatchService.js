const fs = require('fs/promises');
const path = require('path');

const {
  BATCHES_ROOT,
  createBatchId,
  ensureBatchStructure,
  getBatchLayout,
  toTrimmed,
} = require('../../scripts/intakeWorkspace');
const { summarizeBatch, validateBatchSummary } = require('../../scripts/validate_intake_batch');
const { stageBatchImages } = require('../../scripts/stage_imagekey_files');
const { importAiJsonItems } = require('./aiJsonImportService');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic']);
const JSON_EXTENSIONS = new Set(['.json']);
const CSV_EXTENSIONS = new Set(['.csv']);

function logIntakeBatchEvent(event, details = {}) {
  console.info(`[intakeBatchService] ${event}`, details);
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

async function safeReadJson(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeBatchState(batchDir, patch = {}) {
  const layout = getBatchLayout(batchDir);
  const existing = (await safeReadJson(layout.stateJson, {})) || {};
  const next = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(layout.stateJson, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  return next;
}

async function readBatchState(batchDir) {
  const layout = getBatchLayout(batchDir);
  return safeReadJson(layout.stateJson, {});
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

function flattenUploadedFiles(uploadedFiles = {}) {
  const groups = Object.values(uploadedFiles || {});
  return groups.flatMap((group) => (Array.isArray(group) ? group : []));
}

async function saveUploadedAssetsToBatch(batchDir, uploadedFiles = {}) {
  const layout = await ensureBatchStructure(batchDir);
  const images = Array.isArray(uploadedFiles.images) ? uploadedFiles.images : [];
  const jsonFile = uploadedFiles.jsonFile?.[0] || null;
  const csvFile = uploadedFiles.csvFile?.[0] || null;
  const collageFile = uploadedFiles.collageFile?.[0] || null;

  try {
    for (const file of images) {
      const originalName = path.basename(
        String(file.originalname || '').replace(/\\/g, '/')
      );
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

    if (collageFile) {
      const ext = path.extname(String(collageFile.originalname || '')).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) {
        throw new Error('Collage file must be an image.');
      }
      await moveUploadedFile(collageFile.path, layout.collageImage);
    }
  } catch (error) {
    await cleanupUploadedFiles(flattenUploadedFiles(uploadedFiles));
    throw error;
  }

  return getIntakeBatchById(path.basename(batchDir));
}

async function summarizeIntakeBatch(batchDir) {
  const layout = getBatchLayout(batchDir);
  const state = await readBatchState(batchDir);
  let batchStats = null;
  try {
    batchStats = await fs.stat(batchDir);
  } catch {
    batchStats = null;
  }
  const validation = state?.lastValidation && typeof state.lastValidation === 'object'
    ? state.lastValidation
    : null;

  return {
    id: path.basename(batchDir),
    batchDir,
    name: toTrimmed(state?.name) || path.basename(batchDir),
    createdAt: state?.createdAt || batchStats?.birthtime?.toISOString?.() || null,
    updatedAt: state?.updatedAt || batchStats?.mtime?.toISOString?.() || null,
    importedAt: state?.importedAt || null,
    importStatus: toTrimmed(state?.importStatus) || 'not_imported',
    importResult: state?.importResult || null,
    hasJsonFile: await fileExists(layout.mergedInventoryJson),
    hasCsvFile: await fileExists(layout.imageOrderCsv),
    hasCollageFile: await fileExists(layout.collageImage),
    hasMappingCsv: await fileExists(layout.imageKeyMappingCsv),
    originalImagesCount: await countFiles(layout.originalImagesDir, IMAGE_EXTENSIONS),
    stagedImagesCount: await countFiles(layout.stagedImagesDir, IMAGE_EXTENSIONS),
    validation: validation || null,
  };
}

async function listIntakeBatches() {
  await fs.mkdir(BATCHES_ROOT, { recursive: true });
  const entries = await fs.readdir(BATCHES_ROOT, { withFileTypes: true });
  const batches = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => summarizeIntakeBatch(path.join(BATCHES_ROOT, entry.name)))
  );

  return batches.sort((left, right) => {
    const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
    const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
    return rightTime - leftTime;
  });
}

async function getIntakeBatchById(batchId) {
  const normalized = path.basename(toTrimmed(batchId));
  if (!normalized) {
    throw new Error('batchId is required');
  }

  const batchDir = path.join(BATCHES_ROOT, normalized);
  const exists = await fileExists(batchDir);
  if (!exists) {
    throw new Error(`Batch not found: ${normalized}`);
  }
  return summarizeIntakeBatch(batchDir);
}

async function createIntakeBatch({ name = '', uploadedFiles = {} } = {}) {
  const batchId = createBatchId(name || 'batch');
  const batchDir = path.join(BATCHES_ROOT, batchId);
  await ensureBatchStructure(batchDir);
  await writeBatchState(batchDir, {
    name: toTrimmed(name) || batchId,
    createdAt: new Date().toISOString(),
    importStatus: 'not_imported',
  });
  if (flattenUploadedFiles(uploadedFiles).length) {
    return saveUploadedAssetsToBatch(batchDir, uploadedFiles);
  }
  return summarizeIntakeBatch(batchDir);
}

async function updateIntakeBatchAssets(batchId, uploadedFiles = {}) {
  const batch = await getIntakeBatchById(batchId);
  return saveUploadedAssetsToBatch(batch.batchDir, uploadedFiles);
}

async function validateIntakeBatch(batchId) {
  const batch = await getIntakeBatchById(batchId);
  const layout = getBatchLayout(batch.batchDir);
  const startedAt = Date.now();
  logIntakeBatchEvent('validate start', {
    batchId: batch.id,
    batchDir: batch.batchDir,
  });
  const summary = await summarizeBatch({
    jsonPath: layout.mergedInventoryJson,
    csvPath: layout.imageOrderCsv,
    sourceDir: layout.originalImagesDir,
  });
  const validation = validateBatchSummary(summary);
  const normalizedValidation = {
    ok: validation.ok,
    errors: validation.errors,
    totalItems: summary.totalItems,
    itemsWithImageKeysCount: summary.itemsWithImageKeysCount,
    csvSourceFilesCount: summary.csvSourceFilesCount,
    originalImageFilesCount: summary.originalImageFilesCount,
    validatedAt: new Date().toISOString(),
  };

  await writeBatchState(batch.batchDir, {
    lastValidation: normalizedValidation,
  });

  logIntakeBatchEvent('validate success', {
    batchId: batch.id,
    ok: normalizedValidation.ok,
    totalItems: normalizedValidation.totalItems,
    itemsWithImageKeysCount: normalizedValidation.itemsWithImageKeysCount,
    durationMs: Date.now() - startedAt,
  });

  return {
    batch: await summarizeIntakeBatch(batch.batchDir),
    validation: normalizedValidation,
  };
}

async function stageIntakeBatch(batchId) {
  const batch = await getIntakeBatchById(batchId);
  const layout = getBatchLayout(batch.batchDir);
  const startedAt = Date.now();
  logIntakeBatchEvent('stage start', {
    batchId: batch.id,
    batchDir: batch.batchDir,
    stagedDir: layout.stagedImagesDir,
  });
  const result = await stageBatchImages({
    jsonPath: layout.mergedInventoryJson,
    csvPath: layout.imageOrderCsv,
    sourceDir: layout.originalImagesDir,
    stagedDir: layout.stagedImagesDir,
    mappingCsvPath: layout.imageKeyMappingCsv,
  });

  await writeBatchState(batch.batchDir, {
    lastStagedAt: new Date().toISOString(),
    lastStageResult: {
      stagedCount: result.stagedCount,
      itemsWithImageKeysCount: result.itemsWithImageKeysCount,
      sourceFilesCount: result.sourceFilesCount,
    },
  });

  logIntakeBatchEvent('stage success', {
    batchId: batch.id,
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

async function importIntakeBatch(batchId) {
  const batch = await getIntakeBatchById(batchId);
  const layout = getBatchLayout(batch.batchDir);
  const startedAt = Date.now();
  const payload = await safeReadJson(layout.mergedInventoryJson, null);
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const itemsWithImageKeysCount = items.filter((item) => toTrimmed(item?.imageKey)).length;
  const lastValidation = batch.validation || null;

  logIntakeBatchEvent('import start', {
    batchId: batch.id,
    batchDir: batch.batchDir,
    itemCount: items.length,
    itemsWithImageKeysCount,
    hasCsvFile: batch.hasCsvFile,
    importStatus: batch.importStatus,
    pid: process.pid,
  });

  if (!lastValidation || !lastValidation.ok) {
    throw new Error('Batch must pass validation before import.');
  }

  if (itemsWithImageKeysCount > 0) {
    if (!batch.hasCsvFile) {
      throw new Error('Batch import with imageKey values requires a validated image-order CSV.');
    }

    logIntakeBatchEvent('import staging required', {
      batchId: batch.id,
      itemsWithImageKeysCount,
      csvPath: layout.imageOrderCsv,
    });
    await stageIntakeBatch(batchId);
  }

  const jsonText = await fs.readFile(layout.mergedInventoryJson, 'utf8');
  const stagedEntries = await fs.readdir(layout.stagedImagesDir, { withFileTypes: true });
  const importImages = stagedEntries
    .filter((entry) => entry.isFile())
    .map((entry) => ({
      originalname: entry.name,
      path: path.join(layout.stagedImagesDir, entry.name),
      mimetype: inferMimeType(entry.name),
    }));

  if (itemsWithImageKeysCount > 0 && !importImages.length) {
    throw new Error('No staged images found. Stage the batch before importing.');
  }

  logIntakeBatchEvent('import payload prepared', {
    batchId: batch.id,
    importImageCount: importImages.length,
    jsonPath: layout.mergedInventoryJson,
  });

  const result = await importAiJsonItems({
    jsonText,
    importImages: itemsWithImageKeysCount > 0 ? importImages : [],
  });

  await writeBatchState(batch.batchDir, {
    importedAt: new Date().toISOString(),
    importStatus: result.status || 'imported',
    importResult: {
      status: result.status,
      createdCount: result.createdCount,
      failedCount: result.failedCount,
      imageImportSummary: result.imageImportSummary || null,
    },
  });

  logIntakeBatchEvent('import success', {
    batchId: batch.id,
    status: result.status,
    createdCount: result.createdCount,
    failedCount: result.failedCount,
    imageImportSummary: result.imageImportSummary || null,
    durationMs: Date.now() - startedAt,
    pid: process.pid,
  });

  return {
    batch: await summarizeIntakeBatch(batch.batchDir),
    importResult: result,
  };
}

async function deleteIntakeBatch(batchId) {
  const batch = await getIntakeBatchById(batchId);
  await fs.rm(batch.batchDir, { recursive: true, force: true });
  return {
    id: batch.id,
    deleted: true,
  };
}

module.exports = {
  listIntakeBatches,
  getIntakeBatchById,
  createIntakeBatch,
  updateIntakeBatchAssets,
  validateIntakeBatch,
  stageIntakeBatch,
  importIntakeBatch,
  deleteIntakeBatch,
};
