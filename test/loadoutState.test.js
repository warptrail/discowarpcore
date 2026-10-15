const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeLoadout, inventoryContexts } = require('../backend/services/loadoutService');

const entryId = '111111111111111111111111';
const itemId = '222222222222222222222222';
const entry = extra => ({ id: entryId, label: 'Headlamp', itemId, gathered: false, returned: false, ...extra });
const body = entries => ({ name: '  A weekend outside  ', occasion: 'camping', notes: '', entries });

test('round trips stable entry and linked inventory IDs without copying context into storage', () => {
  const result = normalizeLoadout(body([entry({ item: { name: 'Stale name', boxNumber: '999' } })]));
  assert.equal(result.name, 'A weekend outside');
  assert.deepEqual(result.entries[0], { _id: entryId, label: 'Headlamp', itemId, gathered: false, returned: false });
});

test('cannot put away an entry that was not gathered', () => {
  assert.throws(() => normalizeLoadout(body([entry({ returned: true })])), /Gather an entry/);
});

test('duplicate inventory links and duplicate entry IDs are rejected within one loadout', () => {
  assert.throws(() => normalizeLoadout(body([entry(), entry({ id: '333333333333333333333333' })])), /only once/);
  assert.throws(() => normalizeLoadout(body([entry(), entry({ itemId: null })])), /unique/);
});

test('unlinked reminders are saved with independent checklist values', () => {
  const result = normalizeLoadout(body([entry({ itemId: null, gathered: true, returned: true })]));
  assert.equal(result.entries[0].itemId, null);
  assert.equal(result.entries[0].returned, true);
});

test('invalid booleans, IDs, oversized lists and empty names are rejected', () => {
  assert.throws(() => normalizeLoadout(null), /valid loadout/);
  assert.throws(() => normalizeLoadout([]), /valid loadout/);
  assert.throws(() => normalizeLoadout(body([entry({ gathered: 'false' })])), /true or false/);
  assert.throws(() => normalizeLoadout(body([entry({ itemId: 'bad-id' })])), /only once/);
  assert.throws(() => normalizeLoadout(body(Array(201).fill(entry()))), /200 entries/);
  assert.throws(() => normalizeLoadout({ ...body([]), name: ' ' }), /name/);
});

test('archiving preserves linked entries and independent outing checks', () => {
  const result = normalizeLoadout({ ...body([entry({ gathered: true })]), archived: true });
  assert.equal(result.archived, true);
  assert.equal(result.entries[0].itemId, itemId);
  assert.equal(result.entries[0].gathered, true);
  assert.equal(result.entries[0].returned, false);
});

test('resolves current compartment and inherited four-tier location without mutating inventory', () => {
  const items = [{ _id: itemId, name: 'Trail light' }];
  const boxes = [
    { _id: 'parent', box_id: '405', label: 'Camp trunk', locationId: { room: 'Garage', vicinity: 'Shelf', specifics: 'Top', exactSpot: 'Left' } },
    { _id: 'child', box_id: '007', label: 'Light pouch', parentBox: 'parent', items: [itemId], isComplexBox: true, compartments: [{ key: 'A' }, { key: 'B' }], itemCompartments: { [itemId]: 'B' } },
  ];
  const before = JSON.stringify({ items, boxes });
  const context = inventoryContexts(items, boxes).get(itemId);
  assert.equal(context.boxNumber, '007');
  assert.equal(context.placementLabel, '007B');
  assert.equal(context.locationLabel, 'Garage · Shelf · Top · Left');
  assert.equal(JSON.stringify({ items, boxes }), before);
});

test('departed items retain their identity but become unavailable with no active home box', () => {
  const context = inventoryContexts([{ _id: itemId, name: 'Old light', item_status: 'gone' }], [{ _id: 'box', box_id: '007', items: [itemId] }]).get(itemId);
  assert.equal(context.unavailable, true);
  assert.equal(context.boxNumber, '');
});

test('cyclic legacy box ancestry terminates without an invented location', () => {
  const context = inventoryContexts([{ _id: itemId, name: 'Light' }], [
    { _id: 'one', parentBox: 'two', items: [itemId] }, { _id: 'two', parentBox: 'one' },
  ]).get(itemId);
  assert.equal(context.locationLabel, '');
});
