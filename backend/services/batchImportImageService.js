const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const {
  ITEM_MEDIA_SUBDIRS,
  DERIVATIVE_FORMAT,
  toAbsoluteMediaPath,
  toMediaUrl,
} = require('../config/media');
const { setItemImage } = require('./itemService');
const {
  upsertMediaStateByOriginalPath,
  syncDerivedVariantsForMedia,
  toErrorPayload,
} = require('./mediaProcessingService');

const MATCHABLE_IMPORT_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
]);

const MIME_BY_EXTENSION = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
};

let setItemImageRunner = setItemImage;
let upsertMediaStateRunner = upsertMediaStateByOriginalPath;
let syncDerivedVariantsRunner = syncDerivedVariantsForMedia;

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

function toImportFileName(file) {
  const raw = toTrimmed(file?.originalname);
  if (!raw) return '';
  return path.basename(raw.replace(/\\/g, '/'));
}

function buildImportImageLookup(files = []) {
  const lookup = new Map();

  for (const file of Array.isArray(files) ? files : []) {
    const fileName = toImportFileName(file);
    const parsed = path.parse(fileName);
    const ext = toTrimmed(parsed.ext).toLowerCase();
    const baseName = parsed.name;

    if (!baseName || !MATCHABLE_IMPORT_EXTENSIONS.has(ext)) continue;

    const entry = {
      baseName,
      ext,
      fileName,
      originalname: file?.originalname || fileName,
      path: file?.path || '',
      mimetype: toTrimmed(file?.mimetype),
    };

    if (!lookup.has(baseName)) {
      lookup.set(baseName, []);
    }
    lookup.get(baseName).push(entry);
  }

  return lookup;
}

function resolveImportImageMatch(imageKey, importImageLookup) {
  const normalizedImageKey = toTrimmed(imageKey);
  if (!normalizedImageKey) {
    return {
      status: 'missing_image_key',
      imageKey: '',
      matches: [],
    };
  }

  const matches = importImageLookup instanceof Map
    ? importImageLookup.get(normalizedImageKey) || []
    : [];

  if (matches.length === 0) {
    return {
      status: 'missing',
      imageKey: normalizedImageKey,
      matches: [],
    };
  }

  if (matches.length > 1) {
    return {
      status: 'ambiguous',
      imageKey: normalizedImageKey,
      matches,
    };
  }

  return {
    status: 'matched',
    imageKey: normalizedImageKey,
    matches,
    match: matches[0],
  };
}

async function readImageMetadata(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata?.width ?? null,
      height: metadata?.height ?? null,
    };
  } catch {
    return {
      width: null,
      height: null,
    };
  }
}

async function copyMatchedImportImage(match) {
  const ext = toTrimmed(match?.ext).toLowerCase();
  const sourcePath = toTrimmed(match?.path);
  const destinationFilename = `${crypto.randomUUID()}${ext}`;
  const storagePath = `${ITEM_MEDIA_SUBDIRS.original}/${destinationFilename}`;
  const absolutePath = toAbsoluteMediaPath(storagePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.copyFile(sourcePath, absolutePath);

  const [stats, metadata] = await Promise.all([
    fs.stat(absolutePath),
    readImageMetadata(absolutePath),
  ]);

  return {
    storagePath,
    absolutePath,
    url: toMediaUrl(storagePath),
    mimeType: toTrimmed(match?.mimetype) || MIME_BY_EXTENSION[ext] || '',
    width: metadata.width,
    height: metadata.height,
    sizeBytes: stats?.size ?? null,
  };
}

function absoluteMediaPathToStoragePath(absolutePath) {
  const relativePath = path.relative(toAbsoluteMediaPath(''), absolutePath);
  if (!relativePath || relativePath.startsWith('..')) {
    throw new Error(`Derivative path is outside managed media storage: ${absolutePath}`);
  }
  return relativePath.replace(/\\/g, '/');
}

async function readDerivativeMetadata(absolutePath) {
  const [stats, metadata] = await Promise.all([
    fs.stat(absolutePath),
    sharp(absolutePath).metadata(),
  ]);
  const storagePath = absoluteMediaPathToStoragePath(absolutePath);
  return {
    storagePath,
    url: toMediaUrl(storagePath),
    mimeType: DERIVATIVE_FORMAT.mimeType,
    width: metadata?.width ?? null,
    height: metadata?.height ?? null,
    sizeBytes: stats?.size ?? null,
  };
}

async function attachBatchImportImageToItem({
  itemId,
  imageKey,
  importImageLookup,
} = {}) {
  const resolution = resolveImportImageMatch(imageKey, importImageLookup);

  if (resolution.status !== 'matched') {
    return resolution;
  }

  const original = await copyMatchedImportImage(resolution.match);
  let mediaState = await upsertMediaStateRunner(original.absolutePath, {
    processedPath: '',
    displayPath: '',
    thumbPath: '',
    activeVariant: 'original',
    displayDerivedFrom: null,
    thumbDerivedFrom: null,
    processingStatus: 'ready_for_processing',
    sourceType: 'batch_import',
    processingError: null,
    processedAt: null,
  });

  let display;
  let thumb;
  try {
    mediaState = await syncDerivedVariantsRunner(original.absolutePath);
    [display, thumb] = await Promise.all([
      readDerivativeMetadata(mediaState.displayPath),
      readDerivativeMetadata(mediaState.thumbPath),
    ]);
  } catch (error) {
    const processingError = toErrorPayload(error);
    mediaState = await upsertMediaStateRunner(original.absolutePath, {
      processingStatus: 'failed',
      processingError,
    });
    return {
      status: 'derivative_failed',
      imageKey: resolution.imageKey,
      mediaId: mediaState.mediaId,
      storagePath: original.storagePath,
      originalPath: mediaState.originalPath,
      processingStatus: mediaState.processingStatus,
      error: processingError,
    };
  }

  const image = {
    mediaId: mediaState.mediaId,
    originalName: resolution.match.fileName,
    uploadedAt: new Date(),
    original: {
      storagePath: original.storagePath,
      url: original.url,
      mimeType: original.mimeType,
      width: original.width,
      height: original.height,
      sizeBytes: original.sizeBytes,
    },
    display,
    thumb,
  };

  await setItemImageRunner(itemId, image);

  return {
    status: 'attached',
    imageKey: resolution.imageKey,
    mediaId: mediaState.mediaId,
    storagePath: original.storagePath,
    originalPath: mediaState.originalPath,
    processingStatus: mediaState.processingStatus,
    sourceType: mediaState.sourceType,
  };
}

function __setBatchImportImageHandlersForTests(handlers = {}) {
  if (typeof handlers.setItemImage === 'function') {
    setItemImageRunner = handlers.setItemImage;
  }
  if (typeof handlers.upsertMediaStateByOriginalPath === 'function') {
    upsertMediaStateRunner = handlers.upsertMediaStateByOriginalPath;
  }
  if (typeof handlers.syncDerivedVariantsForMedia === 'function') {
    syncDerivedVariantsRunner = handlers.syncDerivedVariantsForMedia;
  }
}

function __resetBatchImportImageHandlersForTests() {
  setItemImageRunner = setItemImage;
  upsertMediaStateRunner = upsertMediaStateByOriginalPath;
  syncDerivedVariantsRunner = syncDerivedVariantsForMedia;
}

module.exports = {
  MATCHABLE_IMPORT_EXTENSIONS,
  buildImportImageLookup,
  resolveImportImageMatch,
  attachBatchImportImageToItem,
  __setBatchImportImageHandlersForTests,
  __resetBatchImportImageHandlersForTests,
};
