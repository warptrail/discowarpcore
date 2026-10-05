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
