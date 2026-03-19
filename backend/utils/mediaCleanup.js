const fs = require('fs/promises');
const path = require('path');
const { MEDIA_ROOT, MEDIA_URL_BASE } = require('../config/media');

const MEDIA_ROOT_RESOLVED = path.resolve(MEDIA_ROOT);
const MEDIA_URL_MARKER = `${MEDIA_URL_BASE}/`;
const OUTSIDE_MEDIA_ROOT = 'outside-media-root';

function isPathInsideMediaRoot(absolutePath) {
  return (
    absolutePath === MEDIA_ROOT_RESOLVED ||
    absolutePath.startsWith(`${MEDIA_ROOT_RESOLVED}${path.sep}`)
  );
}

function normalizeCandidatePath(rawPath) {
  if (typeof rawPath !== 'string') return '';

  let value = rawPath.trim();
  if (!value) return '';

  // Ignore URL query/hash fragments if they are present.
  value = value.split('#')[0].split('?')[0].replace(/\\/g, '/');

  const markerIndex = value.indexOf(MEDIA_URL_MARKER);
  if (markerIndex !== -1) {
    value = value.slice(markerIndex + MEDIA_URL_MARKER.length);
  } else if (value.startsWith(MEDIA_URL_BASE)) {
    value = value.slice(MEDIA_URL_BASE.length);
  }

  return value;
}

function resolveMediaPath(rawPath) {
  const normalized = normalizeCandidatePath(rawPath);
  if (!normalized) return null;

  const isAbsolute = path.isAbsolute(normalized);
  const absolutePath = isAbsolute
    ? path.resolve(normalized)
    : path.resolve(MEDIA_ROOT_RESOLVED, normalized.replace(/^\/+/, ''));

  if (!isPathInsideMediaRoot(absolutePath)) {
    return OUTSIDE_MEDIA_ROOT;
  }

  return absolutePath;
}

async function safeDeleteMediaFile(imagePath, options = {}) {
  const { label = 'media-cleanup' } = options;
  const resolvedPath = resolveMediaPath(imagePath);

  if (!resolvedPath) {
    return { ok: true, deleted: false, skipped: true, reason: 'empty-path' };
  }

  if (resolvedPath === OUTSIDE_MEDIA_ROOT) {
    console.warn(`[${label}] refused to delete path outside MEDIA_ROOT`, {
      imagePath,
      mediaRoot: MEDIA_ROOT_RESOLVED,
    });
    return {
      ok: false,
      deleted: false,
      skipped: true,
      reason: OUTSIDE_MEDIA_ROOT,
    };
  }

  try {
    await fs.unlink(resolvedPath);
    return { ok: true, deleted: true, skipped: false, path: resolvedPath };
  } catch (err) {
    if (err?.code === 'ENOENT') {
      return {
        ok: true,
        deleted: false,
        skipped: true,
        reason: 'missing-file',
        path: resolvedPath,
      };
    }

    console.warn(`[${label}] failed to delete media file`, {
      imagePath,
      path: resolvedPath,
      error: err?.message || err,
    });
    return {
      ok: false,
      deleted: false,
      skipped: false,
      reason: 'unlink-error',
      path: resolvedPath,
    };
  }
}

async function safeDeleteMediaFiles(imagePaths, options = {}) {
  const uniquePaths = Array.from(
    new Set(
      (Array.isArray(imagePaths) ? imagePaths : []).filter(
        (entry) => typeof entry === 'string' && entry.trim(),
      ),
    ),
  );

  const results = await Promise.all(
    uniquePaths.map((entry) => safeDeleteMediaFile(entry, options)),
  );

  return {
    requested: uniquePaths.length,
    deleted: results.filter((result) => result?.deleted).length,
    refused: results.filter((result) => result?.reason === OUTSIDE_MEDIA_ROOT).length,
    results,
  };
}

module.exports = {
  safeDeleteMediaFile,
  safeDeleteMediaFiles,
  resolveMediaPath,
};
