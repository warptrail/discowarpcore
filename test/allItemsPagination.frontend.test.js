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

test('Random discovery requests carry a stable seed across pages', async () => {
  const { buildRequestParams } = await import(
    '../frontend/src/components/AllItemsList/usePaginatedAllItems.js'
  );
  const params = buildRequestParams({
    searchQuery: '',
    sortBy: 'random',
    sortDirection: 'asc',
    randomSeed: '8675309',
    filter: 'all',
    statusFilter: 'active',
    offset: 60,
    limit: 60,
  });

  assert.equal(params.get('sort'), 'random');
  assert.equal(params.get('seed'), '8675309');
  assert.equal(params.get('offset'), '60');
});

test('Batch Focused requests only source-batched items in recent-batch order', async () => {
  const { buildRequestParams } = await import(
    '../frontend/src/components/AllItemsList/usePaginatedAllItems.js'
  );
  const params = buildRequestParams({
    searchQuery: '',
    sortBy: 'alpha',
    sortDirection: 'desc',
    filter: 'all',
    statusFilter: 'batch',
    offset: 0,
    limit: 60,
  });

  assert.deepEqual(Object.fromEntries(params), {
    view: 'list',
    limit: '60',
    offset: '0',
    status: 'all',
    sort: 'batch',
    direction: 'desc',
    scope: 'batched',
  });
});
