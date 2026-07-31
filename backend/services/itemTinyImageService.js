const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const {
  MEDIA_ROOT,
  MEDIA_URL_BASE,
  ITEM_MEDIA_SUBDIRS,
  DERIVATIVE_SIZES,
  DERIVATIVE_FORMAT,
  toAbsoluteMediaPath,
  toMediaUrl,
} = require('../config/media');

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

function toManagedAbsolutePath(value) {
  const raw = toTrimmed(value);
  if (!raw) return '';
  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
    return '';
  }
  if (path.isAbsolute(raw) && !raw.startsWith(`${MEDIA_URL_BASE}/`)) {
    return path.resolve(raw);
  }

  const normalized = raw.replace(/\\/g, '/');
  const storagePath = normalized.startsWith(`${MEDIA_URL_BASE}/`)
    ? normalized.slice(MEDIA_URL_BASE.length + 1)
    : normalized.replace(/^\/+/, '');
  return toAbsoluteMediaPath(storagePath);
}

function isManagedItemMediaPath(value) {
  const absolutePath = toManagedAbsolutePath(value);
  if (!absolutePath) return false;
  const itemRoot = path.resolve(MEDIA_ROOT, 'items');
  const relative = path.relative(itemRoot, absolutePath);
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function getItemTinyPaths(identitySourcePath) {
  const absoluteIdentityPath = toManagedAbsolutePath(identitySourcePath);
  if (!isManagedItemMediaPath(absoluteIdentityPath)) return null;

  const baseName = path.parse(absoluteIdentityPath).name;
  const storagePath = `${ITEM_MEDIA_SUBDIRS.tiny}/${baseName}${DERIVATIVE_FORMAT.extension}`;
  return {
    storagePath,
    absolutePath: toAbsoluteMediaPath(storagePath),
    url: toMediaUrl(storagePath),
  };
}

async function readItemTinyMetadata(paths) {
  const [stats, metadata] = await Promise.all([
    fs.stat(paths.absolutePath),
    sharp(paths.absolutePath).metadata(),
  ]);
  return {
    storagePath: paths.storagePath,
    url: paths.url,
    mimeType: DERIVATIVE_FORMAT.mimeType,
    width: metadata?.width ?? null,
    height: metadata?.height ?? null,
    sizeBytes: stats?.size ?? null,
  };
}

async function generateItemTinyDerivative({ sourcePath, identitySourcePath = sourcePath }) {
  const absoluteSourcePath = toManagedAbsolutePath(sourcePath);
  const paths = getItemTinyPaths(identitySourcePath);
  if (!absoluteSourcePath || !paths) return null;

  const tempPath = `${paths.absolutePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.mkdir(path.dirname(paths.absolutePath), { recursive: true });

  try {
    await sharp(absoluteSourcePath)
      .rotate()
      .resize({
        width: DERIVATIVE_SIZES.tinySize,
        height: DERIVATIVE_SIZES.tinySize,
        fit: 'cover',
        position: sharp.strategy.attention,
      })
      .toFormat(DERIVATIVE_FORMAT.sharpFormat, {
        quality: DERIVATIVE_FORMAT.tinyQuality,
      })
      .toFile(tempPath);
    await fs.rename(tempPath, paths.absolutePath);
  } catch (error) {
    await fs.unlink(tempPath).catch(() => {});
    throw error;
  }

  return {
    ...(await readItemTinyMetadata(paths)),
    absolutePath: paths.absolutePath,
  };
}

module.exports = {
  toManagedAbsolutePath,
  isManagedItemMediaPath,
  getItemTinyPaths,
  readItemTinyMetadata,
  generateItemTinyDerivative,
};
