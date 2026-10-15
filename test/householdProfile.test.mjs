import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOUSEHOLD_PROFILE_STORAGE_KEY, normalizeHouseholdProfile,
  readHouseholdProfile, writeHouseholdProfile,
} from '../frontend/src/util/householdProfile.js';

function storage(initial) {
  const values = new Map(initial ? [[HOUSEHOLD_PROFILE_STORAGE_KEY, initial]] : []);
  return { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}
test('only explicit household identities are remembered, with no guessed submitter', () => {
  assert.equal(readHouseholdProfile(storage()), '');
  for (const invalid of ['all', 'ryan', 'alyssa', 'unknown', null]) {
    assert.equal(normalizeHouseholdProfile(invalid), '');
    assert.equal(readHouseholdProfile(storage(invalid)), '');
  }
  for (const profile of ['discofish', 'laserfox']) {
    const device = storage();
    assert.equal(writeHouseholdProfile(profile, device), true);
    assert.equal(readHouseholdProfile(device), profile);
    assert.equal(readHouseholdProfile(storage(profile)), profile, 'old saved selection remains compatible');
  }
});
test('unavailable device storage is safe and invalid choices cannot be persisted', () => {
  const blocked = { getItem: () => { throw Error('blocked'); }, setItem: () => { throw Error('blocked'); }, removeItem: () => { throw Error('blocked'); } };
  assert.equal(readHouseholdProfile(blocked), '');
  assert.equal(writeHouseholdProfile('laserfox', blocked), false);
  const device = storage('discofish');
  writeHouseholdProfile('invalid', device);
  assert.equal(readHouseholdProfile(device), '');
});
