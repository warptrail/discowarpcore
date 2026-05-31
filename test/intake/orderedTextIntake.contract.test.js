const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const {
  buildBatchManifest,
  buildIntakePayload,
  buildPairings,
  buildSubmitPairings,
  createDefaultSimpleBatchName,
  defaultConfig,
  discoverWorkspaceImages,
  normalizeConfig,
  readItemLines,
  resolvePairingRenderTokens,
  sortImagesDeterministically,
  shouldRandomizeGlow,
  resetSimpleIntake,
  validateBoxFormat,
  validateCounts,
} = require('../../scripts/ordered_text_intake');

async function makeTempRoot(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dwc-ordered-intake-'));
  t.after(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });
  return root;
}

test('readItemLines treats non-empty lines as item names', async (t) => {
  const root = await makeTempRoot(t);
  const itemsPath = path.join(root, 'items.txt');
  await fs.writeFile(itemsPath, '\nNintendo 64 Controller\n  \nUSB-C Cable  \n', 'utf8');

  const lines = await readItemLines(itemsPath);

  assert.deepEqual(lines, [
    { sourceLine: 2, name: 'Nintendo 64 Controller' },
    { sourceLine: 4, name: 'USB-C Cable' },
  ]);
});

test('sortImagesDeterministically sorts numeric filename sets numerically', () => {
  const sorted = sortImagesDeterministically([
    { fileName: '10.jpg', imageKey: '10' },
    { fileName: '2.jpg', imageKey: '2' },
    { fileName: '1.jpg', imageKey: '1' },
  ]);

  assert.deepEqual(sorted.map((image) => image.fileName), ['1.jpg', '2.jpg', '10.jpg']);
});

test('discoverWorkspaceImages sorts natural names and fails on unsupported files', async (t) => {
  const root = await makeTempRoot(t);
  await fs.writeFile(path.join(root, 'IMG_1002.HEIC'), 'image', 'utf8');
  await fs.writeFile(path.join(root, 'IMG_1001.HEIC'), 'image', 'utf8');
  await fs.writeFile(path.join(root, '.DS_Store'), 'ignore', 'utf8');
  await fs.writeFile(path.join(root, 'items.txt'), '', 'utf8');
  await fs.writeFile(path.join(root, 'intake.config.json'), '{}', 'utf8');
  await fs.mkdir(path.join(root, 'processed'));

  const images = await discoverWorkspaceImages(root);
  assert.deepEqual(images.map((image) => image.fileName), ['IMG_1001.HEIC', 'IMG_1002.HEIC']);

  await fs.writeFile(path.join(root, 'animation.gif'), 'image', 'utf8');
  await assert.rejects(
    () => discoverWorkspaceImages(root),
    /Unsupported file.*animation\.gif/
  );
});

test('validateCounts fails loudly on ordered pairing mismatch', () => {
  assert.throws(
    () => validateCounts(
      [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      [{ fileName: '1.jpg' }, { fileName: '2.jpg' }],
      'processed/'
    ),
    /items\.txt contains 3 item names[\s\S]*processed\/ contains 2 supported images/
  );
});

test('payload builders preserve index-based imageKey and existing import manifest shape', () => {
  const processedDir = '/tmp/batch/processed';
  const pairings = buildSubmitPairings({
    processedDir,
    itemLines: [
      { sourceLine: 1, name: 'Nintendo 64 Controller' },
      { sourceLine: 2, name: 'Game Boy Advance' },
    ],
    images: [
      { fileName: '1.webp', inputPath: '/tmp/batch/processed/1.webp' },
      { fileName: '2.webp', inputPath: '/tmp/batch/processed/2.webp' },
    ],
  });
  const renderTokens = { mode: 'explicit', background: 'midnight', glow: 'arc' };
  const intake = buildIntakePayload({
    batchLabel: 'game cables',
    workspaceDir: '/tmp/batch',
    pairings,
    renderTokens,
    config: { box: '701' },
  });
  const manifest = buildBatchManifest({
    batchLabel: 'game cables',
    workspaceDir: '/tmp/batch',
    pairings,
    renderTokens,
    config: { box: '701' },
  });

  assert.deepEqual(intake.items.map((item) => ({
    name: item.name,
    image: item.image,
    imageKey: item.imageKey,
  })), [
    { name: 'Nintendo 64 Controller', image: 'processed/1.webp', imageKey: '1' },
    { name: 'Game Boy Advance', image: 'processed/2.webp', imageKey: '2' },
  ]);
  assert.equal(intake.batchContext.source, 'ordered_text_images');
  assert.equal(intake.batchContext.box, '701');
  assert.equal(manifest.packageVersion, 2);
  assert.equal(manifest.app, 'discowarpcore');
  assert.equal(manifest.target.box, '701');
  assert.deepEqual(manifest.items.map((item) => ({
    imageFile: item.imageFile,
    imageKey: item.imageKey,
    name: item.name,
  })), [
    { imageFile: '1.webp', imageKey: '1', name: 'Nintendo 64 Controller' },
    { imageFile: '2.webp', imageKey: '2', name: 'Game Boy Advance' },
  ]);
});

test('config normalization and box format validation are explicit', () => {
  assert.deepEqual(normalizeConfig({ batchName: ' Shelf Batch ', box: ' 701 ', apiBase: ' http://localhost:5002/ ' }), {
    batchName: 'Shelf Batch',
    box: '701',
    apiBase: 'http://localhost:5002/',
  });
  assert.equal(defaultConfig({ batchName: 'simple fixture' }).batchName, 'simple fixture');
  assert.match(createDefaultSimpleBatchName(new Date(2026, 4, 27, 16, 31)), /^simple 2026-05-27 1631$/);
  assert.equal(validateBoxFormat('701'), '701');
  assert.equal(validateBoxFormat(''), '');
  assert.throws(() => validateBoxFormat('71'), /exactly 3 digits/);
  assert.throws(() => validateBoxFormat('box 701'), /exactly 3 digits/);
});

test('simple init randomizes glow unless an explicit glow is requested', () => {
  const baseTokens = { mode: 'explicit', background: 'midnight', glow: 'arc' };

  assert.equal(shouldRandomizeGlow({}), true);
  assert.equal(shouldRandomizeGlow({ 'glow-token': 'arc' }), false);
  assert.equal(shouldRandomizeGlow({ 'glow-mode': 'fixed' }), false);

  const randomized = resolvePairingRenderTokens(baseTokens, {});
  assert.equal(randomized.background, 'midnight');
  assert.equal(typeof randomized.glow, 'string');
  assert.notEqual(randomized.glow.length, 0);

  assert.deepEqual(resolvePairingRenderTokens(baseTokens, { 'glow-token': 'arc' }), baseTokens);
});

test('resetSimpleIntake archives workspace contents and recreates operator files', async (t) => {
  const root = await makeTempRoot(t);
  const intakeRoot = path.join(root, 'discowarpcore');
  const workspace = path.join(root, 'simple');
  const previousExternalRoot = process.env.DISCOWARPCORE_INTAKE_ROOT;
  process.env.DISCOWARPCORE_INTAKE_ROOT = intakeRoot;
  t.after(() => {
    if (previousExternalRoot == null) {
      delete process.env.DISCOWARPCORE_INTAKE_ROOT;
    } else {
      process.env.DISCOWARPCORE_INTAKE_ROOT = previousExternalRoot;
    }
  });

  await fs.mkdir(path.join(workspace, 'processed'), { recursive: true });
  await fs.writeFile(path.join(workspace, 'IMG_1001.jpg'), 'raw', 'utf8');
  await fs.writeFile(path.join(workspace, 'processed', '1.webp'), 'processed', 'utf8');
  await fs.writeFile(path.join(workspace, 'items.txt'), 'Cable\n', 'utf8');
  await fs.writeFile(
    path.join(workspace, 'intake.config.json'),
    JSON.stringify({ batchName: 'Cable Batch', box: '701', apiBase: 'http://127.0.0.1:5002' }),
    'utf8'
  );

  const originalLog = console.log;
  console.log = () => {};
  const result = await resetSimpleIntake(['--dir', workspace])
    .finally(() => {
      console.log = originalLog;
    });

  assert.equal(result.archived, true);
  assert.match(result.archiveDir, /simple-archive/);
  assert.equal(await fs.readFile(path.join(result.archiveDir, 'IMG_1001.jpg'), 'utf8'), 'raw');
  assert.equal(await fs.readFile(path.join(result.archiveDir, 'processed', '1.webp'), 'utf8'), 'processed');
  assert.equal(await fs.readFile(path.join(result.archiveDir, 'items.txt'), 'utf8'), 'Cable\n');
  assert.equal(await fs.readFile(path.join(workspace, 'items.txt'), 'utf8'), '');

  const nextConfig = JSON.parse(await fs.readFile(path.join(workspace, 'intake.config.json'), 'utf8'));
  assert.match(nextConfig.batchName, /^simple /);
  assert.equal(nextConfig.box, '');

  const receipt = JSON.parse(await fs.readFile(path.join(result.archiveDir, 'simple_intake_archive.json'), 'utf8'));
  assert.equal(receipt.batchName, 'Cable Batch');
  assert.deepEqual(receipt.movedEntries.sort(), ['IMG_1001.jpg', 'intake.config.json', 'items.txt', 'processed'].sort());
});
