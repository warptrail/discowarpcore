const test = require('node:test');
const assert = require('node:assert/strict');

test('tag nebula ranking implementation covers prefix, substring, and fuzzy subsequence matching', async () => {
  const { rankTagOptions } = await import('../frontend/src/components/Retrieval/tagNebulaModel.js');
  const options = [
    { key: 'bath towel', label: 'Bath Towel' },
    { key: 'beach towel', label: 'Beach Towel' },
    { key: 'birthday', label: 'Birthday' },
    { key: 'black', label: 'Black' },
  ];

  assert.deepEqual(
    rankTagOptions(options, 'bath').map((option) => option.key),
    ['bath towel'],
  );
  assert.deepEqual(
    rankTagOptions(options, 'btwl').map((option) => option.key),
    ['bath towel', 'beach towel'],
  );
  assert.deepEqual(
    rankTagOptions(options, 'b', ['bath towel']).map((option) => option.key),
    ['black', 'birthday', 'beach towel'],
  );
});
