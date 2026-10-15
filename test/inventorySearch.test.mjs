import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesInventoryQuery, getMatchingInventoryItems, countMatchingInventoryBoxes } from '../frontend/src/util/inventorySearch.js';
import { filterOrphanedItems } from '../frontend/src/util/operationsAdrift.js';
import { buildQuickAnswers } from '../frontend/src/components/InventoryQuickAnswer/quickAnswerModel.js';

test('universal Operations search covers box identity, placement and hidden metadata', () => {
  for (const field of ['box_id', 'label', 'name', 'location', 'description', 'notes', 'tags']) {
    const box = { _id: 'box', [field]: field === 'tags' ? ['Needle'] : 'Needle', items: [] };
    assert.equal(matchesInventoryQuery(box, ' needle '), true, field);
    assert.equal(matchesInventoryQuery(box, 'needle', 'boxes'), true, field);
    assert.equal(matchesInventoryQuery(box, 'needle', 'items'), false, field);
  }
  for (const tier of ['room', 'vicinity', 'specifics', 'exactSpot']) {
    assert.equal(matchesInventoryQuery({ locationId: { [tier]: 'Needle' } }, 'needle'), true, tier);
  }
});

test('boxed and unboxed item field coverage agrees with the finder and result list', () => {
  for (const field of ['name', 'label', 'description', 'notes', 'category', 'location', 'primaryOwnerName', 'keepPriority', 'tags']) {
    const item = { _id: 'item', name: 'Unrelated name', [field]: field === 'tags' ? ['Needle'] : 'Needle' };
    const box = { box_id: '007', items: [item] };
    assert.equal(matchesInventoryQuery(box, 'needle'), true, field);
    assert.equal(matchesInventoryQuery(box, 'needle', 'items'), true, field);
    assert.equal(matchesInventoryQuery(box, 'needle', 'boxes'), false, field);
    assert.deepEqual(getMatchingInventoryItems(box, 'needle'), [item], field);
    assert.deepEqual(filterOrphanedItems([item], { searchQuery: 'needle' }), [item], field);
    assert.equal(buildQuickAnswers({ boxes: [box], query: 'needle' })[0].item, item, field);
  }
});

test('matching box count includes empty direct matches and nested owners, not contextual parents or duplicates', () => {
  const child = { _id: 'child', box_id: '002', items: [{ _id: 'fish', name: 'Fish' }] };
  const boxes = [
    { _id: 'parent', box_id: '001', label: 'Plain parent', items: [], childBoxes: [child] },
    { _id: 'empty', box_id: '003', notes: 'Fish supplies', items: [] },
    child,
    { _id: 'other', box_id: '004', items: [{ _id: 'keys', name: 'Keys' }] },
  ];
  const matches = (box) => matchesInventoryQuery(box, 'fish');
  assert.equal(countMatchingInventoryBoxes(boxes, matches), 2);
  assert.equal(countMatchingInventoryBoxes(boxes, (box) => matchesInventoryQuery(box, 'fish', 'boxes')), 1);
  assert.equal(countMatchingInventoryBoxes(boxes, (box) => matchesInventoryQuery(box, 'fish', 'items')), 1);
  assert.equal(countMatchingInventoryBoxes(boxes, (box) => matches(box) && box.box_id === '002'), 1, 'additional controls use the same predicate');
  assert.equal(countMatchingInventoryBoxes(boxes, (box) => matchesInventoryQuery(box, 'missing')), 0);
  assert.equal(countMatchingInventoryBoxes([], matches), 0);
});

test('search retains literal phrase matching and ignores opaque database and media attributes', () => {
  const box = { _id: 'needle', imagePath: '/needle.webp', items: [{ _id: 'item-needle', name: 'Plain name', image: { originalName: 'needle.jpg' } }] };
  assert.equal(matchesInventoryQuery(box, 'needle'), false);
  assert.equal(matchesInventoryQuery({ items: [{ description: 'Blue fish toy' }] }, 'BLUE FISH'), true);
  assert.equal(matchesInventoryQuery({ items: [{ description: 'Blue toy fish' }] }, 'blue fish'), false);
  assert.equal(matchesInventoryQuery({ items: null }, 'needle'), false);
  assert.deepEqual(getMatchingInventoryItems(box, ''), []);
});
