const test = require('node:test');
const assert = require('node:assert/strict');
const model = import('../frontend/src/components/InventoryQuickAnswer/quickAnswerModel.js');

test('quick answers prioritize matching item names and retain owning box and four-tier placement', async () => {
  const { buildQuickAnswers } = await model;
  const result = buildQuickAnswers({ query: 'gizmo', locations: [{ _id: 'loc', room: 'Garage', vicinity: 'Shelf', specifics: 'Ledge', exactSpot: 'Behind blue bin' }], boxes: [
    { _id: 'box', box_id: '007', locationId: 'loc', items: [
      { _id: 'metadata', name: 'Adapter', notes: 'For gizmo' },
      { _id: 'partial', name: 'Spare gizmo' },
      { _id: 'exact', name: 'Gizmo' },
    ] },
  ] });
  assert.deepEqual(result.map(x => x.id), ['exact', 'partial', 'metadata']);
  assert.equal(result[0].boxId, '007');
  assert.deepEqual(result[0].path, ['Garage', 'Shelf', 'Ledge', 'Behind blue bin']);
  assert.equal(result[2].nameMatch, false);
});

test('nested items stay in their actual box while inheriting an unrecorded parent location', async () => {
  const { buildQuickAnswers } = await model;
  const result = buildQuickAnswers({ query: 'key', boxes: [{ box_id: '001', location: 'Office · Desk', childBoxes: [
    { box_id: '002', items: [{ _id: 'key', name: 'Keyring' }], childBoxes: [] },
  ] }] });
  assert.equal(result[0].boxId, '002');
  assert.deepEqual(result[0].path, ['Office', 'Desk']);
});

test('unboxed candidates never acquire a guessed box or location', async () => {
  const { buildQuickAnswers } = await model;
  const results = buildQuickAnswers({ query: 'gizmo', orphanedItems: [
    { _id: '1', name: 'Gizmo', location: 'Kitchen' }, { _id: '2', name: 'Gizmo' },
  ] });
  assert.equal(results[0].unboxed, true);
  assert.equal(results[0].boxId, '');
  assert.deepEqual(results[1].path, []);
});

test('existing nested search matching continues to find notes and respects boxes-only scope', async () => {
  const { getMatchingInventoryItems } = await model;
  const box = { items: [{ _id: '1', name: 'Adapter', notes: 'Spare gizmo' }] };
  assert.equal(getMatchingInventoryItems(box, 'gizmo').length, 1);
  assert.equal(getMatchingInventoryItems(box, 'gizmo', 'boxes').length, 0);
  assert.equal(getMatchingInventoryItems(box, '').length, 0);
});
