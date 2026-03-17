const fs = require('fs');
const path = require('path');

const DEFAULT_MEDIA_ROOT = path.resolve(__dirname, '..', 'media');
const MEDIA_ROOT = path.resolve(process.env.MEDIA_ROOT || DEFAULT_MEDIA_ROOT);
const MEDIA_URL_BASE = '/media';

const ITEM_MEDIA_SUBDIRS = {
  original: 'items/original',
  display: 'items/display',
  thumb: 'items/thumb',
};

const BOX_MEDIA_SUBDIRS = {
  original: 'boxes/original',
  display: 'boxes/display',
  thumb: 'boxes/thumb',
};

const ALLOWED_IMAGE_MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const UPLOAD_LIMITS = {
  maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB
};

const DERIVATIVE_SIZES = {
  displayMaxDim: 1600,
  thumbMaxDim: 320,
};

const DERIVATIVE_FORMAT = {
  mimeType: 'image/webp',
  extension: '.webp',
  sharpFormat: 'webp',
  displayQuality: 82,
  thumbQuality: 76,
};

const MEDIA_SUBDIRS = [
  ITEM_MEDIA_SUBDIRS.original,
  ITEM_MEDIA_SUBDIRS.display,
  ITEM_MEDIA_SUBDIRS.thumb,
  BOX_MEDIA_SUBDIRS.original,
  BOX_MEDIA_SUBDIRS.display,
  BOX_MEDIA_SUBDIRS.thumb,
];

function toAbsoluteMediaPath(storagePath) {
  return path.join(MEDIA_ROOT, storagePath);
}

function toMediaUrl(storagePath) {
  return `${MEDIA_URL_BASE}/${storagePath.replace(/\\/g, '/')}`;
}

function ensureMediaDirs() {
  fs.mkdirSync(MEDIA_ROOT, { recursive: true });
  for (const subdir of MEDIA_SUBDIRS) {
    fs.mkdirSync(path.join(MEDIA_ROOT, subdir), { recursive: true });
  }
}

module.exports = {
  MEDIA_ROOT,
  MEDIA_URL_BASE,
  ITEM_MEDIA_SUBDIRS,
  BOX_MEDIA_SUBDIRS,
  ALLOWED_IMAGE_MIME_TO_EXT,
  UPLOAD_LIMITS,
  DERIVATIVE_SIZES,
  DERIVATIVE_FORMAT,
  MEDIA_SUBDIRS,
  toAbsoluteMediaPath,
  toMediaUrl,
  ensureMediaDirs,
};
