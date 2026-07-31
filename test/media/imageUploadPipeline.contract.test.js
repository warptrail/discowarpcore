const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs/promises');
const sharp = require('sharp');

const {
  ITEM_MEDIA_SUBDIRS,
  BOX_MEDIA_SUBDIRS,
  toAbsoluteMediaPath,
} = require('../../backend/config/media');
const {
  processItemImageUpload,
  processBoxImageUpload,
} = require('../../backend/services/itemImageService');

function uniqueFilename(prefix, extension = '.jpg') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
}

async function writeLandscapeJpeg(filePath, { width, height, color }) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
    },
  })
    .jpeg()
    .toFile(filePath);
}

async function assertLandscapeUploadPreserved({
  mediaSubdirs,
  processUpload,
  prefix,
  expectTiny = false,
}) {
  const filename = uniqueFilename(prefix);
  const originalStoragePath = `${mediaSubdirs.original}/${filename}`;
  const originalAbsolutePath = toAbsoluteMediaPath(originalStoragePath);

  const inputWidth = 2200;
  const inputHeight = 1100;

  await writeLandscapeJpeg(originalAbsolutePath, {
    width: inputWidth,
    height: inputHeight,
    color: { r: 30, g: 140, b: 220 },
  });

  const file = {
    filename,
    path: originalAbsolutePath,
    originalname: `${prefix}-landscape.jpg`,
    mimetype: 'image/jpeg',
  };

  let processed = null;
  try {
    processed = await processUpload(file);
    const displayAbsolutePath = toAbsoluteMediaPath(processed.image.display.storagePath);
    const thumbAbsolutePath = toAbsoluteMediaPath(processed.image.thumb.storagePath);

    const [originalMeta, displayMeta, thumbMeta] = await Promise.all([
      sharp(toAbsoluteMediaPath(processed.image.original.storagePath)).metadata(),
      sharp(displayAbsolutePath).metadata(),
      sharp(thumbAbsolutePath).metadata(),
    ]);

    assert.equal(processed.image.original.storagePath, originalStoragePath);
    assert.equal(originalMeta.width, inputWidth);
    assert.equal(originalMeta.height, inputHeight);
    assert.equal(processed.image.original.width, inputWidth);
    assert.equal(processed.image.original.height, inputHeight);

    assert.ok(displayMeta.width <= 1600);
    assert.ok(displayMeta.height <= 1600);
    assert.ok(thumbMeta.width <= 320);
    assert.ok(thumbMeta.height <= 320);
    assert.notEqual(displayMeta.width, displayMeta.height);
    assert.notEqual(thumbMeta.width, thumbMeta.height);

    if (expectTiny) {
      const tinyMeta = await sharp(
        toAbsoluteMediaPath(processed.image.tiny.storagePath)
      ).metadata();
      assert.equal(tinyMeta.format, 'webp');
      assert.equal(tinyMeta.width, 64);
      assert.equal(tinyMeta.height, 64);
    } else {
      assert.equal(processed.image.tiny, undefined);
    }
  } finally {
    if (processed?.filesToCleanup?.length) {
      await Promise.all(
        processed.filesToCleanup.map((filePath) => fs.rm(filePath, { force: true }))
      );
    } else {
      await fs.rm(originalAbsolutePath, { force: true });
    }
  }
}

test('item upload preserves true original landscape dimensions', async () => {
  await assertLandscapeUploadPreserved({
    mediaSubdirs: ITEM_MEDIA_SUBDIRS,
    processUpload: processItemImageUpload,
    prefix: 'item',
    expectTiny: true,
  });
});

test('box upload preserves true original landscape dimensions', async () => {
  await assertLandscapeUploadPreserved({
    mediaSubdirs: BOX_MEDIA_SUBDIRS,
    processUpload: processBoxImageUpload,
    prefix: 'box',
  });
});
