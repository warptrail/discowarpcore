const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const {
  BATCH_STATUS,
  countBatchFiles,
  getBatchLayout,
  moveBatchFolder,
  updateBatchState,
  writeBatchState,
} = require('./batchState');
const {
  buildPreprocessCommand,
  buildVisionCommand,
  runCommand,
} = require('./commandRunner');
const { openFolder } = require('./intakePaths');
const { ensureDestinationBox } = require('./boxProvisioning');

function destinationArgs(batch) {
  return {
    location: batch?.destination?.location || '',
    box: batch?.destination?.box || '',
  };
}

async function refreshCounts(batchRoot) {
  const layout = getBatchLayout(batchRoot);
  const counts = await countBatchFiles(layout);
  await updateBatchState(batchRoot, { counts });
  return counts;
}

async function markFailed(batchRoot, error, pipelineStage) {
  const message = error?.message || String(error || 'Unknown error');
  return updateBatchState(batchRoot, {
    status: BATCH_STATUS.failed,
    pipelineStage,
    lastError: message,
  });
}

async function archiveFailedBatch(batch, intakePaths, error, pipelineStage) {
  const marked = await markFailed(batch.paths.root, error, pipelineStage);
  const failedParent = intakePaths?.failed;
  if (!failedParent) return marked;

  const currentParent = path.resolve(path.dirname(marked.paths.root));
  const failedRoot = path.resolve(failedParent);
  if (currentParent === failedRoot) return marked;

  const moved = await moveBatchFolder(marked, failedRoot);
  const nextBatch = {
    ...moved.batch,
    status: BATCH_STATUS.failed,
    pipelineStage,
    lastError: error?.message || String(error || 'Unknown error'),
  };
  await writeBatchState(moved.layout.root, nextBatch);
  return nextBatch;
}

async function runPreprocess(batch) {
  const batchRoot = batch.paths.root;
  const layout = getBatchLayout(batchRoot);
  await updateBatchState(batchRoot, {
    status: BATCH_STATUS.preprocessing,
    pipelineStage: BATCH_STATUS.preprocessing,
    lastError: null,
  });
  const command = buildPreprocessCommand({
    rawDir: layout.raw,
    processedDir: layout.processed,
  });
  const defaultObjectGlowRepo = path.join(os.homedir(), 'Developer', 'objectiglow');
  await runCommand({
    ...command,
    env: process.env.OBJECTGLOW_REPO ? {} : { OBJECTGLOW_REPO: defaultObjectGlowRepo },
    logPath: path.join(layout.logs, 'preprocess.log'),
    label: 'Background removal',
  });
  const counts = await refreshCounts(batchRoot);
  return updateBatchState(batchRoot, { counts });
}

async function runInit(batch) {
  const batchRoot = batch.paths.root;
  const layout = getBatchLayout(batchRoot);
  const command = buildVisionCommand({
    mode: 'init',
    sourceDir: layout.processed,
    batchName: batch.batchName,
    artifactsDir: layout.itemArtifacts,
    ...destinationArgs(batch),
  });
  await runCommand({
    ...command,
    logPath: path.join(layout.logs, 'init.log'),
    label: 'JSON stub initialization',
  });
  const counts = await refreshCounts(batchRoot);
  return updateBatchState(batchRoot, {
    status: BATCH_STATUS.awaitingAnnotation,
    pipelineStage: BATCH_STATUS.awaitingAnnotation,
    counts,
  });
}

function buildAgentPrompt(batch) {
  const layout = getBatchLayout(batch.paths.root);
  return [
    'New Disco Warp Core vision intake batch.',
    '',
    'Follow this file exactly if present:',
    path.join(layout.itemArtifacts, 'CODEX_PROMPT.md'),
    '',
    'Inspect the images in:',
    layout.processed,
    '',
    'Fill the JSON files in:',
    layout.itemArtifacts,
    '',
    'This is a fresh batch. Ignore any prior batch context.',
    'Do not rename, move, delete, or copy image files.',
    'Do not write to the Disco Warp Core backend media directory.',
    'Do not call backend APIs.',
    'Only edit the JSON files in item_artifacts.',
    'Only fill the requested practical inventory fields: name, description, category, tags, and quantity.',
    '',
  ].join('\n');
}

async function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    const child = spawn('pbcopy', [], { stdio: ['pipe', 'ignore', 'ignore'] });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error('pbcopy failed.'));
    });
    child.stdin.end(text);
  });
}

async function writeAndCopyAgentPrompt(batch) {
  const layout = getBatchLayout(batch.paths.root);
  const prompt = buildAgentPrompt(batch);
  await fs.writeFile(layout.agentPrompt, prompt, 'utf8');
  try {
    await copyToClipboard(prompt);
    return { promptPath: layout.agentPrompt, copied: true };
  } catch {
    return { promptPath: layout.agentPrompt, copied: false };
  }
}

async function runValidation(batch) {
  const batchRoot = batch.paths.root;
  const layout = getBatchLayout(batchRoot);
  await updateBatchState(batchRoot, {
    status: BATCH_STATUS.validating,
    pipelineStage: BATCH_STATUS.validating,
    lastError: null,
  });
  const command = buildVisionCommand({
    mode: 'validate',
    sourceDir: layout.processed,
    batchName: batch.batchName,
    artifactsDir: layout.itemArtifacts,
    ...destinationArgs(batch),
  });
  await runCommand({
    ...command,
    logPath: path.join(layout.logs, 'validation.log'),
    label: 'Vision artifact validation',
  });
  const counts = await refreshCounts(batchRoot);
  return updateBatchState(batchRoot, { counts });
}

async function findNewestZip(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true }).catch(() => []);
  const zips = [];
  for (const entry of entries) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.zip') continue;
    const absolutePath = path.join(dirPath, entry.name);
    const stats = await fs.stat(absolutePath);
    zips.push({ absolutePath, mtimeMs: stats.mtimeMs });
  }
  zips.sort((left, right) => right.mtimeMs - left.mtimeMs);
  return zips[0]?.absolutePath || '';
}

async function runPackage(batch, { outputDir = '' } = {}) {
  const batchRoot = batch.paths.root;
  const layout = getBatchLayout(batchRoot);
  const packageOutputDir = outputDir || layout.package;
  const command = buildVisionCommand({
    mode: 'package',
    sourceDir: layout.processed,
    batchName: batch.batchName,
    artifactsDir: layout.itemArtifacts,
    outputDir: packageOutputDir,
    ...destinationArgs(batch),
  });
  await runCommand({
    ...command,
    logPath: path.join(layout.logs, 'package.log'),
    label: 'Vision package export',
  });
  const archivePath = await findNewestZip(packageOutputDir);
  if (!archivePath) throw new Error(`Package command succeeded, but no zip was found in ${packageOutputDir}`);
  const counts = await refreshCounts(batchRoot);
  return updateBatchState(batchRoot, {
    status: BATCH_STATUS.packaged,
    pipelineStage: BATCH_STATUS.packaged,
    archivePath,
    counts,
  });
}

async function postJson(url, body = null) {
  const response = await fetch(url, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `Request failed: ${url}`);
  }
  return payload;
}

async function uploadPackage(apiBase, archivePath) {
  const bytes = await fs.readFile(archivePath);
  const formData = new FormData();
  formData.append('packageFile', new Blob([bytes], { type: 'application/zip' }), path.basename(archivePath));
  const response = await fetch(`${apiBase}/api/intake-batches/package`, {
    method: 'POST',
    body: formData,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Package upload failed.');
  }
  return payload;
}

async function runDirectImport(batch, { apiBase = process.env.DWC_API_BASE || 'http://127.0.0.1:5002' } = {}) {
  const batchRoot = batch.paths.root;
  let current = batch;
  if (current.destination?.box) {
    await ensureDestinationBox({
      box: current.destination.box,
      location: current.destination.location,
      apiBase,
    });
  }

  if (!current.archivePath) {
    current = await runPackage(current);
  }
  await updateBatchState(batchRoot, {
    status: BATCH_STATUS.importing,
    pipelineStage: BATCH_STATUS.importing,
  });

  const uploadResult = await uploadPackage(apiBase, current.archivePath);
  const uploadedBatchId = uploadResult?.batch?.batchId || uploadResult?.batch?.id;
  if (!uploadedBatchId) {
    throw new Error('Backend did not return an intake batch id after upload.');
  }

  if (uploadResult?.batch?.destinationDefaults?.reviewRequired) {
    await postJson(`${apiBase}/api/intake-batches/${encodeURIComponent(uploadedBatchId)}/destination`, {
      location: batch.destination?.location || null,
      box: batch.destination?.box || null,
    });
  }

  const validationResult = await postJson(`${apiBase}/api/intake-batches/${encodeURIComponent(uploadedBatchId)}/validate`);
  if (validationResult?.batch?.validationStatus !== 'passed') {
    throw new Error('Backend validation did not pass.');
  }

  const importResult = await postJson(`${apiBase}/api/intake-batches/${encodeURIComponent(uploadedBatchId)}/import`);
  if (importResult?.batch?.importLifecycleStatus !== 'success') {
    throw new Error(importResult?.importResult?.message || 'Backend import did not complete successfully.');
  }

  return updateBatchState(batchRoot, {
    status: BATCH_STATUS.completed,
    pipelineStage: BATCH_STATUS.completed,
    importedBatchId: uploadedBatchId,
    lastError: null,
  });
}

async function archiveCompletedBatch(batch, intakePaths) {
  const completed = await moveBatchFolder(batch, intakePaths.completed);
  const nextBatch = {
    ...completed.batch,
    status: BATCH_STATUS.completed,
    pipelineStage: BATCH_STATUS.completed,
  };
  await writeBatchState(completed.layout.root, nextBatch);
  return nextBatch;
}

async function exportZip(batch, intakePaths) {
  const packaged = await runPackage(batch);
  const targetPath = path.join(intakePaths.exports, `${batch.batchId}.zip`);
  await fs.copyFile(packaged.archivePath, targetPath);
  const updated = await updateBatchState(batch.paths.root, {
    status: BATCH_STATUS.packaged,
    pipelineStage: BATCH_STATUS.packaged,
    archivePath: targetPath,
  });
  return updated;
}

module.exports = {
  archiveFailedBatch,
  archiveCompletedBatch,
  buildAgentPrompt,
  exportZip,
  markFailed,
  openFolder,
  refreshCounts,
  runDirectImport,
  runInit,
  runPackage,
  runPreprocess,
  runValidation,
  writeAndCopyAgentPrompt,
};
