const test = require('node:test');
const assert = require('node:assert/strict');
const { sortRetrievalItems, sortRetrievalBoxes } = require('../backend/services/retrievalService');
const { seededRetrievalShuffle } = require('../backend/utils/seededRetrievalShuffle');

const records = Array.from({ length: 140 }, (_, index) => ({
  id: `fixture-${index}`, name: `Item ${String(index).padStart(3, '0')}`,
  boxId: String(index).padStart(3, '0'), boxNumber: String(index).padStart(3, '0'),
}));
const ids = (rows) => rows.map((row) => row.id);

test('seeded shuffle spans the full inventory, stays stable across pages, and never duplicates', () => {
  const first = seededRetrievalShuffle(records, 'visit-a');
  assert.notDeepEqual(ids(first), ids(records));
  assert.deepEqual(ids(first), ids(seededRetrievalShuffle([...records].reverse(), 'visit-a')));
  assert.notDeepEqual(ids(first), ids(seededRetrievalShuffle(records, 'visit-b')));
  const pages = [0, 25, 50, 75, 100, 125].flatMap((offset) => seededRetrievalShuffle(records, 'visit-a').slice(offset, offset + 25));
  assert.deepEqual(ids(pages), ids(first));
  assert.equal(new Set(ids(pages)).size, 140);
  assert.deepEqual([...ids(pages)].sort(), [...ids(records)].sort());
  assert.ok(first.slice(0, 25).some((row) => Number(row.boxId) >= 100), 'Not just a shuffle of the first loaded page');
  assert.equal(records[0].id, 'fixture-0', 'Does not mutate source data');
});

test('both Retrieval sorters support seeded random order and retain ordinary ascending defaults', () => {
  for (const sorter of [sortRetrievalItems, sortRetrievalBoxes]) {
    assert.deepEqual(ids(sorter(records, 'random', 'a')), ids(seededRetrievalShuffle(records, 'a')));
    assert.notDeepEqual(ids(sorter(records, 'random', 'a')), ids(sorter(records, 'random', 'b')));
  }
  assert.deepEqual(ids(sortRetrievalItems([...records].reverse(), 'name')), ids(records));
  assert.deepEqual(ids(sortRetrievalBoxes([...records].reverse(), 'box')), ids(records));
});

test('shuffle seeds are bounded and empty result sets are safe', () => {
  assert.deepEqual(seededRetrievalShuffle([], 'a'), []);
  const seed = 'x'.repeat(96);
  assert.deepEqual(ids(seededRetrievalShuffle(records, seed)), ids(seededRetrievalShuffle(records, `${seed}ignored`)));
});
