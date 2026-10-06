const assert = require('node:assert/strict');
const test = require('node:test');

const {
  formatLocationName,
  locationStructureKey,
  normalizeLocationStructure,
} = require('../backend/utils/locationName');
const { normalizeLocationInput } = require('../backend/services/locationService');

test('location structure keeps its four cartographic levels and creates a display label', () => {
  const location = normalizeLocationStructure({
    room: ' Garage ',
    vicinity: ' North   Shelf ',
    specifics: ' Rack B3 ',
  });

  assert.deepEqual(location, {
    room: 'Garage',
    vicinity: 'North Shelf',
    specifics: 'Rack B3',
    exactSpot: '',
  });
  assert.equal(formatLocationName(location), 'Garage · North Shelf · Rack B3');
});

test('location identity compares all four levels without case or whitespace differences', () => {
  const first = { room: 'Garage', vicinity: 'North Shelf', specifics: 'Rack B3' };
  const same = { room: ' garage ', vicinity: 'north  shelf', specifics: 'rack b3' };
  const differentSpecifics = { room: 'Garage', vicinity: 'North Shelf', specifics: 'Rack B4' };

  assert.equal(locationStructureKey(first), locationStructureKey(same));
  assert.notEqual(locationStructureKey(first), locationStructureKey(differentSpecifics));
});

test('location API only accepts structured input and enforces hierarchy', () => {
  assert.deepEqual(
    normalizeLocationInput({ room: 'Garage', vicinity: 'North Shelf', specifics: 'Rack B3' }),
    {
      room: 'Garage',
      vicinity: 'North Shelf',
      specifics: 'Rack B3',
      exactSpot: '',
    },
  );
  assert.throws(
    () => normalizeLocationInput({ room: 'Garage', specifics: 'Rack B3' }),
    /Specifics requires a vicinity/,
  );
  assert.throws(
    () => normalizeLocationInput({ name: 'Garage - North Shelf - Rack B3' }),
    /Room is required/,
  );
});
