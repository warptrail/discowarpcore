const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeLocationStructure, locationStructureKey, formatLocationName } = require('../backend/utils/locationName');
const { normalizeLocationInput } = require('../backend/services/locationService');
const { findConflicts } = require('../backend/scripts/migrate-location-exact-spot');
const { assertDevelopmentResetTarget } = require('../backend/scripts/resetShared');
const path = { room: 'Office', vicinity: 'Closet', specifics: 'Top shelf', exactSpot: ' Behind   the blue bin ' };

test('four-tier labels and identities normalize text and retain legacy paths', () => {
  assert.equal(normalizeLocationStructure(path).exactSpot, 'Behind the blue bin');
  assert.equal(formatLocationName(path), 'Office · Closet · Top shelf · Behind the blue bin');
  assert.equal(normalizeLocationStructure({ room: 'Office' }).exactSpot, '');
  assert.equal(normalizeLocationStructure(' Office ').exactSpot, '');
  assert.equal(locationStructureKey(path), locationStructureKey({ ...path, exactSpot: 'behind the BLUE bin' }));
  assert.notEqual(locationStructureKey(path), locationStructureKey({ ...path, exactSpot: 'Far right' }));
});
test('Exact Spot needs all ancestors, while earlier tiers remain valid', () => {
  for (const entry of [{ room: 'Office' }, { room: 'Office', vicinity: 'Closet' }, { ...path, exactSpot: '' }, path]) assert.doesNotThrow(() => normalizeLocationInput(entry));
  assert.throws(() => normalizeLocationInput({ ...path, specifics: '' }), /Exact Spot requires specifics/);
  assert.throws(() => normalizeLocationInput({ ...path, vicinity: '' }), /Specifics requires a vicinity/);
});
test('migration detects normalized duplicates and invalid hierarchy without rewriting', () => {
  const source = [{ ...path, _id: '1' }, { ...path, _id: '2', exactSpot: 'behind the blue bin' }];
  assert.equal(findConflicts(source).length, 1);
  assert.equal(findConflicts([{ ...path, _id: '1' }, { ...path, _id: '2', exactSpot: 'Right' }]).length, 0);
  assert.equal(findConflicts([{ ...path, _id: '1', specifics: '' }]).length, 1);
  assert.equal(source[0].exactSpot, path.exactSpot);
});
test('migration refuses production, remote hosts and ambiguous databases', () => {
  assert.throws(() => assertDevelopmentResetTarget('mongodb://127.0.0.1/discowarpcore'), /suffix required/);
  assert.throws(() => assertDevelopmentResetTarget('mongodb://remote/discowarpcore_dev'), /non-loopback/);
  assert.throws(() => assertDevelopmentResetTarget('mongodb://127.0.0.1/discowarpcore_dev', { hostname: 'neonazoth' }), /Production/);
});
test('frontend clears descendants only when a parent is blank and scopes suggestions', async () => {
  const { updateLocationDraft, locationSuggestions } = await import('../frontend/src/util/locationStructure.js');
  assert.deepEqual(updateLocationDraft(path, 'room', ''), { room: '', vicinity: '', specifics: '', exactSpot: '' });
  assert.equal(updateLocationDraft(path, 'specifics', '').exactSpot, '');
  assert.equal(updateLocationDraft(path, 'specifics', 'Bottom shelf').exactSpot, path.exactSpot);
  assert.deepEqual(locationSuggestions([path, { ...path, specifics: 'Bottom shelf', exactSpot: 'Right' }], path, 'exactSpot'), ['Behind the blue bin']);
});
test('chart nests precise spots below shared specifics and safely renders punctuation', async () => {
  const { buildLocationMermaid } = await import('../frontend/src/components/Location/locationHierarchy.js');
  const chart = buildLocationMermaid([path, { ...path, exactSpot: 'Right "corner" <bin>' }]);
  assert.equal((chart.match(/\]:::specifics/g) || []).length, 1);
  assert.equal((chart.match(/\]:::exactSpot/g) || []).length, 2);
  assert.ok(chart.includes('n2 --> n3') && chart.includes('n2 --> n4'));
  assert.ok(chart.includes('#34;corner#34; #60;bin#62;'));
});
