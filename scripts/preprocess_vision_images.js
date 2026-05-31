#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { execFile, spawn } = require('child_process');
const { promisify } = require('util');

const {
  createBatchId,
  parseArgs,
  toTrimmed,
} = require('./intakeWorkspace');

const TOOL_NAME = 'dwc-objectglow-preprocess';
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']);
const HEIC_EXTENSIONS = new Set(['.heic', '.heif']);
const MANIFEST_FILENAME = 'objectglow_preprocess_manifest.json';
const execFileAsync = promisify(execFile);

function usageMessage() {
  return [
    'Usage:',
    '  node scripts/preprocess_vision_images.js \\',
    '    --source-dir /abs/path/to/raw-photos \\',
    '    [--output-dir /abs/path/to/cleaned-images] \\',
    '    [--objectglow-repo /abs/path/to/objectGlow] \\',
    '    [--objectglow-bin /abs/path/to/objectglow] \\',
    '    [--output-mode transparent-png|webp] [--render-mode cutout|objectglow] [--force] [--dry-run]',
    '',
    'Examples:',
    '  OBJECTGLOW_REPO=/Users/me/Developer/objectGlow \\',
    '    node scripts/preprocess_vision_images.js --source-dir ~/Intake/raw/garage-shelf-01',
    '',
    '  node scripts/preprocess_vision_images.js \\',
    '    --source-dir ~/Intake/raw/garage-shelf-01 \\',
    '    --output-dir ~/Intake/discowarpcore/garage-shelf-01-cleaned \\',
    '    --objectglow-bin /Users/me/Developer/objectGlow/bin/objectglow',
    '',
    'Next step after this script succeeds:',
    '  node scripts/build_vision_intake_batch.js --init --source-dir <cleaned-images-dir>',
  ].join('\n');
}

function jsonString(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function isHiddenName(name) {
  return String(name || '').startsWith('.');
}

function isSupportedImageName(fileName) {
  return ALLOWED_EXTENSIONS.has(path.extname(String(fileName || '')).toLowerCase());
}

function isHeicImageName(fileName) {
  return HEIC_EXTENSIONS.has(path.extname(String(fileName || '')).toLowerCase());
}

function basenameWithoutExtension(fileName) {
  return path.basename(fileName, path.extname(fileName));
}

function resolveUserPath(value) {
  const raw = toTrimmed(value);
  if (!raw) return '';
  if (raw === '~') return os.homedir();
  if (raw.startsWith('~/')) return path.join(os.homedir(), raw.slice(2));
  return path.resolve(raw);
}

function parsePositiveInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeOutputMode(value) {
  const normalized = toTrimmed(value || 'transparent-png').toLowerCase();
  if (['transparent-png', 'png', 'transparent'].includes(normalized)) {
    return 'transparent-png';
  }
  if (['webp', 'modern-webp'].includes(normalized)) {
    return 'webp';
  }
  throw new Error(`Unsupported output mode "${value}". Use transparent-png or webp.`);
}

function normalizeRenderMode(value) {
  const normalized = toTrimmed(value || 'cutout').toLowerCase();
  if (['cutout', 'plain', 'plain-cutout', 'no-glow'].includes(normalized)) {
    return 'cutout';
  }
  if (['objectglow', 'glow', 'rendered'].includes(normalized)) {
    return 'objectglow';
  }
  throw new Error(`Unsupported render mode "${value}". Use cutout or objectglow.`);
}

function getOutputExtension(outputMode) {
  return outputMode === 'transparent-png' ? '.png' : '.webp';
}

function resolveObjectGlowCommand(args = {}) {
  const explicitBin = resolveUserPath(args['objectglow-bin'] || process.env.OBJECTGLOW_BIN);
  if (explicitBin) {
    const inferredRepo = path.basename(path.dirname(explicitBin)) === 'bin'
      ? path.dirname(path.dirname(explicitBin))
      : '';
    return {
      command: explicitBin,
      cwd: path.dirname(explicitBin),
      repoRoot: inferredRepo,
      python: inferredRepo ? path.join(inferredRepo, '.venv', 'bin', 'python') : '',
      source: 'objectglow-bin',
    };
  }

  const objectGlowRepo = resolveUserPath(args['objectglow-repo'] || process.env.OBJECTGLOW_REPO);
  if (objectGlowRepo) {
    return {
      command: path.join(objectGlowRepo, 'bin', 'objectglow'),
      cwd: objectGlowRepo,
      repoRoot: objectGlowRepo,
      python: path.join(objectGlowRepo, '.venv', 'bin', 'python'),
      source: 'objectglow-repo',
    };
  }

  return {
    command: 'objectglow',
    cwd: process.cwd(),
    repoRoot: '',
    python: '',
    source: 'PATH',
  };
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

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
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
      inputPath: path.join(sourceDir, entry.name),
    }))
    .sort((left, right) => left.fileName.localeCompare(right.fileName));
}

async function prepareObjectGlowInput(image, tempRoot) {
  if (!isHeicImageName(image.fileName)) {
    return {
      ...image,
      processingInputPath: image.inputPath,
      preprocessing: {
        converted: false,
        sourceFormat: path.extname(image.fileName).slice(1).toLowerCase(),
      },
    };
  }

  await ensureDirectory(tempRoot);
  const convertedPath = path.join(tempRoot, `${image.imageKey}.jpg`);
  await execFileAsync('/usr/bin/sips', [
    '-s',
    'format',
    'jpeg',
    image.inputPath,
    '--out',
    convertedPath,
  ]);

  return {
    ...image,
    processingInputPath: convertedPath,
    preprocessing: {
      converted: true,
      sourceFormat: path.extname(image.fileName).slice(1).toLowerCase(),
      convertedFormat: 'jpeg',
      convertedPath,
      converter: '/usr/bin/sips',
    },
  };
}

function appendOptionalObjectGlowArgs(commandArgs, args = {}) {
  const passthrough = [
    ['preset', '--preset'],
    ['background-token', '--background-token'],
    ['glow-token', '--glow-token'],
    ['accent-token', '--accent-token'],
    ['size', '--size'],
    ['padding', '--padding'],
    ['webp-quality', '--webp-quality'],
  ];

  for (const [key, flag] of passthrough) {
    const value = toTrimmed(args[key]);
    if (value) {
      commandArgs.push(flag, value);
    }
  }
}

function runObjectGlow({
  command,
  cwd,
  image,
  outputPath,
  batchId,
  outputMode,
  extraArgs,
}) {
  return new Promise((resolve) => {
    const runId = `${batchId}-${image.imageKey}`;
    const commandArgs = [
      image.processingInputPath || image.inputPath,
      '--output',
      outputPath,
      '--progress-format',
      'jsonl',
      '--run-id',
      runId,
      '--media-id',
      image.imageKey,
      '--batch-id',
      batchId,
    ];

    if (outputMode === 'transparent-png') {
      commandArgs.push('--legacy-transparent-png');
    }

    commandArgs.push(...extraArgs);

    const child = spawn(command, commandArgs, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const events = [];
    const parseErrors = [];
    let stdoutBuffer = '';
    let stderrText = '';

    child.stdout.on('data', (chunk) => {
      stdoutBuffer += chunk.toString('utf8');
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          events.push(JSON.parse(trimmed));
        } catch (error) {
          parseErrors.push(`Could not parse objectGlow JSONL: ${trimmed.slice(0, 240)}`);
        }
      }
    });

    child.stderr.on('data', (chunk) => {
      stderrText += chunk.toString('utf8');
    });

    child.on('error', (error) => {
      resolve({
        ok: false,
        image,
        outputPath,
        exitCode: null,
        events,
        parseErrors,
        stderr: stderrText,
        error: error?.message || 'Failed to start objectGlow.',
      });
    });

    child.on('close', async (exitCode) => {
      if (stdoutBuffer.trim()) {
        try {
          events.push(JSON.parse(stdoutBuffer.trim()));
        } catch {
          parseErrors.push(`Could not parse objectGlow JSONL: ${stdoutBuffer.trim().slice(0, 240)}`);
        }
      }

      const outputExists = await pathExists(outputPath);
      const finalEvent = [...events].reverse().find((entry) => (
        entry?.event === 'job_completed' || entry?.event === 'job_failed'
      ));
      const ok = exitCode === 0 && outputExists && finalEvent?.event !== 'job_failed';

      resolve({
        ok,
        image,
        outputPath,
        exitCode,
        events,
        finalEvent: finalEvent || null,
        parseErrors,
        stderr: stderrText,
        error: ok
          ? ''
          : finalEvent?.message || stderrText.trim().split(/\r?\n/).slice(-1)[0] || 'objectGlow failed.',
      });
    });
  });
}

function buildPlainCutoutPythonCode() {
  return [
    'import json',
    'import sys',
    'from pathlib import Path',
    'from itemcutout import ProcessImageOptions, process_image, resolve_export_mode',
    '',
    'input_path = Path(sys.argv[1])',
    'output_path = Path(sys.argv[2])',
    'output_mode = sys.argv[3]',
    'run_id = sys.argv[4]',
    'media_id = sys.argv[5]',
    'batch_id = sys.argv[6]',
    'size = int(sys.argv[7])',
    'padding = float(sys.argv[8])',
    'webp_quality = int(sys.argv[9])',
    'skip_auto_rotate = sys.argv[10] == "1"',
    'legacy_transparent_png = output_mode == "transparent-png"',
    '',
    'def emit(payload):',
    '    payload.setdefault("protocolVersion", 1)',
    '    payload.setdefault("runId", run_id)',
    '    payload.setdefault("mediaId", media_id)',
    '    if batch_id:',
    '        payload.setdefault("batchId", batch_id)',
    '    print(json.dumps(payload), flush=True)',
    '',
    'try:',
    '    emit({"event": "job_started", "stage": "preflight", "message": "Plain cutout processing started", "progressPercent": 0, "outputPath": str(output_path)})',
    '    result = process_image(',
    '        input_path=input_path,',
    '        output_path=output_path,',
    '        options=ProcessImageOptions(',
    '            output_size=size,',
    '            padding=padding,',
    '            skip_auto_rotate=skip_auto_rotate,',
    '            webp_quality=webp_quality,',
    '            export_mode=resolve_export_mode(legacy_transparent_png=legacy_transparent_png),',
    '            glow_enabled=False,',
    '            randomize_glow=False,',
    '        ),',
    '    )',
    '    emit({"event": "job_completed", "stage": "finalize", "message": "Plain cutout processing complete", "progressPercent": 100, "outputPath": str(output_path), "elapsedSeconds": result.elapsed_seconds, "inputDimensions": {"width": result.input_size[0], "height": result.input_size[1]} if result.input_size else None, "outputDimensions": {"width": result.output_size[0], "height": result.output_size[1]} if result.output_size else None, "glowApplied": result.glow_applied, "finalAsset": True})',
    'except Exception as exc:',
    '    emit({"event": "job_failed", "stage": "finalize", "message": str(exc) or exc.__class__.__name__, "progressPercent": 100, "outputPath": str(output_path), "errorCode": exc.__class__.__name__})',
    '    raise',
  ].join('\n');
}

function runPlainCutout({
  commandInfo,
  image,
  outputPath,
  batchId,
  outputMode,
  size,
  padding,
  webpQuality,
  skipAutoRotate,
}) {
  return new Promise((resolve) => {
    if (!commandInfo.python) {
      resolve({
        ok: false,
        image,
        outputPath,
        exitCode: null,
        events: [],
        parseErrors: [],
        stderr: '',
        error: 'Plain cutout mode requires --objectglow-repo or --objectglow-bin so the objectGlow Python environment can be located.',
      });
      return;
    }

    const runId = `${batchId}-${image.imageKey}`;
    const commandArgs = [
      '-c',
      buildPlainCutoutPythonCode(),
      image.processingInputPath || image.inputPath,
      outputPath,
      outputMode,
      runId,
      image.imageKey,
      batchId,
      String(size),
      String(padding),
      String(webpQuality),
      skipAutoRotate ? '1' : '0',
    ];

    const child = spawn(commandInfo.python, commandArgs, {
      cwd: commandInfo.repoRoot || commandInfo.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const events = [];
    const parseErrors = [];
    let stdoutBuffer = '';
    let stderrText = '';

    child.stdout.on('data', (chunk) => {
      stdoutBuffer += chunk.toString('utf8');
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          events.push(JSON.parse(trimmed));
        } catch {
          parseErrors.push(`Could not parse plain cutout JSONL: ${trimmed.slice(0, 240)}`);
        }
      }
    });

    child.stderr.on('data', (chunk) => {
      stderrText += chunk.toString('utf8');
    });

    child.on('error', (error) => {
      resolve({
        ok: false,
        image,
        outputPath,
        exitCode: null,
        events,
        parseErrors,
        stderr: stderrText,
        error: error?.message || 'Failed to start objectGlow Python.',
      });
    });

    child.on('close', async (exitCode) => {
      if (stdoutBuffer.trim()) {
        try {
          events.push(JSON.parse(stdoutBuffer.trim()));
        } catch {
          parseErrors.push(`Could not parse plain cutout JSONL: ${stdoutBuffer.trim().slice(0, 240)}`);
        }
      }

      const outputExists = await pathExists(outputPath);
      const finalEvent = [...events].reverse().find((entry) => (
        entry?.event === 'job_completed' || entry?.event === 'job_failed'
      ));
      const ok = exitCode === 0 && outputExists && finalEvent?.event !== 'job_failed';

      resolve({
        ok,
        image,
        outputPath,
        exitCode,
        events,
        finalEvent: finalEvent || null,
        parseErrors,
        stderr: stderrText,
        error: ok
          ? ''
          : finalEvent?.message || stderrText.trim().split(/\r?\n/).slice(-1)[0] || 'plain cutout processing failed.',
      });
    });
  });
}

function buildPlan({
  images,
  outputDir,
  outputMode,
}) {
  const outputExtension = getOutputExtension(outputMode);
  return images.map((image) => ({
    ...image,
    outputPath: path.join(outputDir, `${image.imageKey}${outputExtension}`),
  }));
}

function printPlan({ sourceDir, outputDir, outputMode, renderMode, commandInfo, plannedImages }) {
  console.log('Vision image preprocessing plan.');
  console.log(`- source dir: ${sourceDir}`);
  console.log(`- output dir: ${outputDir}`);
  console.log(`- output mode: ${outputMode}`);
  console.log(`- render mode: ${renderMode}`);
  console.log(`- objectGlow command: ${commandInfo.command}`);
  if (renderMode === 'cutout') {
    console.log(`- objectGlow python: ${commandInfo.python || '(not resolved)'}`);
  }
  console.log(`- images: ${plannedImages.length}`);
  plannedImages.forEach((image) => {
    console.log(`  - ${image.fileName} -> ${path.basename(image.outputPath)}`);
  });
}

async function preprocessImages({
  outputDir,
  outputMode,
  renderMode,
  commandInfo,
  plannedImages,
  batchId,
  extraArgs,
  force,
  dryRun,
  size,
  padding,
  webpQuality,
  skipAutoRotate,
}) {
  if (dryRun) {
    return {
      processed: [],
      skipped: [],
      failed: [],
    };
  }

  await ensureDirectory(outputDir);
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'dwc-objectglow-preprocess-'));

  const processed = [];
  const skipped = [];
  const failed = [];

  try {
    for (const image of plannedImages) {
      if (!force && await pathExists(image.outputPath)) {
        console.log(`Skipping existing output: ${path.basename(image.outputPath)}`);
        skipped.push({
          imageKey: image.imageKey,
          inputFile: image.fileName,
          outputPath: image.outputPath,
          reason: 'output_exists',
        });
        continue;
      }

      let preparedImage;
      try {
        preparedImage = await prepareObjectGlowInput(image, tempRoot);
      } catch (error) {
        failed.push({
          imageKey: image.imageKey,
          inputFile: image.fileName,
          inputPath: image.inputPath,
          outputPath: image.outputPath,
          exitCode: null,
          finalEvent: '',
          finalMessage: '',
          parseErrors: [],
          preprocessing: {
            converted: false,
            error: error?.message || 'Failed to prepare image for objectGlow.',
          },
          error: `Failed to convert ${image.fileName} before objectGlow: ${error?.message || error}`,
          stderrTail: [],
        });
        console.error(`  failed: could not convert ${image.fileName} before objectGlow`);
        continue;
      }

      const conversionNote = preparedImage.preprocessing?.converted
        ? ` via ${path.basename(preparedImage.preprocessing.convertedPath)}`
        : '';
      console.log(`Processing ${image.fileName}${conversionNote} -> ${path.basename(image.outputPath)}`);
      const result = renderMode === 'cutout'
        ? await runPlainCutout({
            commandInfo,
            image: preparedImage,
            outputPath: image.outputPath,
            batchId,
            outputMode,
            size,
            padding,
            webpQuality,
            skipAutoRotate,
          })
        : await runObjectGlow({
            command: commandInfo.command,
            cwd: commandInfo.cwd,
            image: preparedImage,
            outputPath: image.outputPath,
            batchId,
            outputMode,
            extraArgs,
          });

      const summary = {
        imageKey: image.imageKey,
        inputFile: image.fileName,
        inputPath: image.inputPath,
        processingInputPath: preparedImage.processingInputPath,
        preprocessing: preparedImage.preprocessing || null,
        outputPath: image.outputPath,
        exitCode: result.exitCode,
        finalEvent: result.finalEvent?.event || '',
        finalMessage: result.finalEvent?.message || '',
        parseErrors: result.parseErrors,
      };

      if (result.ok) {
        processed.push(summary);
        console.log(`  ok: ${path.basename(image.outputPath)}`);
      } else {
        failed.push({
          ...summary,
          error: result.error,
          stderrTail: result.stderr.trim().split(/\r?\n/).slice(-8),
        });
        console.error(`  failed: ${result.error}`);
      }
    }
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }

  return {
    processed,
    skipped,
    failed,
  };
}

async function writeManifest({
  manifestPath,
  sourceDir,
  outputDir,
  outputMode,
  renderMode,
  commandInfo,
  batchId,
  result,
}) {
  const manifest = {
    tool: TOOL_NAME,
    createdAt: new Date().toISOString(),
    sourceDir,
    outputDir,
    outputMode,
    renderMode,
    objectGlow: {
      command: commandInfo.command,
      cwd: commandInfo.cwd,
      source: commandInfo.source,
    },
    batchId,
    counts: {
      processed: result.processed.length,
      skipped: result.skipped.length,
      failed: result.failed.length,
    },
    processed: result.processed,
    skipped: result.skipped,
    failed: result.failed,
  };

  await fs.writeFile(manifestPath, jsonString(manifest), 'utf8');
  return manifest;
}

async function main() {
  const args = parseArgs();
  if (args.help || args.h) {
    console.log(usageMessage());
    return;
  }

  const sourceDir = resolveUserPath(args['source-dir'] || args._[0]);
  if (!sourceDir) {
    throw new Error(`--source-dir is required.\n\n${usageMessage()}`);
  }

  await assertDirectoryExists(sourceDir, 'Source');

  const outputMode = normalizeOutputMode(args['output-mode']);
  const renderMode = normalizeRenderMode(args['render-mode']);
  const outputDir =
    resolveUserPath(args['output-dir'])
    || path.join(path.dirname(sourceDir), `${path.basename(sourceDir)}_objectglow_cleaned`);
  const force = Boolean(args.force);
  const dryRun = Boolean(args['dry-run']);
  const limit = parsePositiveInteger(args.limit, 0);
  const size = parsePositiveInteger(args.size, 1024);
  const padding = Number.isFinite(Number(args.padding)) ? Number(args.padding) : 0.10;
  const webpQuality = parsePositiveInteger(args['webp-quality'], 90);
  const skipAutoRotate = args['skip-auto-rotate'] !== false;
  const commandInfo = resolveObjectGlowCommand(args);
  const batchId = toTrimmed(args['batch-id']) || createBatchId(path.basename(sourceDir));

  if (path.resolve(sourceDir) === path.resolve(outputDir)) {
    throw new Error('Output directory must be different from source directory.');
  }

  const images = await listSourceImages(sourceDir);
  if (!images.length) {
    throw new Error(`No supported image files found in ${sourceDir}`);
  }

  const selectedImages = limit > 0 ? images.slice(0, limit) : images;
  const plannedImages = buildPlan({
    images: selectedImages,
    outputDir,
    outputMode,
  });

  const extraArgs = [];
  appendOptionalObjectGlowArgs(extraArgs, args);

  printPlan({
    sourceDir,
    outputDir,
    outputMode,
    renderMode,
    commandInfo,
    plannedImages,
  });

  if (dryRun) {
    console.log('Dry run complete. No files were written.');
    return;
  }

  const result = await preprocessImages({
    outputDir,
    outputMode,
    renderMode,
    commandInfo,
    plannedImages,
    batchId,
    extraArgs,
    force,
    dryRun,
    size,
    padding,
    webpQuality,
    skipAutoRotate,
  });

  const manifestPath = path.join(outputDir, MANIFEST_FILENAME);
  await writeManifest({
    manifestPath,
    sourceDir,
    outputDir,
    outputMode,
    renderMode,
    commandInfo,
    batchId,
    result,
  });

  console.log('Vision image preprocessing complete.');
  console.log(`- processed: ${result.processed.length}`);
  console.log(`- skipped: ${result.skipped.length}`);
  console.log(`- failed: ${result.failed.length}`);
  console.log(`- manifest: ${manifestPath}`);
  console.log(`- next: node scripts/build_vision_intake_batch.js --init --source-dir "${outputDir}"`);

  if (result.failed.length > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Failed to preprocess vision images: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  MANIFEST_FILENAME,
  normalizeOutputMode,
  resolveObjectGlowCommand,
  listSourceImages,
  buildPlan,
  preprocessImages,
};
