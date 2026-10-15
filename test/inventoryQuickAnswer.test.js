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
  assert.deepEqual(result[0].placement.tiers, { room: 'Garage', vicinity: 'Shelf', specifics: 'Ledge', exactSpot: 'Behind blue bin' });
  assert.equal(result[2].nameMatch, false);
});

test('nested items stay in their actual box while inheriting an unrecorded parent location', async () => {
  const { buildQuickAnswers } = await model;
  const result = buildQuickAnswers({ query: 'key', boxes: [{ box_id: '001', location: 'Office · Desk', childBoxes: [
    { box_id: '002', items: [{ _id: 'key', name: 'Keyring' }], childBoxes: [] },
  ] }] });
  assert.equal(result[0].boxId, '002');
  assert.deepEqual(result[0].path, ['Office', 'Desk']);
  assert.equal(result[0].placement.legacyLabel, 'Office · Desk');
  assert.equal(result[0].placement.tiers.room, '');
  assert.deepEqual(result[0].boxTrail.map(({ id }) => id), ['001', '002']);
});

test('finder placement retains missing named tiers and inherited structured location without shifting slots', async () => {
  const { buildQuickAnswers } = await model;
  const [answer] = buildQuickAnswers({ query: 'fish', locations: [{ _id: 'loc', room: 'Office', specifics: 'Cabinet', exactSpot: 'Top left' }],
    boxes: [{ box_id: '001', locationId: 'loc', childBoxes: [{ box_id: '002', items: [{ _id: 'fish', name: 'Fish toy' }] }] }] });
  assert.deepEqual(answer.placement.tiers, { room: 'Office', vicinity: '', specifics: 'Cabinet', exactSpot: 'Top left' });
  assert.equal(answer.placement.legacyLabel, '');
  assert.equal(answer.boxId, '002');
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

test('quick answers retain the actual item image sources, not box photos', async () => {
  const { buildQuickAnswers } = await model;
  const item = { _id: 'photo', name: 'Fish', image: { tiny: { url: '/media/items/fish.webp' } } };
  const [answer] = buildQuickAnswers({ query: 'fish', boxes: [{ box_id: '121', imagePath: '/media/boxes/box.webp', items: [item] }] });
  assert.equal(answer.item, item);
  assert.equal(answer.item.image.tiny.url, '/media/items/fish.webp');
});

test('finder includes items whose owning box or recorded location matches the query', async () => {
  const { buildQuickAnswers } = await model;
  const boxes = [{ box_id: '005', label: 'Fish collection', location: 'Office', items: [{ _id: 'box-match', name: 'Ceramic cup' }] },
    { box_id: '006', locationId: 'room', items: [{ _id: 'location-match', name: 'Toy' }] },
    { box_id: '007', label: 'Unrelated', location: 'Office', items: [{ _id: 'unrelated', name: 'Keys' }] }];
  const answers = buildQuickAnswers({ query: 'fish', boxes, locations: [{ _id: 'room', room: 'Fishing room', vicinity: 'Shelf' }] });
  assert.deepEqual(answers.map(({ id }) => id), ['box-match', 'location-match']);
  assert.equal(answers[0].boxLabel, 'Fish collection');
  assert.deepEqual(answers[1].path, ['Fishing room', 'Shelf']);
  assert.equal(answers[0].box, boxes[0]);
  assert.equal(buildQuickAnswers({ query: '005', boxes })[0].id, 'box-match');
});
