const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const frontend = path.resolve(__dirname, '../frontend');
const frontendRequire = createRequire(path.join(frontend, 'package.json'));

async function bundle(file, shallow = false) {
  return (await frontendRequire('esbuild').build({
    entryPoints: [path.join(frontend, 'src', file)], bundle: true, packages: 'external', write: false,
    format: 'cjs', platform: 'node', define: { 'import.meta.env': '{}' }, logLevel: 'silent',
    plugins: shallow ? [{ name: 'shallow', setup(build) { build.onResolve({ filter: /^\./ }, (args) => args.importer ? { path: args.path, external: true } : null); } }] : [],
  })).outputFiles[0].text;
}
test('single, bulk and Undo nominations capture the currently selected profile rather than item owner', async () => {
  let current = 'laserfox'; const calls = [];
  const module = { exports: {} };
  vm.runInNewContext(await bundle('hooks/useDeclutterNomination.js', true), {
    module, exports: module.exports,
    require: (id) => id === 'react' ? { useCallback: (fn) => fn }
      : id.includes('HouseholdProfileContext') ? { useHouseholdProfile: () => ({ getProfileId: () => current }) }
        : { nominateDeclutterCandidates: async (ids, options) => { calls.push({ ids, options }); current = 'discofish'; return []; }, ITEM_OWNERS: [] },
  });
  const nominate = module.exports.default();
  await nominate(['one']);
  await nominate(['one', 'two']);
  assert.equal(calls[0].options.nominatedBy, 'laserfox');
  assert.equal(calls[1].options.nominatedBy, 'discofish', 'an old Undo callback reads the new profile');
  assert.deepEqual(Array.from(calls[1].ids), ['one', 'two']);
});
test('missing profile opens a persistent selection prompt and never nominates anonymously', async () => {
  let prompt, chosen, hidden, mutations = 0;
  const module = { exports: {} };
  vm.runInNewContext(await bundle('hooks/useDeclutterNomination.js', true), {
    module, exports: module.exports,
    require: (id) => id === 'react' ? { useCallback: (fn) => fn }
      : id.includes('HouseholdProfileContext') ? { useHouseholdProfile: () => ({ getProfileId: () => '', selectProfile: (id) => { chosen = id; } }) }
        : id.includes('declutterDeck') ? { nominateDeclutterCandidates: () => { mutations++; } }
          : { ITEM_OWNERS: [{ id: 'discofish', label: 'Discofish' }, { id: 'laserfox', label: 'Laserfox' }] },
  });
  const nominate = module.exports.default({ showToast: (value) => { prompt = value; }, hideToast: (id) => { hidden = id; } });
  await assert.rejects(nominate(['one']), (error) => error.code === module.exports.PROFILE_REQUIRED);
  assert.equal(mutations, 0); assert.equal(prompt.sticky, true);
  assert.deepEqual(Array.from(prompt.actions, (action) => action.label), ['Discofish', 'Laserfox']);
  prompt.actions[1].onClick();
  assert.equal(chosen, 'laserfox'); assert.equal(hidden, 'declutter-profile-required');
});
test('actual API payload attributes a whole deduplicated batch, rejects unknown profiles before fetch', async () => {
  const calls = []; const module = { exports: {} };
  vm.runInNewContext(await bundle('api/declutterDeck.js'), {
    module, exports: module.exports, URL,
    window: { location: { origin: 'http://localhost:7611' } },
    fetch: async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); return { ok: true, json: async () => ({ created: true }) }; },
  });
  const nominate = module.exports.nominateDeclutterCandidates;
  for (const invalid of ['', 'unknown', 'all']) await assert.rejects(nominate(['one'], { nominatedBy: invalid }));
  assert.equal(calls.length, 0);
  await nominate(['one', 'one', 'two'], { nominatedBy: 'laserfox' });
  assert.deepEqual(calls.map(({ body }) => body), [{ itemId: 'one', nominatedBy: 'laserfox' }, { itemId: 'two', nominatedBy: 'laserfox' }]);
  assert.ok(calls.every(({ url }) => url === '/api/declutter-deck/candidates'));
});
test('the existing backend exposes recorded nomination identity without inventing historical attribution', () => {
  const { toClientCandidate, emptyVotes } = require('../backend/services/declutterDeckService');
  const candidate = { _id: 'synthetic-candidate', itemId: 'synthetic-item', votes: emptyVotes(), nominatedBy: 'laserfox' };
  const item = { _id: 'synthetic-item', name: 'Synthetic test item' };
  assert.equal(toClientCandidate(candidate, item, 'discofish').nominatedBy, 'laserfox');
  assert.equal(toClientCandidate({ ...candidate, nominatedBy: '' }, item, 'laserfox').nominatedBy, '');
});
