const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildOrphanedFilter,
  buildOrphanedSort,
} = require('../backend/services/itemService');

test('supports reversible orphaned-date and alphabetical sorts', () => {
  assert.deepEqual(buildOrphanedSort('orphaned:desc'), { orphanedAt: -1, _id: -1 });
  assert.deepEqual(buildOrphanedSort('orphaned:asc'), { orphanedAt: 1, _id: 1 });
  assert.deepEqual(buildOrphanedSort('name:asc'), { name: 1, _id: 1 });
  assert.deepEqual(buildOrphanedSort('name:desc'), { name: -1, _id: -1 });
});

test('combines category, location, and text filters without weakening orphan scope', () => {
  const filter = buildOrphanedFilter({
    query: 'moon',
    category: 'hobbies',
    location: 'garage [north]',
  });

  assert.deepEqual(filter.item_status, { $ne: 'gone' });
  assert.deepEqual(filter.orphanedAt, { $ne: null });
  assert.equal(filter.category, 'hobbies');
  assert.equal(filter.location.source, 'garage \\[north\\]');
  assert.equal(filter.location.flags, 'i');
  assert.equal(filter.$or.length, 6);
  assert.equal(filter.$or[0].name.source, 'moon');
});

test('invalid categories safely match no orphaned records', () => {
  const filter = buildOrphanedFilter({ category: 'not-a-real-category' });
  assert.deepEqual(filter.category, { $in: [] });
});
