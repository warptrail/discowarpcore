import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveOperationsLocationFilter, matchesOperationsLocation } from '../frontend/src/util/operationsLocationFilter.js';
import { filterOrphanedItems } from '../frontend/src/util/operationsAdrift.js';

const locations = [
  { _id: 'garage', room: 'Garage', name: 'Garage' },
  { _id: 'north', room: 'Garage', vicinity: 'North Shelf', specifics: 'Ledge', name: 'Garage · North Shelf · Ledge' },
  { _id: 'bin', room: 'Garage', vicinity: 'North Shelf', specifics: 'Ledge', exactSpot: 'Blue Bin', name: 'Garage · North Shelf · Ledge · Blue Bin' },
  { _id: 'south', room: 'Garage', vicinity: 'South Shelf', name: 'Garage · South Shelf' },
  { _id: 'office', room: 'Office', vicinity: 'North Shelf', specifics: 'Ledge', name: 'Office · North Shelf · Ledge' },
];
const matchedIds = (filter) => locations.filter((entry) => matchesOperationsLocation({ locationId: entry._id }, filter)).map((entry) => entry._id);

test('room selection includes every saved descendant, without crossing room boundaries', () => {
  const filter = resolveOperationsLocationFilter({ room: ' garage ' }, locations);
  assert.deepEqual(matchedIds(filter), ['garage', 'north', 'bin', 'south']);
  assert.equal(matchesOperationsLocation({ locationId: { _id: 'bin' } }, filter), true);
});

test('each successive level narrows to its branch, including exact spot', () => {
  assert.deepEqual(matchedIds(resolveOperationsLocationFilter({ room: 'Garage', vicinity: 'North Shelf' }, locations)), ['north', 'bin']);
  assert.deepEqual(matchedIds(resolveOperationsLocationFilter({ room: 'Garage', vicinity: 'North Shelf', specifics: 'Ledge', exactSpot: 'Blue Bin' }, locations)), ['bin']);
});

test('clearing returns all locations and legacy exact ID filters retain their behavior', () => {
  assert.equal(resolveOperationsLocationFilter('all', locations), 'all');
  assert.equal(matchesOperationsLocation({}, 'all'), true);
  assert.deepEqual(matchedIds(resolveOperationsLocationFilter('north', locations)), ['north']);
  assert.equal(matchesOperationsLocation({ location: 'north' }, 'north'), false);
});

test('invalid room scopes match nothing instead of silently showing all inventory', () => {
  assert.deepEqual(matchedIds(resolveOperationsLocationFilter({ room: 'Not recorded' }, locations)), []);
});

test('legacy unboxed placement labels match saved branches, not partial text guesses', () => {
  const filter = resolveOperationsLocationFilter({ room: 'Garage', vicinity: 'North Shelf' }, locations);
  const items = [
    { _id: 'yes', location: ' garage  · North Shelf · Ledge ' },
    { _id: 'no', location: 'Garage' },
    { _id: 'unknown', location: '' },
    { _id: 'authoritative', locationId: 'office', location: 'Garage · North Shelf · Ledge' },
  ];
  assert.deepEqual(filterOrphanedItems(items, { locationFilter: filter }).map((item) => item._id), ['yes']);
});
