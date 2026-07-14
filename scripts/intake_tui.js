#!/usr/bin/env node

const {
  createBatchWorkspace,
  listBatchStates,
  readBatchState,
} = require('./vision-intake-tui/batchState');
const {
  ensureIntakeDirs,
  getIntakePaths,
  listImageFiles,
  openFolder,
} = require('./vision-intake-tui/intakePaths');
const {
  archiveFailedBatch,
  archiveCompletedBatch,
  exportZip,
  runDirectImport,
  runInit,
  runPackage,
  runPreprocess,
  runValidation,
  writeAndCopyAgentPrompt,
} = require('./vision-intake-tui/intakePipeline');
const {
  askConfirm,
  askEnter,
  askSelect,
  askText,
  createPromptSession,
} = require('./vision-intake-tui/tuiPrompts');
const {
  ensureDestinationBox,
  normalizeTuiBoxNumber,
} = require('./vision-intake-tui/boxProvisioning');
const {
  checkApiHealth,
  printApiConfig,
  resolveApiConfig,
} = require('./vision-intake-tui/apiConfig');

const IMPORT_MODES = Object.freeze({
  direct: 'direct',
  export: 'export',
  validateOnly: 'validate_only',
});

function printHeader({ inboxCount, processingBatches }) {
  const activeLabel = processingBatches.length ? `${processingBatches.length} active` : 'empty';
  console.log('');
  console.log('DISCO WARP CORE VISION INTAKE');
  console.log(`Inbox: ${inboxCount} image${inboxCount === 1 ? '' : 's'}`);
  console.log(`Processing: ${activeLabel}`);
}

function formatBatchChoice(batch) {
  const counts = batch.counts || {};
  return [
    batch.batchName || batch.batchId,
    `[${batch.status || 'unknown'}]`,
    `${counts.rawImages || 0} raw`,
    `${counts.processedImages || 0} processed`,
    `${counts.jsonArtifacts || 0} json`,
  ].join(' · ');
}

async function chooseBatch(rl, batches, message) {
  if (!batches.length) {
    console.log('No matching batches found.');
    return null;
  }
  const selectedRoot = await askSelect(
    rl,
    message,
    batches.map((batch) => ({
      label: formatBatchChoice(batch),
      value: batch.paths.root,
    })).concat([{ label: 'Cancel', value: '' }])
  );
  if (!selectedRoot) return null;
  return readBatchState(selectedRoot);
}

async function recordFailedBatch(batch, intakePaths, error, fallbackStage) {
  try {
    return await archiveFailedBatch(
      batch,
      intakePaths,
      error,
      fallbackStage || batch.pipelineStage || batch.status || 'failed'
    );
  } catch (archiveError) {
    console.error(`Failed to move batch to failed folder: ${archiveError?.message || archiveError}`);
    return batch;
  }
}

async function runPreprocessInitAndPrompt(rl, batch, intakePaths) {
  let current = batch;
  try {
    current = await runPreprocess(current);
    current = await runInit(current);
    const prompt = await writeAndCopyAgentPrompt(current);
    console.log('');
    if (prompt.copied && prompt.method === 'terminal') {
      console.log('Agent prompt copied to terminal clipboard.');
    } else if (prompt.copied && prompt.method === 'ssh-pbcopy') {
      console.log(`Agent prompt copied to MacBook clipboard over SSH: ${prompt.target}`);
    } else if (prompt.copied) {
      console.log('Agent prompt copied to macOS clipboard.');
    } else {
      console.log('Agent prompt written. Clipboard copy failed.');
    }
    console.log(`Prompt file: ${prompt.promptPath}`);
    if (prompt.scp?.attempted && prompt.scp.ok) {
      console.log(`Agent prompt copied with scp to: ${prompt.scp.target}`);
    } else if (prompt.scp?.attempted) {
      console.log(`Agent prompt scp failed: ${prompt.scp.error || 'unknown error'}`);
    }
    console.log(`MacBook pull command: ${prompt.pullCommand}`);
    console.log('Run Codex now. Return here when complete.');
    await askEnter(rl);
    return readBatchState(current.paths.root);
  } catch (error) {
    await recordFailedBatch(current, intakePaths, error, 'preprocessing');
    throw error;
  }
}

async function validateAndFinish(rl, batch, intakePaths, { apiBase } = {}) {
  let current = batch;
  let failureStage = 'validating';
  try {
    current = await runValidation(current);

    if (current.importMode === IMPORT_MODES.export) {
      const exported = await exportZip(current, intakePaths);
      console.log(`Exported zip: ${exported.archivePath}`);
      if (await askConfirm(rl, 'Open exports folder?', { defaultValue: true })) {
        await openFolder(intakePaths.exports);
      }
      return exported;
    }

    if (current.importMode === IMPORT_MODES.validateOnly) {
      const packaged = await runPackage(current);
      console.log(`Validated and packaged: ${packaged.archivePath}`);
      return packaged;
    }

    failureStage = 'importing';
    const imported = await runDirectImport(current, { apiBase });
    const archived = await archiveCompletedBatch(imported, intakePaths);
    console.log(`Direct import completed. Batch archived at: ${archived.paths.root}`);
    return archived;
  } catch (error) {
    await recordFailedBatch(current, intakePaths, error, failureStage);
    throw error;
  }
}

async function startNewBatch(rl, intakePaths, { apiBase } = {}) {
  const inboxImages = await listImageFiles(intakePaths.inbox);
  if (!inboxImages.length) {
    console.log(`No supported images found in ${intakePaths.inbox}`);
    return;
  }

  const batchName = await askText(rl, 'Batch name');
  const location = await askText(rl, 'Destination location (optional)', { optional: true });
  const box = await askText(rl, 'Destination box id (optional)', {
    optional: true,
    validate: normalizeTuiBoxNumber,
  });
  const importMode = await askSelect(rl, 'Import mode', [
    { label: 'Direct database import', value: IMPORT_MODES.direct },
    { label: 'Export zip only', value: IMPORT_MODES.export },
    { label: 'Validate/package only, no import', value: IMPORT_MODES.validateOnly },
  ]);

  if (box && importMode === IMPORT_MODES.direct) {
    const ensured = await ensureDestinationBox({ box, location, apiBase });
    console.log(
      ensured.created
        ? `Created destination box #${ensured.boxNumber}.`
        : `Using existing destination box #${ensured.boxNumber}.`
    );
  }

  const { batch } = await createBatchWorkspace({
    intakePaths,
    batchName,
    destination: { location, box },
    importMode,
    inboxImages,
  });

  console.log(`Created batch workspace: ${batch.paths.root}`);
  const afterPrompt = await runPreprocessInitAndPrompt(rl, batch, intakePaths);
  await validateAndFinish(rl, afterPrompt, intakePaths, { apiBase });
}

async function resumeBatch(rl, intakePaths, { apiBase } = {}) {
  const batches = await listBatchStates(intakePaths.processing);
  const batch = await chooseBatch(rl, batches, 'Resume Existing Batch');
  if (!batch) return;

  if (batch.status === 'awaiting_annotation' || batch.pipelineStage === 'awaiting_annotation') {
    await validateAndFinish(rl, batch, intakePaths, { apiBase });
    return;
  }

  if (batch.status === 'packaged' || batch.pipelineStage === 'packaged') {
    const action = await askSelect(rl, 'Packaged batch action', [
      { label: 'Direct import now', value: 'import' },
      { label: 'Open batch folder', value: 'open' },
      { label: 'Cancel', value: 'cancel' },
    ]);
    if (action === 'import') {
      try {
        const imported = await runDirectImport(batch, { apiBase });
        const archived = await archiveCompletedBatch(imported, intakePaths);
        console.log(`Direct import completed. Batch archived at: ${archived.paths.root}`);
      } catch (error) {
        await recordFailedBatch(batch, intakePaths, error, 'importing');
        throw error;
      }
    } else if (action === 'open') {
      await openFolder(batch.paths.root);
    }
    return;
  }

  if (batch.status === 'failed') {
    console.log(`Last error: ${batch.lastError || 'unknown'}`);
    const action = await askSelect(rl, 'Failed batch action', [
      { label: 'Retry from preprocessing', value: 'preprocess' },
      { label: 'Continue from validation', value: 'validate' },
      { label: 'Open batch folder', value: 'open' },
      { label: 'Cancel', value: 'cancel' },
    ]);
    if (action === 'preprocess') {
      const afterPrompt = await runPreprocessInitAndPrompt(rl, batch, intakePaths);
      await validateAndFinish(rl, afterPrompt, intakePaths, { apiBase });
    } else if (action === 'validate') {
      await validateAndFinish(rl, batch, intakePaths, { apiBase });
    } else if (action === 'open') {
      await openFolder(batch.paths.root);
    }
    return;
  }

  const restart = await askConfirm(rl, `Batch is at "${batch.status}". Run preprocessing/init now?`, {
    defaultValue: true,
  });
  if (restart) {
    const afterPrompt = await runPreprocessInitAndPrompt(rl, batch, intakePaths);
    await validateAndFinish(rl, afterPrompt, intakePaths, { apiBase });
  }
}

async function reviewFailedBatch(rl, intakePaths, { apiBase } = {}) {
  const failedInProcessing = (await listBatchStates(intakePaths.processing))
    .filter((batch) => batch.status === 'failed');
  const failedArchived = await listBatchStates(intakePaths.failed);
  const batch = await chooseBatch(
    rl,
    [...failedInProcessing, ...failedArchived],
    'Review Failed Batch'
  );
  if (!batch) return;

  console.log(`Last error: ${batch.lastError || 'unknown'}`);
  console.log(`Logs: ${batch.paths.logs}`);
  const action = await askSelect(rl, 'Failed batch action', [
    { label: 'Open batch folder', value: 'open' },
    { label: 'Retry from preprocessing', value: 'preprocess' },
    { label: 'Continue from validation', value: 'validate' },
    { label: 'Exit', value: 'exit' },
  ]);
  if (action === 'open') {
    await openFolder(batch.paths.root);
  } else if (action === 'preprocess') {
    const afterPrompt = await runPreprocessInitAndPrompt(rl, batch, intakePaths);
    await validateAndFinish(rl, afterPrompt, intakePaths, { apiBase });
  } else if (action === 'validate') {
    await validateAndFinish(rl, batch, intakePaths, { apiBase });
  }
}

async function main() {
  const apiConfig = resolveApiConfig();
  printApiConfig(apiConfig);
  await checkApiHealth(apiConfig.apiBase);
  console.log('Backend API health check passed.');

  const intakePaths = await ensureIntakeDirs();
  const rl = createPromptSession();

  try {
    while (true) {
      const inboxImages = await listImageFiles(intakePaths.inbox);
      const processingBatches = await listBatchStates(intakePaths.processing);
      printHeader({ inboxCount: inboxImages.length, processingBatches });

      const action = await askSelect(rl, 'Options', [
        { label: 'Start New Batch', value: 'start' },
        { label: 'Resume Existing Batch', value: 'resume' },
        { label: 'Review Failed Batch', value: 'failed' },
        { label: 'Open Intake Folder', value: 'open' },
        { label: 'Exit', value: 'exit' },
      ]);

      if (action === 'start') {
        await startNewBatch(rl, intakePaths, apiConfig);
      } else if (action === 'resume') {
        await resumeBatch(rl, intakePaths, apiConfig);
      } else if (action === 'failed') {
        await reviewFailedBatch(rl, intakePaths, apiConfig);
      } else if (action === 'open') {
        await openFolder(intakePaths.root);
      } else {
        break;
      }
    }
  } catch (error) {
    console.error('');
    console.error(error?.message || error);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('');
    console.error(error?.message || error);
    process.exit(1);
  });
}
