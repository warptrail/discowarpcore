import test from 'node:test';
import assert from 'node:assert/strict';
import { initialBrowseSort, sortAfterFilterChange, sortAfterFieldClick } from '../frontend/src/components/Retrieval/retrievalBrowseSort.js';

test('fresh unfiltered arrival is random, even when an older view had another sort', () => {
  assert.equal(initialBrowseSort({ q: '', tags: [] }, 'name'), 'random');
  assert.equal(initialBrowseSort({ q: '', boxIdPrefix: '', rooms: [] }, 'box'), 'random');
});
test('every search or facet activates the correct ascending default, including restored scopes', () => {
  for (const defaultSort of ['name', 'box']) {
    for (const filters of [{ q: 'fixture' }, { boxIdPrefix: '1' }, ...['categories', 'tags', 'locations', 'rooms', 'owners', 'keepPriorities'].map((key) => ({ [key]: ['fixture'] }))]) {
      assert.equal(initialBrowseSort(filters, defaultSort), defaultSort);
      assert.equal(sortAfterFilterChange('random', filters, defaultSort), defaultSort);
      assert.equal(sortAfterFilterChange('location_desc', filters, defaultSort), defaultSort);
    }
  }
});
test('clearing filters leaves the current ordering intact until an explicit reshuffle', () => {
  assert.equal(sortAfterFilterChange('name', {}, 'name'), 'name');
  assert.equal(sortAfterFilterChange('box', {}, 'box'), 'box');
});

test('clicking a selected ascending or descending field returns to no-sort random order', () => {
  for (const field of ['location', 'name', 'box', 'tag', 'category']) {
    assert.equal(sortAfterFieldClick(field, field), 'random');
    assert.equal(sortAfterFieldClick(`${field}_desc`, field), 'random');
    assert.equal(sortAfterFieldClick('random', field), field);
  }
  assert.equal(sortAfterFieldClick('name_desc', 'box'), 'box_desc');
});
