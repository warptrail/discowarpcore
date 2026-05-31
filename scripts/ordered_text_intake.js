#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const {
  createBatchId,
  getExternalIntakeRoot,
  parseArgs,
  slugify,
  toTrimmed,
} = require('./intakeWorkspace');
const {
  resolveObjectGlowCommand,
  preprocessImages,
} = require('./preprocess_vision_images');
const {
  DEFAULT_RENDER_TOKENS,
  RENDER_TOKEN_KEYS,
  validateRenderTokens,
} = require('../backend/services/renderTokenContract');

const execFileAsync = promisify(execFile);

const TOOL_NAME = 'dwc-ordered-text-intake';
const APP_NAME = 'discowarpcore';
const SIMPLE_WORKSPACE_DIRNAME = 'simple';
const DEFAULT_SIMPLE_INTAKE_DIR = path.join(os.homedir(), 'Intake', SIMPLE_WORKSPACE_DIRNAME);
const DEFAULT_OBJECTGLOW_REPO = path.join(os.homedir(), 'Developer', 'objectiglow');
const ITEMS_FILENAME = 'items.txt';
const CONFIG_FILENAME = 'intake.config.json';
const PREVIEW_FILENAME = 'pairing_preview.txt';
const PROCESSED_DIRNAME = 'processed';
const PACKAGE_DIRNAME = 'package';
const INTAKE_FILENAME = 'intake.json';
const BATCH_MANIFEST_FILENAME = 'batch_manifest.json';
const SUPPORTED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']);
const HEIC_EXTENSIONS = new Set(['.heic', '.heif']);
const IGNORED_WORKSPACE_FILES = new Set([
  ITEMS_FILENAME,
  CONFIG_FILENAME,
  PREVIEW_FILENAME,
  INTAKE_FILENAME,
  BATCH_MANIFEST_FILENAME,
]);
const DEFAULT_API_BASE = 'http://127.0.0.1:5002';

const naturalCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

function usageMessage() {
  return [
    'Usage:',
    '  npm run intake:simple:init',
    '  npm run intake:simple:submit',
    '  npm run intake:simple:reset',
    '',
    'Optional:',
    '  npm run intake:simple:init -- --dir ~/Intake/simple --force',
    '  npm run intake:simple:init -- --glow-token arc',
    '  npm run intake:simple:submit -- --dir ~/Intake/simple',
    '  npm run intake:simple:reset -- --dir ~/Intake/simple',
    '',
    'Workflow:',
    `  1. Drag raw item photos into ${DEFAULT_SIMPLE_INTAKE_DIR}`,
    '  2. Run npm run intake:simple:init',
    `  3. Fill item names in ${ITEMS_FILENAME} and optional box in ${CONFIG_FILENAME}`,
    '  4. Run npm run intake:simple:submit while the backend server is running',
    '  5. Run npm run intake:simple:reset to archive and clear the simple workspace',
  ].join('\n');
}

function jsonString(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function resolveUserPath(value, fallbackPath = '') {
  const raw = toTrimmed(value);
  if (!raw) return fallbackPath ? path.resolve(fallbackPath) : '';
  if (raw === '~') return os.homedir();
  if (raw.startsWith('~/')) return path.join(os.homedir(), raw.slice(2));
  return path.resolve(raw);
}

function isHiddenName(name) {
  return String(name || '').startsWith('.');
}

function basenameWithoutExtension(fileName) {
  return path.basename(fileName, path.extname(fileName));
}

function isSupportedImageName(fileName) {
  return SUPPORTED_IMAGE_EXTENSIONS.has(path.extname(String(fileName || '')).toLowerCase());
}

function isHeicImageName(fileName) {
  return HEIC_EXTENSIONS.has(path.extname(String(fileName || '')).toLowerCase());
}

function isNumericImageSet(images) {
  return images.length > 0 && images.every((image) => /^\d+$/.test(image.imageKey));
}

function compareImageFileNames(left, right, numericSet) {
  if (numericSet) {
    const leftNumber = Number.parseInt(left.imageKey, 10);
    const rightNumber = Number.parseInt(right.imageKey, 10);
    if (leftNumber !== rightNumber) return leftNumber - rightNumber;
  }

  return naturalCollator.compare(left.fileName, right.fileName);
}

function sortImagesDeterministically(images = []) {
  const numericSet = isNumericImageSet(images);
  return [...images].sort((left, right) => {
    const byName = compareImageFileNames(left, right, numericSet);
    if (byName !== 0) return byName;
    return left.fileName.localeCompare(right.fileName);
  });
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function assertDirectoryExists(dirPath, label) {
  const stats = await fs.stat(dirPath).catch(() => null);
  if (!stats || !stats.isDirectory()) {
    throw new Error(`${label} folder not found: ${dirPath}`);
  }
}

async function assertFileExists(filePath, label) {
  const stats = await fs.stat(filePath).catch(() => null);
  if (!stats || !stats.isFile()) {
    throw new Error(`${label} not found: ${filePath}`);
  }
}

async function readJsonFile(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw new Error(`Invalid JSON in ${filePath}: ${error?.message || error}`);
  }
}

async function readItemLines(itemsPath) {
  const text = await fs.readFile(itemsPath, 'utf8');
  return text
    .split(/\r?\n/)
    .map((line, index) => ({
      sourceLine: index + 1,
      name: line.trim(),
    }))
    .filter((line) => line.name);
}

async function writeFileIfMissing(filePath, contents) {
  if (await pathExists(filePath)) {
    return false;
  }
  await fs.writeFile(filePath, contents, 'utf8');
  return true;
}

function formatTimestampForName(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}${minutes}`;
}

function createDefaultSimpleBatchName(date = new Date()) {
  return `simple ${formatTimestampForName(date)}`;
}

function defaultConfig({ batchName = createDefaultSimpleBatchName() } = {}) {
  return {
    batchName,
    box: '',
    apiBase: DEFAULT_API_BASE,
  };
}

async function ensureOperatorFiles(workspaceDir) {
  const itemsPath = path.join(workspaceDir, ITEMS_FILENAME);
  const configPath = path.join(workspaceDir, CONFIG_FILENAME);
  const createdItems = await writeFileIfMissing(itemsPath, '');
  const createdConfig = await writeFileIfMissing(configPath, jsonString(defaultConfig()));
  if (!createdConfig) {
    const currentConfig = normalizeConfig(await readJsonFile(configPath, {}));
    const patchedConfig = {
      batchName: currentConfig.batchName || createDefaultSimpleBatchName(),
      box: currentConfig.box,
      apiBase: currentConfig.apiBase,
    };
    if (
      patchedConfig.batchName !== currentConfig.batchName ||
      patchedConfig.apiBase !== currentConfig.apiBase
    ) {
      await fs.writeFile(configPath, jsonString(patchedConfig), 'utf8');
    }
  }
  return {
    itemsPath,
    configPath,
    createdItems,
    createdConfig,
  };
}

async function discoverWorkspaceImages(workspaceDir) {
  const entries = await fs.readdir(workspaceDir, { withFileTypes: true });
  const unsupportedFiles = [];
  const images = [];

  for (const entry of entries) {
    if (isHiddenName(entry.name)) continue;
    if (entry.isDirectory()) {
      continue;
    }
    if (!entry.isFile()) continue;
    if (IGNORED_WORKSPACE_FILES.has(entry.name)) continue;

    if (!isSupportedImageName(entry.name)) {
      unsupportedFiles.push(entry.name);
      continue;
    }

    images.push({
      fileName: entry.name,
      imageKey: basenameWithoutExtension(entry.name),
      inputPath: path.join(workspaceDir, entry.name),
    });
  }

  if (unsupportedFiles.length) {
    throw new Error(
      `Unsupported file(s) in ${workspaceDir}: ${unsupportedFiles.join(', ')}. ` +
      `Only raw image files should be dragged into this folder. Supported image extensions: ${Array.from(SUPPORTED_IMAGE_EXTENSIONS).join(', ')}.`
    );
  }

  return sortImagesDeterministically(images);
}

async function discoverProcessedImages(processedDir) {
  await assertDirectoryExists(processedDir, PROCESSED_DIRNAME);
  const entries = await fs.readdir(processedDir, { withFileTypes: true });
  const unsupportedFiles = [];
  const images = [];

  for (const entry of entries) {
    if (!entry.isFile() || isHiddenName(entry.name)) continue;
    if (!isSupportedImageName(entry.name)) {
      unsupportedFiles.push(entry.name);
      continue;
    }
    images.push({
      fileName: entry.name,
      imageKey: basenameWithoutExtension(entry.name),
      inputPath: path.join(processedDir, entry.name),
    });
  }

  if (unsupportedFiles.length) {
    throw new Error(`Unsupported file(s) in ${processedDir}: ${unsupportedFiles.join(', ')}.`);
  }

  return sortImagesDeterministically(images);
}

function validateCounts(itemLines, images, imageFolderLabel = PROCESSED_DIRNAME) {
  if (!images.length) {
    throw new Error(`No supported image files found in ${imageFolderLabel}.`);
  }

  if (itemLines.length !== images.length) {
    throw new Error([
      'Ordered intake validation failed:',
      `${ITEMS_FILENAME} contains ${itemLines.length} item names.`,
      `${imageFolderLabel} contains ${images.length} supported images.`,
      'These counts must match exactly because pairing is line-number based.',
    ].join('\n'));
  }
}

function buildPairings({ itemLines, images, processedDir }) {
  return itemLines.map((item, index) => {
    const lineNumber = index + 1;
    const outputFileName = `${lineNumber}.webp`;
    const image = images[index];

    return {
      index: lineNumber,
      sourceLine: item.sourceLine,
      name: item.name,
      inputFile: image.fileName,
      inputPath: image.inputPath,
      imageKey: String(lineNumber),
      outputFileName,
      outputPath: path.join(processedDir, outputFileName),
      intakeImagePath: `${PROCESSED_DIRNAME}/${outputFileName}`,
    };
  });
}

function buildInitPairings({ images, processedDir }) {
  return images.map((image, index) => {
    const lineNumber = index + 1;
    const outputFileName = `${lineNumber}.webp`;
    return {
      index: lineNumber,
      sourceLine: lineNumber,
      name: '',
      inputFile: image.fileName,
      inputPath: image.inputPath,
      imageKey: String(lineNumber),
      outputFileName,
      outputPath: path.join(processedDir, outputFileName),
      intakeImagePath: `${PROCESSED_DIRNAME}/${outputFileName}`,
    };
  });
}

function buildSubmitPairings({ itemLines, images, processedDir }) {
  return itemLines.map((item, index) => {
    const lineNumber = index + 1;
    const image = images[index];
    return {
      index: lineNumber,
      sourceLine: item.sourceLine,
      name: item.name,
      inputFile: image.fileName,
      inputPath: image.inputPath,
      imageKey: basenameWithoutExtension(image.fileName),
      outputFileName: image.fileName,
      outputPath: path.join(processedDir, image.fileName),
      intakeImagePath: `${PROCESSED_DIRNAME}/${image.fileName}`,
    };
  });
}

async function assertCanInitializeOutputs({ processedDir, workspaceDir, force }) {
  const processedExists = await pathExists(processedDir);
  const processedEntries = processedExists ? await fs.readdir(processedDir) : [];
  const blockingPaths = [];

  if (processedEntries.length > 0) {
    blockingPaths.push(`${processedDir}/`);
  }

  if (blockingPaths.length && !force) {
    throw new Error(
      'Refusing to overwrite existing simple intake output:\n' +
      blockingPaths.map((entry) => `- ${entry}`).join('\n') +
      '\nRun again with --force to clear and regenerate processed images.'
    );
  }

  if (force) {
    await fs.rm(processedDir, { recursive: true, force: true });
    await fs.rm(path.join(workspaceDir, INTAKE_FILENAME), { force: true });
    await fs.rm(path.join(workspaceDir, BATCH_MANIFEST_FILENAME), { force: true });
    await fs.rm(path.join(workspaceDir, PREVIEW_FILENAME), { force: true });
    await fs.rm(path.join(workspaceDir, PACKAGE_DIRNAME), { recursive: true, force: true });
  }
}

async function assertHeicConversionAvailable(images) {
  const hasHeic = images.some((image) => isHeicImageName(image.fileName));
  if (!hasHeic) return;

  if (!(await pathExists('/usr/bin/sips'))) {
    throw new Error(
      'HEIC/HEIF input was found, but this ObjectGlow preprocessing path requires /usr/bin/sips for conversion. ' +
      'Convert HEIC files to jpg/png first or run on macOS with sips available.'
    );
  }
}

function resolveOrderedRenderTokens(args = {}) {
  const glow = toTrimmed(args['glow-token']) || DEFAULT_RENDER_TOKENS.glow;
  const requested = {
    mode: 'explicit',
    background: toTrimmed(args['background-token']) || DEFAULT_RENDER_TOKENS.background,
    glow,
  };
  const validation = validateRenderTokens(requested, {
    fallbackTokens: DEFAULT_RENDER_TOKENS,
  });

  if (!validation.isValid) {
    throw new Error(`Invalid render token options:\n${validation.errors.map((error) => `- ${error}`).join('\n')}`);
  }

  return validation.renderTokens;
}

function pickRandomToken(tokens = [], fallback = '') {
  const source = Array.isArray(tokens) ? tokens.filter(Boolean) : [];
  if (!source.length) return toTrimmed(fallback);
  const index = Math.floor(Math.random() * source.length);
  return toTrimmed(source[index]) || toTrimmed(fallback);
}

function shouldRandomizeGlow(args = {}) {
  if (toTrimmed(args['glow-token'])) return false;
  const mode = toTrimmed(args['glow-mode']).toLowerCase();
  if (['fixed', 'explicit', 'off'].includes(mode)) return false;
  return true;
}

function resolvePairingRenderTokens(baseTokens, args = {}) {
  if (!shouldRandomizeGlow(args)) {
    return baseTokens;
  }

  return {
    ...baseTokens,
    glow: pickRandomToken(RENDER_TOKEN_KEYS.glows, baseTokens.glow),
  };
}

async function resolveOrderedObjectGlowCommand(args = {}) {
  if (
    toTrimmed(args['objectglow-bin']) ||
    toTrimmed(args['objectglow-repo']) ||
    toTrimmed(process.env.OBJECTGLOW_BIN) ||
    toTrimmed(process.env.OBJECTGLOW_REPO)
  ) {
    return resolveObjectGlowCommand(args);
  }

  const defaultLauncher = path.join(DEFAULT_OBJECTGLOW_REPO, 'bin', 'objectglow');
  if (await pathExists(defaultLauncher)) {
    return resolveObjectGlowCommand({
      ...args,
      'objectglow-repo': DEFAULT_OBJECTGLOW_REPO,
    });
  }

  return resolveObjectGlowCommand(args);
}

function buildObjectGlowExtraArgs(args = {}, renderTokens = DEFAULT_RENDER_TOKENS) {
  const size = toTrimmed(args.size) || '1024';
  const webpQuality = toTrimmed(args['webp-quality']) || '90';
  const padding = toTrimmed(args.padding) || '0.10';

  return [
    '--background-token',
    renderTokens.background,
    '--glow-token',
    renderTokens.glow,
    '--size',
    size,
    '--webp-quality',
    webpQuality,
    '--padding',
    padding,
  ];
}

function normalizeConfig(rawConfig = {}) {
  const source = rawConfig && typeof rawConfig === 'object' && !Array.isArray(rawConfig)
    ? rawConfig
    : {};
  return {
    batchName: toTrimmed(source.batchName),
    box: toTrimmed(source.box),
    apiBase: toTrimmed(source.apiBase || process.env.DWC_API_BASE || DEFAULT_API_BASE),
  };
}

async function readSimpleConfig(configPath) {
  const raw = await readJsonFile(configPath, defaultConfig());
  return normalizeConfig(raw);
}

function validateBoxFormat(box) {
  const normalized = toTrimmed(box);
  if (!normalized) return '';
  if (!/^\d{3}$/.test(normalized)) {
    throw new Error(
      `Invalid box number "${normalized}". Box numbers must be exactly 3 digits, like "001" or "701".`
    );
  }
  return normalized;
}

async function fetchJson(url, options = {}, fallbackMessage = 'Request failed') {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error(
      `${fallbackMessage}. Backend API is not reachable at ${url}. Start the backend server or set apiBase in ${CONFIG_FILENAME}.`
    );
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error || body?.message || fallbackMessage);
  }
  return body;
}

async function validateConfiguredBox({ box, apiBase }) {
  const normalizedBox = validateBoxFormat(box);
  if (!normalizedBox) return null;

  const url = `${apiBase.replace(/\/+$/, '')}/api/boxes/resolve-short-id/${encodeURIComponent(normalizedBox)}`;
  const result = await fetchJson(url, { headers: { Accept: 'application/json' } }, `Box ${normalizedBox} was not found`);
  if (!result?.ok || !result?.box) {
    throw new Error(`Box ${normalizedBox} was not found.`);
  }
  return result.box;
}

function buildIntakePayload({ batchLabel, workspaceDir, pairings, renderTokens, config }) {
  const box = toTrimmed(config?.box) || null;
  return {
    packageVersion: 1,
    app: APP_NAME,
    workflow: 'ordered_text_images',
    batchLabel,
    createdAt: new Date().toISOString(),
    batchContext: {
      source: 'ordered_text_images',
      itemCount: pairings.length,
      location: null,
      box,
      destinationReviewed: true,
    },
    metadata: {
      createdByTool: TOOL_NAME,
      sourceDir: workspaceDir,
      pairing: 'line_number_index',
      renderTokens,
    },
    items: pairings.map((pairing) => ({
      name: pairing.name,
      image: pairing.intakeImagePath,
      imageFile: pairing.outputFileName,
      imageKey: pairing.imageKey,
      category: 'miscellaneous',
      tags: [],
      quantity: 1,
      box,
    })),
  };
}

function buildBatchManifest({ batchLabel, workspaceDir, pairings, renderTokens, config }) {
  const box = toTrimmed(config?.box) || null;
  return {
    packageVersion: 2,
    app: APP_NAME,
    batchLabel,
    createdAt: new Date().toISOString(),
    target: {
      location: null,
      box,
    },
    batchContext: {
      source: 'ordered_text_images',
      itemCount: pairings.length,
      location: null,
      box,
      destinationReviewed: true,
    },
    metadata: {
      createdByTool: TOOL_NAME,
      sourceDir: workspaceDir,
      imageSource: 'ordered_text_raw_images',
      processedImagesDir: PROCESSED_DIRNAME,
      sourceMachine: os.hostname(),
      operator: toTrimmed(process.env.USER || process.env.USERNAME || 'unknown'),
      renderTokens,
    },
    items: pairings.map((pairing) => ({
      imageFile: pairing.outputFileName,
      imageKey: pairing.imageKey,
      name: pairing.name,
      description: '',
      category: 'miscellaneous',
      tags: [],
      quantity: 1,
      box,
    })),
  };
}

function buildPairingPreview(pairings) {
  return [
    'Pairing preview:',
    ...pairings.map((pairing) => (
      `${pairing.index}. ${pairing.inputFile} -> ${pairing.name || '(fill items.txt line)'} -> ${pairing.intakeImagePath}`
    )),
    '',
  ].join('\n');
}

function printPairingPreview(pairings) {
  console.log('');
  process.stdout.write(buildPairingPreview(pairings));
}

async function writePairingPreview(workspaceDir, pairings) {
  const previewPath = path.join(workspaceDir, PREVIEW_FILENAME);
  await fs.writeFile(previewPath, buildPairingPreview(pairings), 'utf8');
  return previewPath;
}

async function movePath(sourcePath, destinationPath) {
  await ensureDirectory(path.dirname(destinationPath));
  try {
    await fs.rename(sourcePath, destinationPath);
  } catch (error) {
    if (error?.code !== 'EXDEV') throw error;
    const stats = await fs.stat(sourcePath);
    if (stats.isDirectory()) {
      await fs.cp(sourcePath, destinationPath, { recursive: true });
      await fs.rm(sourcePath, { recursive: true, force: true });
    } else {
      await fs.copyFile(sourcePath, destinationPath);
      await fs.rm(sourcePath, { force: true });
    }
  }
}

async function listWorkspaceEntries(workspaceDir) {
  const entries = await fs.readdir(workspaceDir, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => !isHiddenName(entry.name))
    .map((entry) => ({
      name: entry.name,
      sourcePath: path.join(workspaceDir, entry.name),
    }));
}

async function createUniqueArchiveDir(batchName) {
  const archiveRoot = path.join(getExternalIntakeRoot(), 'simple-archive');
  await ensureDirectory(archiveRoot);

  const baseName = createBatchId(slugify(batchName, 'simple'));
  let archiveDir = path.join(archiveRoot, baseName);
  let suffix = 2;
  while (await pathExists(archiveDir)) {
    archiveDir = path.join(archiveRoot, `${baseName}-${suffix}`);
    suffix += 1;
  }
  await ensureDirectory(archiveDir);
  return archiveDir;
}

async function processOrderedImages({
  pairings,
  processedDir,
  commandInfo,
  renderTokens,
  args,
  batchId,
}) {
  await ensureDirectory(processedDir);

  const aggregate = {
    processed: [],
    skipped: [],
    failed: [],
  };

  for (const pairing of pairings) {
    const plannedImage = {
      fileName: pairing.inputFile,
      imageKey: pairing.imageKey,
      inputPath: pairing.inputPath,
      outputPath: pairing.outputPath,
    };
    const pairingRenderTokens = resolvePairingRenderTokens(renderTokens, args);
    pairing.renderTokens = pairingRenderTokens;
    console.log(
      `Render tokens for ${pairing.outputFileName}: background=${pairingRenderTokens.background}, glow=${pairingRenderTokens.glow}`
    );

    const result = await preprocessImages({
      outputDir: processedDir,
      outputMode: 'webp',
      renderMode: 'objectglow',
      commandInfo,
      plannedImages: [plannedImage],
      batchId,
      extraArgs: buildObjectGlowExtraArgs(args, pairingRenderTokens),
      force: true,
      dryRun: false,
      size: 1024,
      padding: 0.10,
      webpQuality: 90,
      skipAutoRotate: args['skip-auto-rotate'] !== false,
    });

    aggregate.processed.push(...result.processed);
    aggregate.skipped.push(...result.skipped);
    aggregate.failed.push(...result.failed);
  }

  if (aggregate.failed.length > 0 || aggregate.skipped.length > 0) {
    const failedLines = aggregate.failed.map((entry) => (
      `- ${entry.inputFile}: ${entry.error || entry.finalMessage || 'ObjectGlow processing failed.'}`
    ));
    const skippedLines = aggregate.skipped.map((entry) => (
      `- ${entry.inputFile}: ${entry.reason || 'skipped'}`
    ));
    throw new Error([
      'ObjectGlow processing failure.',
      ...failedLines,
      ...skippedLines,
    ].filter(Boolean).join('\n'));
  }

  return aggregate;
}

async function createZipArchive({ packageDir, archivePath }) {
  await ensureDirectory(path.dirname(archivePath));
  await execFileAsync('/usr/bin/zip', ['-rq', archivePath, '.'], {
    cwd: packageDir,
  });
}

async function createSubmitPackage({ workspaceDir, batchManifest, pairings, batchId }) {
  const packageRoot = path.join(workspaceDir, PACKAGE_DIRNAME);
  const packageDir = path.join(packageRoot, 'current');
  const imagesDir = path.join(packageDir, 'images');
  const archivePath = path.join(packageRoot, `${batchId}.zip`);

  await fs.rm(packageDir, { recursive: true, force: true });
  await fs.rm(archivePath, { force: true });
  await ensureDirectory(imagesDir);

  await fs.writeFile(path.join(packageDir, BATCH_MANIFEST_FILENAME), jsonString(batchManifest), 'utf8');
  for (const pairing of pairings) {
    await fs.copyFile(pairing.outputPath, path.join(imagesDir, pairing.outputFileName));
  }

  await createZipArchive({ packageDir, archivePath });
  return {
    packageDir,
    archivePath,
  };
}

async function uploadPackage(apiBase, archivePath) {
  const bytes = await fs.readFile(archivePath);
  const formData = new FormData();
  formData.append('packageFile', new Blob([bytes], { type: 'application/zip' }), path.basename(archivePath));
  const url = `${apiBase.replace(/\/+$/, '')}/api/intake-batches/package`;
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
  } catch (_error) {
    throw new Error(
      `Package upload failed. Backend API is not reachable at ${url}. Start the backend server or set apiBase in ${CONFIG_FILENAME}.`
    );
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Package upload failed.');
  }
  return payload;
}

async function postJson(apiBase, requestPath, body = null) {
  return fetchJson(
    `${apiBase.replace(/\/+$/, '')}${requestPath}`,
    {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    },
    `Backend request failed: ${requestPath}`
  );
}

async function submitPackageToDatabase({ apiBase, archivePath, box }) {
  const uploadResult = await uploadPackage(apiBase, archivePath);
  const uploadedBatchId = uploadResult?.batch?.batchId || uploadResult?.batch?.id;
  if (!uploadedBatchId) {
    throw new Error('Backend did not return an intake batch id after upload.');
  }

  if (uploadResult?.batch?.destinationDefaults?.reviewRequired) {
    await postJson(apiBase, `/api/intake-batches/${encodeURIComponent(uploadedBatchId)}/destination`, {
      location: null,
      box: toTrimmed(box) || null,
    });
  }

  const validationResult = await postJson(apiBase, `/api/intake-batches/${encodeURIComponent(uploadedBatchId)}/validate`);
  if (validationResult?.batch?.validationStatus !== 'passed') {
    throw new Error('Backend validation did not pass.');
  }

  const importResult = await postJson(apiBase, `/api/intake-batches/${encodeURIComponent(uploadedBatchId)}/import`);
  if (importResult?.batch?.importLifecycleStatus !== 'success') {
    throw new Error(importResult?.importResult?.message || 'Backend import did not complete successfully.');
  }

  return {
    uploadedBatchId,
    validationResult,
    importResult,
  };
}

function resolveWorkspaceDir(args = {}) {
  return resolveUserPath(args.dir || args._?.[0], DEFAULT_SIMPLE_INTAKE_DIR);
}

async function initializeSimpleIntake(rawArgs = process.argv.slice(2)) {
  const args = parseArgs(rawArgs);
  if (args.help || args.h) {
    console.log(usageMessage());
    return { ok: true, help: true };
  }

  const workspaceDir = resolveWorkspaceDir(args);
  const processedDir = path.join(workspaceDir, PROCESSED_DIRNAME);
  const force = Boolean(args.force);

  await ensureDirectory(workspaceDir);
  await assertCanInitializeOutputs({ processedDir, workspaceDir, force });
  const operatorFiles = await ensureOperatorFiles(workspaceDir);

  const images = await discoverWorkspaceImages(workspaceDir);
  if (!images.length) {
    throw new Error(`No supported image files found in ${workspaceDir}. Drag raw photos into this folder and run init again.`);
  }
  await assertHeicConversionAvailable(images);

  const renderTokens = resolveOrderedRenderTokens(args);
  const commandInfo = await resolveOrderedObjectGlowCommand(args);
  const pairings = buildInitPairings({ images, processedDir });
  const batchId = toTrimmed(args['batch-id']) || createBatchId(path.basename(workspaceDir));

  console.log('Simple ordered intake initialization.');
  console.log(`- workspace: ${workspaceDir}`);
  console.log(`- raw images: ${images.length}`);
  console.log(`- processed dir: ${processedDir}`);
  console.log(`- objectGlow command: ${commandInfo.command}`);
  console.log(`- render background: ${renderTokens.background}`);
  console.log(`- render glow: ${shouldRandomizeGlow(args) ? 'random per image' : renderTokens.glow}`);
  printPairingPreview(pairings);
  console.log('');
  console.log('Processing images through ObjectGlow...');

  const processingResult = await processOrderedImages({
    pairings,
    processedDir,
    commandInfo,
    renderTokens,
    args,
    batchId,
  });
  const previewPath = await writePairingPreview(workspaceDir, pairings);

  console.log('');
  console.log('Simple ordered intake initialization complete.');
  console.log(`- processed images: ${processedDir}`);
  console.log(`- item names file: ${operatorFiles.itemsPath}${operatorFiles.createdItems ? ' (created)' : ' (already existed)'}`);
  console.log(`- config file: ${operatorFiles.configPath}${operatorFiles.createdConfig ? ' (created)' : ' (already existed)'}`);
  console.log(`- pairing preview: ${previewPath}`);
  console.log(`- processed count: ${processingResult.processed.length}`);
  console.log('');
  console.log(`Next: fill ${operatorFiles.itemsPath}, optionally set "box" in ${operatorFiles.configPath}, then run npm run intake:simple:submit`);

  return {
    ok: true,
    workspaceDir,
    processedDir,
    itemCount: 0,
    imageCount: images.length,
    pairings,
  };
}

async function submitSimpleIntake(rawArgs = process.argv.slice(2)) {
  const args = parseArgs(rawArgs);
  if (args.help || args.h) {
    console.log(usageMessage());
    return { ok: true, help: true };
  }

  const workspaceDir = resolveWorkspaceDir(args);
  const processedDir = path.join(workspaceDir, PROCESSED_DIRNAME);
  const itemsPath = path.join(workspaceDir, ITEMS_FILENAME);
  const configPath = path.join(workspaceDir, CONFIG_FILENAME);
  const intakePath = path.join(workspaceDir, INTAKE_FILENAME);
  const batchManifestPath = path.join(workspaceDir, BATCH_MANIFEST_FILENAME);

  await assertDirectoryExists(workspaceDir, 'Simple intake workspace');
  await assertFileExists(itemsPath, ITEMS_FILENAME);
  if (!(await pathExists(configPath))) {
    await fs.writeFile(configPath, jsonString(defaultConfig()), 'utf8');
    throw new Error(`Created missing ${CONFIG_FILENAME}. Review it, then run submit again.`);
  }

  const itemLines = await readItemLines(itemsPath);
  const images = await discoverProcessedImages(processedDir);
  validateCounts(itemLines, images, `${PROCESSED_DIRNAME}/`);

  const config = await readSimpleConfig(configPath);
  const box = validateBoxFormat(config.box);
  const apiBase = config.apiBase || DEFAULT_API_BASE;
  const resolvedBox = await validateConfiguredBox({ box, apiBase });
  const renderTokens = resolveOrderedRenderTokens(args);
  const pairings = buildSubmitPairings({ itemLines, images, processedDir });
  const batchLabel = toTrimmed(args['batch-label']) || config.batchName || createDefaultSimpleBatchName();
  const batchId = toTrimmed(args['batch-id']) || createBatchId(batchLabel);

  const intakePayload = buildIntakePayload({
    batchLabel,
    workspaceDir,
    pairings,
    renderTokens,
    config: { ...config, box },
  });
  const batchManifest = buildBatchManifest({
    batchLabel,
    workspaceDir,
    pairings,
    renderTokens,
    config: { ...config, box },
  });

  await fs.writeFile(intakePath, jsonString(intakePayload), 'utf8');
  await fs.writeFile(batchManifestPath, jsonString(batchManifest), 'utf8');
  const packaged = await createSubmitPackage({
    workspaceDir,
    batchManifest,
    pairings,
    batchId,
  });

  console.log('Simple ordered intake submit.');
  console.log(`- workspace: ${workspaceDir}`);
  console.log(`- item names: ${itemLines.length}`);
  console.log(`- processed images: ${images.length}`);
  console.log(`- api base: ${apiBase}`);
  console.log(`- destination box: ${box ? `${box}${resolvedBox?.label ? ` (${resolvedBox.label})` : ''}` : '(none / orphaned import)'}`);
  printPairingPreview(pairings);
  console.log('');
  console.log('Uploading package, validating, and importing...');

  const result = await submitPackageToDatabase({
    apiBase,
    archivePath: packaged.archivePath,
    box,
  });

  console.log('');
  console.log('Simple ordered intake submit complete.');
  console.log(`- intake payload: ${intakePath}`);
  console.log(`- batch manifest: ${batchManifestPath}`);
  console.log(`- package archive: ${packaged.archivePath}`);
  console.log(`- imported batch id: ${result.uploadedBatchId}`);
  console.log(`- imported items: ${result.importResult?.importResult?.createdCount ?? itemLines.length}`);

  return {
    ok: true,
    workspaceDir,
    intakePath,
    batchManifestPath,
    archivePath: packaged.archivePath,
    uploadedBatchId: result.uploadedBatchId,
    itemCount: itemLines.length,
    imageCount: images.length,
  };
}

async function resetSimpleIntake(rawArgs = process.argv.slice(2)) {
  const args = parseArgs(rawArgs);
  if (args.help || args.h) {
    console.log(usageMessage());
    return { ok: true, help: true };
  }

  const workspaceDir = resolveWorkspaceDir(args);
  await ensureDirectory(workspaceDir);

  const configPath = path.join(workspaceDir, CONFIG_FILENAME);
  const existingConfig = normalizeConfig(await readJsonFile(configPath, {}));
  const batchName = toTrimmed(args['batch-label']) || existingConfig.batchName || createDefaultSimpleBatchName();
  const entries = await listWorkspaceEntries(workspaceDir);

  if (!entries.length) {
    const operatorFiles = await ensureOperatorFiles(workspaceDir);
    console.log('Simple intake workspace was already empty.');
    console.log(`- workspace: ${workspaceDir}`);
    console.log(`- item names file: ${operatorFiles.itemsPath}`);
    console.log(`- config file: ${operatorFiles.configPath}`);
    return {
      ok: true,
      archived: false,
      workspaceDir,
      archiveDir: '',
    };
  }

  const archiveDir = await createUniqueArchiveDir(batchName);
  for (const entry of entries) {
    await movePath(entry.sourcePath, path.join(archiveDir, entry.name));
  }

  const receipt = {
    tool: TOOL_NAME,
    archivedAt: new Date().toISOString(),
    batchName,
    sourceWorkspace: workspaceDir,
    archiveDir,
    movedEntries: entries.map((entry) => entry.name),
  };
  await fs.writeFile(path.join(archiveDir, 'simple_intake_archive.json'), jsonString(receipt), 'utf8');

  const operatorFiles = await ensureOperatorFiles(workspaceDir);

  console.log('Simple intake workspace archived and reset.');
  console.log(`- archived batch name: ${batchName}`);
  console.log(`- archive dir: ${archiveDir}`);
  console.log(`- moved entries: ${entries.length}`);
  console.log(`- reset workspace: ${workspaceDir}`);
  console.log(`- new item names file: ${operatorFiles.itemsPath}`);
  console.log(`- new config file: ${operatorFiles.configPath}`);

  return {
    ok: true,
    archived: true,
    workspaceDir,
    archiveDir,
    batchName,
    movedEntries: entries.map((entry) => entry.name),
  };
}

async function runCli(rawArgs = process.argv.slice(2)) {
  const args = parseArgs(rawArgs);
  const mode = toTrimmed(args.mode || (args.init ? 'init' : args.submit ? 'submit' : args.reset ? 'reset' : ''));

  if (args.help || args.h) {
    console.log(usageMessage());
    return { ok: true, help: true };
  }

  if (mode === 'init') {
    return initializeSimpleIntake(rawArgs.filter((arg) => arg !== '--init'));
  }
  if (mode === 'submit') {
    return submitSimpleIntake(rawArgs.filter((arg) => arg !== '--submit'));
  }
  if (mode === 'reset') {
    return resetSimpleIntake(rawArgs.filter((arg) => arg !== '--reset'));
  }

  throw new Error(`Choose a mode: --init, --submit, or --reset.\n\n${usageMessage()}`);
}

if (require.main === module) {
  runCli().catch((error) => {
    console.error(error?.message || error);
    process.exit(1);
  });
}

module.exports = {
  DEFAULT_SIMPLE_INTAKE_DIR,
  ITEMS_FILENAME,
  CONFIG_FILENAME,
  PREVIEW_FILENAME,
  PROCESSED_DIRNAME,
  INTAKE_FILENAME,
  BATCH_MANIFEST_FILENAME,
  SUPPORTED_IMAGE_EXTENSIONS,
  defaultConfig,
  createDefaultSimpleBatchName,
  readItemLines,
  discoverWorkspaceImages,
  discoverProcessedImages,
  sortImagesDeterministically,
  validateCounts,
  buildPairings,
  buildInitPairings,
  buildSubmitPairings,
  buildIntakePayload,
  buildBatchManifest,
  normalizeConfig,
  validateBoxFormat,
  resolveOrderedRenderTokens,
  shouldRandomizeGlow,
  resolvePairingRenderTokens,
  initializeSimpleIntake,
  submitSimpleIntake,
  resetSimpleIntake,
  runCli,
};
