import test from 'node:test';
import assert from 'node:assert/strict';
import { readShelfSelection, toggleShelfSelection, scopeBoxToShelves, countShelfItems } from '../frontend/src/util/shelfSelection.js';
import { collectPlacedItems } from '../frontend/src/util/boxAddressViews.js';

const shelves = [1, 2, 3, 10, 99].map(number => ({ key: `B${number}` }));
const crystal = { _id: 'crystal', name: 'Crystal', quantity: 12 };
const jar = { _id: 'jar', box_id: '602', items: [crystal], childBoxes: [] };
const jewelry = { _id: 'jewelry', box_id: '601', parentCompartmentKey: 'B2', items: [], childBoxes: [jar] };
const owner = { _id: 'owner', box_id: '004', isComplexBox: true,
  compartments: [{ key: 'A' }, { key: 'B', children: shelves }],
  items: [{ _id: 'mug', name: 'Mug' }, { _id: 'bowl', name: 'Bowl' }, { _id: 'plate', name: 'Plate' }],
  itemCompartments: { mug: 'B1', bowl: 'B2', plate: 'A' }, childBoxes: [jewelry] };

test('multiple shelf addresses normalize, deduplicate and sort without changing the address grammar', () => {
  assert.deepEqual(readShelfSelection('B99,B2,A1,B2,B100,B10', 'B', shelves), ['B2', 'B10', 'B99']);
  assert.deepEqual(readShelfSelection(null, 'B', shelves, 'B2'), ['B2']);
  assert.deepEqual(readShelfSelection(null, 'B', shelves, 'B'), []);
  assert.deepEqual(toggleShelfSelection(['B2'], 'B10'), ['B2', 'B10']);
  assert.deepEqual(toggleShelfSelection(['B2'], 'B2'), []);
});

test('shelf counts use item records, include physical descendants once, and show empty shelves', () => {
  assert.deepEqual(countShelfItems(owner, 'B', shelves), { B: 3, B1: 1, B2: 2, B3: 0, B10: 0, B99: 0 });
  assert.equal(countShelfItems(null, 'B', shelves), null);
});

test('combined selection preserves ownership, excludes other shelves, and leaves inventory intact', () => {
  const scoped = scopeBoxToShelves(owner, 'B', ['B1', 'B2']);
  const items = collectPlacedItems(scoped);
  assert.deepEqual(items.map(item => item._id), ['mug', 'bowl', 'crystal']);
  assert.equal(items.find(item => item._id === 'crystal').ownerBoxId, '602');
  assert.equal(scoped.childBoxes[0], jewelry);
  assert.equal(owner.items.length, 3);
  assert.deepEqual(collectPlacedItems(scopeBoxToShelves(owner, 'B', ['B3'])), []);
  assert.equal(collectPlacedItems(scopeBoxToShelves(owner, 'B')).length, 3);
});
