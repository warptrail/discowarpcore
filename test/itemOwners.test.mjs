import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEM_OWNERS, matchesPrimaryOwner } from '../frontend/src/util/itemOwners.js';
import { filterOrphanedItems } from '../frontend/src/util/operationsAdrift.js';

test('owner controls use only the two canonical household identities', () => {
  assert.deepEqual(ITEM_OWNERS.map((owner) => owner.id), ['discofish', 'laserfox']);
});

test('canonical owner filters match existing names and legacy aliases', () => {
  for (const value of ['Discofish', 'discofish', ' Alyssa ']) assert.equal(matchesPrimaryOwner(value, 'discofish'), true);
  for (const value of ['Laserfox', 'laserfox', ' Ryan ']) assert.equal(matchesPrimaryOwner(value, 'laserfox'), true);
  assert.equal(matchesPrimaryOwner('Discofish', 'laserfox'), false);
  assert.equal(matchesPrimaryOwner(null, 'laserfox'), false);
  assert.equal(matchesPrimaryOwner(null, 'all'), true);
});

test('owner filtering includes legacy unboxed items and All restores every item', () => {
  const items = [{ _id: 'fish', primaryOwnerName: 'Alyssa' }, { _id: 'fox', primaryOwnerName: 'Ryan' }, { _id: 'shared' }];
  assert.deepEqual(filterOrphanedItems(items, { ownerFilter: 'discofish' }).map((item) => item._id), ['fish']);
  assert.deepEqual(filterOrphanedItems(items, { ownerFilter: 'laserfox' }).map((item) => item._id), ['fox']);
  assert.deepEqual(filterOrphanedItems(items, { ownerFilter: 'all' }), items);
});
