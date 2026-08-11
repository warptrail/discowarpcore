const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildRetrievalBoxes,
  filterRetrievalBoxes,
  sortRetrievalBoxes,
  sortRetrievalItems,
} = require('../backend/services/retrievalService');

const boxes = [
  { boxId: '099', searchText: 'garage cables', groupKey: '', locationKey: 'garage' },
  { boxId: '100', searchText: 'office paper', groupKey: '', locationKey: 'office' },
  { boxId: '105', searchText: 'garage snow gear', groupKey: '', locationKey: 'garage' },
  { boxId: '109', searchText: 'garage towels', groupKey: '', locationKey: 'garage' },
  { boxId: '110', searchText: 'garage records', groupKey: '', locationKey: 'garage' },
  { boxId: '199', searchText: 'closet archive', groupKey: '', locationKey: 'closet' },
  { boxId: '200', searchText: 'garage tools', groupKey: '', locationKey: 'garage' },
];

const filter = (boxIdPrefix, query = '') => filterRetrievalBoxes(boxes, {
  query,
  boxIdPrefix,
  groupFilters: [],
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
    { boxId: '105', tagKeys: ['winter', 'clothing'], groupKey: '', locationKey: '', searchText: '' },
    { boxId: '106', tagKeys: ['winter'], groupKey: '', locationKey: '', searchText: '' },
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
