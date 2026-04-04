const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateBatchSummary,
} = require('../../scripts/validate_intake_batch');

test('validateBatchSummary passes when counts line up', () => {
  const result = validateBatchSummary({
    itemsWithImageKeysCount: 2,
    csvSourceFilesCount: 2,
    originalImageFilesCount: 2,
    imagesIncluded: true,
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
});

test('validateBatchSummary fails on count mismatches', () => {
  const result = validateBatchSummary({
    itemsWithImageKeysCount: 2,
    csvSourceFilesCount: 3,
    originalImageFilesCount: 1,
    imagesIncluded: true,
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /does not match items with imageKey/i);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /differs from raw image-order CSV row count/i);
});

test('validateBatchSummary allows missing images and records a warning', () => {
  const result = validateBatchSummary({
    itemsWithImageKeysCount: 2,
    csvSourceFilesCount: 2,
    originalImageFilesCount: 0,
    imagesIncluded: false,
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /No source images included/i);
});
