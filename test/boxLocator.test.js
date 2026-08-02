const assert = require('node:assert/strict');
const test = require('node:test');

async function loadBoxLocator() {
  return import('../frontend/src/util/boxLocator.js');
}

const makeBox = (boxId, childBoxes = []) => ({
  box_id: boxId,
  label: `Box ${boxId}`,
  childBoxes,
});

test('box ID prefix filtering promotes a nested match and preserves its subtree', async () => {
  const { filterBoxTreeByIdPrefix } = await loadBoxLocator();
  const nestedMatch = makeBox('202', [makeBox('777')]);
  const tree = [
    makeBox('100', [nestedMatch]),
    makeBox('312'),
  ];

  const result = filterBoxTreeByIdPrefix(tree, '202');

  assert.equal(result.length, 1);
  assert.equal(result[0], nestedMatch);
  assert.deepEqual(result[0].childBoxes.map((box) => box.box_id), ['777']);
});

test('matching parents retain matching descendants without duplicate promoted rows', async () => {
  const { filterBoxTreeByIdPrefix } = await loadBoxLocator();
  const matchingChild = makeBox('202');
  const matchingParent = makeBox('200', [matchingChild]);

  const result = filterBoxTreeByIdPrefix(
    [matchingParent, makeBox('312')],
    '2',
  );

  assert.deepEqual(result.map((box) => box.box_id), ['200']);
  assert.equal(result[0].childBoxes[0], matchingChild);
});

test('empty box ID prefix leaves the current tree unchanged', async () => {
  const { filterBoxTreeByIdPrefix } = await loadBoxLocator();
  const tree = [makeBox('202')];

  assert.equal(filterBoxTreeByIdPrefix(tree, ''), tree);
});

test('one digit returns the matching ID family and keeps each family subtree', async () => {
  const { filterBoxTreeByIdPrefix } = await loadBoxLocator();
  const family = makeBox('200', [makeBox('777')]);
  const sibling = makeBox('245');

  const result = filterBoxTreeByIdPrefix(
    [makeBox('100'), family, sibling, makeBox('312')],
    '2',
  );

  assert.deepEqual(result.map((box) => box.box_id), ['200', '245']);
  assert.deepEqual(result[0].childBoxes.map((box) => box.box_id), ['777']);
});

test('two digits progressively narrow the matching family', async () => {
  const { filterBoxTreeByIdPrefix } = await loadBoxLocator();

  const result = filterBoxTreeByIdPrefix(
    [makeBox('200'), makeBox('202'), makeBox('245'), makeBox('312')],
    '20',
  );

  assert.deepEqual(result.map((box) => box.box_id), ['200', '202']);
});

test('unknown exact ID returns an empty scope without altering source nodes', async () => {
  const { filterBoxTreeByIdPrefix } = await loadBoxLocator();
  const tree = [makeBox('202'), makeBox('312')];

  assert.deepEqual(filterBoxTreeByIdPrefix(tree, '999'), []);
  assert.deepEqual(tree.map((box) => box.box_id), ['202', '312']);
});

test('box ID normalization accepts pasted punctuation and caps through callers', async () => {
  const { normalizeBoxId } = await loadBoxLocator();

  assert.equal(normalizeBoxId('  #20-2  '), '202');
});
