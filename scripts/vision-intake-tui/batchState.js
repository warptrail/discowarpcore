const fs = require('fs/promises');
const path = require('path');

const { slugify } = require('../intakeWorkspace');
const { listImageFiles } = require('./intakePaths');

const BATCH_STATUS = Object.freeze({
  created: 'created',
  preprocessing: 'preprocessing',
  awaitingAnnotation: 'awaiting_annotation',
  validating: 'validating',
  packaged: 'packaged',
  importing: 'importing',
  completed: 'completed',
  failed: 'failed',
});

function timestampForBatchId(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0'),
  ].join('');
}

function createVisionBatchId(batchName, date = new Date()) {
  const slug = slugify(batchName, 'batch').replace(/-/g, '_');
  return `batch_${timestampForBatchId(date)}_${slug}`;
}

function getBatchLayout(batchRoot) {
  const root = path.resolve(batchRoot);
  return {
    root,
    raw: path.join(root, 'raw'),
    processed: path.join(root, 'processed'),
    itemArtifacts: path.join(root, 'item_artifacts'),
    package: path.join(root, 'package'),
    logs: path.join(root, 'logs'),
    batchJson: path.join(root, 'batch.json'),
    agentPrompt: path.join(root, 'CODEX_AGENT_PROMPT.md'),
  };
}

async function ensureBatchLayout(batchRoot) {
  const layout = getBatchLayout(batchRoot);
  await Promise.all([
    fs.mkdir(layout.raw, { recursive: true }),
    fs.mkdir(layout.processed, { recursive: true }),
    fs.mkdir(layout.itemArtifacts, { recursive: true }),
    fs.mkdir(layout.package, { recursive: true }),
    fs.mkdir(layout.logs, { recursive: true }),
  ]);
  return layout;
}

async function readBatchState(batchRoot) {
  const layout = getBatchLayout(batchRoot);
  const raw = await fs.readFile(layout.batchJson, 'utf8');
  return JSON.parse(raw);
}

async function writeBatchState(batchRoot, batch) {
  const layout = getBatchLayout(batchRoot);
  const next = {
    ...batch,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(layout.batchJson, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  return next;
}

async function updateBatchState(batchRoot, patch = {}) {
  const current = await readBatchState(batchRoot);
  return writeBatchState(batchRoot, {
    ...current,
    ...patch,
    paths: {
      ...(current.paths || {}),
      ...(patch.paths || {}),
    },
    destination: {
      ...(current.destination || {}),
      ...(patch.destination || {}),
    },
    counts: {
      ...(current.counts || {}),
      ...(patch.counts || {}),
    },
  });
}

async function countBatchFiles(layout) {
  const rawImages = await listImageFiles(layout.raw);
  const processedImages = await listImageFiles(layout.processed);
  const artifacts = await fs.readdir(layout.itemArtifacts, { withFileTypes: true }).catch(() => []);
  return {
    rawImages: rawImages.length,
    processedImages: processedImages.length,
    jsonArtifacts: artifacts.filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === '.json').length,
  };
}

async function moveInboxImagesToRaw(images, rawDir) {
  await fs.mkdir(rawDir, { recursive: true });
  for (const image of images) {
    await fs.rename(image.absolutePath, path.join(rawDir, image.fileName));
  }
}

async function createBatchWorkspace({
  intakePaths,
  batchName,
  destination,
  importMode,
  inboxImages,
}) {
  const batchId = createVisionBatchId(batchName);
  const batchRoot = path.join(intakePaths.processing, batchId);
  const layout = await ensureBatchLayout(batchRoot);
  await moveInboxImagesToRaw(inboxImages, layout.raw);
  const counts = await countBatchFiles(layout);
  const now = new Date().toISOString();
  const batch = {
    batchId,
    batchName,
    createdAt: now,
    updatedAt: now,
    status: BATCH_STATUS.created,
    pipelineStage: BATCH_STATUS.created,
    paths: {
      root: layout.root,
      raw: layout.raw,
      processed: layout.processed,
      itemArtifacts: layout.itemArtifacts,
      package: layout.package,
      logs: layout.logs,
    },
    destination: {
      location: destination?.location || null,
      box: destination?.box || null,
    },
    importMode,
    counts,
    lastError: null,
    archivePath: null,
    importedBatchId: null,
  };
  await writeBatchState(batchRoot, batch);
  return { batch, layout };
}

async function listBatchStates(parentDir) {
  const entries = await fs.readdir(parentDir, { withFileTypes: true }).catch(() => []);
  const batches = [];
  for (const entry of entries.filter((candidate) => candidate.isDirectory())) {
    const batchRoot = path.join(parentDir, entry.name);
    try {
      batches.push(await readBatchState(batchRoot));
    } catch {
      // Ignore folders that are not TUI intake batches.
    }
  }
  return batches.sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || '')));
}

async function moveBatchFolder(batch, destinationParent) {
  const currentRoot = batch?.paths?.root;
  if (!currentRoot) throw new Error('Batch has no root path.');
  const nextRoot = path.join(destinationParent, path.basename(currentRoot));
  await fs.mkdir(destinationParent, { recursive: true });
  await fs.rename(currentRoot, nextRoot);
  const layout = getBatchLayout(nextRoot);
  const nextBatch = {
    ...batch,
    paths: {
      root: layout.root,
      raw: layout.raw,
      processed: layout.processed,
      itemArtifacts: layout.itemArtifacts,
      package: layout.package,
      logs: layout.logs,
    },
  };
  await writeBatchState(nextRoot, nextBatch);
  return { batch: nextBatch, layout };
}

module.exports = {
  BATCH_STATUS,
  countBatchFiles,
  createBatchWorkspace,
  createVisionBatchId,
  ensureBatchLayout,
  getBatchLayout,
  listBatchStates,
  moveBatchFolder,
  readBatchState,
  updateBatchState,
  writeBatchState,
};
