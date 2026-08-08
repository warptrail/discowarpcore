const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildItemListFilter,
  buildPagedSort,
  compareMemorySortedItems,
  toItemListSummary,
} = require('../backend/services/itemService');

test('item list filters preserve status, scope, batch, and broad search coverage', () => {
  const boxedId = '69c333e4a84ea0ac47e752cb';
  const batchId = '69c333e4a84ea0ac47e752cc';
  const filter = buildItemListFilter({
    statusScope: 'active',
    query: 'garage',
    scope: 'boxed',
    sourceBatchId: batchId,
    boxedItemIds: [boxedId],
    searchBoxItemIds: [boxedId],
    searchBatchIds: [batchId],
  });

  assert.deepEqual(filter._id, { $in: [boxedId] });
  assert.equal(filter.sourceBatchId, batchId);
  assert.ok(filter.$or.some((entry) => entry.description instanceof RegExp));
  assert.ok(filter.$or.some((entry) => entry.notes instanceof RegExp));
  assert.ok(filter.$or.some((entry) => entry._id?.$in?.includes(boxedId)));
  assert.ok(filter.$or.some((entry) => entry.sourceBatchId?.$in?.includes(batchId)));
  assert.ok(filter.$and.some((entry) => entry.item_status?.$ne === 'gone'));
});

test('invalid batch ids safely produce an empty batch match', () => {
  const filter = buildItemListFilter({ sourceBatchId: 'not-an-object-id' });
  assert.deepEqual(filter.sourceBatchId, { $in: [] });
});

test('paged sorts use stable id tie breakers and retain legacy aliases', () => {
  assert.deepEqual(buildPagedSort('alpha', 'asc'), {
    mode: 'find',
    sort: { name: 1, _id: 1 },
  });
  assert.deepEqual(buildPagedSort('purchasePrice', 'desc'), {
    mode: 'find',
    sort: { purchasePriceCents: -1, _id: -1 },
  });
  assert.deepEqual(buildPagedSort('updated:desc'), {
    mode: 'find',
    sort: { updatedAt: -1, _id: -1 },
  });
});

test('memory sorts are deterministic across page boundaries', () => {
  const plan = buildPagedSort('keepPriority', 'asc');
  const context = { boxByItemId: new Map(), batchById: new Map() };
  const items = [
    { _id: '3', name: 'Same', keepPriority: 'low' },
    { _id: '2', name: 'Same', keepPriority: 'essential' },
    { _id: '1', name: 'Same', keepPriority: 'essential' },
  ];
  items.sort((left, right) => compareMemorySortedItems(left, right, plan, context));
  assert.deepEqual(items.map((item) => item._id), ['1', '2', '3']);
});

test('list summaries omit heavyweight history arrays', () => {
  const summary = toItemListSummary({
    _id: 'item-1',
    name: 'Item',
    usageHistory: [new Date()],
    checkHistory: [new Date()],
    maintenanceHistory: [new Date()],
  });
  assert.equal(summary.name, 'Item');
  assert.equal('usageHistory' in summary, false);
  assert.equal('checkHistory' in summary, false);
  assert.equal('maintenanceHistory' in summary, false);
});
