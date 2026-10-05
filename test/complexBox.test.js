const test = require('node:test');
const assert = require('node:assert/strict');
const Box = require('../backend/models/Box');
const { buildRetrievalBoxes } = require('../backend/services/retrievalService');

test('complex box defaults off and can be toggled both ways', () => {
  const box = new Box({ box_id: '123', label: 'Red tool chest' });
  assert.equal(box.isComplexBox, false);
  box.isComplexBox = true;
  assert.equal(box.toObject().isComplexBox, true);
  box.isComplexBox = false;
  assert.equal(box.toObject().isComplexBox, false);
});

test('retrieval preserves complex status without inheriting it into nested boxes', () => {
  const rows = buildRetrievalBoxes([
    { _id: 'chest', box_id: '123', label: 'Red tool chest', isComplexBox: true, items: [] },
    { _id: 'drawer', box_id: '124', label: 'Top drawer', parentBox: 'chest', items: [] },
  ]);
  assert.equal(rows.find((row) => row.boxId === '123').isComplexBox, true);
  assert.equal(rows.find((row) => row.boxId === '124').isComplexBox, false);
});
