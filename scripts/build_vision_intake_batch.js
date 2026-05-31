#!/usr/bin/env node

const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const {
  createBatchId,
  getExternalIntakeRoot,
  parseArgs,
  slugify,
  toTrimmed,
} = require('./intakeWorkspace');

const execFileAsync = promisify(execFile);

const TOOL_NAME = 'dwc-vision-intake';
const APP_NAME = 'discowarpcore';
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic']);
const DEFAULT_ARTIFACTS_DIRNAME = 'item_artifacts';
const DEFAULT_IMAGES_DIRNAME = 'images';

function usageMessage() {
  return [
    'Usage:',
    '  node scripts/build_vision_intake_batch.js --init \\',
    '    --source-dir /abs/path/to/background-removed-images \\',
    '    [--batch-label "garage shelf 01"] [--box 701] [--location garage]',
    '',
    '  node scripts/build_vision_intake_batch.js --validate \\',
    '    --source-dir /abs/path/to/background-removed-images \\',
    '    [--batch-label "garage shelf 01"] [--box 701] [--location garage]',
    '',
    '  node scripts/build_vision_intake_batch.js --package \\',
    '    --source-dir /abs/path/to/background-removed-images \\',
    '    [--batch-label "garage shelf 01"] [--box 701] [--location garage]',
    '',
    'Workflow:',
    `  1. --init creates ${DEFAULT_ARTIFACTS_DIRNAME}/<imageKey>.json stubs and a Codex prompt.`,
    '  2. Fill one artifact per image. imageKey must equal the image basename.',
    '  3. --package writes batch_manifest.json, images/, and a zip.',
  ].join('\n');
}

function isHiddenName(name) {
  return String(name || '').startsWith('.');
}

function toAbsolutePath(candidatePath) {
  return path.resolve(String(candidatePath || ''));
}

function basenameWithoutExtension(fileName) {
  return path.basename(fileName, path.extname(fileName));
}

function isSupportedImageName(fileName) {
  return ALLOWED_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

function jsonString(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function assertDirectoryExists(dirPath, label) {
  const stats = await fs.stat(dirPath).catch(() => null);
  if (!stats || !stats.isDirectory()) {
    throw new Error(`${label} directory not found: ${dirPath}`);
  }
}

async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function listSourceImages(sourceDir) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .filter((entry) => !isHiddenName(entry.name))
    .filter((entry) => isSupportedImageName(entry.name))
    .map((entry) => ({
      fileName: entry.name,
      imageKey: basenameWithoutExtension(entry.name),
      absolutePath: path.join(sourceDir, entry.name),
    }))
    .sort((left, right) => left.fileName.localeCompare(right.fileName));
}

function buildArtifactTemplate({ imageKey, fileName, location, box }) {
  return {
    imageKey,
    sourceFile: fileName,
    name: '',
    description: '',
    category: 'miscellaneous',
    tags: [],
    quantity: 1,
    location: location || null,
    box: box || null,
    notes: 'Fill name and description from the cleaned object image. Keep imageKey unchanged.',
  };
}

function buildPrompt({ batchLabel, location, box, imageCount }) {
  return [
    '# Disco Warp Core Vision Intake Agent',
    '',
    'You are annotating cleaned item cutout images for a fast Disco Warp Core inventory import.',
    'Follow this procedure exactly. Preserve filenames and image keys so the package import can attach each image to the item record.',
    '',
    `Batch: ${batchLabel || '(derive from folder)'}`,
    `Images: ${imageCount}`,
    `Default location: ${location || 'null'}`,
    `Default box: ${box || 'null / orphaned import'}`,
    '',
    '## Scope',
    '',
    `- Edit only JSON files in \`${DEFAULT_ARTIFACTS_DIRNAME}/\`.`,
    '- Do not rename, move, delete, or copy image files.',
    '- Do not write to the Disco Warp Core backend media directory.',
    '- Do not create database records or call the backend API.',
    '- The package/import pipeline will attach images later by matching `imageKey` to image filename basename.',
    '',
    '## Required Matching Rule',
    '',
    'For every image file:',
    '',
    '```text',
    'image filename basename == JSON imageKey',
    '```',
    '',
    'Example:',
    '',
    '```text',
    'IMG_9991.png -> item_artifacts/IMG_9991.json -> "imageKey": "IMG_9991"',
    '```',
    '',
    'Never change `imageKey`. Never change `sourceFile` unless it is clearly wrong and does not match an existing image filename.',
    '',
    '## Per-Image Procedure',
    '',
    'For each image in the source folder:',
    '',
    `1. Open the matching ${DEFAULT_ARTIFACTS_DIRNAME}/<imageKey>.json file.`,
    '2. Inspect the matching image.',
    '3. Fill only the practical inventory fields: `name`, `description`, `category`, `tags`, and `quantity`.',
    '4. Keep `location` and `box` as already generated unless the user explicitly gave different values.',
    '5. Keep guesses conservative. Prefer a useful generic name over a confident wrong one.',
    '',
    '## Item JSON Shape',
    '',
    'Each artifact must remain one valid JSON object:',
    '',
    '```json',
    '{',
    '  "imageKey": "IMG_9991",',
    '  "sourceFile": "IMG_9991.png",',
    '  "name": "Cordless drill",',
    '  "description": "Yellow and black cordless drill, bare tool only.",',
    '  "category": "tools",',
    '  "tags": ["drill", "cordless"],',
    '  "quantity": 1,',
    '  "location": "garage",',
    '  "box": "701"',
    '}',
    '```',
    '',
    'Field rules:',
    '',
    '- `name`: required, short, human-readable item name.',
    '- `description`: optional but useful; include uncertainty here if needed.',
    '- `category`: use one accepted category below. Use `miscellaneous` when unsure.',
    '- `tags`: short lowercase-ish descriptors; keep the list small.',
    '- `quantity`: integer count visible in the image; usually `1`.',
    '- Do not add every possible Item model field. This is a fast intake pass.',
    '',
    '## Accepted Categories',
    '',
    'miscellaneous, tools, hardware, automotive, cleaning, kitchen, appliances, electronics, office, books, clothing, bathroom, medical, decor, furniture, garden, camping, hobbies, toys, games, seasonal',
    '',
    '## Completion Check',
    '',
    '- Every supported image has a matching JSON artifact.',
    '- Every artifact is valid JSON.',
    '- Every artifact has a non-empty `name`.',
    '- Every artifact keeps `imageKey` equal to the image filename basename.',
    '',
    'When all artifacts are filled, the operator can run:',
    '',
    '```bash',
    'node scripts/build_vision_intake_batch.js --package --source-dir <same-folder>',
    '```',
    '',
  ].join('\n');
}

async function initArtifacts({
  sourceDir,
  artifactsDir,
  batchLabel,
  location,
  box,
}) {
  await assertDirectoryExists(sourceDir, 'Source');
  const images = await listSourceImages(sourceDir);
  if (!images.length) {
    throw new Error(`No supported image files found in ${sourceDir}`);
  }

  await ensureDirectory(artifactsDir);
  let createdCount = 0;
  let existingCount = 0;

  for (const image of images) {
    const artifactPath = path.join(artifactsDir, `${image.imageKey}.json`);
    if (await pathExists(artifactPath)) {
      existingCount += 1;
      continue;
    }

    await fs.writeFile(
      artifactPath,
      jsonString(buildArtifactTemplate({
        imageKey: image.imageKey,
        fileName: image.fileName,
        location,
        box,
      })),
      'utf8'
    );
    createdCount += 1;
  }

  const promptPath = path.join(artifactsDir, 'CODEX_PROMPT.md');
  await fs.writeFile(
    promptPath,
    buildPrompt({
      batchLabel,
      location,
      box,
      imageCount: images.length,
    }),
    'utf8'
  );

  return {
    sourceDir,
    artifactsDir,
    promptPath,
    imageCount: images.length,
    createdCount,
    existingCount,
  };
}

async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}: ${error?.message || error}`);
  }
}

function normalizeTags(rawTags) {
  if (!Array.isArray(rawTags)) return [];
  const seen = new Set();
  const tags = [];

  for (const rawTag of rawTags) {
    const tag = toTrimmed(rawTag);
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }

  return tags;
}

function normalizeQuantity(value) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function normalizeItemArtifact(raw, {
  image,
  artifactPath,
  defaultLocation,
  defaultBox,
}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`Artifact must be a JSON object: ${artifactPath}`);
  }

  const imageKey = toTrimmed(raw.imageKey);
  if (imageKey !== image.imageKey) {
    throw new Error(
      `Artifact imageKey mismatch for ${artifactPath}: expected "${image.imageKey}", found "${imageKey}"`
    );
  }

  const name = toTrimmed(raw.name);
  if (!name) {
    throw new Error(`Artifact is missing name: ${artifactPath}`);
  }

  return {
    name,
    description: toTrimmed(raw.description),
    category: toTrimmed(raw.category) || 'miscellaneous',
    tags: normalizeTags(raw.tags),
    quantity: normalizeQuantity(raw.quantity),
    location: toTrimmed(raw.location) || defaultLocation || null,
    box: toTrimmed(raw.box) || defaultBox || null,
    imageKey,
  };
}

async function readCompletedArtifacts({
  images,
  artifactsDir,
  defaultLocation,
  defaultBox,
}) {
  const items = [];

  for (const image of images) {
    const artifactPath = path.join(artifactsDir, `${image.imageKey}.json`);
    if (!(await pathExists(artifactPath))) {
      throw new Error(`Missing artifact for ${image.fileName}: ${artifactPath}`);
    }

    const raw = await readJsonFile(artifactPath);
    items.push(normalizeItemArtifact(raw, {
      image,
      artifactPath,
      defaultLocation,
      defaultBox,
    }));
  }

  return items;
}

async function listArtifactFiles(artifactsDir) {
  const entries = await fs.readdir(artifactsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .filter((entry) => path.extname(entry.name).toLowerCase() === '.json')
    .filter((entry) => entry.name !== 'CODEX_PROMPT.md')
    .map((entry) => ({
      fileName: entry.name,
      artifactPath: path.join(artifactsDir, entry.name),
      imageKey: basenameWithoutExtension(entry.name),
    }))
    .sort((left, right) => left.fileName.localeCompare(right.fileName));
}

async function validateArtifacts({
  sourceDir,
  artifactsDir,
  location,
  box,
}) {
  await assertDirectoryExists(sourceDir, 'Source');
  await assertDirectoryExists(artifactsDir, 'Artifacts');

  const images = await listSourceImages(sourceDir);
  const imageByKey = new Map(images.map((image) => [image.imageKey, image]));
  const artifactFiles = await listArtifactFiles(artifactsDir);
  const artifactByKey = new Map();
  const errors = [];
  const warnings = [];
  const validItems = [];

  if (!images.length) {
    errors.push(`No supported image files found in ${sourceDir}`);
  }

  for (const artifact of artifactFiles) {
    if (artifactByKey.has(artifact.imageKey)) {
      errors.push(`Duplicate JSON artifact basename: ${artifact.fileName}`);
      continue;
    }
    artifactByKey.set(artifact.imageKey, artifact);
  }

  for (const image of images) {
    if (!artifactByKey.has(image.imageKey)) {
      errors.push(`Missing JSON artifact for image ${image.fileName}`);
    }
  }

  for (const artifact of artifactFiles) {
    const raw = await readJsonFile(artifact.artifactPath).catch((error) => {
      errors.push(error?.message || `Invalid JSON in ${artifact.artifactPath}`);
      return null;
    });
    if (!raw) continue;

    const declaredImageKey = toTrimmed(raw.imageKey);
    if (!declaredImageKey) {
      errors.push(`Artifact is missing imageKey: ${artifact.artifactPath}`);
      continue;
    }
    if (artifactByKey.get(declaredImageKey)?.artifactPath !== artifact.artifactPath) {
      errors.push(
        `Artifact filename/imageKey mismatch: ${artifact.fileName} declares "${declaredImageKey}"`
      );
    }

    const declaredSourceFile = toTrimmed(raw.sourceFile || raw.imageFile);
    const image = declaredSourceFile
      ? images.find((entry) => entry.fileName === declaredSourceFile)
      : imageByKey.get(declaredImageKey);
    if (!image) {
      errors.push(
        `Artifact references missing image: ${artifact.artifactPath}${declaredSourceFile ? ` -> ${declaredSourceFile}` : ''}`
      );
      continue;
    }
    if (declaredImageKey !== image.imageKey) {
      errors.push(
        `imageKey must match image filename basename for ${artifact.artifactPath}: expected "${image.imageKey}", found "${declaredImageKey}"`
      );
    }
    if (!declaredSourceFile) {
      warnings.push(`Artifact is missing sourceFile/imageFile and will infer ${image.fileName}: ${artifact.artifactPath}`);
    }
    if (!toTrimmed(raw.name)) {
      errors.push(`Artifact is missing required name: ${artifact.artifactPath}`);
      continue;
    }

    const itemLocation = toTrimmed(raw.location) || location;
    const itemBox = toTrimmed(raw.box) || box;
    if (!itemLocation && !itemBox) {
      warnings.push(`No destination set for ${artifact.fileName}; import will require destination review or become unknown/orphaned.`);
    }

    validItems.push({
      artifactPath: artifact.artifactPath,
      imageFile: image.fileName,
      imageKey: declaredImageKey,
      name: toTrimmed(raw.name),
    });
  }

  return {
    ok: errors.length === 0,
    sourceDir,
    artifactsDir,
    totalImages: images.length,
    totalArtifacts: artifactFiles.length,
    validItemCount: validItems.length,
    errors,
    warnings,
  };
}

async function copyImages(images, imagesDir) {
  await ensureDirectory(imagesDir);
  for (const image of images) {
    await fs.copyFile(image.absolutePath, path.join(imagesDir, image.fileName));
  }
}

function buildBatchManifest({
  batchLabel,
  sourceDir,
  archivePath,
  location,
  box,
  items,
}) {
  return {
    packageVersion: 2,
    app: APP_NAME,
    batchLabel,
    createdAt: new Date().toISOString(),
    target: {
      location: location || null,
      box: box || null,
    },
    batchContext: {
      source: 'vision_intake',
      itemCount: items.length,
      location: location || null,
      box: box || null,
    },
    metadata: {
      createdByTool: TOOL_NAME,
      sourceDir,
      archivePath,
      imageSource: 'background_removed_or_operator_selected',
      sourceMachine: os.hostname(),
      operator: toTrimmed(process.env.USER || process.env.USERNAME || 'unknown'),
    },
    items,
  };
}

async function createZipArchive({ packageDir, archivePath }) {
  await ensureDirectory(path.dirname(archivePath));
  await execFileAsync('/usr/bin/zip', ['-rq', archivePath, '.'], {
    cwd: packageDir,
  });
}

async function packageBatch({
  sourceDir,
  artifactsDir,
  batchLabel,
  location,
  box,
  outputDir,
  keepPackageDir,
}) {
  await assertDirectoryExists(sourceDir, 'Source');
  await assertDirectoryExists(artifactsDir, 'Artifacts');

  const images = await listSourceImages(sourceDir);
  if (!images.length) {
    throw new Error(`No supported image files found in ${sourceDir}`);
  }

  const items = await readCompletedArtifacts({
    images,
    artifactsDir,
    defaultLocation: location,
    defaultBox: box,
  });

  const normalizedBatchLabel = batchLabel || path.basename(sourceDir);
  const archiveFileName = `${createBatchId(normalizedBatchLabel)}.zip`;
  const archivePath = path.join(outputDir, archiveFileName);
  if (await pathExists(archivePath)) {
    throw new Error(`Refusing to overwrite existing archive: ${archivePath}`);
  }

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'dwc-vision-intake-'));
  const packageDir = path.join(tempRoot, 'package');
  const imagesDir = path.join(packageDir, DEFAULT_IMAGES_DIRNAME);

  await ensureDirectory(packageDir);
  await copyImages(images, imagesDir);

  const itemsWithImageFiles = items.map((item) => ({
    imageFile: images.find((image) => image.imageKey === item.imageKey)?.fileName || `${item.imageKey}`,
    ...item,
  }));
  const manifest = buildBatchManifest({
    batchLabel: normalizedBatchLabel,
    sourceDir,
    archivePath,
    location,
    box,
    items: itemsWithImageFiles,
  });
  await fs.writeFile(path.join(packageDir, 'batch_manifest.json'), jsonString(manifest), 'utf8');

  await createZipArchive({ packageDir, archivePath });

  if (!keepPackageDir) {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }

  return {
    batchLabel: normalizedBatchLabel,
    imageCount: images.length,
    itemCount: items.length,
    archivePath,
    tempRoot: keepPackageDir ? tempRoot : '',
    packageDir: keepPackageDir ? packageDir : '',
  };
}

function printInitSummary(result) {
  console.log('Vision intake artifacts initialized.');
  console.log(`- source dir: ${result.sourceDir}`);
  console.log(`- artifacts dir: ${result.artifactsDir}`);
  console.log(`- prompt: ${result.promptPath}`);
  console.log(`- images: ${result.imageCount}`);
  console.log(`- created artifacts: ${result.createdCount}`);
  console.log(`- existing artifacts preserved: ${result.existingCount}`);
}

function printPackageSummary(result) {
  console.log('Vision intake batch package created.');
  console.log(`- batch label: ${result.batchLabel}`);
  console.log(`- package path: ${result.archivePath}`);
  console.log(`- images: ${result.imageCount}`);
  console.log(`- items: ${result.itemCount}`);
  if (result.packageDir) {
    console.log(`- package dir: ${result.packageDir}`);
  }
}

function printValidationSummary(result) {
  console.log('Vision intake artifact validation complete.');
  console.log(`- source dir: ${result.sourceDir}`);
  console.log(`- artifacts dir: ${result.artifactsDir}`);
  console.log(`- total images: ${result.totalImages}`);
  console.log(`- total JSON artifacts: ${result.totalArtifacts}`);
  console.log(`- valid item count: ${result.validItemCount}`);
  console.log(`- error count: ${result.errors.length}`);
  console.log(`- warning count: ${result.warnings.length}`);

  if (result.warnings.length) {
    console.log('');
    console.log('Warnings:');
    result.warnings.forEach((warning) => console.log(`- ${warning}`));
  }

  if (result.errors.length) {
    console.log('');
    console.log('Errors:');
    result.errors.forEach((error) => console.log(`- ${error}`));
  }
}

async function main() {
  const args = parseArgs();
  const sourceDir = toAbsolutePath(args['source-dir'] || args._[0]);
  const batchLabel = toTrimmed(args['batch-label']) || path.basename(sourceDir || '');
  const location = toTrimmed(args.location);
  const box = toTrimmed(args.box);
  const artifactsDir = toAbsolutePath(
    args['artifacts-dir'] || path.join(sourceDir, DEFAULT_ARTIFACTS_DIRNAME)
  );
  const outputDir = toAbsolutePath(args['output-dir'] || getExternalIntakeRoot());
  const shouldInit = Boolean(args.init);
  const shouldValidate = Boolean(args.validate);
  const shouldPackage = Boolean(args.package);
  const keepPackageDir = Boolean(args['keep-package-dir']);

  if (!sourceDir || sourceDir === path.resolve('')) {
    throw new Error('--source-dir is required.');
  }
  if (!batchLabel || !slugify(batchLabel, '')) {
    throw new Error('--batch-label is required when source folder name is not usable.');
  }
  const selectedModeCount = [shouldInit, shouldValidate, shouldPackage].filter(Boolean).length;
  if (selectedModeCount !== 1) {
    throw new Error('Choose exactly one mode: --init, --validate, or --package.');
  }

  if (shouldInit) {
    const result = await initArtifacts({
      sourceDir,
      artifactsDir,
      batchLabel,
      location,
      box,
    });
    printInitSummary(result);
    return;
  }

  if (shouldValidate) {
    const result = await validateArtifacts({
      sourceDir,
      artifactsDir,
      location,
      box,
    });
    printValidationSummary(result);
    if (!result.ok) {
      process.exitCode = 1;
    }
    return;
  }

  const result = await packageBatch({
    sourceDir,
    artifactsDir,
    batchLabel,
    location,
    box,
    outputDir,
    keepPackageDir,
  });
  printPackageSummary(result);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Failed to build vision intake batch: ${error?.message || error}`);
    console.error('');
    console.error(usageMessage());
    process.exit(1);
  });
}

module.exports = {
  buildArtifactTemplate,
  initArtifacts,
  listSourceImages,
  normalizeItemArtifact,
  packageBatch,
  validateArtifacts,
};
