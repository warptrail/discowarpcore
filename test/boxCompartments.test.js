const test = require('node:test');
const assert = require('node:assert/strict');
const { getCompartments, getItemCompartment, resolveCompartment, validateCompartments, withBoxCompartments } = require('../backend/utils/boxCompartments');

test('complex boxes start with A/B and all existing items in A', () => {
  const box = { box_id: '302', isComplexBox: true, items: [{ _id: 'one', name: 'Hammer' }] };
  const result = withBoxCompartments(box);
  assert.deepEqual(result.compartments.map((row) => row.key), ['A', 'B']);
  assert.equal(result.items[0].placementLabel, '302A');
  assert.equal(result.items.length, 1);
  assert.equal(box.items[0].placementLabel, undefined);
});

test('placement respects overrides and ordinary boxes have no compartment', () => {
  const box = { isComplexBox: true, itemCompartments: new Map([['one', 'B']]) };
  assert.equal(getItemCompartment(box, 'one'), 'B');
  assert.equal(getItemCompartment(box, 'two'), 'A');
  assert.equal(getItemCompartment({ ...box, isComplexBox: false }, 'one'), '');
  assert.deepEqual(getCompartments({ isComplexBox: false }), []);
  assert.throws(() => resolveCompartment({ isComplexBox: false }, 'B'));
  assert.throws(() => resolveCompartment(box, 'C'));
  assert.equal(resolveCompartment(box), 'A');
});

test('compartment letters remain stable and a complex box cannot have fewer than two', () => {
  const initial = getCompartments({ isComplexBox: true });
  assert.throws(() => validateCompartments([{ key: 'A' }]));
  assert.throws(() => validateCompartments([{ key: 'A' }, { key: 'A' }]));
  assert.throws(() => validateCompartments([{ key: 'B' }, { key: 'A' }]));
  const expanded = validateCompartments([...initial, { key: 'C', label: ' Bottom drawer ' }], initial);
  assert.equal(expanded[2].label, 'Bottom drawer');
  assert.throws(() => validateCompartments(initial, expanded));
});

const { getLeafCompartments, flattenCompartments, reassignCompartments, getChildBoxCompartment, compartmentContains } = require('../backend/utils/boxCompartments');
const nested = [{ key: 'A', label: 'Cupboard', children: [{ key: 'A1', label: 'Top' }, { key: 'A2', label: 'Bottom' }] }, { key: 'B', label: 'Open' }];

test('compartments stop at shelves, preserve stable addresses and only accept leaf destinations', () => {
  assert.deepEqual(validateCompartments(nested), nested);
  const box = { isComplexBox: true, compartments: nested };
  assert.deepEqual(getLeafCompartments(box).map((row) => row.key), ['A1', 'A2', 'B']);
  assert.equal(flattenCompartments(box).length, 4);
  assert.equal(resolveCompartment(box), 'A1');
  assert.equal(resolveCompartment(box, 'a2'), 'A2');
  assert.throws(() => resolveCompartment(box, 'A'));
  assert.throws(() => validateCompartments([{ ...nested[0], children: [{ key: 'A1', children: [] }] }, nested[1]]));
  assert.throws(() => validateCompartments([{ ...nested[0], children: [{ key: 'B1' }] }, nested[1]]));
  assert.throws(() => validateCompartments([{ key: 'A' }, nested[1]], nested));
  assert.equal(compartmentContains('A', 'A2'), true);
  assert.equal(compartmentContains('A1', 'A12'), false);
});

test('subdivision requires all affected direct items and boxes; validation is non-mutating', () => {
  const original = { isComplexBox: true, items: ['item'], compartments: [{ key: 'A', label: '' }, { key: 'B', label: '' }], itemCompartments: {}, childBoxCompartments: { child: 'A' } };
  const snapshot = JSON.stringify(original);
  assert.throws(() => reassignCompartments(original, nested, ['child']));
  assert.throws(() => reassignCompartments(original, nested, ['child'], { items: { item: 'A1' } }));
  const reassigned = reassignCompartments(original, nested, ['child'], { items: { item: 'A1' }, boxes: { child: 'A2' } });
  assert.equal(reassigned.itemCompartments.item, 'A1');
  assert.equal(reassigned.childBoxCompartments.child, 'A2');
  assert.equal(JSON.stringify(original), snapshot);
  assert.equal(getChildBoxCompartment({ ...original, compartments: nested, ...reassigned }, 'child'), 'A2');
  assert.equal(getChildBoxCompartment(original, 'legacy'), '');
  assert.throws(() => reassignCompartments(original, nested, ['child'], { items: { stranger: 'B' } }));
  assert.throws(() => reassignCompartments(original, nested, ['child'], { items: { item: '' }, boxes: { child: 'A2' } }));
  assert.throws(() => reassignCompartments({ ...original, isComplexBox: false }, nested, ['child']));
});

test('shelf placements survive disable and re-enable without changing ownership', () => {
  const box = { isComplexBox: true, compartments: nested, items: ['one'], itemCompartments: { one: 'A2' }, childBoxCompartments: { child: 'A1' } };
  assert.equal(getItemCompartment(box, 'one'), 'A2');
  assert.equal(getItemCompartment({ ...box, isComplexBox: false }, 'one'), '');
  assert.equal(getChildBoxCompartment({ ...box, isComplexBox: false }, 'child'), '');
  assert.equal(getChildBoxCompartment(box, 'child'), 'A1');
  assert.deepEqual(box.items, ['one']);
});

test('frontend cabinet scope keeps physical descendants on that shelf and excludes other shelves', async () => {
  const fs = require('node:fs');
  const util = await import(`data:text/javascript;base64,${Buffer.from(fs.readFileSync('frontend/src/util/boxCompartments.js')).toString('base64')}`);
  const jar = { _id: 'jar', items: [{ _id: 'crystal' }], childBoxes: [] };
  const box = { isComplexBox: true, compartments: nested, items: [{ _id: 'one' }, { _id: 'two' }], itemCompartments: { one: 'A1', two: 'B' }, childBoxes: [{ _id: 'jewelry', parentCompartmentKey: 'A2', items: [], childBoxes: [jar] }, { _id: 'legacy', childBoxes: [] }] };
  const group = util.scopeBoxToCompartment(box, 'A');
  assert.deepEqual(group.items.map((item) => item._id), ['one']);
  assert.equal(group.childBoxes[0].childBoxes[0].items[0]._id, 'crystal');
  assert.equal(group.childBoxes.length, 1);
  assert.equal(util.scopeBoxToCompartment(box, 'A1').childBoxes.length, 0);
  assert.equal(util.scopeBoxToCompartment(box, '').childBoxes.length, 2);
});

test('console summary counts physical descendants and quantities once, separately from structural sections', async () => {
  const { summarizeBoxInventory } = await import('../frontend/src/util/boxInventorySummary.js');
  const crystal = { _id: 'crystal', name: 'Sample', quantity: 3 };
  const tree = { _id: 'root', isComplexBox: true, compartments: nested, items: [{ _id: 'plate', quantity: 2 }], childBoxes: [{ _id: 'jewelry', items: [], childBoxes: [{ _id: 'jar', items: [crystal], childBoxes: [] }] }] };
  const snapshot = JSON.stringify(tree);
  assert.deepEqual(summarizeBoxInventory(tree), { sectionCount: 2, storageSpaceCount: 3, itemRecords: 2, totalQuantity: 5, nestedBoxCount: 2 });
  assert.equal(JSON.stringify(tree), snapshot);
  tree.childBoxes[0].items.push(crystal);
  assert.equal(summarizeBoxInventory(tree).totalQuantity, 5);
  assert.equal(summarizeBoxInventory(null).totalQuantity, 0);
});
