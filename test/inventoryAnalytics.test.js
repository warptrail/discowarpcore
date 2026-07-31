const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateBoxCollectionStats,
} = require('../backend/utils/inventoryAnalytics');

test('calculates filtered box metrics without double-counting shared item references', () => {
  const result = calculateBoxCollectionStats({
    boxes: [
      {
        _id: 'box-a',
        location: 'Garage',
        group: 'Tools',
        notes: 'Top shelf',
        items: ['item-a', 'item-b'],
      },
      {
        _id: 'box-b',
        location: 'garage',
        group: 'Tools',
        items: ['item-b', 'item-c'],
      },
      {
        _id: 'box-c',
        location: 'Office',
        group: 'Paper',
        items: ['item-d'],
      },
    ],
    items: [
      { _id: 'item-a', quantity: 2, valueCents: 1250, notes: 'Keep dry' },
      { _id: 'item-b', quantity: 1, valueCents: 500 },
      { _id: 'item-c', quantity: 3, valueCents: 0, maintenanceNotes: 'Inspect' },
      { _id: 'item-d', quantity: 1, valueCents: 900 },
    ],
    includedBoxIds: ['box-a', 'box-b'],
  });

  assert.deepEqual(result, {
    scope: 'filtered_boxes',
    currency: 'USD',
    metrics: {
      boxCount: 2,
      locationCount: 1,
      groupCount: 1,
      boxNoteCount: 1,
      itemRecordCount: 3,
      itemQuantity: 6,
      itemNoteCount: 2,
      valuedItemRecordCount: 2,
      totalValueCents: 3000,
    },
  });
});

test('returns stable zero metrics for an empty scope', () => {
  const result = calculateBoxCollectionStats({
    boxes: [{ _id: 'box-a', items: ['item-a'] }],
    items: [{ _id: 'item-a', quantity: 1, valueCents: 100 }],
    includedBoxIds: [],
  });

  assert.equal(result.metrics.boxCount, 0);
  assert.equal(result.metrics.itemRecordCount, 0);
  assert.equal(result.metrics.totalValueCents, 0);
});
