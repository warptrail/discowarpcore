const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { getRetrievalItemsPage, getRetrievalBoxesPage } = require('../backend/services/retrievalService');
const { createLocation, renameLocation } = require('../backend/services/locationService');
const Item = require('../backend/models/Item');
const Location = require('../backend/models/Location');

test('structured Exact Spot propagates through box and item retrieval and dossier responses', { skip: process.env.LOCAL_MONGO_TEST !== '1' }, async () => {
  const dbName = `location_retrieval_${process.pid}_${Date.now()}_test`;
  try {
    await mongoose.connect(`mongodb://127.0.0.1:27017/${dbName}`, { serverSelectionTimeoutMS: 5000, autoIndex: false });
    const locationId = new mongoose.Types.ObjectId();
    const itemId = new mongoose.Types.ObjectId();
    const parentId = new mongoose.Types.ObjectId();
    const childId = new mongoose.Types.ObjectId();
    await mongoose.connection.db.collection('locations').insertOne({ _id: locationId, room: 'Office', vicinity: 'Closet', specifics: 'Top shelf', exactSpot: 'Behind blue bin' });
    await mongoose.connection.db.collection('items').insertOne({ _id: itemId, name: 'QA item', item_status: 'active', location: 'Old string' });
    await mongoose.connection.db.collection('boxes').insertMany([
      { _id: parentId, box_id: '990', label: 'Parent', locationId, items: [] },
      { _id: childId, box_id: '991', label: 'Child', parentBox: parentId, items: [itemId] },
    ]);
    let items = await getRetrievalItemsPage({ q: 'Behind blue bin' });
    assert.equal(items.items.length, 1);
    assert.equal(items.items[0].locationLabel, 'Office · Closet · Top shelf · Behind blue bin');
    const boxes = await getRetrievalBoxesPage({ q: 'Behind blue bin' });
    assert.equal(boxes.boxes.length, 2);
    assert.equal(boxes.boxes.find(box => box.boxId === '991').locationLabel, items.items[0].locationLabel);
    let detail = await Item.findItemById(itemId);
    assert.equal(detail.inheritedLocation, items.items[0].locationLabel);
    await mongoose.connection.db.collection('boxes').updateOne({ _id: childId }, { $set: { locationId } });
    detail = await Item.findItemById(itemId);
    assert.equal(detail.box.locationId.exactSpot, 'Behind blue bin');
    assert.equal(detail.location, 'Old string');
    await Location.collection.createIndex({ room: 1, vicinity: 1, specifics: 1, exactSpot: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
    const structure = { room: 'Office', vicinity: 'Closet', specifics: 'Top shelf', exactSpot: 'Right' };
    const concurrent = await Promise.allSettled([createLocation(structure), createLocation(structure)]);
    assert.equal(concurrent.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(concurrent.find(result => result.status === 'rejected').reason.status, 409);
    await assert.rejects(renameLocation(locationId, structure), (error) => error.status === 409);
  } finally {
    if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
