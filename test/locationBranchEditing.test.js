const test = require('node:test');
const assert = require('node:assert/strict');
const model = import('../frontend/src/components/Location/locationBranchEditing.js');
const hierarchy = import('../frontend/src/components/Location/locationHierarchy.js');
const paths = [
  { _id: 'a', room: 'Garage', vicinity: 'North shelf', specifics: 'Top', exactSpot: 'Back' },
  { _id: 'b', room: ' garage ', vicinity: 'North shelf', specifics: 'Bottom', exactSpot: '' },
  { _id: 'c', room: 'Kitchen', vicinity: 'North shelf', specifics: 'Top', exactSpot: '' },
];

test('node actions resolve full ancestry and add only the next tier', async () => {
  const { branchLocations, childLocation } = await model;
  const { buildLocationBranches } = await hierarchy;
  const garage = buildLocationBranches(paths)[0];
  const shelf = garage.children[0];
  assert.deepEqual(branchLocations(paths, shelf).map(row => row._id), ['a', 'b']);
  assert.deepEqual(childLocation(shelf, '  Middle   rack '), { room: 'Garage', vicinity: 'North shelf', specifics: 'Middle rack', exactSpot: '' });
  assert.throws(() => childLocation(shelf, ' '), /Enter a name/);
  assert.throws(() => childLocation(shelf.children[1].children[0], 'Beyond'), /final location level/);
});

test('parent rename preserves IDs, descendants, sibling rooms and source rows', async () => {
  const { branchRenamePlan } = await model;
  const { buildLocationBranches } = await hierarchy;
  const original = JSON.stringify(paths);
  const plan = branchRenamePlan(paths, buildLocationBranches(paths)[0], 'Workshop');
  assert.deepEqual(plan.map(change => change.id), ['a', 'b']);
  assert.deepEqual(plan[0].draft, { room: 'Workshop', vicinity: 'North shelf', specifics: 'Top', exactSpot: 'Back' });
  assert.deepEqual(plan[1].draft, { room: 'Workshop', vicinity: 'North shelf', specifics: 'Bottom', exactSpot: '' });
  assert.equal(JSON.stringify(paths), original);
});

test('inline rename refuses sibling collisions and stale IDs before any save', async () => {
  const { branchRenamePlan } = await model;
  const { buildLocationBranches } = await hierarchy;
  const garage = buildLocationBranches(paths)[0];
  assert.throws(() => branchRenamePlan(paths, garage, 'kitchen'), /another branch/);
  assert.throws(() => branchRenamePlan(paths, garage, 'Workshop', ['a', 'missing']), /changed/);
  assert.throws(() => branchRenamePlan(paths, garage, ''), /Enter a name/);
});

test('partial rename reports confirmed progress and a retry writes only remaining IDs', async () => {
  const { branchRenamePlan, saveBranchRename } = await model;
  const { buildLocationBranches } = await hierarchy;
  const garage = buildLocationBranches(paths)[0];
  const current = paths.map(row => ({ ...row }));
  const calls = [];
  const registry = { renameLocationInline: async (id, draft) => {
    calls.push(id);
    if (id === 'b') throw new Error('Connection lost.');
    Object.assign(current.find(row => row._id === id), draft);
  } };
  await assert.rejects(saveBranchRename(registry, branchRenamePlan(current, garage, 'Workshop', ['a', 'b'])), failure => {
    assert.equal(failure.savedCount, 1);
    assert.match(failure.message, /1 of 2 paths saved.*Connection lost/);
    return true;
  });
  assert.deepEqual(calls, ['a', 'b']);
  assert.deepEqual(branchRenamePlan(current, garage, 'Workshop', ['a', 'b']).map(change => change.id), ['b']);
});

test('branch mutations preserve or broaden the current scope without hiding unrelated roots', async () => {
  const { scopeAfterBranchChange } = await model;
  const { buildLocationBranches } = await hierarchy;
  const garage = buildLocationBranches(paths)[0];
  const scope = { room: 'Garage', vicinity: 'North shelf', specifics: 'Top', exactSpot: 'Back' };
  assert.deepEqual(scopeAfterBranchChange(scope, garage, { room: 'Workshop' }, 'rename'), { ...scope, room: 'Workshop' });
  assert.deepEqual(scopeAfterBranchChange(scope, garage, {}, 'add'), { room: 'Garage', vicinity: '', specifics: '', exactSpot: '' });
  assert.deepEqual(scopeAfterBranchChange({}, garage, { room: 'Workshop' }, 'rename'), {});
  assert.deepEqual(scopeAfterBranchChange({ room: 'Kitchen' }, garage, {}, 'add'), { room: 'Kitchen' });
});
