const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const {
  getOrCreateImageDerivative,
  normalizeSourceStoragePath,
  resolveDerivativePaths,
} = require('../backend/services/onDemandImageDerivativeService');
const { getImageDerivativeApi } = require('../backend/controllers/mediaController');
const { MEDIA_ROOT } = require('../backend/config/media');

test('normalizes supported entity media URLs and rejects unsafe sources', () => {
  assert.equal(
    normalizeSourceStoragePath('/media/items/original/example.png?v=1'),
    'items/original/example.png',
  );
  assert.equal(
    normalizeSourceStoragePath('http://localhost:5002/media/items/display/example.webp'),
    'items/display/example.webp',
  );
  assert.equal(
    normalizeSourceStoragePath('/media/boxes/original/example.png'),
    'boxes/original/example.png',
  );
  assert.equal(normalizeSourceStoragePath('/media/items/original/../secret.png'), '');
});

test('maps item and box variants to canonical WebP derivative paths', () => {
  const thumb = resolveDerivativePaths({
    source: '/media/items/original/example.png',
    variant: 'thumb',
  });
  const display = resolveDerivativePaths({
    source: '/media/items/original/example.jpg',
    variant: 'display',
  });
  const boxThumb = resolveDerivativePaths({
    source: '/media/boxes/original/box-photo.jpg',
    variant: 'thumb',
  });

  assert.equal(thumb.targetStoragePath, 'items/thumb/example.webp');
  assert.equal(display.targetStoragePath, 'items/display/example.webp');
  assert.equal(boxThumb.targetStoragePath, 'boxes/thumb/box-photo.webp');
  assert.equal(resolveDerivativePaths({ source: '/etc/passwd', variant: 'thumb' }), null);
  assert.equal(resolveDerivativePaths({ source: '/media/items/original/example.png', variant: 'tiny' }), null);
});

test('generates, reuses, refreshes, and deduplicates on-demand derivatives', async (t) => {
  const stem = `on-demand-test-${process.pid}-${Date.now()}`;
  const sourceStoragePath = `items/original/${stem}.png`;
  const sourceAbsolutePath = path.join(MEDIA_ROOT, sourceStoragePath);
  const thumbAbsolutePath = path.join(MEDIA_ROOT, `items/thumb/${stem}.webp`);
  t.after(async () => {
    await Promise.allSettled([
      fs.unlink(sourceAbsolutePath),
      fs.unlink(thumbAbsolutePath),
    ]);
  });

  await fs.mkdir(path.dirname(sourceAbsolutePath), { recursive: true });
  await sharp({
    create: {
      width: 64,
      height: 48,
      channels: 4,
      background: { r: 40, g: 160, b: 210, alpha: 1 },
    },
  }).png().toFile(sourceAbsolutePath);

  const [first, duplicate] = await Promise.all([
    getOrCreateImageDerivative({ source: `/media/${sourceStoragePath}`, variant: 'thumb' }),
    getOrCreateImageDerivative({ source: `/media/${sourceStoragePath}`, variant: 'thumb' }),
  ]);
  assert.equal(first.targetAbsolutePath, duplicate.targetAbsolutePath);
  assert.equal((await fs.stat(thumbAbsolutePath)).size > 0, true);

  const reused = await getOrCreateImageDerivative({
    source: `/media/${sourceStoragePath}`,
    variant: 'thumb',
  });
  assert.equal(reused.generated, false);

  const future = new Date(Date.now() + 1500);
  await fs.utimes(sourceAbsolutePath, future, future);
  const refreshed = await getOrCreateImageDerivative({
    source: `/media/${sourceStoragePath}`,
    variant: 'thumb',
  });
  assert.equal(refreshed.generated, true);

  const headers = {};
  const response = {
    setHeader(name, value) { headers[String(name).toLowerCase()] = value; },
    type(value) { headers['content-type'] = value; return this; },
    sendFile(filePath) { this.filePath = filePath; return filePath; },
  };
  await getImageDerivativeApi({
    query: { source: `/media/${sourceStoragePath}`, variant: 'thumb' },
  }, response);
  assert.equal(headers['cache-control'], 'public, max-age=31536000, immutable');
  assert.equal(response.filePath, thumbAbsolutePath);
});

test('derivative endpoint returns bounded missing-source errors', async () => {
  const missingRequest = {
    query: { source: '/media/items/original/does-not-exist.png', variant: 'thumb' },
  };
  const missingResponse = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return body;
    },
  };
  await getImageDerivativeApi(missingRequest, missingResponse);
  assert.equal(missingResponse.statusCode, 404);
  assert.equal(missingResponse.body.error, 'Source image not found');
});
