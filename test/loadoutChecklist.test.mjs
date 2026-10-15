import test from 'node:test';
import assert from 'node:assert/strict';
import { getFixedLoadouts, loadoutProgress, toggleChecklist, loadoutBody } from '../frontend/src/components/Loadouts/loadoutModel.js';
import { OCCASION_PRESETS, starterEntries } from '../frontend/src/components/Loadouts/occasionPresets.js';

test('ungathering clears put-away state; put-away cannot gather an entry implicitly', () => {
  const entries = [{ id: 'a', gathered: true, returned: true }, { id: 'b', gathered: false, returned: false }];
  assert.deepEqual(toggleChecklist(entries, 'a', 'gather')[0], { id: 'a', gathered: false, returned: false });
  assert.deepEqual(toggleChecklist(entries, 'b', 'return'), entries);
  assert.equal(entries[0].returned, true);
});

test('put-away totals include only entries gathered for this outing', () => {
  assert.deepEqual(loadoutProgress([{ itemId: 'x', gathered: true, returned: false }, { itemId: null, gathered: true, returned: true }, { gathered: false, returned: false }]), {
    total: 3, linked: 1, gathered: 2, returned: 1, remaining: 1,
  });
});

test('save body preserves revision and strips presentation-only inventory context', () => {
  const result = loadoutBody({ revision: 4, name: 'Trip', occasion: 'travel', entries: [{ id: 'e', label: 'Light', itemId: 'i', gathered: true, returned: false, item: { boxNumber: '007' } }] });
  assert.equal(result.revision, 4);
  assert.equal(result.entries[0].item, undefined);
});

test('all six occasion starters have distinct palettes and no fabricated inventory ownership', () => {
  assert.equal(OCCASION_PRESETS.length, 6);
  assert.equal(new Set(OCCASION_PRESETS.map(preset => preset.palette[0])).size, 6);
  for (const preset of OCCASION_PRESETS) {
    const entries = starterEntries(preset.id);
    assert(entries.length > 0);
    assert(entries.every(entry => entry.itemId === null && !entry.gathered && !entry.returned));
  }
});

test('the gallery stays at six occasions in a stable order despite custom or duplicate records', () => {
  const fixed = OCCASION_PRESETS.map(preset => ({ id: preset.id, occasion: preset.id, entries: [] }));
  const records = [
    { id: 'custom', occasion: 'custom' },
    ...fixed.toReversed(),
    { id: 'another-camping-list', occasion: 'camping' },
  ];
  assert.deepEqual(getFixedLoadouts(records).map(loadout => loadout.id), fixed.map(loadout => loadout.id));
  assert.equal(records.length, 8, 'The selector does not remove stored records.');
});
