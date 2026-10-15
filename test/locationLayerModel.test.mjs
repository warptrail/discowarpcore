import test from 'node:test';
import assert from 'node:assert/strict';
import { getLocationMapScope } from '../frontend/src/components/Location/locationHierarchy.js';
import { availableLocationLayers, nextLocationLayer, selectLocationLayerScope } from '../frontend/src/components/InventoryFilters/locationLayerModel.js';

const records = [
  { room: 'Garage', vicinity: 'North Shelf', specifics: 'Ledge', exactSpot: 'Blue bin' },
  { room: 'Garage', vicinity: 'Dark Corner' },
  { room: 'Bedroom', vicinity: 'Closet' },
  { room: 'Office' },
];

test('stack advances one registered tier at a time and stops at leaves', () => {
  for (const [requested, index, expected] of [
    [{}, 0, 0],
    [{ room: 'Garage' }, 0, 1],
    [{ room: 'Garage', vicinity: 'North Shelf' }, 1, 2],
    [{ room: 'Garage', vicinity: 'North Shelf', specifics: 'Ledge' }, 2, 3],
    [records[0], 3, 3],
    [{ room: 'Office' }, 0, 0],
    [{ room: 'Garage', vicinity: 'Dark Corner' }, 1, 1],
  ]) {
    const { scope, options } = getLocationMapScope(records, requested);
    assert.equal(nextLocationLayer(scope, options, index), expected);
  }
});

test('Unknown, multi-room scope and missing intermediate tiers stay at Rooms', () => {
  for (const requested of [{}, { room: '[Unknown]' }, { room: 'Unregistered' }]) {
    const { scope, options } = getLocationMapScope(records, requested);
    assert.deepEqual(availableLocationLayers(scope, options), [0]);
  }
  const { scope, options } = getLocationMapScope([{ room: 'Gap', specifics: 'No vicinity' }], { room: 'Gap' });
  assert.deepEqual(availableLocationLayers(scope, options), [0]);
});

test('parent changes clear only deeper tiers without mutating the saved scope', () => {
  const original = records[0];
  assert.deepEqual(selectLocationLayerScope(original, 'vicinity', 'Dark Corner'), {
    room: 'Garage', vicinity: 'Dark Corner', specifics: '', exactSpot: '',
  });
  assert.deepEqual(selectLocationLayerScope(original, 'room', 'Bedroom'), {
    room: 'Bedroom', vicinity: '', specifics: '', exactSpot: '',
  });
  assert.equal(original.exactSpot, 'Blue bin');
});

test('external clear clamps a previously deep layer to the root', () => {
  const cleared = getLocationMapScope(records, {});
  assert.equal(Math.min(3, availableLocationLayers(cleared.scope, cleared.options).at(-1)), 0);
});
