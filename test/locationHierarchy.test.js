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

test('branch explorer keeps full ancestry and equivalent parents without merging rooms', async () => {
  const { buildLocationBranches } = await model;
  const rooms = buildLocationBranches([
    { room: 'Garage', vicinity: 'Shelf', specifics: 'Top', exactSpot: 'Front' },
    { room: ' garage ', vicinity: ' shelf ', specifics: 'Top', exactSpot: 'Back' },
    { room: 'Kitchen', vicinity: 'Shelf', specifics: 'Top', exactSpot: 'Front' },
    { room: 'Office' },
  ]);
  assert.deepEqual(rooms.map((room) => room.label), ['Garage', 'Kitchen', 'Office']);
  assert.equal(rooms[0].children.length, 1);
  assert.equal(rooms[0].pathCount, 2);
  const spots = rooms[0].children[0].children[0].children;
  assert.deepEqual(spots.map((spot) => spot.label), ['Back', 'Front']);
  assert.deepEqual(spots[0].path, ['Garage', 'Shelf', 'Top', 'Back']);
  assert.notEqual(rooms[0].children[0].key, rooms[1].children[0].key);
  assert.deepEqual(rooms[2].children, []);
});

test('branch explorer does not invent missing tiers and sorts numbered branches naturally', async () => {
  const { buildLocationBranches } = await model;
  const rooms = buildLocationBranches([
    { room: 'Room 10', vicinity: '', specifics: 'Unassigned tier', exactSpot: 'Not a valid branch' },
    { room: 'Room 2', vicinity: 'Drawer 10' },
    { room: 'Room 2', vicinity: 'Drawer 2' },
    { room: '', vicinity: 'No room' },
  ]);
  assert.deepEqual(rooms.map((room) => room.label), ['Room 2', 'Room 10']);
  assert.deepEqual(rooms[0].children.map((node) => node.label), ['Drawer 2', 'Drawer 10']);
  assert.deepEqual(rooms[1].children, []);
});
