const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');

test('address-aware Retrieval pages, ownership, counts, bulk placement, and reads', { skip: process.env.RUN_COMPLEX_BOX_INTEGRATION !== '1', timeout: 30000 }, async () => {
  const env = require('dotenv').parse(require('node:fs').readFileSync('backend/.env'));
  assert.match(env.MONGO_URI, /^mongodb:\/\/(127\.0\.0\.1|localhost):27017\/discowarpcore_dev/);
  await mongoose.connect(env.MONGO_URI, { dbName: `discowarpcore_address_test_${randomUUID().replaceAll('-', '')}`, serverSelectionTimeoutMS: 5000, autoIndex: false, autoCreate: false });
  const Box = require('../backend/models/Box');
  const Item = require('../backend/models/Item');
  const service = require('../backend/services/boxService');
  const placement = require('../backend/services/boxItemService');
  const itemService = require('../backend/services/itemService');
  const retrieval = require('../backend/services/retrievalService');
  try {
    const compartments = Array.from({ length: 26 }, (_, index) => {
      const key = String.fromCharCode(65 + index);
      return { key, label: `Cabinet ${key}`, ...(key === 'Z' ? { children: Array.from({ length: 99 }, (_, index) => ({ key: `Z${index + 1}`, label: index === 98 ? 'Very top crystal shelf' : `Shelf ${index + 1}` })) } : {}) };
    });
    const kitchen = await service.createBox({ box_id: '004', label: 'Kitchen', isComplexBox: true, compartments });
    const jewelry = await service.createBox({ box_id: '600', label: 'Jewelry', parentBox: kitchen._id, parentCompartmentKey: 'Z99' });
    const jar = await service.createBox({ box_id: '601', label: 'Jar', parentBox: jewelry._id });
    const crystal = await placement.createItemInBox(jar._id, { name: 'Crystal sample', category: 'miscellaneous', quantity: 3, tags: ['mineral'] });
    await placement.createItemInBox(kitchen._id, { name: 'Mug', compartmentKey: 'A', quantity: 2 });
    const all = await retrieval.getRetrievalBoxesPage({ addressScope: '004', includeCabinets: true, sort: 'box', limit: 100 });
    assert.equal(all.total, 29); // three real boxes, twenty-six cabinet views
    assert.equal(all.physicalBoxMatches, 3);
    assert.equal(all.cabinetMatches, 26);
    assert.equal(all.analytics.metrics.boxCount, 3);
    assert.equal(all.analytics.metrics.itemRecordCount, 2);
    assert.equal(all.analytics.metrics.itemQuantity, 5);
    assert.equal(new Set(all.boxes.map(row => row.resultKey)).size, 29);
    const page = await retrieval.getRetrievalBoxesPage({ addressScope: '004', includeCabinets: true, sort: 'box', offset: 26, limit: 1 });
    assert.equal(page.boxes[0].address, '004Z');
    assert.equal(page.boxes[0].ownerBoxLabel, 'Kitchen');
    const scoped = await retrieval.getRetrievalItemsPage({ addressScope: '#004z99', q: 'crystal', tag: 'mineral' });
    assert.equal(scoped.total, 1);
    assert.equal(scoped.items[0].boxId, String(jar._id));
    assert.equal(scoped.items[0].boxNumber, '601');
    assert.match(scoped.items[0].placementTrail, /004Z99/);
    assert.equal((await retrieval.getRetrievalItemsPage({ addressScope: '004A', q: 'crystal' })).total, 0);
    const section = await retrieval.getRetrievalBoxesPage({ addressScope: '004Z99', includeCabinets: true, q: 'crystal' });
    assert.equal(section.cabinetMatches, 1);
    assert.equal(section.analytics.metrics.itemQuantity, 3);
    assert.equal((await retrieval.getRetrievalBoxesPage({})).boxes.some(row => row.kind === 'cabinet'), false);
    const read = await service.getBoxDataStructure('#004z99', { flat: 'items' });
    assert.equal(read.tree.childBoxes[0].childBoxes[0].items[0].name, crystal.name);
    assert.equal(read.flatItems.length, 1);
    await assert.rejects(service.getBoxDataStructure('004Z100'), /complete/);
    await assert.rejects(retrieval.getRetrievalItemsPage({ addressScope: '004Z100' }), /Invalid address/);
    assert.equal((await retrieval.getRetrievalItemsPage({ addressScope: '004Z98', q: 'crystal' })).total, 0);
    const count = await Item.countDocuments();
    await assert.rejects(itemService.bulkCreateItems({ itemNames: ['Invalid'], boxShortId: '004Z' }), /shelf/);
    await assert.rejects(itemService.bulkCreateItems({ itemNames: ['Invalid'], boxShortId: '004Z100' }), /address/);
    assert.equal(await Item.countDocuments(), count);
    const bulk = await itemService.bulkCreateItems({ itemNames: ['Tiny one', 'Tiny two'], boxShortId: '#004z99' });
    assert.equal(bulk.destination.address, '004Z99');
    const stored = await Box.findById(kitchen._id).lean();
    for (const id of bulk.createdItemIds) assert.equal(stored.itemCompartments[id], 'Z99');
    const rootRead = await service.getBoxDataStructure('004');
    const { cabinetView } = await import('../frontend/src/util/boxAddressViews.js');
    const view = cabinetView(rootRead.tree, 'Z99');
    assert.equal(view.items.find(item => String(item._id) === String(crystal._id)).ownerBoxId, '601');
  } finally {
    try { await mongoose.connection.dropDatabase(); }
    finally { await mongoose.disconnect(); }
  }
});
