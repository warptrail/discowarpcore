import test from 'node:test';
import assert from 'node:assert/strict';
import { compareFamilyViews } from '../frontend/src/util/boxAddressViews.js';

test('Box ID direction reverses sections while retaining the owning box first', () => {
  const rows = [
    { kind: 'cabinet', address: '504A' },
    { kind: 'box', address: '504' },
    { kind: 'cabinet', address: '504Z' },
    { kind: 'cabinet', address: '504B' },
  ];
  const ordered = (sort, direction) => [...rows].sort((a,b) => compareFamilyViews(a,b,sort,direction)).map(row => row.address);
  assert.deepEqual(ordered('boxId','asc'), ['504','504A','504B','504Z']);
  assert.deepEqual(ordered('boxId','desc'), ['504','504Z','504B','504A']);
  assert.deepEqual(ordered('name','desc'), ['504','504A','504B','504Z']);
});
