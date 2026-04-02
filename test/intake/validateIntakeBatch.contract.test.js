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
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test('validateBatchSummary fails on count mismatches', () => {
  const result = validateBatchSummary({
    itemsWithImageKeysCount: 2,
    csvSourceFilesCount: 3,
    originalImageFilesCount: 1,
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 2);
  assert.match(result.errors[0], /does not match items with imageKey/i);
  assert.match(result.errors[1], /does not match raw image-order CSV row count/i);
});
