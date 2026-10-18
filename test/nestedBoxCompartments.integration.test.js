const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const { FIXTURES } = require('../backend/scripts/seed-complex-box-fixtures');
const { getLeafCompartments, getChildBoxCompartment, validateCompartments } = require('../backend/utils/boxCompartments');

test('mock structures contain six drawers, five bookshelf spaces and seventeen kitchen spaces', () => {
  assert.deepEqual(FIXTURES.map((fixture) => getLeafCompartments({ isComplexBox: true, compartments: validateCompartments(fixture.compartments) }).length), [6, 5, 17]);
  assert.equal(FIXTURES.reduce((total, fixture) => total + fixture.names.length, 0), 28);
});

test('nested placement, subdivision, deep physical nesting and exports on isolated MongoDB', { skip: process.env.RUN_COMPLEX_BOX_INTEGRATION !== '1', timeout: 30000 }, async () => {
  const env = require('dotenv').parse(require('node:fs').readFileSync('backend/.env'));
  assert.match(env.MONGO_URI || '', /^mongodb:\/\/(?:127\.0\.0\.1|localhost):27017\/discowarpcore_dev(?:\?|$)/);
  const dbName = `discowarpcore_complex_test_${randomUUID().replaceAll('-', '')}`;
  await mongoose.connect(env.MONGO_URI, { dbName, serverSelectionTimeoutMS: 5000, autoIndex: false, autoCreate: false });
  const Box = require('../backend/models/Box');
  const Item = require('../backend/models/Item');
  const service = require('../backend/services/boxService');
  const items = require('../backend/services/boxItemService');
  const { buildBoxJsonExport, buildBoxCsvExport } = require('../backend/services/boxExportService');
  try {
    const kitchen = await service.createBox({ box_id: '501', label: 'Kitchen', isComplexBox: true, compartments: FIXTURES[2].compartments });
    await assert.rejects(service.createBox({ box_id: '502', label: 'No shelf', parentBox: kitchen._id }), /Choose a compartment/);
    await assert.rejects(service.createBox({ box_id: '502', label: 'Cabinet only', parentBox: kitchen._id, parentCompartmentKey: 'B' }), /shelf/);
    const jewelry = await service.createBox({ box_id: '502', label: 'Jewelry box', parentBox: kitchen._id, parentCompartmentKey: 'B2' });
    const jar = await service.createBox({ box_id: '503', label: 'Jar', parentBox: jewelry._id });
    const crystal = await items.createItemInBox(jar._id, { name: 'Crystal', quantity: 1 });
    const plate = await items.createItemInBox(kitchen._id, { name: 'Plate', compartmentKey: 'B1' });
    assert.equal((await service.getBoxByMongoId(jewelry._id)).parentCompartmentKey, 'B2');
    await service.updateBox(jewelry._id, { parentBox: kitchen._id, parentCompartmentKey: 'B3' });
    assert.equal((await service.getBoxTreeByShortId('501')).childBoxes[0].parentCompartmentKey, 'B3');
    await service.updateBox(jewelry._id, { parentBox: kitchen._id, parentCompartmentKey: 'B2' }); // Undo
    assert.equal(String((await Box.findById(jar._id).lean()).parentBox), String(jewelry._id));
    await items.attachItemToBox({ itemId: plate._id, boxId: kitchen._id, compartmentKey: 'B2' });
    await items.attachItemToBox({ itemId: plate._id, boxId: kitchen._id });
    assert.equal((await Box.findById(kitchen._id).lean()).itemCompartments[plate._id], 'B2');
    await items.attachItemToBox({ itemId: plate._id, boxId: kitchen._id, compartmentKey: 'B1' }); // Undo
    assert.equal((await Box.findById(kitchen._id).lean()).items.length, 1);
    const { getRetrievalItemsPage, getRetrievalBoxesPage } = require('../backend/services/retrievalService');
    assert.equal((await getRetrievalItemsPage({ q: '501B1' })).items[0].name, 'Plate');
    assert.equal((await getRetrievalBoxesPage({ q: '501B2' })).boxes[0].boxLabel, 'Jewelry box');
    assert.equal((await service.getBoxesByParent(kitchen._id))[0].parentCompartmentKey, 'B2');
    await items.addItemsToBox(kitchen._id, [plate._id], 'B3');
    assert.equal((await Box.findById(kitchen._id).lean()).itemCompartments[plate._id], 'B3');
    await items.addItemsToBox(kitchen._id, [plate._id], 'B1');
    await assert.rejects(items.createItemInBox(kitchen._id, { name: 'Invalid', compartmentKey: 'B' }), /shelf/);
    assert.equal(await Item.countDocuments({ name: 'Invalid' }), 0);
    const tree = await service.getBoxDataStructure('501', { flat: 'all', includeStats: true });
    assert.equal(tree.tree.childBoxes[0].childBoxes[0].items[0].name, 'Crystal');
    assert.equal(tree.flatItems.length, 2);
    const exported = (await buildBoxJsonExport(kitchen._id, { frontendBaseOrigin: 'http://localhost:7611' })).payload;
    assert.equal(exported.directContents.childBoxes[0].parentCompartmentKey, 'B2');
    assert.equal(exported.directContents.items[0].compartmentKey, 'B1');
    assert.deepEqual(validateCompartments(JSON.parse(JSON.stringify(exported.box.compartments))), FIXTURES[2].compartments);
    assert.equal(exported.box.childBoxCompartments[jewelry._id], 'B2');
    assert.match((await buildBoxCsvExport(kitchen._id, { frontendBaseOrigin: 'http://localhost:7611' })).csv, /B1/);
    await service.updateBox(kitchen._id, { isComplexBox: false });
    assert.equal((await service.getBoxByMongoId(jewelry._id)).parentCompartmentKey, '');
    await service.updateBox(kitchen._id, { isComplexBox: true });
    assert.equal((await service.getBoxByMongoId(jewelry._id)).parentCompartmentKey, 'B2');
    // Deep physical chains do not consume compartment layers.
    let parent = jar;
    for (let index = 0; index < 5; index++) parent = await service.createBox({ box_id: String(510 + index), label: `Inner ${index}`, parentBox: parent._id });
    await assert.rejects(service.updateBox(kitchen._id, { parentBox: parent._id }), /cycle/i);
    await assert.rejects(service.updateBox(jar._id, { parentBox: jar._id }), /cycle/i);
    const innerComplex = await service.createBox({ box_id: '520', label: 'Inner complex', parentBox: parent._id, isComplexBox: true, compartments: FIXTURES[1].compartments });
    await items.createItemInBox(innerComplex._id, { name: 'Inner sample', compartmentKey: 'D2' });
    await service.updateBox(jewelry._id, { parentBox: null });
    assert.equal(getChildBoxCompartment(await Box.findById(kitchen._id).lean(), jewelry._id), '');
    assert.equal((await service.getBoxByMongoId(jewelry._id)).parentCompartmentKey, '');
    await service.updateBox(jewelry._id, { parentBox: kitchen._id, parentCompartmentKey: 'A' });
    const before = await Box.findById(kitchen._id).lean();
    const split = before.compartments.map((row) => row.key === 'A' ? { ...row, children: [{ key: 'A1', label: 'Upper' }, { key: 'A2', label: 'Lower' }] } : row);
    const cup = await items.createItemInBox(kitchen._id, { name: 'Cup', compartmentKey: 'A' });
    const snapshot = JSON.stringify(await Box.findById(kitchen._id).lean());
    await assert.rejects(service.updateBox(kitchen._id, { compartments: split }), /shelf/);
    await assert.rejects(service.updateBox(kitchen._id, { compartments: split, compartmentReassignments: { items: { [cup._id]: 'A1' } } }), /shelf/);
    assert.equal(JSON.stringify(await Box.findById(kitchen._id).lean()), snapshot);
    await service.updateBox(kitchen._id, { compartments: split, compartmentReassignments: { items: { [cup._id]: 'A1' }, boxes: { [jewelry._id]: 'A2' } } });
    const after = await Box.findById(kitchen._id).lean();
    assert.equal(after.itemCompartments[cup._id], 'A1');
    assert.equal(after.childBoxCompartments[jewelry._id], 'A2');
    const depth4 = structuredClone(split);
    depth4[0].children[0].children = [{ key: 'A1a' }];
    await assert.rejects(service.updateBox(kitchen._id, { compartments: depth4 }), /three layers/);
    assert.equal(String((await Box.findOne({ items: crystal._id }).lean())._id), String(jar._id));
    // Historical physical children remain unspecified.
    const legacy = await Box.create({ box_id: '530', label: 'Legacy', parentBox: kitchen._id });
    assert.equal((await service.getBoxByMongoId(legacy._id)).parentCompartmentKey, '');
    const plain = await service.createBox({ box_id: '531', label: 'New physical box' });
    await assert.rejects(service.updateBox(plain._id, { parentBox: kitchen._id, parentCompartmentKey: '', restoreUnspecifiedPlacement: true }), /Choose a compartment/);
    await service.updateBox(legacy._id, { parentBox: null });
    await service.updateBox(legacy._id, { parentBox: kitchen._id, parentCompartmentKey: '', restoreUnspecifiedPlacement: true });
    assert.equal((await service.getBoxByMongoId(legacy._id)).parentCompartmentKey, '');
    await service.releaseChildrenToFloor(kitchen._id);
    assert.equal(String((await Box.findById(jar._id).lean()).parentBox), String(jewelry._id));
    assert.deepEqual((await Box.findById(kitchen._id).lean()).childBoxCompartments, {});
  } finally {
    assert.equal(mongoose.connection.name, dbName);
    try { await mongoose.connection.dropDatabase(); }
    finally { await mongoose.disconnect(); }
  }
});
