const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');
const {
  ITEM_MEDIA_SUBDIRS,
  BOX_MEDIA_SUBDIRS,
  DERIVATIVE_SIZES,
  DERIVATIVE_FORMAT,
  toAbsoluteMediaPath,
  toMediaUrl,
} = require('../config/media');
const { generateItemTinyDerivative } = require('./itemTinyImageService');

async function processEntityImageUpload(file, mediaSubdirs, { includeTiny = false } = {}) {
  const originalStoragePath = `${mediaSubdirs.original}/${file.filename}`;
  const originalAbsolutePath = file.path;
  const baseName = path.parse(file.filename).name;

  const displayStoragePath = `${mediaSubdirs.display}/${baseName}${DERIVATIVE_FORMAT.extension}`;
  const thumbStoragePath = `${mediaSubdirs.thumb}/${baseName}${DERIVATIVE_FORMAT.extension}`;

  const displayAbsolutePath = toAbsoluteMediaPath(displayStoragePath);
  const thumbAbsolutePath = toAbsoluteMediaPath(thumbStoragePath);

  const source = sharp(originalAbsolutePath).rotate(); // auto-orient from EXIF

  const [originalMeta, originalStat, displayInfo, thumbInfo, tinyResult] = await Promise.all([
    sharp(originalAbsolutePath).metadata(),
    fs.stat(originalAbsolutePath),
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
      .toFile(displayAbsolutePath),
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
      .toFile(thumbAbsolutePath),
    includeTiny
      ? generateItemTinyDerivative({
          sourcePath: originalAbsolutePath,
          identitySourcePath: originalAbsolutePath,
        })
      : null,
  ]);

  return {
    image: {
      originalName: file.originalname || '',
      uploadedAt: new Date(),
      original: {
        storagePath: originalStoragePath,
        url: toMediaUrl(originalStoragePath),
        mimeType: file.mimetype,
        width: originalMeta.width ?? null,
        height: originalMeta.height ?? null,
        sizeBytes: originalStat.size ?? null,
      },
      display: {
        storagePath: displayStoragePath,
        url: toMediaUrl(displayStoragePath),
        mimeType: DERIVATIVE_FORMAT.mimeType,
        width: displayInfo.width ?? null,
        height: displayInfo.height ?? null,
        sizeBytes: displayInfo.size ?? null,
      },
      thumb: {
        storagePath: thumbStoragePath,
        url: toMediaUrl(thumbStoragePath),
        mimeType: DERIVATIVE_FORMAT.mimeType,
        width: thumbInfo.width ?? null,
        height: thumbInfo.height ?? null,
        sizeBytes: thumbInfo.size ?? null,
      },
      ...(tinyResult
        ? {
            tiny: {
              storagePath: tinyResult.storagePath,
              url: tinyResult.url,
              mimeType: tinyResult.mimeType,
              width: tinyResult.width,
              height: tinyResult.height,
              sizeBytes: tinyResult.sizeBytes,
            },
          }
        : {}),
    },
    filesToCleanup: [
      originalAbsolutePath,
      displayAbsolutePath,
      thumbAbsolutePath,
      tinyResult?.absolutePath,
    ].filter(Boolean),
  };
}

async function processItemImageUpload(file) {
  return processEntityImageUpload(file, ITEM_MEDIA_SUBDIRS, { includeTiny: true });
}

async function processBoxImageUpload(file) {
  return processEntityImageUpload(file, BOX_MEDIA_SUBDIRS);
}

module.exports = {
  processEntityImageUpload,
  processItemImageUpload,
  processBoxImageUpload,
};
