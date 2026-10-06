const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildRetrievalBoxes,
  filterRetrievalBoxes,
  sortRetrievalBoxes,
  sortRetrievalItems,
} = require('../backend/services/retrievalService');

const boxes = [
  { boxId: '099', searchText: 'garage cables', locationKey: 'garage' },
  { boxId: '100', searchText: 'office paper', locationKey: 'office' },
  { boxId: '105', searchText: 'garage snow gear', locationKey: 'garage' },
  { boxId: '109', searchText: 'garage towels', locationKey: 'garage' },
  { boxId: '110', searchText: 'garage records', locationKey: 'garage' },
  { boxId: '199', searchText: 'closet archive', locationKey: 'closet' },
  { boxId: '200', searchText: 'garage tools', locationKey: 'garage' },
];

const filter = (boxIdPrefix, query = '') => filterRetrievalBoxes(boxes, {
  query,
  boxIdPrefix,
  locationFilters: [],
});

test('one box digit selects the complete hundred family', () => {
  assert.deepEqual(filter('1').map((box) => box.boxId), [
    '100',
    '105',
    '109',
    '110',
    '199',
  ]);
});

test('two box digits narrow to the corresponding ten-box range', () => {
  assert.deepEqual(filter('10').map((box) => box.boxId), ['100', '105', '109']);
});

test('three box digits select the exact box', () => {
  assert.deepEqual(filter('105').map((box) => box.boxId), ['105']);
});

test('box prefix combines with the normal text search', () => {
  assert.deepEqual(filter('1', 'garage').map((box) => box.boxId), ['105', '109', '110']);
});

test('pasted box punctuation is normalized and capped to three digits', () => {
  assert.deepEqual(filter('#10-5 extra').map((box) => box.boxId), ['105']);
});

test('box rows expose box tags while filtering uses tags from direct items', () => {
  const built = buildRetrievalBoxes(
    [
      {
        _id: 'box-105',
        box_id: '105',
        label: 'Snow Gear',
        tags: ['garage', 'winter storage'],
        items: ['item-1'],
      },
      {
        _id: 'box-106',
        box_id: '106',
        label: 'Backpack',
        tags: ['travel'],
        items: ['item-2'],
      },
    ],
    [
      { _id: 'item-1', tags: ['winter', 'clothing'] },
      { _id: 'item-2', tags: ['camping'] },
    ],
  );

  assert.deepEqual(built[0].tags, ['garage', 'winter storage']);
  assert.deepEqual(built[0].itemTags, ['clothing', 'winter']);

  const filtered = filterRetrievalBoxes(built, {
    query: '',
    tagFilters: ['winter'],
  });
  assert.deepEqual(filtered.map((box) => box.boxId), ['105']);
});

test('box tag filtering supports ANY and ALL matching across direct-item tags', () => {
  const rows = [
    { boxId: '105', tagKeys: ['winter', 'clothing'], locationKey: '', searchText: '' },
    { boxId: '106', tagKeys: ['winter'], locationKey: '', searchText: '' },
  ];

  assert.deepEqual(
    filterRetrievalBoxes(rows, {
      query: '',
      tagFilters: ['winter', 'clothing'],
      tagOperator: 'or',
    }).map((box) => box.boxId),
    ['105', '106'],
  );
  assert.deepEqual(
    filterRetrievalBoxes(rows, {
      query: '',
      tagFilters: ['winter', 'clothing'],
      tagOperator: 'and',
    }).map((box) => box.boxId),
    ['105'],
  );
});

test('box and item results can sort alphabetically by their first tag', () => {
  const boxRows = [
    { boxId: '105', boxLabel: 'Snow Gear', itemTags: ['winter'] },
    { boxId: '106', boxLabel: 'Backpack', itemTags: ['camping'] },
  ];
  assert.deepEqual(
    sortRetrievalBoxes(boxRows, 'tag').map((box) => box.boxId),
    ['106', '105'],
  );

  const itemRows = [
    { name: 'Mittens', tags: ['winter'], locationLabel: 'Garage', boxNumber: '105' },
    { name: 'Tent', tags: ['camping'], locationLabel: 'Garage', boxNumber: '405' },
  ];
  assert.deepEqual(
    sortRetrievalItems(itemRows, 'tag').map((item) => item.name),
    ['Tent', 'Mittens'],
  );
});

test('room filters use structured rooms across vicinity/specifics and inherited boxes', () => {
  const built = buildRetrievalBoxes([
    { _id: 'parent', box_id: '001', location: 'stale office', locationId: { room: 'Garage', vicinity: 'North Shelf', specifics: 'Top' } },
    { _id: 'child', box_id: '002', parentBox: 'parent' },
    { _id: 'other', box_id: '003', locationId: { room: 'Garage', vicinity: 'Dark Corner' } },
    { _id: 'office', box_id: '004', locationId: { room: 'Office' } },
    { _id: 'legacy', box_id: '005', location: 'Garage - unknown legacy detail' },
  ]);
  assert.equal(built.find((box) => box.boxId === '002').locationLabel, 'Garage · North Shelf · Top');
  assert.deepEqual(filterRetrievalBoxes(built, { roomFilters: ['garage'] }).map((box) => box.boxId).sort(), ['001', '002', '003']);
  assert.deepEqual(filterRetrievalBoxes(built, { roomFilters: ['garage', 'office'], boxIdPrefix: '00' }).map((box) => box.boxId).sort(), ['001', '002', '003', '004']);
  assert.equal(filterRetrievalBoxes(built, { roomFilters: [] }).length, 5);
});
