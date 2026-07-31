const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const {
  MEDIA_ROOT,
  ITEM_MEDIA_SUBDIRS,
  BOX_MEDIA_SUBDIRS,
  toAbsoluteMediaPath,
} = require('../../backend/config/media');
const {
  getItemTinyPaths,
  generateItemTinyDerivative,
} = require('../../backend/services/itemTinyImageService');

test('item tiny derivative is an exact smart-cropped 64px WebP', async (t) => {
  const stem = `tiny-contract-${process.pid}-${Date.now()}`;
  const sourcePath = toAbsoluteMediaPath(`${ITEM_MEDIA_SUBDIRS.original}/${stem}.png`);
  const expectedTinyPath = toAbsoluteMediaPath(`${ITEM_MEDIA_SUBDIRS.tiny}/${stem}.webp`);

  t.after(async () => {
    await Promise.allSettled([
      fs.unlink(sourcePath),
      fs.unlink(expectedTinyPath),
    ]);
  });

  await fs.mkdir(path.dirname(sourcePath), { recursive: true });
  await sharp({
    create: {
      width: 180,
      height: 90,
      channels: 4,
      background: { r: 24, g: 190, b: 150, alpha: 1 },
    },
  }).png().toFile(sourcePath);

  const result = await generateItemTinyDerivative({ sourcePath });
  const metadata = await sharp(result.absolutePath).metadata();

  assert.equal(result.storagePath, `${ITEM_MEDIA_SUBDIRS.tiny}/${stem}.webp`);
  assert.equal(result.mimeType, 'image/webp');
  assert.equal(metadata.format, 'webp');
  assert.equal(metadata.width, 64);
  assert.equal(metadata.height, 64);
  assert.ok(result.sizeBytes > 0);
});

test('item tiny path resolver does not create derivatives for box media', () => {
  const boxPath = toAbsoluteMediaPath(`${BOX_MEDIA_SUBDIRS.original}/box-source.jpg`);
  assert.equal(getItemTinyPaths(boxPath), null);
  assert.ok(path.resolve(boxPath).startsWith(path.resolve(MEDIA_ROOT)));
});
