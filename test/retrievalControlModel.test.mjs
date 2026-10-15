import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRetrievalLocations, locationKeysForScope, roomsForLocationKeys, scopeForLocationKeys,
  ownerFacetKeys, buildControlPanelChips, EMPTY_LOCATION_BRANCH_PREFIX, UNKNOWN_ROOM_OPTION,
  hasSecondaryRetrievalFilters,
} from '../frontend/src/components/Retrieval/retrievalControlModel.js';

const registry = [
  { room: 'Garage', vicinity: 'North Shelf', specifics: 'Ledge' },
  { room: 'Garage', vicinity: 'North Shelf', specifics: 'Ledge', exactSpot: 'Blue bin' },
  { room: 'Garage', vicinity: 'South Shelf' },
  { room: 'Kitchen', vicinity: 'Pantry' },
];
const facets = [
  { key: 'garage · north shelf · ledge', label: 'Garage · North Shelf · Ledge' },
  { key: 'garage · north shelf · ledge · blue bin', label: 'Garage · North Shelf · Ledge · Blue bin' },
  { key: 'garage · south shelf', label: 'Garage · South Shelf' },
  { key: 'garage - dark corner', label: 'Garage - Dark Corner' },
];

test('legacy labels stay selectable without inventing registry tiers', () => {
  const records = buildRetrievalLocations(registry, facets, [{ key: 'office', label: 'Office' }]);
  assert.equal(records.length, 6);
  assert.deepEqual(records.find((record) => record.legacy), { room: 'Garage - Dark Corner', legacy: true });
  assert.ok(records.some((record) => record.room === 'Office'));
  assert.equal(registry.length, 4);
});

test('secondary-filter indicator ignores location and respects tag-scoped routes', () => {
  for (const type of ['categories', 'owners', 'keepPriorities', 'tags']) {
    assert.equal(hasSecondaryRetrievalFilters({ activeChips: [{ type, key: 'fixture' }] }), true, type);
  }
  assert.equal(hasSecondaryRetrievalFilters({ activeChips: [{ type: 'locations', key: 'garage' }] }), false);
  assert.equal(hasSecondaryRetrievalFilters({ activeChips: [] }), false);
  assert.equal(hasSecondaryRetrievalFilters({ hasTagScope: true, activeChips: [{ type: 'tags', key: 'fixture' }] }), false);
  assert.equal(hasSecondaryRetrievalFilters({ isBoxMode: true, selectedBoxTags: ['fixture'] }), true);
  assert.equal(hasSecondaryRetrievalFilters({ isBoxMode: true, selectedBoxTags: [], activeChips: [{ type: 'owners' }] }), false);
});

test('room scopes include descendants and exact spot narrows using existing server keys', () => {
  assert.deepEqual(locationKeysForScope(registry, facets, { room: 'Garage' }), facets.slice(0, 3).map(({ key }) => key));
  assert.deepEqual(locationKeysForScope(registry, facets, { room: 'Garage', vicinity: 'North Shelf' }), facets.slice(0, 2).map(({ key }) => key));
  assert.deepEqual(locationKeysForScope(registry, facets, registry[1]), [facets[1].key]);
  assert.deepEqual(locationKeysForScope(registry, facets, {}), []);
});

test('empty and invalid branches never become unfiltered results or another room', () => {
  const empty = locationKeysForScope(registry, facets, { room: 'Kitchen' });
  assert.equal(empty.length, 1);
  assert.ok(empty[0].startsWith(EMPTY_LOCATION_BRANCH_PREFIX));
  assert.ok(!facets.some(({ key }) => key === empty[0]));
  assert.equal(scopeForLocationKeys(registry, empty).room, 'Kitchen');
  assert.ok(locationKeysForScope(registry, facets, { room: 'Not registered' })[0].startsWith(EMPTY_LOCATION_BRANCH_PREFIX));
});

test('restored location keys recover recorded tiers and multiple room highlights', () => {
  assert.deepEqual(scopeForLocationKeys(registry, [facets[1].key]), registry[1]);
  assert.equal(scopeForLocationKeys(registry, facets.slice(0, 2).map(({ key }) => key)), null);
  assert.deepEqual(roomsForLocationKeys(registry, facets, facets.slice(0, 3).map(({ key }) => key)), ['Garage']);
});

test('Unknown uses exact server facets without becoming a registered room', () => {
  const options = [...facets, { key: 'unknown location', label: 'Unknown Location' }];
  const records = buildRetrievalLocations(registry, options);
  assert.ok(!records.some(({ room }) => room === 'Unknown Location' || room === UNKNOWN_ROOM_OPTION));
  const keys = locationKeysForScope(records, options, { room: UNKNOWN_ROOM_OPTION });
  assert.deepEqual(keys, ['unknown location']);
  assert.deepEqual(roomsForLocationKeys(records, options, keys), [UNKNOWN_ROOM_OPTION]);
  assert.equal(scopeForLocationKeys(records, keys), null);
});

test('Unknown and normal rooms form a union and restored highlights retain both', () => {
  const options = [...facets, { key: 'unknown location', label: 'Unknown Location' }];
  const keys = [UNKNOWN_ROOM_OPTION, 'Garage'].flatMap((room) => locationKeysForScope(registry, options, { room }));
  assert.deepEqual(keys, ['unknown location', ...facets.slice(0, 3).map(({ key }) => key)]);
  assert.deepEqual(roomsForLocationKeys(registry, options, keys), [UNKNOWN_ROOM_OPTION, 'Garage']);
});

test('Unknown with no matching records remains selected and returns zero, not all inventory', () => {
  const keys = locationKeysForScope(registry, facets, { room: UNKNOWN_ROOM_OPTION });
  assert.deepEqual(keys, [`${EMPTY_LOCATION_BRANCH_PREFIX}unknown`]);
  assert.deepEqual(roomsForLocationKeys(registry, facets, keys), [UNKNOWN_ROOM_OPTION]);
});

test('unmigrated flat labels remain selectable in the room row without inferred tiers', () => {
  const records = buildRetrievalLocations(registry, facets);
  assert.deepEqual(locationKeysForScope(records, facets, { room: 'Garage - Dark Corner' }), ['garage - dark corner']);
  assert.deepEqual(roomsForLocationKeys(records, facets, ['garage - dark corner']), ['Garage - Dark Corner']);
});

test('owner icons send all matching server aliases, without modifying saved ownership', () => {
  const options = [{ key: 'alyssa' }, { key: 'discofish' }, { key: 'ryan' }, { key: 'laserfox' }];
  assert.deepEqual(ownerFacetKeys(options, 'discofish'), ['alyssa', 'discofish']);
  assert.deepEqual(ownerFacetKeys(options, 'laserfox'), ['ryan', 'laserfox']);
});

test('one canonical owner chip represents all server aliases and empty scopes have readable labels', () => {
  assert.deepEqual(buildControlPanelChips([
    { type: 'owners', key: 'alyssa', label: 'Owner: Alyssa' },
    { type: 'owners', key: 'discofish', label: 'Owner: discofish' },
    { type: 'locations', key: `${EMPTY_LOCATION_BRANCH_PREFIX}kitchen`, label: `Location: ${EMPTY_LOCATION_BRANCH_PREFIX}kitchen` },
  ]), [
    { type: 'owners', key: 'discofish', label: 'Owner: Discofish' },
    { type: 'locations', key: `${EMPTY_LOCATION_BRANCH_PREFIX}kitchen`, label: 'Location: kitchen' },
  ]);
});
