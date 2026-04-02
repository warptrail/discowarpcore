const test = require('node:test');
const assert = require('node:assert/strict');

const { assignMissingImageKeys } = require('../../scripts/assign_imagekeys_to_json');

test('assignMissingImageKeys fills missing keys from item names', () => {
  const result = assignMissingImageKeys({
    items: [
      { name: 'Coffee Beans' },
      { name: 'Wooden Mug' },
    ],
  });

  assert.equal(result.assignedCount, 2);
  assert.deepEqual(
    result.payload.items.map((item) => item.imageKey),
    ['coffee-beans', 'wooden-mug']
  );
});

test('assignMissingImageKeys keeps existing keys and dedupes new ones', () => {
  const result = assignMissingImageKeys({
    items: [
      { name: 'Coffee Beans', imageKey: 'coffee-beans' },
      { name: 'Coffee Beans' },
      { name: 'Coffee Beans' },
    ],
  });

  assert.equal(result.assignedCount, 2);
  assert.deepEqual(
    result.payload.items.map((item) => item.imageKey),
    ['coffee-beans', 'coffee-beans-2', 'coffee-beans-3']
  );
});
