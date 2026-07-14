const fs = require('fs/promises');
const { constants: FS_CONSTANTS } = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const sharp = require('sharp');

const MediaState = require('../models/MediaState');
const { DERIVATIVE_SIZES, DERIVATIVE_FORMAT, MEDIA_ROOT } = require('../config/media');
const { createMediaId } = require('../utils/mediaId');
const {
  MEDIA_ERROR_CODES,
  createMediaError,
  isMediaError,
  toMediaErrorPayload,
} = require('./mediaErrors');
const {
  DEFAULT_RENDER_TOKENS,
  RENDER_TOKEN_KEYS,
  resolveRenderTokens,
  validateRenderTokens,
} = require('./renderTokenContract');

const DEFAULT_OBJECT_GLOW_REPO = path.resolve(__dirname, '../../../objectiglow');
const OBJECT_GLOW_REPO = String(
  process.env.OBJECT_GLOW_REPO || DEFAULT_OBJECT_GLOW_REPO
).trim();
const OBJECT_GLOW_MODULE = process.env.OBJECT_GLOW_MODULE || 'itemcutout';
const MAX_STDOUT_SNIPPET_LENGTH = 1200;
const ACTIVE_VARIANTS = new Set(['original', 'processed']);
const PROCESSING_STATUSES = new Set([
  'idle',
  'ready_for_processing',
  'queued',
  'processing',
  'completed',
  'failed',
]);

// Avoid stale file-metadata reads when regenerating the same derivative path in rapid succession.
// Keep memory/item caches enabled for performance; only disable file cache keys.
sharp.cache({ files: 0 });

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

const OBJECT_GLOW_TIMEOUT_MS = toPositiveInteger(
  process.env.OBJECT_GLOW_TIMEOUT_MS,
  120000
);
const OBJECT_GLOW_PROGRESS_EVENTS = new Set([
  'job_queued',
  'job_started',
  'stage_started',
  'stage_progress',
  'stage_completed',
  'warning',
  'job_completed',
  'job_failed',
]);

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

function normalizeMediaId(value) {
  return toTrimmed(value);
}

function toStdoutSnippet(stdout) {
  const text = String(stdout || '').trim();
  if (!text) return '';
  if (text.length <= MAX_STDOUT_SNIPPET_LENGTH) return text;
  return `${text.slice(0, MAX_STDOUT_SNIPPET_LENGTH)}...`;
}

function coerceBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return null;
}

function coerceNumber(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDimensions(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const width = coerceNumber(raw.width);
  const height = coerceNumber(raw.height);
  if (width == null || height == null) return null;
  return { width, height };
}

function clampProgressPercent(value) {
  const parsed = coerceNumber(value);
  if (parsed == null) return null;
  if (parsed < 0) return 0;
  if (parsed > 100) return 100;
  return parsed;
}

function normalizeObjectGlowProgressEvent(rawEvent = {}, fallbackContext = {}) {
  if (!rawEvent || typeof rawEvent !== 'object' || Array.isArray(rawEvent)) return null;

  const event = toTrimmed(rawEvent.event).toLowerCase();
  if (!OBJECT_GLOW_PROGRESS_EVENTS.has(event)) return null;

  const stage = toTrimmed(rawEvent.stage).toLowerCase();
  const message = toTrimmed(rawEvent.message);
  const runId = toTrimmed(rawEvent.runId || rawEvent.run_id || fallbackContext.runId);
  const mediaId = toTrimmed(rawEvent.mediaId || rawEvent.media_id || fallbackContext.mediaId);
  const batchId = toTrimmed(rawEvent.batchId || rawEvent.batch_id || fallbackContext.batchId);
  const timestamp = normalizeOptionalDate(rawEvent.timestamp)?.toISOString() || new Date().toISOString();
  const protocolVersion = Number.parseInt(String(rawEvent.protocolVersion ?? rawEvent.protocol_version ?? 1), 10);
  const warningCode = toTrimmed(rawEvent.warningCode || rawEvent.warning_code);
  const errorCode = toTrimmed(rawEvent.errorCode || rawEvent.error_code);
  const outputPath = toTrimmed(rawEvent.outputPath || rawEvent.output_path);

  return {
    protocolVersion: Number.isFinite(protocolVersion) && protocolVersion > 0 ? protocolVersion : 1,
    event,
    timestamp,
    runId,
    mediaId,
    batchId,
    stage,
    message,
    progressPercent: clampProgressPercent(rawEvent.progressPercent ?? rawEvent.progress_percent),
    stageCurrent: coerceNumber(rawEvent.stageCurrent ?? rawEvent.stage_current),
    stageTotal: coerceNumber(rawEvent.stageTotal ?? rawEvent.stage_total),
    etaSeconds: coerceNumber(
      rawEvent.etaSeconds ??
      rawEvent.eta_seconds ??
      rawEvent.etaSecondsRemaining ??
      rawEvent.eta_seconds_remaining
    ),
    outputPath,
    warningCode,
    errorCode,
    elapsedSeconds: coerceNumber(rawEvent.elapsedSeconds ?? rawEvent.elapsed_seconds),
    inputDimensions: normalizeDimensions(rawEvent.inputDimensions ?? rawEvent.input_dimensions),
    outputDimensions: normalizeDimensions(rawEvent.outputDimensions ?? rawEvent.output_dimensions),
    glowApplied: coerceBoolean(rawEvent.glowApplied ?? rawEvent.glow_applied),
    glowColor:
      rawEvent.glowColor != null
        ? rawEvent.glowColor
        : rawEvent.glow_color != null
          ? rawEvent.glow_color
          : null,
    details:
      rawEvent.details && typeof rawEvent.details === 'object' && !Array.isArray(rawEvent.details)
        ? rawEvent.details
        : null,
  };
}

function createObjectGlowLineParser({
  onEvent,
  context = {},
} = {}) {
  let buffer = '';
  let lastCompletedEvent = null;
  let lastFailedEvent = null;

  const processLine = (line) => {
    const trimmedLine = toTrimmed(line);
    if (!trimmedLine) return;

    let parsed = null;
    try {
      parsed = JSON.parse(trimmedLine);
    } catch (_error) {
      logMediaProcessingEvent('objectGlow non-json progress line ignored', {
        line: trimmedLine.slice(0, 240),
      });
      return;
    }

    const normalizedEvent = normalizeObjectGlowProgressEvent(parsed, context);
    if (!normalizedEvent) {
      logMediaProcessingEvent('objectGlow unsupported progress event ignored', {
        line: trimmedLine.slice(0, 240),
      });
      return;
    }

    if (normalizedEvent.event === 'job_completed') {
      lastCompletedEvent = normalizedEvent;
    }
    if (normalizedEvent.event === 'job_failed') {
      lastFailedEvent = normalizedEvent;
    }

    onEvent?.(normalizedEvent);
  };

  return {
    append(chunk) {
      buffer += String(chunk || '');
      let newlineIndex = buffer.indexOf('\n');
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        processLine(line);
        newlineIndex = buffer.indexOf('\n');
      }
    },
    flush() {
      processLine(buffer);
      buffer = '';
      return {
        lastCompletedEvent,
        lastFailedEvent,
      };
    },
    getState() {
      return {
        lastCompletedEvent,
        lastFailedEvent,
      };
    },
  };
}

function normalizeActiveVariant(value, fallback = 'original') {
  const normalized = toTrimmed(value).toLowerCase();
  if (ACTIVE_VARIANTS.has(normalized)) return normalized;
  return fallback;
}

function normalizeActiveVariantOrNull(value) {
  const normalized = toTrimmed(value).toLowerCase();
  if (!normalized) return null;
  return ACTIVE_VARIANTS.has(normalized) ? normalized : null;
}

function normalizeProcessingStatus(value, fallback = 'idle') {
  const normalized = toTrimmed(value).toLowerCase();
  if (PROCESSING_STATUSES.has(normalized)) return normalized;
  return fallback;
}

function normalizeOptionalDate(value) {
  if (value == null || value === '') return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function renderTokensEqual(leftTokens, rightTokens) {
  const left = normalizeRenderTokensForState(leftTokens, DEFAULT_RENDER_TOKENS);
  const right = normalizeRenderTokensForState(rightTokens, DEFAULT_RENDER_TOKENS);
  return left.mode === right.mode
    && left.background === right.background
    && left.glow === right.glow;
}

function hasAnyRenderTokenValue(tokens) {
  if (!tokens || typeof tokens !== 'object') return false;
  const mode = toTrimmed(tokens.mode).toLowerCase();
  if (mode === 'random') return true;
  return Boolean(
    toTrimmed(tokens.background) || toTrimmed(tokens.glow)
  );
}

function normalizeRenderTokensForState(tokens, fallbackTokens = DEFAULT_RENDER_TOKENS) {
  const candidate = resolveRenderTokens(tokens, fallbackTokens);
  const validation = validateRenderTokens(candidate, {
    fallbackTokens: DEFAULT_RENDER_TOKENS,
  });
  const resolved = validation.isValid ? validation.renderTokens : DEFAULT_RENDER_TOKENS;
  const mode = toTrimmed(resolved.mode).toLowerCase() === 'random' ? 'random' : 'explicit';
  return {
    mode,
    background: toTrimmed(resolved.background),
    glow: toTrimmed(resolved.glow),
  };
}

function validateAndResolveRenderTokens(tokens, {
  fallbackTokens = DEFAULT_RENDER_TOKENS,
  fieldName = 'renderTokens',
} = {}) {
  const validation = validateRenderTokens(tokens, { fallbackTokens });
  if (!validation.isValid) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT,
      validation.errors[0] || `${fieldName} is invalid`,
      { fieldName, errors: validation.errors }
    );
  }
  return normalizeRenderTokensForState(validation.renderTokens, fallbackTokens);
}

function pickRandomToken(tokens = [], fallback = '') {
  const source = Array.isArray(tokens) ? tokens.filter(Boolean) : [];
  if (!source.length) return toTrimmed(fallback);
  const index = Math.floor(Math.random() * source.length);
  return toTrimmed(source[index]) || toTrimmed(fallback);
}

function materializeRenderTokensForProcessing(tokens, {
  fallbackTokens = DEFAULT_RENDER_TOKENS,
} = {}) {
  const resolved = validateAndResolveRenderTokens(tokens, { fallbackTokens });
  if (resolved.mode !== 'random') return resolved;

  return {
    mode: 'random',
    background: pickRandomToken(RENDER_TOKEN_KEYS.backgrounds, resolved.background),
    glow: pickRandomToken(RENDER_TOKEN_KEYS.glows, resolved.glow),
  };
}

function getAllowedMediaRoots() {
  const roots = [MEDIA_ROOT]
    .map((entry) => path.resolve(String(entry || '').trim()))
    .filter(Boolean);

  const seen = new Set();
  return roots.filter((root) => {
    if (seen.has(root)) return false;
    seen.add(root);
    return true;
  });
}

const ALLOWED_MEDIA_ROOTS = getAllowedMediaRoots();

function isPathInsideRoot(candidatePath, rootPath) {
  const relative = path.relative(rootPath, candidatePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function assertPathInAllowedRoots(resolvedPath, fieldName) {
  const insideAllowedRoot = ALLOWED_MEDIA_ROOTS.some((rootPath) =>
    isPathInsideRoot(resolvedPath, rootPath)
  );

  if (!insideAllowedRoot) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_PATH_OUT_OF_BOUNDS,
      `${fieldName} must resolve within MEDIA_ROOT`,
      {
        inputPath: fieldName === 'inputPath' || fieldName === 'originalPath'
          ? resolvedPath
          : '',
        outputPath: fieldName === 'outputPath' || fieldName === 'processedPath'
          ? resolvedPath
          : '',
        fieldName,
        allowedRoots: ALLOWED_MEDIA_ROOTS,
      }
    );
  }
}

function resolveMediaPath(rawPath, { fieldName, allowEmpty = false } = {}) {
  const field = fieldName || 'path';
  const raw = toTrimmed(rawPath);

  if (!raw) {
    if (allowEmpty) return '';
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT,
      `${field} is required`,
      { fieldName: field }
    );
  }

  const resolved = path.isAbsolute(raw)
    ? path.resolve(raw)
    : path.resolve(MEDIA_ROOT, raw);

  assertPathInAllowedRoots(resolved, field);
  return resolved;
}

async function ensureReadableFile(filePath, {
  code = MEDIA_ERROR_CODES.MEDIA_SOURCE_NOT_FOUND,
  message,
  inputPath = '',
  outputPath = '',
} = {}) {
  const resolvedPath = resolveMediaPath(filePath, {
    fieldName: inputPath ? 'inputPath' : 'path',
  });

  try {
    const stat = await fs.stat(resolvedPath);
    if (!stat.isFile()) {
      throw new Error('not_file');
    }
    return resolvedPath;
  } catch (_error) {
    throw createMediaError(
      code,
      message || `Source file is missing: ${resolvedPath}`,
      {
        inputPath: inputPath || resolvedPath,
        outputPath,
      }
    );
  }
}

async function assertOutputArtifact(filePath, {
  code = MEDIA_ERROR_CODES.MEDIA_OUTPUT_MISSING,
  message,
  inputPath = '',
  outputPath = '',
  minSizeBytes = 1,
} = {}) {
  const resolvedPath = resolveMediaPath(filePath, {
    fieldName: outputPath ? 'outputPath' : 'path',
  });

  try {
    const stat = await fs.stat(resolvedPath);
    if (!stat.isFile()) {
      throw new Error('not_file');
    }
    if (!Number.isFinite(stat.size) || stat.size < minSizeBytes) {
      throw new Error('empty_file');
    }
    return resolvedPath;
  } catch (_error) {
    throw createMediaError(
      code,
      message || `Expected output artifact is missing: ${resolvedPath}`,
      {
        inputPath,
        outputPath: outputPath || resolvedPath,
      }
    );
  }
}

function normalizeMediaStateRecord(record) {
  if (!record) return null;
  const source =
    typeof record?.toObject === 'function' ? record.toObject({ virtuals: false }) : record;

  return {
    mediaId: normalizeMediaId(source?.mediaId),
    originalPath: toTrimmed(source?.originalPath),
    processedPath: toTrimmed(source?.processedPath),
    displayPath: toTrimmed(source?.displayPath),
    thumbPath: toTrimmed(source?.thumbPath),
    renderTokens: normalizeRenderTokensForState(source?.renderTokens, DEFAULT_RENDER_TOKENS),
    activeVariant: normalizeActiveVariant(source?.activeVariant, 'original'),
    displayDerivedFrom: normalizeActiveVariantOrNull(source?.displayDerivedFrom),
    thumbDerivedFrom: normalizeActiveVariantOrNull(source?.thumbDerivedFrom),
    processingStatus: normalizeProcessingStatus(source?.processingStatus, 'idle'),
    sourceType: toTrimmed(source?.sourceType).toLowerCase(),
    processingError: source?.processingError ?? null,
    processedAt: source?.processedAt ? new Date(source.processedAt).toISOString() : null,
    updatedAt: source?.updatedAt ? new Date(source.updatedAt).toISOString() : null,
  };
}

function removeUndefinedEntries(input = {}) {
  const next = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      next[key] = value;
    }
  }
  return next;
}

function normalizeMediaStateUpdate(updateSet = {}) {
  const normalized = { ...updateSet };

  if (Object.prototype.hasOwnProperty.call(normalized, 'mediaId')) {
    normalized.mediaId = normalizeMediaId(normalized.mediaId);
  }

  if (Object.prototype.hasOwnProperty.call(normalized, 'processedPath')) {
    normalized.processedPath = resolveMediaPath(normalized.processedPath, {
      fieldName: 'processedPath',
      allowEmpty: true,
    });
  }

  if (Object.prototype.hasOwnProperty.call(normalized, 'displayPath')) {
    normalized.displayPath = resolveMediaPath(normalized.displayPath, {
      fieldName: 'displayPath',
      allowEmpty: true,
    });
  }

  if (Object.prototype.hasOwnProperty.call(normalized, 'thumbPath')) {
    normalized.thumbPath = resolveMediaPath(normalized.thumbPath, {
      fieldName: 'thumbPath',
      allowEmpty: true,
    });
  }

  if (Object.prototype.hasOwnProperty.call(normalized, 'renderTokens')) {
    normalized.renderTokens = validateAndResolveRenderTokens(normalized.renderTokens, {
      fieldName: 'renderTokens',
    });
  }

  if (Object.prototype.hasOwnProperty.call(normalized, 'activeVariant')) {
    normalized.activeVariant = normalizeActiveVariant(normalized.activeVariant, 'original');
  }

  if (Object.prototype.hasOwnProperty.call(normalized, 'displayDerivedFrom')) {
    normalized.displayDerivedFrom = normalizeActiveVariantOrNull(
      normalized.displayDerivedFrom
    );
  }

  if (Object.prototype.hasOwnProperty.call(normalized, 'thumbDerivedFrom')) {
    normalized.thumbDerivedFrom = normalizeActiveVariantOrNull(
      normalized.thumbDerivedFrom
    );
  }

  if (Object.prototype.hasOwnProperty.call(normalized, 'processingStatus')) {
    normalized.processingStatus = normalizeProcessingStatus(
      normalized.processingStatus,
      'idle'
    );
  }

  if (Object.prototype.hasOwnProperty.call(normalized, 'sourceType')) {
    normalized.sourceType = toTrimmed(normalized.sourceType).toLowerCase();
  }

  if (Object.prototype.hasOwnProperty.call(normalized, 'processedAt')) {
    normalized.processedAt = normalizeOptionalDate(normalized.processedAt);
  }

  return normalized;
}

async function upsertMediaStateByOriginalPath(
  originalPath,
  updateSet = {},
  setOnInsert = {}
) {
  const normalizedOriginalPath = resolveMediaPath(originalPath, {
    fieldName: 'originalPath',
  });

  const defaultInsert = {
    mediaId: createMediaId(),
    originalPath: normalizedOriginalPath,
    processedPath: '',
    displayPath: '',
    thumbPath: '',
    renderTokens: normalizeRenderTokensForState(DEFAULT_RENDER_TOKENS),
    activeVariant: 'original',
    displayDerivedFrom: null,
    thumbDerivedFrom: null,
    processingStatus: 'idle',
    sourceType: '',
    processingError: null,
    processedAt: null,
  };

  const normalizedSet = removeUndefinedEntries(normalizeMediaStateUpdate(updateSet));
  const normalizedSetOnInsert = removeUndefinedEntries(
    normalizeMediaStateUpdate({
      ...defaultInsert,
      ...setOnInsert,
    })
  );

  for (const key of Object.keys(normalizedSet)) {
    if (Object.prototype.hasOwnProperty.call(normalizedSetOnInsert, key)) {
      delete normalizedSetOnInsert[key];
    }
  }

  const update = {
    $set: normalizedSet,
    $setOnInsert: normalizedSetOnInsert,
  };

  const doc = await MediaState.findOneAndUpdate(
    { originalPath: normalizedOriginalPath },
    update,
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    }
  );

  return normalizeMediaStateRecord(doc);
}

async function getMediaStateById(mediaId) {
  const normalizedMediaId = normalizeMediaId(mediaId);

  if (!normalizedMediaId) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT,
      'mediaId is required',
      { fieldName: 'mediaId' }
    );
  }

  const doc = await MediaState.findOne({ mediaId: normalizedMediaId }).lean();
  return normalizeMediaStateRecord(doc);
}

async function getMediaStateByOriginalPath(originalPath) {
  const normalizedOriginalPath = resolveMediaPath(originalPath, {
    fieldName: 'originalPath',
  });
  const doc = await MediaState.findOne({ originalPath: normalizedOriginalPath }).lean();
  return normalizeMediaStateRecord(doc);
}

async function ensureMediaStateByOriginalPath(originalPath) {
  return upsertMediaStateByOriginalPath(originalPath);
}

async function countMediaByState(filter = {}) {
  const query = {};
  const processingStatus = normalizeProcessingStatus(filter?.processingStatus, '');
  const sourceType = toTrimmed(filter?.sourceType).toLowerCase();

  if (processingStatus) {
    query.processingStatus = processingStatus;
  }
  if (sourceType) {
    query.sourceType = sourceType;
  }

  return MediaState.countDocuments(query);
}

function toVariantSiblingDirectory(sourceDirPath, targetVariantSegment) {
  const segments = path.resolve(sourceDirPath).split(path.sep);
  const variantSegments = new Set([
    'original',
    'originals',
    'processed',
    'display',
    'thumb',
  ]);

  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = toTrimmed(segments[index]).toLowerCase();
    if (variantSegments.has(segment)) {
      const next = [...segments];
      next[index] = targetVariantSegment;
      return next.join(path.sep);
    }
  }

  return path.join(path.resolve(sourceDirPath), targetVariantSegment);
}

function computeDerivedPathFromSource(sourcePath, derivativeKind) {
  const normalizedSourcePath = resolveMediaPath(sourcePath, {
    fieldName: 'sourcePath',
  });
  const sourceDir = path.dirname(normalizedSourcePath);
  const baseName = path.parse(normalizedSourcePath).name;
  const derivativeDir = toVariantSiblingDirectory(sourceDir, derivativeKind);
  return resolveMediaPath(
    path.join(derivativeDir, `${baseName}${DERIVATIVE_FORMAT.extension}`),
    {
      fieldName: `${derivativeKind}Path`,
    }
  );
}

function computeProcessedOutputPath(inputPath) {
  const normalizedInputPath = resolveMediaPath(inputPath, {
    fieldName: 'inputPath',
  });
  const sourceDir = path.dirname(normalizedInputPath);
  const baseName = path.parse(normalizedInputPath).name;
  const processedDir = toVariantSiblingDirectory(sourceDir, 'processed');
  return resolveMediaPath(path.join(processedDir, `${baseName}.webp`), {
    fieldName: 'outputPath',
  });
}

function normalizeObjectGlowSuccessPayload(
  payload = {},
  { inputPath: fallbackInputPath = '', outputPath: fallbackOutputPath = '' } = {}
) {
  const status = toTrimmed(payload.status);
  const inputPath = toTrimmed(payload.inputPath || payload.input_path);
  const outputPath = toTrimmed(payload.outputPath || payload.output_path);

  if (!status || !inputPath || !outputPath) {
    throw createMediaError(
      MEDIA_ERROR_CODES.OBJECT_GLOW_BAD_JSON,
      'objectGlow JSON response is missing required fields',
      {
        inputPath: fallbackInputPath,
        outputPath: fallbackOutputPath,
      }
    );
  }

  return {
    status,
    inputPath,
    outputPath,
    elapsedSeconds: coerceNumber(payload.elapsedSeconds ?? payload.elapsed_seconds),
    inputDimensions: normalizeDimensions(
      payload.inputDimensions ?? payload.input_dimensions
    ),
    outputDimensions: normalizeDimensions(
      payload.outputDimensions ?? payload.output_dimensions
    ),
    glowApplied: coerceBoolean(payload.glowApplied ?? payload.glow_applied),
    glowColor:
      payload.glowColor != null
        ? payload.glowColor
        : payload.glow_color != null
          ? payload.glow_color
          : null,
  };
}

function prependPythonPath(prefixPath, existingPythonPath) {
  const normalizedPrefix = toTrimmed(prefixPath);
  const normalizedExisting = toTrimmed(existingPythonPath);
  if (!normalizedPrefix) return normalizedExisting;
  if (!normalizedExisting) return normalizedPrefix;
  return `${normalizedPrefix}${path.delimiter}${normalizedExisting}`;
}

async function isExecutableFile(candidatePath) {
  const normalizedPath = toTrimmed(candidatePath);
  if (!normalizedPath) return false;

  try {
    const stat = await fs.stat(normalizedPath);
    if (!stat.isFile()) return false;
    await fs.access(normalizedPath, FS_CONSTANTS.X_OK);
    return true;
  } catch (_error) {
    return false;
  }
}

function buildObjectGlowCliArgs(inputPath, outputPath, renderTokens, progressContext = {}) {
  const normalized = normalizeRenderTokensForState(renderTokens, DEFAULT_RENDER_TOKENS);
  const args = [
    inputPath,
    '--output',
    outputPath,
    '--progress-format',
    'jsonl',
    '--background-token',
    normalized.background,
    '--glow-token',
    normalized.glow,
  ];
  const runId = toTrimmed(progressContext?.runId);
  const mediaId = toTrimmed(progressContext?.mediaId);
  const batchId = toTrimmed(progressContext?.batchId);

  if (runId) {
    args.push('--run-id', runId);
  }
  if (mediaId) {
    args.push('--media-id', mediaId);
  }
  if (batchId) {
    args.push('--batch-id', batchId);
  }

  return args;
}

async function resolveObjectGlowInvocation(inputPath, outputPath, renderTokens, progressContext = {}) {
  const repoRoot = path.resolve(OBJECT_GLOW_REPO);
  const launcherPath = path.join(repoRoot, 'bin', 'objectglow');
  const venvPythonPath = path.join(repoRoot, '.venv', 'bin', 'python');
  const cliArgs = buildObjectGlowCliArgs(inputPath, outputPath, renderTokens, progressContext);
  const normalizedRenderTokens = normalizeRenderTokensForState(renderTokens, DEFAULT_RENDER_TOKENS);

  if (await isExecutableFile(launcherPath)) {
    return {
      strategy: 'repo-launcher',
      executable: launcherPath,
      args: cliArgs,
      cwd: repoRoot,
      env: {
        ...process.env,
        OBJECT_GLOW_REPO: repoRoot,
      },
      debugEnv: {
        OBJECT_GLOW_REPO: repoRoot,
        OBJECTGLOW_PYTHON: toTrimmed(process.env.OBJECTGLOW_PYTHON),
        PYTHONPATH: toTrimmed(process.env.PYTHONPATH),
        OBJECT_GLOW_MODULE,
        OBJECT_GLOW_RENDER_BACKGROUND: normalizedRenderTokens.background,
        OBJECT_GLOW_RENDER_GLOW: normalizedRenderTokens.glow,
      },
    };
  }

  if (await isExecutableFile(venvPythonPath)) {
    const repoSrc = path.join(repoRoot, 'src');
    const pythonPath = prependPythonPath(repoSrc, process.env.PYTHONPATH);

    return {
      strategy: 'repo-venv-python-fallback',
      executable: venvPythonPath,
      args: ['-m', OBJECT_GLOW_MODULE, ...cliArgs],
      cwd: repoRoot,
      env: {
        ...process.env,
        OBJECT_GLOW_REPO: repoRoot,
        PYTHONPATH: pythonPath,
      },
      debugEnv: {
        OBJECT_GLOW_REPO: repoRoot,
        OBJECTGLOW_PYTHON: toTrimmed(process.env.OBJECTGLOW_PYTHON) || venvPythonPath,
        PYTHONPATH: pythonPath,
        OBJECT_GLOW_MODULE,
        OBJECT_GLOW_RENDER_BACKGROUND: normalizedRenderTokens.background,
        OBJECT_GLOW_RENDER_GLOW: normalizedRenderTokens.glow,
      },
    };
  }

  throw createMediaError(
    MEDIA_ERROR_CODES.OBJECT_GLOW_SPAWN_FAILED,
    `objectGlow repo-local launcher not found at ${launcherPath} and fallback python not found at ${venvPythonPath}`,
    {
      inputPath,
      outputPath,
      stdoutSnippet: '',
      stderr: '',
      details: {
        objectGlowRepo: repoRoot,
        launcherPath,
        venvPythonPath,
      },
    }
  );
}

function logObjectGlowInvocation({ strategy, executable, args, cwd, debugEnv }) {
  console.info('[mediaProcessingService] objectGlow invocation', {
    strategy,
    executable,
    argv: [executable, ...(Array.isArray(args) ? args : [])],
    cwd,
    env: {
      OBJECT_GLOW_REPO: toTrimmed(debugEnv?.OBJECT_GLOW_REPO),
      OBJECTGLOW_PYTHON: toTrimmed(debugEnv?.OBJECTGLOW_PYTHON),
      PYTHONPATH: toTrimmed(debugEnv?.PYTHONPATH),
      OBJECT_GLOW_MODULE: toTrimmed(debugEnv?.OBJECT_GLOW_MODULE),
      OBJECT_GLOW_RENDER_BACKGROUND: toTrimmed(debugEnv?.OBJECT_GLOW_RENDER_BACKGROUND),
      OBJECT_GLOW_RENDER_GLOW: toTrimmed(debugEnv?.OBJECT_GLOW_RENDER_GLOW),
    },
  });
}

function logMediaProcessingEvent(event, details = {}) {
  console.info(`[mediaProcessingService] ${event}`, details);
}

async function runObjectGlowSubprocess({
  inputPath,
  outputPath,
  renderTokens,
  progressContext = {},
  onEvent,
}) {
  const invocation = await resolveObjectGlowInvocation(
    inputPath,
    outputPath,
    renderTokens,
    progressContext
  );
  const { strategy, executable, args, cwd, env, debugEnv } = invocation;
  const lineParser = createObjectGlowLineParser({
    onEvent,
    context: progressContext,
  });

  logObjectGlowInvocation({ strategy, executable, args, cwd, debugEnv });

  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timeoutHandle = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGKILL');
      const timeoutDetails = {
        strategy,
        executable,
        argv: [executable, ...(Array.isArray(args) ? args : [])],
        cwd,
        renderTokens,
        inputPath,
        outputPath,
        stderr,
        stdoutSnippet: toStdoutSnippet(stdout),
      };
      logMediaProcessingEvent('objectGlow timeout', timeoutDetails);
      reject(
        createMediaError(
          MEDIA_ERROR_CODES.OBJECT_GLOW_TIMEOUT,
          `objectGlow timed out after ${OBJECT_GLOW_TIMEOUT_MS}ms`,
          timeoutDetails
        )
      );
    }, Math.max(1000, OBJECT_GLOW_TIMEOUT_MS));

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      lineParser.append(text);
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (spawnError) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutHandle);
      reject(
        createMediaError(
          MEDIA_ERROR_CODES.OBJECT_GLOW_SPAWN_FAILED,
          `Failed to start objectGlow subprocess: ${spawnError.message}`,
          {
            inputPath,
            outputPath,
            stderr,
            stdoutSnippet: toStdoutSnippet(stdout),
          }
        )
      );
    });

    child.on('close', (exitCode, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutHandle);
      const parserState = lineParser.flush();
      console.info('[mediaProcessingService] objectGlow result', {
        strategy,
        executable,
        argv: [executable, ...(Array.isArray(args) ? args : [])],
        cwd,
        exitCode: Number.isInteger(exitCode) ? exitCode : null,
        signal: signal || null,
        stdoutSnippet: toStdoutSnippet(stdout),
        stderrSnippet: toStdoutSnippet(stderr),
      });
      resolve({
        exitCode: Number.isInteger(exitCode) ? exitCode : null,
        signal: signal || null,
        stdout,
        stderr,
        lastCompletedEvent: parserState.lastCompletedEvent,
        lastFailedEvent: parserState.lastFailedEvent,
      });
    });
  });
}

let objectGlowRunner = runObjectGlowSubprocess;

async function reconcileCompletedMediaStateIfArtifactExists(
  originalPath,
  {
    state = null,
    outputPath = '',
    renderTokens = null,
    allowQueuedRecovery = false,
    reason = 'artifact_reconciliation',
  } = {}
) {
  const normalizedOriginalPath = resolveMediaPath(originalPath, {
    fieldName: 'originalPath',
  });
  const existingState = state || await getMediaStateByOriginalPath(normalizedOriginalPath);
  if (!existingState?.originalPath) return null;

  const candidateOutputPath = toTrimmed(outputPath)
    ? resolveMediaPath(outputPath, { fieldName: 'outputPath' })
    : toTrimmed(existingState.processedPath)
      ? resolveMediaPath(existingState.processedPath, { fieldName: 'processedPath' })
      : computeProcessedOutputPath(normalizedOriginalPath);

  const isCompleted = existingState.processingStatus === 'completed';
  const isRecoverableInterruptedState =
    allowQueuedRecovery && ['queued', 'processing'].includes(existingState.processingStatus);
  if (!isCompleted && !isRecoverableInterruptedState) {
    return null;
  }

  try {
    await assertOutputArtifact(candidateOutputPath, {
      inputPath: normalizedOriginalPath,
      outputPath: candidateOutputPath,
    });
  } catch (_error) {
    return null;
  }

  const nextRenderTokens = normalizeRenderTokensForState(
    renderTokens || existingState.renderTokens,
    DEFAULT_RENDER_TOKENS
  );

  logMediaProcessingEvent('terminal completion reconciled from artifact', {
    reason,
    mediaId: toTrimmed(existingState.mediaId),
    originalPath: normalizedOriginalPath,
    outputPath: candidateOutputPath,
    previousStatus: existingState.processingStatus,
    renderTokens: nextRenderTokens,
  });

  let processingState = await upsertMediaStateByOriginalPath(normalizedOriginalPath, {
    processedPath: candidateOutputPath,
    renderTokens: nextRenderTokens,
    activeVariant: 'processed',
    processingStatus: 'completed',
    processingError: null,
    processedAt: existingState.processedAt || new Date(),
  });

  processingState = await syncDerivedVariantsForMedia(normalizedOriginalPath);

  logMediaProcessingEvent('terminal completion persisted', {
    reason,
    mediaId: toTrimmed(processingState.mediaId),
    originalPath: normalizedOriginalPath,
    outputPath: processingState.processedPath,
    status: processingState.processingStatus,
    processedAt: processingState.processedAt,
  });

  return processingState;
}

async function syncDerivedVariantsForMedia(originalPath) {
  const baseState = await upsertMediaStateByOriginalPath(originalPath);
  const activeVariant = normalizeActiveVariant(baseState.activeVariant, 'original');

  const sourcePath =
    activeVariant === 'processed' ? baseState.processedPath : baseState.originalPath;

  if (!sourcePath) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_SOURCE_NOT_FOUND,
      `No source path available for activeVariant=${activeVariant}`,
      {
        inputPath: baseState.originalPath,
        outputPath: baseState.processedPath,
      }
    );
  }

  const normalizedSourcePath = await ensureReadableFile(sourcePath, {
    code: MEDIA_ERROR_CODES.MEDIA_SOURCE_NOT_FOUND,
    message: `Active source file is missing for variant ${activeVariant}: ${sourcePath}`,
    inputPath: baseState.originalPath,
    outputPath: baseState.processedPath,
  });

  // Derivatives belong to the immutable original's media identity. The active
  // variant supplies pixels, but must never create a second derivative path.
  const displayPath = computeDerivedPathFromSource(baseState.originalPath, 'display');
  const thumbPath = computeDerivedPathFromSource(baseState.originalPath, 'thumb');
  const displayTempPath = `${displayPath}.tmp-${process.pid}-${Date.now()}`;
  const thumbTempPath = `${thumbPath}.tmp-${process.pid}-${Date.now()}`;

  await fs.mkdir(path.dirname(displayPath), { recursive: true });
  await fs.mkdir(path.dirname(thumbPath), { recursive: true });

  try {
    const source = sharp(normalizedSourcePath).rotate();

    await Promise.all([
      source
        .clone()
        .resize({
          width: DERIVATIVE_SIZES.displayMaxDim,
          height: DERIVATIVE_SIZES.displayMaxDim,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFormat(DERIVATIVE_FORMAT.sharpFormat, {
          quality: DERIVATIVE_FORMAT.displayQuality,
        })
        .toFile(displayTempPath),
      source
        .clone()
        .resize({
          width: DERIVATIVE_SIZES.thumbMaxDim,
          height: DERIVATIVE_SIZES.thumbMaxDim,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFormat(DERIVATIVE_FORMAT.sharpFormat, {
          quality: DERIVATIVE_FORMAT.thumbQuality,
        })
        .toFile(thumbTempPath),
    ]);

    await Promise.all([
      assertOutputArtifact(displayTempPath, {
        code: MEDIA_ERROR_CODES.MEDIA_DERIVATIVE_SYNC_FAILED,
        message: 'Temporary display derivative is missing after generation',
        inputPath: baseState.originalPath,
        outputPath: displayTempPath,
      }),
      assertOutputArtifact(thumbTempPath, {
        code: MEDIA_ERROR_CODES.MEDIA_DERIVATIVE_SYNC_FAILED,
        message: 'Temporary thumbnail derivative is missing after generation',
        inputPath: baseState.originalPath,
        outputPath: thumbTempPath,
      }),
    ]);

    // POSIX rename replaces each visible file atomically, so readers never see
    // a partially-written image while ObjectGlow refreshes derivatives.
    await fs.rename(displayTempPath, displayPath);
    await fs.rename(thumbTempPath, thumbPath);
  } catch (error) {
    await Promise.allSettled([
      fs.unlink(displayTempPath),
      fs.unlink(thumbTempPath),
    ]);
    if (isMediaError(error)) throw error;
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_DERIVATIVE_SYNC_FAILED,
      `Failed to regenerate derived variants: ${error.message}`,
      {
        inputPath: baseState.originalPath,
        outputPath: baseState.processedPath,
      }
    );
  }

  await assertOutputArtifact(displayPath, {
    code: MEDIA_ERROR_CODES.MEDIA_DERIVATIVE_SYNC_FAILED,
    message: 'Display derivative is missing after sync',
    inputPath: baseState.originalPath,
    outputPath: displayPath,
  });

  await assertOutputArtifact(thumbPath, {
    code: MEDIA_ERROR_CODES.MEDIA_DERIVATIVE_SYNC_FAILED,
    message: 'Thumb derivative is missing after sync',
    inputPath: baseState.originalPath,
    outputPath: thumbPath,
  });

  const nextState = await upsertMediaStateByOriginalPath(baseState.originalPath, {
    displayPath,
    thumbPath,
    displayDerivedFrom: activeVariant,
    thumbDerivedFrom: activeVariant,
  });

  const supersededDerivativePaths = [baseState.displayPath, baseState.thumbPath]
    .map((entry) => toTrimmed(entry))
    .filter(Boolean)
    .filter((entry) => ![displayPath, thumbPath].includes(entry));
  await Promise.allSettled(supersededDerivativePaths.map((entry) => fs.unlink(entry)));

  return nextState;
}

async function setActiveVariant(originalPath, nextActiveVariant) {
  const normalizedNextVariant = toTrimmed(nextActiveVariant).toLowerCase();

  if (!ACTIVE_VARIANTS.has(normalizedNextVariant)) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT,
      'activeVariant must be "original" or "processed"',
      {
        inputPath: toTrimmed(originalPath),
      }
    );
  }

  const state = await upsertMediaStateByOriginalPath(originalPath);
  const sourcePath =
    normalizedNextVariant === 'processed' ? state.processedPath : state.originalPath;

  if (!sourcePath) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_SOURCE_NOT_FOUND,
      `Cannot set activeVariant=${normalizedNextVariant}; source path is empty`,
      {
        inputPath: state.originalPath,
        outputPath: state.processedPath,
      }
    );
  }

  await ensureReadableFile(sourcePath, {
    code: MEDIA_ERROR_CODES.MEDIA_SOURCE_NOT_FOUND,
    message: `Cannot set activeVariant=${normalizedNextVariant}; source file missing: ${sourcePath}`,
    inputPath: state.originalPath,
    outputPath: state.processedPath,
  });

  await upsertMediaStateByOriginalPath(state.originalPath, {
    activeVariant: normalizedNextVariant,
  });

  return syncDerivedVariantsForMedia(state.originalPath);
}

async function setActiveVariantById(mediaId, nextActiveVariant) {
  const state = await getMediaStateById(mediaId);
  if (!state?.originalPath) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_SOURCE_NOT_FOUND,
      `Media state not found for mediaId=${toTrimmed(mediaId)}`,
      { inputPath: '' }
    );
  }
  return setActiveVariant(state.originalPath, nextActiveVariant);
}

async function queueMediaProcessing(inputPath, outputPath, renderTokens, options = {}) {
  const normalizedInputPath = resolveMediaPath(inputPath, { fieldName: 'inputPath' });
  const normalizedOutputPath = outputPath
    ? resolveMediaPath(outputPath, { fieldName: 'outputPath' })
    : computeProcessedOutputPath(normalizedInputPath);
  const existingState = await getMediaStateByOriginalPath(normalizedInputPath);
  const forceReprocess = options?.forceReprocess === true;
  const fallbackTokens = normalizeRenderTokensForState(
    existingState?.renderTokens,
    DEFAULT_RENDER_TOKENS
  );
  const shouldUpdateTokens = hasAnyRenderTokenValue(renderTokens);
  const resolvedRenderTokens = shouldUpdateTokens
    ? validateAndResolveRenderTokens(renderTokens, {
        fallbackTokens,
        fieldName: 'renderTokens',
      })
    : fallbackTokens;

    await ensureReadableFile(normalizedInputPath, {
      code: MEDIA_ERROR_CODES.MEDIA_SOURCE_NOT_FOUND,
      message: `Input file is missing: ${normalizedInputPath}`,
      inputPath: normalizedInputPath,
      outputPath: normalizedOutputPath,
    });

  if (!forceReprocess) {
    const sameRenderTokensAsExisting = renderTokensEqual(
      existingState?.renderTokens,
      resolvedRenderTokens
    );
    const reconciledState = await reconcileCompletedMediaStateIfArtifactExists(
      normalizedInputPath,
      {
        state: existingState,
        outputPath: normalizedOutputPath,
        renderTokens: resolvedRenderTokens,
        allowQueuedRecovery: true,
        reason: existingState?.processingStatus === 'completed'
          ? 'already_complete_skip'
          : 'stale_inflight_artifact_skip',
      }
    );

    if (reconciledState && (sameRenderTokensAsExisting || !shouldUpdateTokens)) {
      logMediaProcessingEvent('skip as already complete', {
        mediaId: toTrimmed(reconciledState.mediaId),
        originalPath: normalizedInputPath,
        outputPath: normalizedOutputPath,
        requestedRenderTokens: resolvedRenderTokens,
        existingRenderTokens: normalizeRenderTokensForState(
          reconciledState.renderTokens,
          DEFAULT_RENDER_TOKENS
        ),
        forceReprocess,
      });

      return {
        mediaId: reconciledState.mediaId,
        inputPath: normalizedInputPath,
        outputPath: normalizedOutputPath,
        renderTokens: normalizeRenderTokensForState(
          reconciledState.renderTokens,
          resolvedRenderTokens
        ),
        processingState: reconciledState,
        skipped: true,
        skipReason: 'already_complete',
      };
    }
  }

  logMediaProcessingEvent('enqueue requested', {
    mediaId: toTrimmed(existingState?.mediaId),
    originalPath: normalizedInputPath,
    outputPath: normalizedOutputPath,
    forceReprocess,
    requestedRenderTokens: resolvedRenderTokens,
    existingStatus: toTrimmed(existingState?.processingStatus),
  });

  const processingState = await upsertMediaStateByOriginalPath(
    normalizedInputPath,
    {
      processedPath: normalizedOutputPath,
      processingStatus: 'queued',
      processingError: null,
      ...(shouldUpdateTokens ? { renderTokens: resolvedRenderTokens } : {}),
    },
    {
      originalPath: normalizedInputPath,
      renderTokens: resolvedRenderTokens,
      activeVariant: 'original',
      displayDerivedFrom: null,
      thumbDerivedFrom: null,
      processedAt: null,
    }
  );

  return {
    mediaId: processingState.mediaId,
    inputPath: normalizedInputPath,
    outputPath: normalizedOutputPath,
    renderTokens: normalizeRenderTokensForState(
      processingState.renderTokens,
      resolvedRenderTokens
    ),
    processingState,
  };
}

async function queueMediaProcessingById(mediaId, outputPath, renderTokens, options = {}) {
  const state = await getMediaStateById(mediaId);
  if (!state?.originalPath) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_SOURCE_NOT_FOUND,
      `Media state not found for mediaId=${toTrimmed(mediaId)}`,
      { inputPath: '' }
    );
  }
  return queueMediaProcessing(state.originalPath, outputPath, renderTokens, options);
}

async function enqueueMediaProcessingById(mediaId, outputPath, renderTokens, options = {}) {
  return queueMediaProcessingById(mediaId, outputPath, renderTokens, options);
}

async function processImageWithObjectGlowById(mediaId, outputPath, renderTokens, options = {}) {
  const state = await getMediaStateById(mediaId);
  if (!state?.originalPath) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_SOURCE_NOT_FOUND,
      `Media state not found for mediaId=${toTrimmed(mediaId)}`,
      { inputPath: '' }
    );
  }
  const fallbackTokens = normalizeRenderTokensForState(
    state?.renderTokens,
    DEFAULT_RENDER_TOKENS
  );
  const requestedTokens = hasAnyRenderTokenValue(renderTokens)
    ? renderTokens
    : fallbackTokens;
  const materializedTokens = materializeRenderTokensForProcessing(requestedTokens, {
    fallbackTokens,
  });

  return processImageWithObjectGlow(state.originalPath, outputPath, {
    renderTokens: materializedTokens,
    progressContext: {
      ...(options?.progressContext || {}),
      mediaId: toTrimmed(options?.progressContext?.mediaId || mediaId),
    },
    onProgress: options?.onProgress,
  });
}

async function processImageWithObjectGlow(inputPath, outputPath, options = {}) {
  let normalizedInputPath = '';
  let normalizedOutputPath = '';
  let renderTokens = normalizeRenderTokensForState(DEFAULT_RENDER_TOKENS);

  try {
    normalizedInputPath = resolveMediaPath(inputPath, { fieldName: 'inputPath' });
    normalizedOutputPath = outputPath
      ? resolveMediaPath(outputPath, { fieldName: 'outputPath' })
      : computeProcessedOutputPath(normalizedInputPath);
    const existingState = await getMediaStateByOriginalPath(normalizedInputPath);
    const requestedTokens = options?.renderTokens;
    const fallbackTokens = normalizeRenderTokensForState(
      existingState?.renderTokens,
      DEFAULT_RENDER_TOKENS
    );
    renderTokens = hasAnyRenderTokenValue(requestedTokens)
      ? materializeRenderTokensForProcessing(requestedTokens, {
          fallbackTokens,
        })
      : materializeRenderTokensForProcessing(fallbackTokens, {
          fallbackTokens: DEFAULT_RENDER_TOKENS,
        });

    logMediaProcessingEvent('start processing', {
      mediaId: toTrimmed(existingState?.mediaId),
      originalPath: normalizedInputPath,
      outputPath: normalizedOutputPath,
      renderTokens,
      priorStatus: toTrimmed(existingState?.processingStatus),
    });

    const processingStartState = await upsertMediaStateByOriginalPath(
      normalizedInputPath,
      {
        processedPath: normalizedOutputPath,
        renderTokens,
        processingStatus: 'processing',
        processingError: null,
      },
      {
        originalPath: normalizedInputPath,
        renderTokens,
        activeVariant: 'original',
        displayDerivedFrom: null,
        thumbDerivedFrom: null,
        processedAt: null,
      }
    );
    const progressMediaId = toTrimmed(options?.progressContext?.mediaId)
      || toTrimmed(processingStartState?.mediaId)
      || toTrimmed(existingState?.mediaId);
    const progressRunId = toTrimmed(options?.progressContext?.runId)
      || (progressMediaId ? `process-${progressMediaId}` : '');

    await ensureReadableFile(normalizedInputPath, {
      code: MEDIA_ERROR_CODES.MEDIA_SOURCE_NOT_FOUND,
      message: `Input file is missing: ${normalizedInputPath}`,
      inputPath: normalizedInputPath,
      outputPath: normalizedOutputPath,
    });

    await fs.mkdir(path.dirname(normalizedOutputPath), { recursive: true });

    let lastCompletedEvent = null;
    let lastFailedEvent = null;
    const { exitCode, signal, stdout, stderr } = await objectGlowRunner({
      inputPath: normalizedInputPath,
      outputPath: normalizedOutputPath,
      renderTokens,
      progressContext: {
        runId: progressRunId,
        mediaId: progressMediaId,
        batchId: toTrimmed(options?.progressContext?.batchId),
      },
      onEvent: (event) => {
        if (event?.event === 'job_completed') {
          lastCompletedEvent = event;
        } else if (event?.event === 'job_failed') {
          lastFailedEvent = event;
        }
        options?.onProgress?.(event);
      },
    });

    if (exitCode !== 0) {
      const reason =
        toTrimmed(lastFailedEvent?.message) ||
        (exitCode == null && signal
          ? `objectGlow terminated by signal ${signal}`
          : `objectGlow exited with code ${exitCode}`);

      throw createMediaError(
        MEDIA_ERROR_CODES.OBJECT_GLOW_PROCESS_FAILED,
        reason,
        {
          exitCode,
          stderr,
          stdoutSnippet: toStdoutSnippet(stdout),
          inputPath: normalizedInputPath,
          outputPath: normalizedOutputPath,
          objectGlowErrorCode: toTrimmed(lastFailedEvent?.errorCode),
        }
      );
    }

    const finalOutputPath = normalizedOutputPath;
    const normalizedSuccess = {
      status: 'ok',
      inputPath: normalizedInputPath,
      outputPath: toTrimmed(lastCompletedEvent?.outputPath) || finalOutputPath,
      elapsedSeconds: coerceNumber(lastCompletedEvent?.elapsedSeconds),
      inputDimensions: normalizeDimensions(lastCompletedEvent?.inputDimensions),
      outputDimensions: normalizeDimensions(lastCompletedEvent?.outputDimensions),
      glowApplied: coerceBoolean(lastCompletedEvent?.glowApplied),
      glowColor:
        lastCompletedEvent?.glowColor != null
          ? lastCompletedEvent.glowColor
          : null,
    };

    await assertOutputArtifact(finalOutputPath, {
      code: MEDIA_ERROR_CODES.MEDIA_OUTPUT_MISSING,
      message: 'objectGlow exited successfully but processed output is missing',
      inputPath: normalizedInputPath,
      outputPath: finalOutputPath,
    });

    logMediaProcessingEvent('success', {
      mediaId: toTrimmed(existingState?.mediaId),
      originalPath: normalizedInputPath,
      outputPath: finalOutputPath,
      renderTokens,
    });

    let processingState = await upsertMediaStateByOriginalPath(normalizedInputPath, {
      processedPath: finalOutputPath,
      renderTokens,
      activeVariant: 'processed',
      processingStatus: 'completed',
      processingError: null,
      processedAt: new Date(),
    });

    if (processingState.activeVariant === 'processed') {
      processingState = await syncDerivedVariantsForMedia(normalizedInputPath);
    }

    logMediaProcessingEvent('terminal completion persisted', {
      reason: 'process_success',
      mediaId: toTrimmed(processingState.mediaId),
      originalPath: normalizedInputPath,
      outputPath: finalOutputPath,
      status: processingState.processingStatus,
      processedAt: processingState.processedAt,
    });

    return {
      result: {
        ...normalizedSuccess,
        inputPath: normalizedInputPath,
        outputPath: finalOutputPath,
        renderTokens,
      },
      processingState,
    };
  } catch (error) {
    const mediaError = isMediaError(error)
      ? error
      : createMediaError(
          MEDIA_ERROR_CODES.OBJECT_GLOW_PROCESS_FAILED,
          error?.message
            ? `objectGlow processing failed: ${error.message}`
            : 'Failed to process image with objectGlow',
          {
            inputPath: normalizedInputPath,
            outputPath: normalizedOutputPath,
          }
        );

    if (normalizedInputPath) {
      const processingError = toMediaErrorPayload(mediaError);
      const processingState = await upsertMediaStateByOriginalPath(normalizedInputPath, {
        processedPath: normalizedOutputPath,
        renderTokens,
        processingStatus: 'failed',
        processingError,
      });
      mediaError.processingState = processingState;
      logMediaProcessingEvent('retry/failure', {
        mediaId: toTrimmed(processingState.mediaId),
        originalPath: normalizedInputPath,
        outputPath: normalizedOutputPath,
        status: processingState.processingStatus,
        error: processingError,
      });
    }

    throw mediaError;
  }
}

function __setObjectGlowRunnerForTests(runner) {
  objectGlowRunner = typeof runner === 'function' ? runner : runObjectGlowSubprocess;
}

function __resetObjectGlowRunnerForTests() {
  objectGlowRunner = runObjectGlowSubprocess;
}

function toBackfillLimit(limit) {
  const parsed = Number.parseInt(String(limit ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 500;
  if (parsed > 5000) return 5000;
  return parsed;
}

async function backfillMissingMediaIds({ limit } = {}) {
  const safeLimit = toBackfillLimit(limit);
  const candidates = await MediaState.find({
    $or: [
      { mediaId: { $exists: false } },
      { mediaId: null },
      { mediaId: '' },
    ],
    originalPath: { $nin: ['', null] },
  })
    .sort({ updatedAt: 1, _id: 1 })
    .limit(safeLimit)
    .lean();

  let updatedCount = 0;
  let skippedCount = 0;

  for (const record of candidates) {
    const originalPath = toTrimmed(record?.originalPath);
    if (!originalPath) {
      skippedCount += 1;
      continue;
    }

    try {
      await MediaState.findOneAndUpdate(
        { originalPath },
        {
          $set: {
            mediaId: createMediaId(),
          },
        },
        {
          runValidators: false,
        }
      );
      updatedCount += 1;
    } catch (_error) {
      skippedCount += 1;
    }
  }

  return {
    matchedCount: candidates.length,
    updatedCount,
    skippedCount,
  };
}

module.exports = {
  backfillMissingMediaIds,
  getMediaStateById,
  enqueueMediaProcessingById,
  queueMediaProcessingById,
  processImageWithObjectGlowById,
  setActiveVariantById,
  queueMediaProcessing,
  processImageWithObjectGlow,
  computeProcessedOutputPath,
  syncDerivedVariantsForMedia,
  reconcileCompletedMediaStateIfArtifactExists,
  setActiveVariant,
  getMediaStateByOriginalPath,
  upsertMediaStateByOriginalPath,
  ensureMediaStateByOriginalPath,
  countMediaByState,
  toErrorPayload: toMediaErrorPayload,
  __setObjectGlowRunnerForTests,
  __resetObjectGlowRunnerForTests,
  __normalizeObjectGlowProgressEventForTests: normalizeObjectGlowProgressEvent,
  __createObjectGlowLineParserForTests: createObjectGlowLineParser,
};
