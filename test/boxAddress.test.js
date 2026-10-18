const test = require('node:test');
const assert = require('node:assert/strict');
const { parseBoxAddress, normalizeBoxAddress, compareBoxAddresses } = require('../shared/boxAddress.mjs');
const { validateCompartments } = require('../backend/utils/boxCompartments');
const { createAddressIndex, buildAddressViews, viewInScope } = require('../backend/utils/inventoryAddressViews');
const { buildRetrievalBoxes } = require('../backend/services/retrievalService');

const compartments = [{ key: 'A', label: 'Open space' }, { key: 'B', label: 'Cups', children: Array.from({ length: 99 }, (_, n) => ({ key: `B${n + 1}`, label: n === 1 ? 'Middle shelf' : `Shelf ${n + 1}` })) }];
const boxes = [
  { _id: 'kitchen', box_id: '004', label: 'Kitchen', isComplexBox: true, compartments, items: ['mug', 'plate'], itemCompartments: { mug: 'B2', plate: 'A' }, childBoxCompartments: { jewelry: 'B2' } },
  { _id: 'jewelry', box_id: '600', label: 'Jewelry', parentBox: 'kitchen', items: [] },
  { _id: 'jar', box_id: '601', label: 'Jar', parentBox: 'jewelry', items: ['crystal'] },
];
const items = [{ _id: 'mug', name: 'Mug', quantity: 2 }, { _id: 'plate', name: 'Plate' }, { _id: 'crystal', name: 'Crystal', quantity: 3 }];

test('address grammar preserves identity and rejects unsupported structural designations', () => {
  assert.equal(normalizeBoxAddress(' #004b99 '), '004B99');
  for (const value of ['0', '00', '004', '004A', '004Z', ...[1, 9, 10, 26, 99].map(n => `004Z${n}`)]) assert.ok(parseBoxAddress(value), value);
  assert.deepEqual(parseBoxAddress('#004b2'), { address: '004B2', boxId: '004', cabinet: 'B', shelf: 2, compartmentKey: 'B2', complete: true, kind: 'shelf' });
  for (const value of ['004B0', '004B01', '004B100', '004BB', '004B2A', '004B2/1', '0040', '4B', '004 B2']) assert.equal(parseBoxAddress(value), null, value);
  assert.deepEqual(['004B99', '004B10', '004B2'].sort(compareBoxAddresses), ['004B2', '004B10', '004B99']);
});

test('99 shelves are valid; 100 and fourth structural levels are rejected', () => {
  assert.equal(validateCompartments(compartments)[1].children.length, 99);
  assert.throws(() => validateCompartments([compartments[0], { ...compartments[1], children: [...compartments[1].children, { key: 'B100' }] }]), /99/);
  assert.throws(() => validateCompartments([compartments[0], { key: 'B', children: [{ key: 'B1', children: [] }] }]), /three layers/);
});

test('address scope reaches physical descendants, keeps owners, and fails closed', () => {
  const index = createAddressIndex(boxes, items);
  const scope = index.resolve('004B2');
  assert.deepEqual([...scope.itemIds], ['mug', 'crystal']);
  assert.deepEqual([...index.resolve('00').itemIds], ['mug', 'plate', 'crystal']);
  assert.match(index.trail(boxes[2], 'crystal'), /004B2 Kitchen Middle shelf > 600 Jewelry > 601 Jar/);
  assert.throws(() => index.resolve('004C1'), /does not exist/);
  assert.throws(() => index.resolve('004B100'), /Invalid address/);
  const views = buildAddressViews(buildRetrievalBoxes(boxes, items), index, true);
  assert.deepEqual(views.filter(row => row.boxId === '004').map(row => row.address), ['004', '004A', '004B']);
  const cabinet = views.find(row => row.address === '004B');
  assert.equal(cabinet.ownerBoxMongoId, 'kitchen');
  assert.equal(cabinet.id, 'kitchen');
  assert.equal(cabinet.scopedItemCount, 2);
  assert.equal(cabinet.shelfCount, 99);
  assert.ok(cabinet.searchText.includes('crystal'));
  assert.deepEqual(views.filter(row => viewInScope(row, scope)).map(row => row.address), ['004B', '600', '601']);
  assert.equal(new Set(views.map(row => row.resultKey)).size, views.length);
  assert.equal(buildAddressViews(buildRetrievalBoxes(boxes, items), index, false).length, 3);
});

test('frontend view scopes preserve real identities and include descendants only once', async () => {
  const { buildBoxViewTree, findAddressView, scopeBoxViews } = await import('../frontend/src/util/boxAddressViews.js');
  const jar = { ...boxes[2], items: [items[2]], childBoxes: [] };
  const jewelry = { ...boxes[1], items: [], childBoxes: [jar], parentCompartmentKey: 'B2' };
  const tree = [{ ...boxes[0], items: items.slice(0, 2), childBoxes: [jewelry] }];
  const views = buildBoxViewTree(tree);
  assert.deepEqual(views.map(row => row.address), ['004', '004A', '004B']);
  const selected = findAddressView(tree, '#004b2');
  assert.equal(selected.box_id, '004');
  assert.equal(selected._id, 'kitchen');
  assert.deepEqual(selected.items.map(item => item.ownerBoxId), ['004', '601']);
  assert.equal(scopeBoxViews(views, '004B100').length, 0);
  assert.equal(findAddressView(tree, '004Z99'), null);
  assert.equal(scopeBoxViews(views, '004B2')[0].items.length, 2);
  const { getBoxSearchText } = await import('../frontend/src/util/inventorySearch.js');
  assert.equal(getBoxSearchText(views.find(row => row.address === '004A')).includes('middle shelf'), false);
  assert.equal(getBoxSearchText(views.find(row => row.address === '004B')).includes('middle shelf'), true);
});

test('address colors use the owning physical identity', async () => {
  const { getBoxTheme } = await import('../frontend/src/util/inventoryColorTheme.js');
  assert.deepEqual(getBoxTheme('004Z99'), getBoxTheme('004'));
  assert.deepEqual(getBoxTheme('#004b2'), getBoxTheme('004'));
});

test('CSV and printable exports retain full leaf and nested-box placement addresses', () => {
  const { buildBoxCsvFromPayload, buildBoxHtmlFromPayload } = require('../backend/services/boxExportService');
  const payload = { box: { boxId: '004', label: 'Cupboard' }, directContents: {
    items: [{ mongoId: 'sample', name: 'Sample', quantity: 1, compartmentKey: 'Z99', placementLabel: '004Z99' }],
    childBoxes: [{ boxId: '005', label: 'Jar', parentCompartmentKey: 'Z99', parentPlacementLabel: '004Z99' }],
  } };
  const csv = buildBoxCsvFromPayload(payload);
  assert.match(csv, /placement_address/);
  assert.match(csv, /004Z99/);
  const html = buildBoxHtmlFromPayload(payload);
  assert.match(html, /Stored in #004Z99/);
  assert.match(html, /#004Z99/);
});
