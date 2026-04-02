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
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => ALLOWED_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((left, right) => left.localeCompare(right));
}

async function summarizeBatch({ jsonPath, csvPath, sourceDir }) {
  const payload = await readJsonPayload(jsonPath);
  if (!isPlainObject(payload)) {
    throw new Error(`Expected top-level JSON object in ${jsonPath}`);
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  const itemsWithImageKeys = items.filter((item) => toTrimmed(item?.imageKey));
  const csvSourceFiles = await parseImageOrderCsv(csvPath);
  const originalImageFiles = await listImageFiles(sourceDir);

  return {
    totalItems: items.length,
    itemsWithImageKeysCount: itemsWithImageKeys.length,
    csvSourceFilesCount: csvSourceFiles.length,
    originalImageFilesCount: originalImageFiles.length,
    csvSourceFiles,
    originalImageFiles,
  };
}

function validateBatchSummary(summary) {
  const errors = [];

  if (summary.itemsWithImageKeysCount === 0) {
    errors.push('No items with imageKey were found in merged_inventory_batch.json.');
  }

  if (summary.csvSourceFilesCount !== summary.itemsWithImageKeysCount) {
    errors.push(
      `CSV row count (${summary.csvSourceFilesCount}) does not match items with imageKey (${summary.itemsWithImageKeysCount}).`
    );
  }

  if (summary.originalImageFilesCount !== summary.csvSourceFilesCount) {
    errors.push(
      `original_images file count (${summary.originalImageFilesCount}) does not match raw image-order CSV row count (${summary.csvSourceFilesCount}).`
    );
  }

  return {
    ok: errors.length === 0,
    errors,
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
