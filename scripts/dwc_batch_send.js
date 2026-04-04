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
const TOOL_NAME = 'dwc-batch-send';
const PACKAGE_VERSION = 1;
const APP_NAME = 'discowarpcore';
function usageMessage() {
  return [
    'Usage:',
    '  node scripts/dwc_batch_send.js \\',
    '    --source-dir /abs/path/to/batch-folder \\',
    '    [--batch-label "garage shelf pass"] \\',
    '    [--dry-run] \\',
    '    [--keep-temp]',
  ].join('\n');
}

function toAbsolutePath(candidatePath) {
  return path.resolve(String(candidatePath || ''));
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function assertFileExists(filePath, label) {
  const stats = await fs.stat(filePath).catch(() => null);
  if (!stats || !stats.isFile()) {
    throw new Error(`${label} file not found: ${filePath}`);
  }
}

async function assertDirectoryExists(dirPath, label) {
  const stats = await fs.stat(dirPath).catch(() => null);
  if (!stats || !stats.isDirectory()) {
    throw new Error(`${label} directory not found: ${dirPath}`);
  }
}

async function listVisibleRootFiles(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && !isHiddenName(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function isHiddenName(name) {
  return String(name || '').startsWith('.');
}

async function collectVisibleFiles(rootDir) {
  const results = [];

  async function walk(currentDir, relativeDir = '') {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (isHiddenName(entry.name)) {
        continue;
      }

      const absolutePath = path.join(currentDir, entry.name);
      const relativePath = path.join(relativeDir, entry.name);

      if (entry.isDirectory()) {
        await walk(absolutePath, relativePath);
        continue;
      }

      if (entry.isFile()) {
        results.push({
          absolutePath,
          relativePath: relativePath.replace(/\\/g, '/'),
          name: entry.name,
        });
      }
    }
  }

  await walk(rootDir);
  return results.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function copyFileToPackage(sourcePath, destinationPath) {
  await ensureDirectory(path.dirname(destinationPath));
  await fs.copyFile(sourcePath, destinationPath);
}

async function copyImagesToPackage(imageFiles, packageImagesDir) {
  await ensureDirectory(packageImagesDir);
  for (const file of imageFiles) {
    await copyFileToPackage(file.absolutePath, path.join(packageImagesDir, file.relativePath));
  }
}

function buildManifest({
  batchLabel,
  sourceDir,
  jsonSourcePath,
  csvSourcePath,
  imagesPath,
  imageFiles,
  dryRun,
  keepTemp,
}) {
  const imagesIncluded = imageFiles.length > 0;
  const operator = toTrimmed(process.env.USER || process.env.USERNAME || 'unknown');

  return {
    packageVersion: PACKAGE_VERSION,
    app: APP_NAME,
    batchLabel,
    createdAt: new Date().toISOString(),
    sourceMachine: os.hostname(),
    operator,
    cleanupIntent: keepTemp
      ? 'preserve_temp_artifacts'
      : 'preserve_temp_artifacts_until_explicit_cleanup',
    files: {
      aiIntakeJson: 'ai_intake.json',
      imageMappingCsv: 'image_mapping.csv',
      ...(imagesIncluded ? { imagesDir: 'images' } : {}),
    },
    images: {
      included: imagesIncluded,
      count: imageFiles.length,
    },
    metadata: {
      createdByTool: TOOL_NAME,
      dryRun: Boolean(dryRun),
      sourceDir,
      sourceJsonFilename: path.basename(jsonSourcePath),
      sourceCsvFilename: csvSourcePath ? path.basename(csvSourcePath) : '',
      sourceImagesDirname: imagesPath ? path.basename(imagesPath) : '',
      sourceImageEntries: imageFiles.map((file) => file.relativePath),
    },
  };
}

async function writeManifest(manifest, manifestPath) {
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

async function createZipArchive({ packageDir, archivePath }) {
  await ensureDirectory(path.dirname(archivePath));
  await execFileAsync('/usr/bin/zip', ['-rq', archivePath, '.'], {
    cwd: packageDir,
  });
}

function printSummary({
  batchLabel,
  archivePath,
  tempRoot,
  packageDir,
  manifestPath,
  jsonSourcePath,
  csvSourcePath,
  imagesPath,
  imageFiles,
  dryRun,
}) {
  console.log('Disco Warp Core batch package created.');
  console.log(`- batch label: ${batchLabel}`);
  console.log(`- package path: ${archivePath}`);
  console.log(`- temp root: ${tempRoot}`);
  console.log(`- package dir: ${packageDir}`);
  console.log(`- manifest path: ${manifestPath}`);
  console.log(`- source dir: ${path.dirname(jsonSourcePath)}`);
  console.log(`- AI Intake JSON: ${jsonSourcePath}`);
  console.log(`- Image Mapping CSV: ${csvSourcePath || 'not included'}`);
  console.log(`- images included: ${imageFiles.length > 0 ? 'yes' : 'no'}`);
  console.log(`- image count: ${imageFiles.length}`);
  if (imagesPath) {
    console.log(`- images source: ${imagesPath}`);
  }
  if (dryRun) {
    console.log('- dry run: yes');
    console.log('- network upload: not attempted');
  }
}

async function detectSourceInputs(sourceDir) {
  const rootFiles = await listVisibleRootFiles(sourceDir);
  const jsonFiles = rootFiles.filter((name) => path.extname(name).toLowerCase() === '.json');
  const csvFiles = rootFiles.filter((name) => path.extname(name).toLowerCase() === '.csv');
  const imagesCandidates = ['images', 'original_images'];

  if (jsonFiles.length !== 1) {
    throw new Error(
      jsonFiles.length === 0
        ? `Expected exactly one JSON file in source dir: ${sourceDir}`
        : `Expected exactly one JSON file in source dir, found ${jsonFiles.length}: ${jsonFiles.join(', ')}`
    );
  }

  if (csvFiles.length > 1) {
    throw new Error(`Expected at most one CSV file in source dir, found ${csvFiles.length}: ${csvFiles.join(', ')}`);
  }

  let imagesPath = '';
  for (const candidate of imagesCandidates) {
    const candidatePath = path.join(sourceDir, candidate);
    const stats = await fs.stat(candidatePath).catch(() => null);
    if (stats?.isDirectory()) {
      imagesPath = candidatePath;
      break;
    }
  }

  const imageFiles = imagesPath ? await collectVisibleFiles(imagesPath) : [];
  const csvPath = csvFiles[0] ? path.join(sourceDir, csvFiles[0]) : '';

  if (imageFiles.length > 0 && !csvPath) {
    throw new Error('Images were found, but no CSV file was provided. Images require an image mapping CSV.');
  }

  return {
    jsonPath: path.join(sourceDir, jsonFiles[0]),
    csvPath,
    imagesPath,
    imageFiles,
  };
}

async function main() {
  const args = parseArgs();
  const sourceDir = toAbsolutePath(args['source-dir'] || args._[0]);
  const inferredBatchLabel = path.basename(sourceDir || '');
  const batchLabel = toTrimmed(args['batch-label']) || inferredBatchLabel;
  const batchSlug = slugify(batchLabel, '');
  const outputDir = getExternalIntakeRoot();
  const dryRun = Boolean(args['dry-run']);
  const keepTemp = Boolean(args['keep-temp']);

  if (!toTrimmed(sourceDir)) {
    throw new Error('--source-dir is required.');
  }
  await assertDirectoryExists(sourceDir, 'Source');
  if (!batchLabel) {
    throw new Error('Batch label could not be derived from --source-dir. Provide --batch-label explicitly.');
  }
  if (!batchSlug) {
    throw new Error(`Batch label is not filesystem-safe enough to package: "${batchLabel}"`);
  }

  const {
    jsonPath,
    csvPath,
    imagesPath,
    imageFiles,
  } = await detectSourceInputs(sourceDir);
  await assertFileExists(jsonPath, 'AI Intake JSON');
  if (csvPath) {
    await assertFileExists(csvPath, 'Image Mapping CSV');
  }
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'dwc-batch-send-'));
  const packageDir = path.join(tempRoot, 'package');
  const manifestPath = path.join(packageDir, 'manifest.json');
  const archiveFileName = `${createBatchId(batchLabel)}.zip`;
  const archivePath = path.join(outputDir, archiveFileName);

  if (await pathExists(archivePath)) {
    throw new Error(`Refusing to overwrite existing archive: ${archivePath}`);
  }

  await ensureDirectory(packageDir);
  await copyFileToPackage(jsonPath, path.join(packageDir, 'ai_intake.json'));
  if (csvPath) {
    await copyFileToPackage(csvPath, path.join(packageDir, 'image_mapping.csv'));
  }

  if (imageFiles.length > 0) {
    await copyImagesToPackage(imageFiles, path.join(packageDir, 'images'));
  }

  const manifest = buildManifest({
    batchLabel,
    sourceDir,
    jsonSourcePath: jsonPath,
    csvSourcePath: csvPath,
    imagesPath,
    imageFiles,
    dryRun,
    keepTemp,
  });

  await writeManifest(manifest, manifestPath);
  await createZipArchive({
    packageDir,
    archivePath,
  });

  printSummary({
    batchLabel,
    archivePath,
    tempRoot,
    packageDir,
    manifestPath,
    jsonSourcePath: jsonPath,
    csvSourcePath: csvPath,
    imagesPath,
    imageFiles,
    dryRun,
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Failed to build batch package: ${error?.message || error}`);
    console.error('');
    console.error(usageMessage());
    process.exit(1);
  });
}
