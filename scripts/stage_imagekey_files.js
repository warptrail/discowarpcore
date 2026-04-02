#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const {
  BATCHES_ROOT,
  ensureBatchStructure,
  getBatchLayout,
  parseArgs,
  resolveRepoPath,
  toTrimmed,
} = require('./intakeWorkspace');

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic']);
const RAW_CSV_FILE_PATH_HEADERS = new Set(['file_path', 'filepath', 'path']);
const RAW_CSV_FILE_NAME_HEADERS = new Set([
  'file_name',
  'filename',
  'image_filename',
  'image_name',
]);
const RAW_CSV_INDEX_HEADERS = new Set(['index', 'position', 'order']);
const MAPPING_CSV_HEADERS = new Set(['imagekey', 'sourcefile', 'stagedfile', 'status']);

class CsvValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CsvValidationError';
  }
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }
    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

async function parseImageOrderCsv(csvPath) {
  const raw = await fs.readFile(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) {
    throw new CsvValidationError(
      `CSV is empty: ${csvPath}. Expected raw image-order CSV columns like: index,file_path,file_name`
    );
  }

  const header = parseCsvLine(lines[0]).map((entry) => entry.toLowerCase());
  const headerSet = new Set(header);

  const looksLikeMappingCsv = [...MAPPING_CSV_HEADERS].every((entry) => headerSet.has(entry));
  if (looksLikeMappingCsv) {
    throw new CsvValidationError(
      `Invalid CSV input: ${csvPath} looks like a generated mapping CSV (imageKey,sourceFile,stagedFile,status), not a raw image-order CSV. Expected columns like: index,file_path,file_name`
    );
  }

  const filePathColumn = header.findIndex((entry) => RAW_CSV_FILE_PATH_HEADERS.has(entry));
  const fileNameColumn = header.findIndex((entry) => RAW_CSV_FILE_NAME_HEADERS.has(entry));
  const indexColumn = header.findIndex((entry) => RAW_CSV_INDEX_HEADERS.has(entry));

  if (filePathColumn === -1 && fileNameColumn === -1) {
    throw new CsvValidationError(
      `Invalid CSV input: ${csvPath} is missing usable raw image columns. Expected columns like: index,file_path,file_name`
    );
  }

  const sourceFiles = lines.slice(1).map((line, rowIndex) => {
    const values = parseCsvLine(line);
    const rowLabel = `row ${rowIndex + 2}`;
    const candidate = filePathColumn !== -1
      ? values[filePathColumn] || ''
      : values[fileNameColumn] || '';
    const normalizedCandidate = toTrimmed(candidate);
    const baseName = path.basename(normalizedCandidate);
    const ext = path.extname(baseName).toLowerCase();

    if (!normalizedCandidate) {
      throw new CsvValidationError(
        `Invalid CSV input: ${csvPath} ${rowLabel} is missing file_path/file_name. Expected columns like: index,file_path,file_name`
      );
    }

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      const indexValue = indexColumn !== -1 ? toTrimmed(values[indexColumn]) : '';
      const indexSuffix = indexValue ? ` (index=${indexValue})` : '';
      throw new CsvValidationError(
        `Invalid CSV input: ${csvPath} ${rowLabel}${indexSuffix} has non-image source value "${normalizedCandidate}". Expected real image filenames or paths ending in: ${[...ALLOWED_EXTENSIONS].join(', ')}. Expected columns like: index,file_path,file_name`
      );
    }

    return baseName;
  });

  if (!sourceFiles.length) {
    throw new CsvValidationError(
      `Invalid CSV input: ${csvPath} has headers but no usable data rows. Expected columns like: index,file_path,file_name`
    );
  }

  return sourceFiles;
}

async function listImageFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => ALLOWED_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((left, right) => left.localeCompare(right));
}

async function readMergedItems(jsonPath) {
  const raw = await fs.readFile(jsonPath, 'utf8');
  const payload = JSON.parse(raw);
  const items = Array.isArray(payload?.items) ? payload.items : [];
  return items.filter((item) => toTrimmed(item?.imageKey));
}

async function writeMappingCsv(mappingPath, rows) {
  const header = 'imageKey,sourceFile,stagedFile,status\n';
  const body = rows
    .map((row) => [
      row.imageKey,
      row.sourceFile,
      row.stagedFile,
      row.status,
    ].map((value) => `"${String(value || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  await fs.writeFile(mappingPath, `${header}${body}${body ? '\n' : ''}`, 'utf8');
}

async function stageBatchImages({
  jsonPath,
  csvPath,
  sourceDir,
  stagedDir,
  mappingCsvPath,
} = {}) {
  const itemsWithImageKeys = await readMergedItems(jsonPath);
  if (!itemsWithImageKeys.length) {
    throw new Error(`No items with imageKey found in ${jsonPath}`);
  }

  let sourceFiles = [];
  let csvExists = false;
  try {
    await fs.access(csvPath);
    csvExists = true;
  } catch {
    csvExists = false;
  }

  if (csvExists) {
    sourceFiles = await parseImageOrderCsv(csvPath);
  } else {
    sourceFiles = await listImageFiles(sourceDir);
  }

  if (!sourceFiles.length) {
    throw new Error(`No source image files found from ${csvPath} or ${sourceDir}`);
  }

  await fs.mkdir(stagedDir, { recursive: true });

  const mappingRows = [];
  let stagedCount = 0;
  for (let index = 0; index < itemsWithImageKeys.length; index += 1) {
    const item = itemsWithImageKeys[index];
    const sourceFile = sourceFiles[index] || '';
    const imageKey = toTrimmed(item.imageKey);

    if (!sourceFile) {
      mappingRows.push({
        imageKey,
        sourceFile: '',
        stagedFile: '',
        status: 'missing_source_image',
      });
      continue;
    }

    const ext = path.extname(sourceFile).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      mappingRows.push({
        imageKey,
        sourceFile,
        stagedFile: '',
        status: 'unsupported_extension',
      });
      continue;
    }

    const sourcePath = path.join(sourceDir, sourceFile);
    const stagedFile = `${imageKey}${ext}`;
    const stagedPath = path.join(stagedDir, stagedFile);
    await fs.copyFile(sourcePath, stagedPath);
    stagedCount += 1;

    mappingRows.push({
      imageKey,
      sourceFile,
      stagedFile,
      status: 'staged',
    });
  }

  await writeMappingCsv(mappingCsvPath, mappingRows);

  return {
    stagedCount,
    mappingRows,
    itemsWithImageKeysCount: itemsWithImageKeys.length,
    sourceFilesCount: sourceFiles.length,
  };
}

async function main() {
  const args = parseArgs();
  const batchDir = resolveRepoPath(args['batch-dir'], path.join(BATCHES_ROOT, 'example-batch'));
  const layout = await ensureBatchStructure(batchDir);
  const jsonPath = resolveRepoPath(args.json, layout.mergedInventoryJson);
  const csvPath = resolveRepoPath(args.csv, layout.imageOrderCsv);
  const sourceDir = resolveRepoPath(args['source-dir'], layout.originalImagesDir);
  const stagedDir = resolveRepoPath(args['staged-dir'], layout.stagedImagesDir);
  const mappingCsvPath = resolveRepoPath(args.mapping, layout.imageKeyMappingCsv);

  const result = await stageBatchImages({
    jsonPath,
    csvPath,
    sourceDir,
    stagedDir,
    mappingCsvPath,
  });

  console.log(`Batch dir: ${path.relative(process.cwd(), batchDir)}`);
  console.log(`Staged ${result.stagedCount} image file(s) into ${path.relative(process.cwd(), stagedDir)}`);
  console.log(`Wrote mapping CSV: ${path.relative(process.cwd(), mappingCsvPath)}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Failed to stage imageKey files: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  CsvValidationError,
  parseCsvLine,
  parseImageOrderCsv,
  stageBatchImages,
};
