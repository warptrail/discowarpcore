const assert = require('node:assert/strict');
const test = require('node:test');
const model = import('../frontend/src/components/Location/locationHierarchy.js');

test('house hierarchy shares equivalent parent nodes without merging paths across rooms', async () => {
  const { buildLocationMermaid, getLocationRooms } = await model;
  const locations = [
    { room: 'Garage', vicinity: 'Shelf', specifics: 'Top' },
    { room: ' garage ', vicinity: 'shelf', specifics: 'Bottom' },
    { room: 'Kitchen', vicinity: 'Shelf', specifics: 'Top' },
  ];
  assert.deepEqual(getLocationRooms(locations), ['Garage', 'Kitchen']);
  const source = buildLocationMermaid(locations);
  assert.equal((source.match(/:::room/g) || []).length, 2);
  assert.equal((source.match(/:::vicinity/g) || []).length, 2);
  assert.equal((source.match(/:::specifics/g) || []).length, 3);
  assert.equal((source.match(/house -->/g) || []).length, 2);
});

test('location labels cannot inject chart statements or HTML', async () => {
  const { buildLocationMermaid } = await model;
  const source = buildLocationMermaid([{ room: 'Room"\nclick n0 "javascript:alert(1)" <script>', vicinity: '', specifics: '' }]);
  assert.equal(source.includes('\nclick'), false);
  assert.equal(source.includes('<script>'), false);
  assert.equal(source.includes('javascript:alert(1)"'), false);
});

test('room-only and vicinity-only paths retain their meaningful tier', async () => {
  const { buildLocationMermaid } = await model;
  const source = buildLocationMermaid([
    { room: 'Garage', vicinity: '', specifics: '' },
    { room: 'Kitchen', vicinity: 'Cupboard', specifics: '' },
  ]);
  assert.equal((source.match(/:::room/g) || []).length, 2);
  assert.equal((source.match(/:::vicinity/g) || []).length, 1);
  assert.equal((source.match(/:::specifics/g) || []).length, 0);
});

test('map scope follows all four parents and resets invalid descendants', async () => {
  const { getLocationMapScope } = await model;
  const paths = [
    { room: 'Garage', vicinity: 'Shelf', specifics: 'Top', exactSpot: 'Behind bin' },
    { room: 'Garage', vicinity: 'Shelf', specifics: 'Top', exactSpot: 'Front edge' },
    { room: 'Kitchen', vicinity: 'Shelf', specifics: 'Top', exactSpot: '' },
  ];
  const focused = getLocationMapScope(paths, { room: 'garage', vicinity: 'Shelf', specifics: 'Top', exactSpot: 'behind bin' });
  assert.equal(focused.locations.length, 1);
  assert.equal(focused.scope.exactSpot, 'Behind bin');
  assert.deepEqual(focused.options.exactSpot, ['Behind bin', 'Front edge']);
  const invalid = getLocationMapScope(paths, { room: 'Missing room', vicinity: 'Shelf', specifics: 'Top', exactSpot: 'Behind bin' });
  assert.deepEqual(invalid.scope, { room: '', vicinity: '', specifics: '', exactSpot: '' });
  assert.equal(invalid.locations.length, 3);
});

test('tier legend counts full identities while preserving coarse paths', async () => {
  const { countLocationTiers } = await model;
  assert.deepEqual(countLocationTiers([
    { room: 'Garage', vicinity: 'Shelf', specifics: 'Top', exactSpot: 'Front' },
    { room: 'Garage', vicinity: 'Shelf', specifics: 'Top', exactSpot: 'Back' },
    { room: 'Kitchen', vicinity: 'Shelf', specifics: '', exactSpot: '' },
  ]), { room: 2, vicinity: 2, specifics: 1, exactSpot: 2 });
});
