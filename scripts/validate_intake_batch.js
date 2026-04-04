#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const {
  BATCHES_ROOT,
  getBatchLayout,
  parseArgs,
  resolveRepoPath,
  toTrimmed,
} = require('./intakeWorkspace');
const { parseImageOrderCsv } = require('./stage_imagekey_files');

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic']);

function isPlainObject(value) {
  if (!value || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

async function readJsonPayload(jsonPath) {
  const raw = await fs.readFile(jsonPath, 'utf8');
  return JSON.parse(raw);
}

async function listImageFiles(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => ALLOWED_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
}

async function summarizeBatch({ jsonPath, csvPath, sourceDir }) {
  const payload = await readJsonPayload(jsonPath);
  if (!isPlainObject(payload)) {
    throw new Error(`Expected top-level JSON object in ${jsonPath}`);
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  const itemsWithImageKeys = items.filter((item) => toTrimmed(item?.imageKey));
  const originalImageFiles = await listImageFiles(sourceDir);
  const originalImageSet = new Set(originalImageFiles);
  const imagesIncluded = originalImageFiles.length > 0;
  const csvSourceFiles = (csvPath)
    ? await parseImageOrderCsv(csvPath)
    : [];

  let readyCount = 0;
  let missingCount = 0;
  let ambiguousCount = 0;

  if (imagesIncluded) {
    for (const sourceFile of csvSourceFiles) {
      if (!sourceFile) continue;
      if (originalImageSet.has(sourceFile)) {
        readyCount += 1;
      } else {
        missingCount += 1;
      }
    }
  }

  return {
    totalItems: items.length,
    itemsWithImageKeysCount: itemsWithImageKeys.length,
    rowCount: csvSourceFiles.length,
    readyCount,
    missingCount,
    ambiguousCount,
    csvSourceFilesCount: csvSourceFiles.length,
    originalImageFilesCount: originalImageFiles.length,
    imagesIncluded,
    csvSourceFiles,
    originalImageFiles,
  };
}

function validateBatchSummary(summary) {
  const errors = [];
  const warnings = [];

  if (summary.imagesIncluded && summary.csvSourceFilesCount !== summary.itemsWithImageKeysCount) {
    errors.push(
      `CSV row count (${summary.csvSourceFilesCount}) does not match items with imageKey (${summary.itemsWithImageKeysCount}).`
    );
  }

  if (!summary.imagesIncluded) {
    warnings.push(
      summary.csvSourceFilesCount > 0
        ? 'No source images included; validation checked AI JSON and mapping CSV only.'
        : 'No source images included; validation checked AI JSON only.'
    );
  } else if (summary.originalImageFilesCount !== summary.csvSourceFilesCount) {
    warnings.push(
      `original_images file count (${summary.originalImageFilesCount}) differs from raw image-order CSV row count (${summary.csvSourceFilesCount}).`
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

async function main() {
  const args = parseArgs();
  const batchDir = resolveRepoPath(args['batch-dir'], path.join(BATCHES_ROOT, 'example-batch'));
  const layout = getBatchLayout(batchDir);
  const jsonPath = resolveRepoPath(args.json, layout.mergedInventoryJson);
  const csvPath = resolveRepoPath(args.csv, layout.imageOrderCsv);
  const sourceDir = resolveRepoPath(args['source-dir'], layout.originalImagesDir);

  const summary = await summarizeBatch({ jsonPath, csvPath, sourceDir });
  const validation = validateBatchSummary(summary);

  console.log(`Batch dir: ${path.relative(process.cwd(), batchDir)}`);
  console.log(`- total items: ${summary.totalItems}`);
  console.log(`- items with imageKey: ${summary.itemsWithImageKeysCount}`);
  console.log(`- image-order CSV rows: ${summary.csvSourceFilesCount}`);
  console.log(`- original_images files: ${summary.originalImageFilesCount}`);

  validation.warnings.forEach((warning) => {
    console.warn(`- warning: ${warning}`);
  });

  if (!validation.ok) {
    validation.errors.forEach((error) => {
      console.error(`- ${error}`);
    });
    throw new Error('Batch validation failed.');
  }

  console.log('Batch validation passed.');
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Failed to validate intake batch: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  summarizeBatch,
  validateBatchSummary,
};
