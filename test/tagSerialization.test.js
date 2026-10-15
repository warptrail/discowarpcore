const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const mongoose = require('mongoose');
const Box = require('../backend/models/Box');
const Item = require('../backend/models/Item');
const { tagsJsonReplacer } = require('../backend/utils/tagSerialization');

function serialize(payload) {
  const app = express();
  app.set('json replacer', tagsJsonReplacer);
  const response = Object.create(express.response);
  response.app = app;
  response.get = () => undefined;
  response.set = () => response;
  response.send = (body) => JSON.parse(body);
  return response.json(payload);
}

test('Express lowercases nested legacy box/item tags without mutating source records', () => {
  const payload = {
    label: 'Other Drawers', tags: ['Junk Drawers', 'DIY'],
    items: [{ name: 'USB Cable', tags: ['Electronics', 'USB-C'], notes: 'Keep USB-C case' }],
  };
  const original = structuredClone(payload);
  assert.deepEqual(serialize(payload), {
    label: 'Other Drawers', tags: ['junk drawers', 'diy'],
    items: [{ name: 'USB Cable', tags: ['electronics', 'usb-c'], notes: 'Keep USB-C case' }],
  });
  assert.deepEqual(payload, original);
});

test('tag facets and aggregated item tags use lowercase labels while preserving filter keys', () => {
  assert.deepEqual(serialize({
    facets: { tags: [{ key: 'home improvement', label: 'Home Improvement', count: 3 }] },
    itemTags: ['Gardening', 'CAFÉ'],
    categories: [{ key: 'tools', label: 'Tools' }],
  }), {
    facets: { tags: [{ key: 'home improvement', label: 'home improvement', count: 3 }] },
    itemTags: ['gardening', 'café'],
    categories: [{ key: 'tools', label: 'Tools' }],
  });
});

test('legacy Mongoose records serialize lowercase tags, preserving IDs and dates', () => {
  const id = new mongoose.Types.ObjectId();
  const date = new Date('2026-10-13T12:00:00Z');
  const box = Box.hydrate({ _id: id, box_id: '002', label: 'Other Drawers', tags: ['Junk Drawers'] });
  const item = Item.hydrate({ _id: id, name: 'Keepsake', tags: ['Sentimental'] });
  const result = serialize({ box, item, date });
  assert.deepEqual(result.box.tags, ['junk drawers']);
  assert.deepEqual(result.item.tags, ['sentimental']);
  assert.equal(result.box._id, id.toString());
  assert.equal(result.date, date.toISOString());
  assert.equal(box.tags[0], 'Junk Drawers');
  assert.equal(item.tags[0], 'Sentimental');
  assert.equal(box.isModified('tags'), false);
});

for (const [name, Model, fields] of [
  ['box', Box, { box_id: '002', label: 'Other Drawers' }],
  ['item', Item, { name: 'Keepsake' }],
]) {
  test(`${name} tags normalize when created, replaced or appended`, () => {
    const document = new Model({ ...fields, tags: ['Junk Drawers', 'CAFÉ'] });
    assert.deepEqual([...document.tags], ['junk drawers', 'café']);
    document.tags = ['DIY'];
    document.tags.push('Electronics');
    assert.deepEqual([...document.tags], ['diy', 'electronics']);
    assert.equal(document.validateSync(), undefined);
    document.tags = [];
    assert.deepEqual([...document.tags], []);
  });
  test(`${name} tag updates lowercase replacement and appended values before database writes`, async () => {
    const original = Model.collection.updateOne;
    const writes = [];
    Model.collection.updateOne = async (_filter, update) => {
      writes.push(update);
      return { acknowledged: true, modifiedCount: 1 };
    };
    try {
      const filter = { _id: new mongoose.Types.ObjectId() };
      await Model.updateOne(filter, { $set: { tags: ['Junk Drawers'] } });
      await Model.updateOne(filter, { $addToSet: { tags: { $each: ['DIY', 'Home Improvement'] } } });
      await Model.updateOne(filter, { $push: { tags: 'GARDENING' } });
      assert.deepEqual(writes[0].$set.tags, ['junk drawers']);
      assert.deepEqual(writes[1].$addToSet.tags.$each, ['diy', 'home improvement']);
      assert.equal(writes[2].$push.tags, 'gardening');
    } finally {
      Model.collection.updateOne = original;
    }
  });
}

test('missing tags, empty tags and unrelated strings preserve their API shape', () => {
  assert.deepEqual(serialize({ tags: [], item: { name: 'UPPERCASE', tags: null } }), {
    tags: [], item: { name: 'UPPERCASE', tags: null },
  });
  assert.deepEqual(serialize({ item: { name: 'UPPERCASE' } }), { item: { name: 'UPPERCASE' } });
});
