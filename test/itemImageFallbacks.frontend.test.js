const test = require('node:test');
const assert = require('node:assert/strict');

test('Quick Peek image candidates survive a missing derivative endpoint', async () => {
  const {
    getItemMicroThumbnailCandidates,
    getItemPreviewImageCandidates,
  } = await import('../frontend/src/util/itemImage.js');

  const item = {
    image: {
      original: {
        storagePath: 'items/original/original-only.jpg',
      },
    },
  };

  assert.deepEqual(getItemPreviewImageCandidates(item), [
    '/api/media/image-derivative?variant=display&source=%2Fmedia%2Fitems%2Foriginal%2Foriginal-only.jpg',
    '/media/items/original/original-only.jpg',
  ]);
  assert.deepEqual(getItemMicroThumbnailCandidates(item), [
    '/api/media/image-derivative?variant=thumb&source=%2Fmedia%2Fitems%2Foriginal%2Foriginal-only.jpg',
    '/media/items/original/original-only.jpg',
  ]);
});

test('Quick Peek tries stale saved variants before generated and original fallbacks', async () => {
  const { getItemPreviewImageCandidates } = await import(
    '../frontend/src/util/itemImage.js'
  );

  const item = {
    image: {
      display: { url: '/media/items/display/stale.webp' },
      thumb: { url: '/media/items/thumb/stale.webp' },
      original: { url: '/media/items/original/source.jpg' },
    },
  };

  assert.deepEqual(getItemPreviewImageCandidates(item), [
    '/media/items/display/stale.webp',
    '/api/media/image-derivative?variant=display&source=%2Fmedia%2Fitems%2Foriginal%2Fsource.jpg',
    '/media/items/thumb/stale.webp',
    '/media/items/original/source.jpg',
  ]);
});
