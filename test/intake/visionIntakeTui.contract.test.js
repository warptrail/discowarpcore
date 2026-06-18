const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const {
  createBatchWorkspace,
  createVisionBatchId,
  readBatchState,
  updateBatchState,
} = require('../../scripts/vision-intake-tui/batchState');
const {
  buildPreprocessCommand,
  buildVisionCommand,
} = require('../../scripts/vision-intake-tui/commandRunner');
const {
  ensureIntakeDirs,
  getIntakePaths,
  listImageFiles,
} = require('../../scripts/vision-intake-tui/intakePaths');
const {
  archiveFailedBatch,
} = require('../../scripts/vision-intake-tui/intakePipeline');
const {
  ensureDestinationBox,
  normalizeTuiBoxNumber,
} = require('../../scripts/vision-intake-tui/boxProvisioning');
const {
  askText,
} = require('../../scripts/vision-intake-tui/tuiPrompts');
const {
  validateArtifacts,
} = require('../../scripts/build_vision_intake_batch');

async function makeTempRoot(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dwc-vision-tui-'));
  t.after(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });
  return root;
}

test('createVisionBatchId creates timestamped slug ids', () => {
  const id = createVisionBatchId('Garage Shelf!', new Date(2026, 4, 20, 12, 34, 56));
  assert.equal(id, 'batch_20260520123456_garage_shelf');
});

test('ensureIntakeDirs creates durable intake folder model', async (t) => {
  const root = await makeTempRoot(t);
  const paths = await ensureIntakeDirs(root);

  for (const key of ['inbox', 'processing', 'completed', 'failed', 'exports']) {
    const stats = await fs.stat(paths[key]);
    assert.equal(stats.isDirectory(), true);
  }
});

test('createBatchWorkspace moves inbox images and writes resumable batch state', async (t) => {
  const root = await makeTempRoot(t);
  const paths = await ensureIntakeDirs(root);
  await fs.writeFile(path.join(paths.inbox, 'IMG_1.png'), 'image', 'utf8');
  await fs.writeFile(path.join(paths.inbox, 'notes.txt'), 'ignore', 'utf8');

  const images = await listImageFiles(paths.inbox);
  const { batch } = await createBatchWorkspace({
    intakePaths: paths,
    batchName: 'Garage Shelf',
    destination: { location: 'garage', box: '701' },
    importMode: 'export',
    inboxImages: images,
  });

  const saved = await readBatchState(batch.paths.root);
  assert.equal(saved.batchName, 'Garage Shelf');
  assert.equal(saved.destination.location, 'garage');
  assert.equal(saved.destination.box, '701');
  assert.equal(saved.counts.rawImages, 1);
  assert.equal((await listImageFiles(paths.inbox)).length, 0);
  assert.equal((await listImageFiles(saved.paths.raw)).length, 1);

  const updated = await updateBatchState(saved.paths.root, {
    status: 'awaiting_annotation',
    counts: { jsonArtifacts: 1 },
  });
  assert.equal(updated.status, 'awaiting_annotation');
  assert.equal(updated.counts.rawImages, 1);
  assert.equal(updated.counts.jsonArtifacts, 1);
});

test('normalizeTuiBoxNumber accepts only optional exact 3-digit box numbers', () => {
  assert.equal(normalizeTuiBoxNumber('701'), '701');
  assert.equal(normalizeTuiBoxNumber(' 001 '), '001');
  assert.equal(normalizeTuiBoxNumber(''), '');
  assert.throws(() => normalizeTuiBoxNumber('71'), /exactly 3 digits/);
  assert.throws(() => normalizeTuiBoxNumber('box 701'), /exactly 3 digits/);
});

test('askText reprompts until destination box id validation passes', async () => {
  const answers = ['71', 'box 701', '701'];
  const originalLog = console.log;
  const rl = {
    async question() {
      return answers.shift();
    },
  };

  let value = '';
  try {
    console.log = () => {};
    value = await askText(rl, 'Destination box id (optional)', {
      optional: true,
      validate: normalizeTuiBoxNumber,
    });
  } finally {
    console.log = originalLog;
  }

  assert.equal(value, '701');
  assert.equal(answers.length, 0);
});

test('ensureDestinationBox creates a missing destination box through existing box API', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (calls.length === 1) {
      return {
        ok: false,
        status: 404,
        async json() {
          return { ok: false, error: 'Box not found' };
        },
      };
    }
    return {
      ok: true,
      status: 201,
      async json() {
        return { _id: 'mongo-777', box_id: '777', label: 'Box 777' };
      },
    };
  };

  const result = await ensureDestinationBox({
    box: '777',
    location: 'garage',
    apiBase: 'http://dwc.local/',
    fetchImpl,
  });

  assert.equal(result.created, true);
  assert.equal(result.boxNumber, '777');
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'http://dwc.local/api/boxes/resolve-short-id/777');
  assert.equal(calls[1].url, 'http://dwc.local/api/boxes');
  assert.equal(calls[1].options.method, 'POST');
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    box_id: '777',
    label: 'Box 777',
    location: 'garage',
  });
});

test('archiveFailedBatch marks and moves a failed processing batch', async (t) => {
  const root = await makeTempRoot(t);
  const paths = await ensureIntakeDirs(root);
  await fs.writeFile(path.join(paths.inbox, 'IMG_1.png'), 'image', 'utf8');
  const images = await listImageFiles(paths.inbox);
  const { batch } = await createBatchWorkspace({
    intakePaths: paths,
    batchName: 'Garage Shelf',
    destination: { location: 'garage', box: '701' },
    importMode: 'direct',
    inboxImages: images,
  });

  const originalRoot = batch.paths.root;
  const archived = await archiveFailedBatch(
    batch,
    paths,
    new Error('Backend import did not complete successfully.'),
    'importing'
  );

  await assert.rejects(fs.stat(originalRoot));
  assert.equal(path.dirname(archived.paths.root), paths.failed);
  const saved = await readBatchState(archived.paths.root);
  assert.equal(saved.status, 'failed');
  assert.equal(saved.pipelineStage, 'importing');
  assert.match(saved.lastError, /Backend import/);
});

test('command builders compose existing script calls with batch paths', () => {
  const preprocess = buildPreprocessCommand({
    rawDir: '/tmp/raw',
    processedDir: '/tmp/processed',
  });
  assert.equal(preprocess.command, process.execPath);
  assert.deepEqual(preprocess.args.slice(0, 5), [
    'scripts/preprocess_vision_images.js',
    '--source-dir',
    '/tmp/raw',
    '--output-dir',
    '/tmp/processed',
  ]);

  const vision = buildVisionCommand({
    mode: 'validate',
    sourceDir: '/tmp/processed',
    artifactsDir: '/tmp/item_artifacts',
    batchName: 'Garage Shelf',
    location: 'garage',
    box: '701',
  });
  assert.equal(vision.command, process.execPath);
  assert.deepEqual(vision.args, [
    'scripts/build_vision_intake_batch.js',
    '--validate',
    '--source-dir',
    '/tmp/processed',
    '--batch-label',
    'Garage Shelf',
    '--artifacts-dir',
    '/tmp/item_artifacts',
    '--location',
    'garage',
    '--box',
    '701',
  ]);
});

test('validateArtifacts reports missing names and mismatched image keys', async (t) => {
  const root = await makeTempRoot(t);
  const sourceDir = path.join(root, 'processed');
  const artifactsDir = path.join(root, 'item_artifacts');
  await fs.mkdir(sourceDir, { recursive: true });
  await fs.mkdir(artifactsDir, { recursive: true });
  await fs.writeFile(path.join(sourceDir, 'IMG_1.png'), 'image', 'utf8');
  await fs.writeFile(
    path.join(artifactsDir, 'IMG_1.json'),
    JSON.stringify({ imageKey: 'WRONG', sourceFile: 'IMG_1.png', name: '' }),
    'utf8'
  );

  const result = await validateArtifacts({
    sourceDir,
    artifactsDir,
    location: '',
    box: '',
  });

  assert.equal(result.ok, false);
  assert.equal(result.totalImages, 1);
  assert.equal(result.totalArtifacts, 1);
  assert.match(result.errors.join('\n'), /mismatch|imageKey/i);
});
