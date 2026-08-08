const test = require('node:test');
const assert = require('node:assert/strict');

test('All Items request parameters preserve server pagination and filtering state', async () => {
  const { buildRequestParams } = await import(
    '../frontend/src/components/AllItemsList/usePaginatedAllItems.js'
  );
  const params = buildRequestParams({
    searchQuery: '  concord shelf  ',
    sortBy: 'owner',
    sortDirection: 'desc',
    filter: 'category:Tools',
    statusFilter: 'active',
    offset: 60,
    limit: 60,
  });

  assert.deepEqual(Object.fromEntries(params), {
    view: 'list',
    limit: '60',
    offset: '60',
    status: 'active',
    sort: 'owner',
    direction: 'desc',
    q: 'concord shelf',
    category: 'Tools',
  });
});

test('All Items appended pages deduplicate records by item ID', async () => {
  const { mergeUniqueItems } = await import(
    '../frontend/src/components/AllItemsList/usePaginatedAllItems.js'
  );
  const merged = mergeUniqueItems(
    [{ _id: 'one', name: 'old' }, { _id: 'two' }],
    [{ _id: 'one', name: 'new' }, { _id: 'three' }],
  );

  assert.deepEqual(merged.map((item) => item._id), ['one', 'two', 'three']);
  assert.equal(merged[0].name, 'new');
});
