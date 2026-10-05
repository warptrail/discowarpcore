import test from 'node:test';
import assert from 'node:assert/strict';
import { addCapturedOrphanedItem, filterOrphanedItems } from '../frontend/src/util/operationsAdrift.js';

const oldItem = { _id: 'old', name: 'Spare blanket', category: 'camping' };
const captured = { _id: 'new', name: 'USB-C charger', notes: 'Blue travel pouch', tags: ['travel'], category: 'electronics', primaryOwnerName: 'Laserfox' };

test('captured item immediately participates in search and the unfiltered list', () => {
  const items = addCapturedOrphanedItem([oldItem], captured);
  assert.deepEqual(filterOrphanedItems(items, { searchQuery: 'USB-C' }), [captured]);
  assert.deepEqual(filterOrphanedItems(items, { searchQuery: 'blue travel' }), [captured]);
  assert.deepEqual(filterOrphanedItems(items, { searchQuery: '' }), [captured, oldItem]);
  assert.deepEqual(filterOrphanedItems(items, { searchQuery: 'not present' }), []);
});

test('repeated capture notifications cannot duplicate the same item', () => {
  const once = addCapturedOrphanedItem([oldItem], captured);
  assert.deepEqual(addCapturedOrphanedItem(once, captured), once);
  assert.deepEqual(addCapturedOrphanedItem(once, { ...captured, name: 'Updated charger' }).map(x => x.name), ['Updated charger', 'Spare blanket']);
  assert.equal(addCapturedOrphanedItem(once, null), once);
});

test('clearing a search restores all items while other filters remain respected', () => {
  const items = [captured, oldItem];
  assert.deepEqual(filterOrphanedItems(items, { searchQuery: 'CHARGER', ownerFilter: 'laserfox' }), [captured]);
  assert.deepEqual(filterOrphanedItems(items, { searchQuery: '', categoryFilter: 'camping' }), [oldItem]);
  assert.deepEqual(filterOrphanedItems(items, { boxLocatorQuery: '981' }), []);
  assert.deepEqual(filterOrphanedItems(items, { keepPriorityFilter: 'gone' }), []);
  assert.deepEqual(filterOrphanedItems(items, { filterBy: 'empty' }), []);
});
