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
const { normalizeApiBase, resolveApiConfig } = require('./apiConfig');

const DEFAULT_OBJECTGLOW_REPO_CANDIDATES = Object.freeze([
  '/Volumes/Luna/Developer-Luna/objectiglow',
  path.join(os.homedir(), 'Developer', 'objectiglow'),
]);
const PROMPT_SCP_TIMEOUT_MS = 30000;
const PROMPT_REMOTE_CLIPBOARD_TIMEOUT_MS = 10000;

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function resolveDefaultObjectGlowRepo() {
  for (const candidate of DEFAULT_OBJECTGLOW_REPO_CANDIDATES) {
    if (await pathExists(path.join(candidate, 'bin', 'objectglow'))) {
      return candidate;
    }
  }
  return DEFAULT_OBJECTGLOW_REPO_CANDIDATES[0];
}

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
    archivePath: null,
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
  const defaultObjectGlowRepo = await resolveDefaultObjectGlowRepo();
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

function isSshSession(env = process.env) {
  return Boolean(env.SSH_TTY || env.SSH_CONNECTION || env.SSH_CLIENT);
}

function copyToTerminalClipboard(text, stream = process.stdout) {
  if (typeof stream?.write !== 'function') return false;
  const encoded = Buffer.from(String(text || ''), 'utf8').toString('base64');
  stream.write(`\u001b]52;c;${encoded}\u0007`);
  stream.write(`\u001b]52;c;${encoded}\u001b\\`);
  return true;
}

async function copyToMacClipboard(text) {
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

async function copyToRemoteMacClipboard(text, {
  env = process.env,
  spawnImpl = spawn,
  timeoutMs = PROMPT_REMOTE_CLIPBOARD_TIMEOUT_MS,
} = {}) {
  const target = env.DISCO_PROMPT_CLIPBOARD_SSH_TARGET;
  if (!target) return { attempted: false, copied: false, method: '' };

  return new Promise((resolve, reject) => {
    const child = spawnImpl('ssh', [
      '-o',
      'BatchMode=yes',
      target,
      'pbcopy',
    ], {
      stdio: ['pipe', 'ignore', 'pipe'],
    });
    let stderr = '';
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback(value);
    };
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      finish(reject, new Error(`remote pbcopy timed out after ${Math.round(timeoutMs / 1000)} seconds`));
    }, timeoutMs);

    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      finish(reject, error);
    });
    child.on('close', (code, signal) => {
      if (code === 0) {
        finish(resolve, {
          attempted: true,
          copied: true,
          method: 'ssh-pbcopy',
          target,
        });
        return;
      }
      const message = signal
        ? `remote pbcopy stopped by ${signal}`
        : stderr.trim() || `remote pbcopy exited with code ${code}`;
      finish(reject, new Error(message));
    });
    child.stdin.end(text);
  });
}

async function copyToClipboard(text, {
  env = process.env,
  stream = process.stdout,
  spawnImpl = spawn,
} = {}) {
  if (env.DISCO_PROMPT_CLIPBOARD_SSH_TARGET) {
    return copyToRemoteMacClipboard(text, { env, spawnImpl });
  }

  if (isSshSession(env) && copyToTerminalClipboard(text, stream)) {
    return { copied: true, method: 'terminal' };
  }

  await copyToMacClipboard(text);
  return { copied: true, method: 'pbcopy' };
}

function quoteShellArg(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function promptPullHost({ env = process.env, host = os.hostname() } = {}) {
  return env.DISCO_PROMPT_PULL_HOST || host;
}

function buildPromptPullCommand(promptPath, { env = process.env, host = os.hostname() } = {}) {
  const user = env.DISCO_PROMPT_PULL_USER || env.USER || os.userInfo().username;
  const sourceHost = promptPullHost({ env, host });
  return `scp ${user}@${sourceHost}:${quoteShellArg(promptPath)} ~/Desktop/`;
}

async function scpPromptIfConfigured(promptPath, {
  env = process.env,
  spawnImpl = spawn,
  timeoutMs = PROMPT_SCP_TIMEOUT_MS,
} = {}) {
  const target = env.DISCO_PROMPT_SCP_TARGET;
  if (!target) return { attempted: false, ok: false, target: '' };

  return new Promise((resolve) => {
    const child = spawnImpl('scp', [promptPath, target], {
      stdio: ['inherit', 'inherit', 'inherit'],
    });
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      finish({
        attempted: true,
        ok: false,
        target,
        error: `scp timed out after ${Math.round(timeoutMs / 1000)} seconds`,
      });
    }, timeoutMs);

    child.on('error', (error) => {
      finish({ attempted: true, ok: false, target, error: error.message });
    });
    child.on('close', (code, signal) => {
      if (code === 0) {
        finish({ attempted: true, ok: true, target });
        return;
      }
      finish({
        attempted: true,
        ok: false,
        target,
        error: signal ? `scp stopped by ${signal}` : `scp exited with code ${code}`,
      });
    });
  });
}

async function writeAndCopyAgentPrompt(batch, options = {}) {
  const layout = getBatchLayout(batch.paths.root);
  const prompt = buildAgentPrompt(batch);
  await fs.writeFile(layout.agentPrompt, prompt, 'utf8');
  const pullCommand = buildPromptPullCommand(layout.agentPrompt, options);
  let copyResult = { copied: false, method: '' };
  try {
    copyResult = await copyToClipboard(prompt, options);
  } catch {
    copyResult = { copied: false, method: '' };
  }
  const scp = await scpPromptIfConfigured(layout.agentPrompt, options);
  return { promptPath: layout.agentPrompt, pullCommand, scp, ...copyResult };
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

async function getJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
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
  const normalizedApiBase = normalizeApiBase(apiBase);
  const response = await fetch(`${normalizedApiBase}/api/intake-batches/package`, {
    method: 'POST',
    body: formData,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Package upload failed.');
  }
  return payload;
}

async function runDirectImport(batch, {
  apiBase = resolveApiConfig().apiBase,
  logger = console,
} = {}) {
  const normalizedApiBase = normalizeApiBase(apiBase);
  const batchRoot = batch.paths.root;
  let current = batch;
  if (current.destination?.box) {
    logger.log(`Ensuring destination box through API: ${normalizedApiBase}`);
    await ensureDestinationBox({
      box: current.destination.box,
      location: current.destination.location,
      apiBase: normalizedApiBase,
    });
  }

  if (current.archivePath && !await pathExists(current.archivePath)) {
    logger.log(`Package archive missing at ${current.archivePath}; rebuilding package.`);
    current = await updateBatchState(batchRoot, { archivePath: null });
  }

  if (!current.archivePath) {
    current = await runPackage(current);
  }
  await updateBatchState(batchRoot, {
    status: BATCH_STATUS.importing,
    pipelineStage: BATCH_STATUS.importing,
  });

  logger.log(`Uploading intake package to ${normalizedApiBase}`);
  const uploadResult = await uploadPackage(normalizedApiBase, current.archivePath);
  const uploadedBatchId = uploadResult?.batch?.batchId || uploadResult?.batch?.id;
  if (!uploadedBatchId) {
    throw new Error('Backend did not return an intake batch id after upload.');
  }
  logger.log(`Uploaded package as backend batch: ${uploadedBatchId}`);

  if (uploadResult?.batch?.destinationDefaults?.reviewRequired) {
    logger.log('Reviewing backend batch destination defaults.');
    await postJson(`${normalizedApiBase}/api/intake-batches/${encodeURIComponent(uploadedBatchId)}/destination`, {
      location: batch.destination?.location || null,
      box: batch.destination?.box || null,
    });
  }

  logger.log('Validating backend intake batch.');
  const validationResult = await postJson(`${normalizedApiBase}/api/intake-batches/${encodeURIComponent(uploadedBatchId)}/validate`);
  logger.log(`Backend validation status: ${validationResult?.batch?.validationStatus || 'unknown'}`);
  if (validationResult?.batch?.validationStatus !== 'passed') {
    throw new Error('Backend validation did not pass.');
  }

  logger.log('Importing backend intake batch.');
  const importResult = await postJson(`${normalizedApiBase}/api/intake-batches/${encodeURIComponent(uploadedBatchId)}/import`);
  logger.log(`Backend import status: ${importResult?.batch?.importLifecycleStatus || 'unknown'}`);
  if (importResult?.batch?.importLifecycleStatus !== 'success') {
    throw new Error(importResult?.importResult?.message || 'Backend import did not complete successfully.');
  }

  const finalResult = await getJson(`${normalizedApiBase}/api/intake-batches/${encodeURIComponent(uploadedBatchId)}`)
    .catch(() => null);

  return updateBatchState(batchRoot, {
    status: BATCH_STATUS.completed,
    pipelineStage: BATCH_STATUS.completed,
    importedBatchId: uploadedBatchId,
    importedBackendStatus: finalResult?.batch?.importLifecycleStatus || importResult?.batch?.importLifecycleStatus || 'success',
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
  buildPromptPullCommand,
  copyToClipboard,
  copyToRemoteMacClipboard,
  copyToTerminalClipboard,
  exportZip,
  isSshSession,
  markFailed,
  openFolder,
  refreshCounts,
  runDirectImport,
  runInit,
  runPackage,
  runPreprocess,
  runValidation,
  scpPromptIfConfigured,
  writeAndCopyAgentPrompt,
  resolveDefaultObjectGlowRepo,
};
