const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const Item = require('../backend/models/Item');
const Box = require('../backend/models/Box');
require('../backend/models/Location');
const { EventLog } = require('../backend/models/EventLog');
const { saveMissing, getMissingItems, getMissingSummary } = require('../backend/services/itemMissingService');
const { updateItem, markItemGone, restoreItemToActive } = require('../backend/services/itemService');
const { attachItemToBox, removeItemFromBox } = require('../backend/services/boxItemService');
const { patchMissingApi, patchFoundApi } = require('../backend/controllers/itemMissingController');
const enabled = process.env.DWC_MISSING_DB_TEST === '1';
const database = `dwc_missing_test_${randomUUID().replaceAll('-', '')}`;
let record, home, target;
before(async () => {
  if (!enabled) return;
  await mongoose.connect(`mongodb://127.0.0.1:27017/${database}`, { serverSelectionTimeoutMS: 5000 });
});
after(async () => {
  if (!enabled || mongoose.connection.readyState !== 1) return;
  assert.equal(mongoose.connection.name, database);
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
beforeEach(async () => {
  if (!enabled) return;
  await Promise.all([Item.deleteMany({}), Box.deleteMany({}), EventLog.deleteMany({})]);
  record = await Item.create({ name: 'Fixture flashlight', quantity: 4 });
  home = await Box.create({ box_id: '043', label: 'Shelf hook', items: [record._id], isComplexBox: true, itemCompartments: { [record._id]: 'B' } });
  target = await Box.create({ box_id: '044', label: 'New home', isComplexBox: true });
});
const request = (extra = {}) => ({ profile: 'discofish', expectedQuantity: 4, expectedRevision: 0, quantity: 2, action: 'report', ...extra });
const found = (extra = {}) => ({ profile: 'laserfox', expectedQuantity: 4, expectedRevision: 1, recoveredQuantity: 1, placementConfirmed: true,
  placement: { mode: 'home', expected: { boxId: String(home._id), compartmentKey: 'B' } }, ...extra });
const scenario = (name, work) => test(name, { skip: !enabled }, work);
scenario('reports and partial recoveries preserve membership, compartments and quantity', async () => {
  let updated = await saveMissing(record._id, request());
  assert.equal(updated.missing.quantity, 2); assert.equal(updated.box.placementLabel, '043B');
  assert.equal(updated.quantity, 4); assert.equal(updated.mutationLease, undefined);
  assert.deepEqual(await getMissingSummary(), { records: 1, objects: 2 });
  assert.equal((await getMissingItems({ q: 'flashlight' })).total, 1);
  assert.equal((await getMissingItems({ q: '[.*' })).total, 0);
  updated = await saveMissing(record._id, found(), true);
  assert.equal(updated.missing.quantity, 1); assert.equal(updated.missingHistory.length, 2);
  assert.equal(updated.missingHistory[1].profile, 'laserfox');
  await assert.rejects(saveMissing(record._id, found(), true), err => err.status === 409);
  updated = await saveMissing(record._id, found({ expectedRevision: 2 }), true);
  assert.equal(updated.missing.quantity, 0); assert.equal(updated.quantity, 4);
  assert.equal(updated.box.placementLabel, '043B');
  assert.deepEqual(await getMissingSummary(), { records: 0, objects: 0 });
});
scenario('two devices cannot apply the same revision twice', async () => {
  const results = await Promise.allSettled([saveMissing(record._id, request()), saveMissing(record._id, request({ profile: 'laserfox' }))]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.find(result => result.status === 'rejected').reason.status, 409);
  const stored = await Item.findById(record._id).lean();
  assert.equal(stored.missingHistory.length, 1); assert.equal(stored.mutationLease, undefined);
});
scenario('new home requires all recovered, whole-record confirmation and a valid compartment', async () => {
  await saveMissing(record._id, request());
  const placement = { mode: 'new', expected: { boxId: String(home._id), compartmentKey: 'B' }, boxId: String(target._id), compartmentKey: 'B', wholeRecordConfirmed: true };
  await assert.rejects(saveMissing(record._id, found({ placement }), true), /every missing/);
  await assert.rejects(saveMissing(record._id, found({ placement: { ...placement, wholeRecordConfirmed: false }, recoveredQuantity: 2 }), true), /entire inventory/);
  await assert.rejects(saveMissing(record._id, found({ placement: { ...placement, compartmentKey: 'Z' }, recoveredQuantity: 2 }), true), /valid compartment/);
  const updated = await saveMissing(record._id, found({ placement, recoveredQuantity: 2 }), true);
  assert.equal(updated.box.placementLabel, '044B'); assert.equal(updated.missing.quantity, 0);
  assert.equal((await Box.findById(home._id)).items.length, 0);
  assert.equal(updated.missingHistory[1].fromPlacement.boxNumber, '043');
});
scenario('missing state cannot be patched and quantity reductions cannot hide missing objects', async () => {
  await saveMissing(record._id, request());
  for (const patch of [{ missing: { quantity: 0 } }, { 'missing.quantity': 0 }, { $set: { quantity: 1 } }, { missingHistory: [] }, { isMissing: false }]) {
    await assert.rejects(updateItem(record._id, patch), /Missing Items/);
  }
  await assert.rejects(updateItem(record._id, { quantity: 1 }), /less than the missing/);
  await assert.rejects(updateItem(record._id, { item_status: 'gone', disposition: 'lost' }), /departure action/);
  await updateItem(record._id, { notes: 'Checked the hook', quantity: 5 });
  assert.equal((await Item.findById(record._id)).missing.quantity, 2);
  await assert.rejects(saveMissing(record._id, found(), true), err => err.status === 409);
});
scenario('permanent departure closes missing history and restore does not reopen it', async () => {
  await saveMissing(record._id, request());
  const gone = await markItemGone(record._id, { disposition: 'lost', profile: 'laserfox' });
  assert.equal(gone.missing.quantity, 0); assert.equal(gone.item_status, 'gone');
  assert.equal(gone.missingHistory.at(-1).action, 'departed');
  assert.equal(gone.missingHistory.at(-1).placement.placementLabel, '043B');
  const restored = await restoreItemToActive(record._id, {});
  assert.equal(restored.missing.quantity, 0);
  assert.equal((await EventLog.countDocuments({ event_type: 'item_missing_departed' })), 1);
});
scenario('ordinary moves and unboxing preserve flags; Found rejects a stale home', async () => {
  await saveMissing(record._id, request());
  await attachItemToBox({ itemId: record._id, boxId: target._id, compartmentKey: 'A' });
  await assert.rejects(saveMissing(record._id, found(), true), err => err.status === 409);
  await removeItemFromBox(target._id, record._id);
  const unboxed = await Item.findItemById(record._id);
  assert.equal(unboxed.box, null); assert.equal(unboxed.missing.quantity, 2);
  const resolved = await saveMissing(record._id, found({ recoveredQuantity: 2, placement: { mode: 'home', expected: { boxId: null, compartmentKey: '' } } }), true);
  assert.equal(resolved.box, null); assert.equal(resolved.missing.quantity, 0);
});
scenario('correction cancels report without fabricating recovery', async () => {
  await saveMissing(record._id, request());
  const updated = await saveMissing(record._id, request({ expectedRevision: 1, quantity: 0, action: 'correction', note: 'Count was mistaken' }));
  assert.equal(updated.missingHistory.at(-1).action, 'correction');
  assert.equal(updated.box.placementLabel, '043B');
});
scenario('deleted destinations and unconfirmed placement leave reports untouched', async () => {
  await saveMissing(record._id, request());
  await assert.rejects(saveMissing(record._id, found({ placementConfirmed: false }), true), /put away/);
  await Box.deleteOne({ _id: target._id });
  await assert.rejects(saveMissing(record._id, found({ recoveredQuantity: 2, placement: { mode: 'new', expected: { boxId: String(home._id), compartmentKey: 'B' }, boxId: String(target._id), wholeRecordConfirmed: true } }), true), err => err.status === 409);
  const updated = await Item.findItemById(record._id);
  assert.equal(updated.missing.quantity, 2); assert.equal(updated.box.placementLabel, '043B');
});
scenario('controller returns HTTP conflict with refreshed state and validates failed recovery', async () => {
  await saveMissing(record._id, request());
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
  await patchMissingApi({ params: { id: String(record._id) }, body: request() }, response);
  assert.equal(response.statusCode, 409); assert.equal(response.body.data.missing.quantity, 2);
  await patchFoundApi({ params: { id: String(record._id) }, body: found({ recoveredQuantity: 3 }) }, response);
  assert.equal(response.statusCode, 400); assert.equal(response.body.data.box.placementLabel, '043B');
});
scenario('recovery-save failure after relocation retains the flag and exposes the new actual home', async () => {
  await saveMissing(record._id, request());
  const original = Item.findOneAndUpdate;
  Item.findOneAndUpdate = function(query, update, options) {
    if (update?.$set?.missing && update.$push?.missingHistory?.action === 'found') {
      return Promise.reject(new Error('Injected recovery write failure'));
    }
    return original.call(this, query, update, options);
  };
  try {
    await assert.rejects(saveMissing(record._id, found({ recoveredQuantity: 2, placement: {
      mode: 'new', expected: { boxId: String(home._id), compartmentKey: 'B' },
      boxId: String(target._id), compartmentKey: 'B', wholeRecordConfirmed: true,
    } }), true), /Injected recovery/);
  } finally { Item.findOneAndUpdate = original; }
  const current = await Item.findItemById(record._id);
  assert.equal(current.box.placementLabel, '044B'); assert.equal(current.missing.quantity, 2);
  assert.equal(current.missingHistory.length, 1);
  assert.equal(await Item.exists({ _id: record._id, 'mutationLease.token': { $exists: true } }), null);
});

scenario('emptying a box retains missing counts while clearing the recorded home', async () => {
  await saveMissing(record._id, request());
  const { emptyBoxItems } = require('../backend/services/boxItemService');
  await emptyBoxItems(home._id);
  const current = await Item.findItemById(record._id);
  assert.equal(current.box, null); assert.equal(current.missing.quantity, 2);
  assert.equal(current.missingHistory.length, 1);
});
