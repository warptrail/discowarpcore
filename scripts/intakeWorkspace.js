const fs = require('fs/promises');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const INTAKE_ROOT = path.join(REPO_ROOT, 'var', 'intake');
const BATCHES_ROOT = path.join(INTAKE_ROOT, 'batches');

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

function slugify(value, fallback = 'batch') {
  const normalized = toTrimmed(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function timestampPrefix(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}${minutes}`;
}

function resolveRepoPath(candidatePath, fallbackPath) {
  const raw = toTrimmed(candidatePath);
  if (!raw) return path.resolve(fallbackPath);
  return path.resolve(REPO_ROOT, raw);
}

function parseArgs(argv = process.argv.slice(2)) {
  const args = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }

    const [flag, inlineValue] = token.split('=', 2);
    const key = flag.slice(2);

    if (inlineValue != null) {
      args[key] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      index += 1;
      continue;
    }

    args[key] = true;
  }

  return args;
}

function getBatchLayout(batchDir) {
  const resolvedBatchDir = path.resolve(batchDir);
  return {
    batchDir: resolvedBatchDir,
    stateJson: path.join(resolvedBatchDir, 'batch_state.json'),
    mergedInventoryJson: path.join(resolvedBatchDir, 'merged_inventory_batch.json'),
    imageOrderCsv: path.join(resolvedBatchDir, 'image_order.csv'),
    collageImage: path.join(resolvedBatchDir, 'collage.jpg'),
    imageKeyMappingCsv: path.join(resolvedBatchDir, 'imagekey_mapping.csv'),
    originalImagesDir: path.join(resolvedBatchDir, 'original_images'),
    stagedImagesDir: path.join(resolvedBatchDir, 'staged_images'),
  };
}

async function ensureBatchStructure(batchDir) {
  const layout = getBatchLayout(batchDir);
  await fs.mkdir(layout.originalImagesDir, { recursive: true });
  await fs.mkdir(layout.stagedImagesDir, { recursive: true });
  return layout;
}

function createBatchId(name = '') {
  const base = slugify(name, 'batch');
  return `${timestampPrefix()}_${base}`;
}

module.exports = {
  REPO_ROOT,
  INTAKE_ROOT,
  BATCHES_ROOT,
  toTrimmed,
  slugify,
  parseArgs,
  resolveRepoPath,
  getBatchLayout,
  ensureBatchStructure,
  createBatchId,
};
