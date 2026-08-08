const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');
const {
  DERIVATIVE_FORMAT,
  DERIVATIVE_SIZES,
  BOX_MEDIA_SUBDIRS,
  ITEM_MEDIA_SUBDIRS,
  MEDIA_ROOT,
  toAbsoluteMediaPath,
} = require('../config/media');

const ENTITY_MEDIA_DIRECTORIES = {
  items: ITEM_MEDIA_SUBDIRS,
  boxes: BOX_MEDIA_SUBDIRS,
};
const ALLOWED_SOURCE_DIRECTORIES = new Set(
  Object.entries(ENTITY_MEDIA_DIRECTORIES).flatMap(([entityType, directories]) => [
    directories.original,
    directories.display,
    `${entityType}/processed`,
  ]),
);
const VARIANT_CONFIG = {
  thumb: {
    maxDimension: DERIVATIVE_SIZES.thumbMaxDim,
    quality: DERIVATIVE_FORMAT.thumbQuality,
  },
  display: {
    maxDimension: DERIVATIVE_SIZES.displayMaxDim,
    quality: DERIVATIVE_FORMAT.displayQuality,
  },
};
const MAX_CONCURRENT_GENERATIONS = 2;
const generationByTarget = new Map();
const generationQueue = [];
let activeGenerationCount = 0;

function normalizeSourceStoragePath(rawValue) {
  const raw = String(rawValue || '').trim();
  if (!raw) return '';

  let pathname = raw;
  try {
    if (/^https?:\/\//i.test(raw)) {
      pathname = new URL(raw).pathname;
    }
  } catch {
    return '';
  }

  const cleanPath = pathname
    .split(/[?#]/, 1)[0]
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/^media\//, '');
  const normalized = path.posix.normalize(cleanPath);
  if (!normalized || normalized === '.' || normalized.startsWith('../')) return '';

  const sourceDirectory = path.posix.dirname(normalized);
  if (!ALLOWED_SOURCE_DIRECTORIES.has(sourceDirectory)) return '';
  return normalized;
}

function resolveDerivativePaths({ source, variant }) {
  const normalizedVariant = String(variant || '').trim().toLowerCase();
  const config = VARIANT_CONFIG[normalizedVariant];
  const sourceStoragePath = normalizeSourceStoragePath(source);
  if (!config || !sourceStoragePath) return null;

  const sourceBaseName = path.posix.parse(sourceStoragePath).name;
  if (!sourceBaseName) return null;

  const entityType = sourceStoragePath.split('/', 1)[0];
  const targetDirectory = ENTITY_MEDIA_DIRECTORIES[entityType]?.[normalizedVariant];
  if (!targetDirectory) return null;

  const targetStoragePath = `${targetDirectory}/${sourceBaseName}${DERIVATIVE_FORMAT.extension}`;
  const sourceAbsolutePath = toAbsoluteMediaPath(sourceStoragePath);
  const targetAbsolutePath = toAbsoluteMediaPath(targetStoragePath);
  const mediaRootPrefix = `${MEDIA_ROOT}${path.sep}`;

  if (
    !sourceAbsolutePath.startsWith(mediaRootPrefix) ||
    !targetAbsolutePath.startsWith(mediaRootPrefix)
  ) {
    return null;
  }

  return {
    config,
    sourceStoragePath,
    sourceAbsolutePath,
    targetStoragePath,
    targetAbsolutePath,
    variant: normalizedVariant,
  };
}

async function isUsableFile(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

async function isDerivativeFresh(paths) {
  try {
    const [sourceStat, targetStat] = await Promise.all([
      fs.stat(paths.sourceAbsolutePath),
      fs.stat(paths.targetAbsolutePath),
    ]);
    return (
      sourceStat.isFile() &&
      targetStat.isFile() &&
      targetStat.size > 0 &&
      targetStat.mtimeMs >= sourceStat.mtimeMs
    );
  } catch {
    return false;
  }
}

function runGeneration(job) {
  return new Promise((resolve, reject) => {
    generationQueue.push({ job, reject, resolve });
    drainGenerationQueue();
  });
}

function drainGenerationQueue() {
  while (
    activeGenerationCount < MAX_CONCURRENT_GENERATIONS &&
    generationQueue.length > 0
  ) {
    const { job, reject, resolve } = generationQueue.shift();
    activeGenerationCount += 1;
    Promise.resolve()
      .then(job)
      .then(resolve, reject)
      .finally(() => {
        activeGenerationCount -= 1;
        drainGenerationQueue();
      });
  }
}

async function createDerivative(paths) {
  if (!(await isUsableFile(paths.sourceAbsolutePath))) {
    const error = new Error('Source image not found');
    error.code = 'SOURCE_NOT_FOUND';
    throw error;
  }

  await fs.mkdir(path.dirname(paths.targetAbsolutePath), { recursive: true });
  const temporaryPath = `${paths.targetAbsolutePath}.${process.pid}-${Date.now()}.tmp`;

  try {
    await sharp(paths.sourceAbsolutePath)
      .rotate()
      .resize({
        width: paths.config.maxDimension,
        height: paths.config.maxDimension,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toFormat(DERIVATIVE_FORMAT.sharpFormat, {
        quality: paths.config.quality,
      })
      .toFile(temporaryPath);
    await fs.rename(temporaryPath, paths.targetAbsolutePath);
  } catch (error) {
    await fs.unlink(temporaryPath).catch(() => {});
    throw error;
  }
}

async function getOrCreateImageDerivative({ source, variant }) {
  const paths = resolveDerivativePaths({ source, variant });
  if (!paths) {
    const error = new Error('Invalid derivative request');
    error.code = 'INVALID_DERIVATIVE_REQUEST';
    throw error;
  }

  if (await isDerivativeFresh(paths)) {
    return { ...paths, generated: false };
  }

  let generation = generationByTarget.get(paths.targetAbsolutePath);
  if (!generation) {
    generation = runGeneration(() => createDerivative(paths))
      .finally(() => generationByTarget.delete(paths.targetAbsolutePath));
    generationByTarget.set(paths.targetAbsolutePath, generation);
  }
  await generation;
  return { ...paths, generated: true };
}

module.exports = {
  getOrCreateImageDerivative,
  normalizeSourceStoragePath,
  resolveDerivativePaths,
};
