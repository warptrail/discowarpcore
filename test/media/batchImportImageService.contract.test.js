const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildImportImageLookup,
  resolveImportImageMatch,
} = require('../../backend/services/batchImportImageService');
const mediaProcessingService = require('../../backend/services/mediaProcessingService');

test('buildImportImageLookup groups import images by exact basename', () => {
  const lookup = buildImportImageLookup([
    { originalname: 'import-images/hammer.jpg', path: '/tmp/hammer-a.jpg' },
    { originalname: 'import-images/wrench.png', path: '/tmp/wrench.png' },
    { originalname: 'import-images/hammer.png', path: '/tmp/hammer-b.png' },
  ]);

  assert.equal((lookup.get('hammer') || []).length, 2);
  assert.equal((lookup.get('wrench') || []).length, 1);
});

test('resolveImportImageMatch reports missing and ambiguous matches clearly', () => {
  const lookup = buildImportImageLookup([
    { originalname: 'hammer.jpg', path: '/tmp/hammer-a.jpg' },
    { originalname: 'hammer.png', path: '/tmp/hammer-b.png' },
  ]);

  const missing = resolveImportImageMatch('wrench', lookup);
  assert.equal(missing.status, 'missing');

  const ambiguous = resolveImportImageMatch('hammer', lookup);
  assert.equal(ambiguous.status, 'ambiguous');
  assert.equal(ambiguous.matches.length, 2);
});

test('media processing service exports media-state upsert used by batch image imports', () => {
  assert.equal(
    typeof mediaProcessingService.upsertMediaStateByOriginalPath,
    'function'
  );
});
