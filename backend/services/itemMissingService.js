const Item = require('../models/Item');
const Box = require('../models/Box');
const { withItemMutationLock } = require('../utils/itemMutationLock');
const { fail, missingCount, missingRevision, validateMissingRequest, buildMissingUpdate } = require('../utils/itemMissing');
const { logEventBestEffort } = require('./eventLogService');

const missingFilter = { item_status: { $ne: 'gone' }, 'missing.quantity': { $gt: 0 } };
function placementSnapshot(item) {
  return { boxId: item.box?._id ? String(item.box._id) : null,
    boxNumber: item.box?.box_id || '', boxName: item.box?.label || '',
    compartmentKey: item.box?.compartmentKey || '', placementLabel: item.box?.placementLabel || item.box?.box_id || '',
    location: item.inheritedLocation || item.box?.location || item.location || '' };
}
async function getMissingSummary() {
  const [summary] = await Item.aggregate([{ $match: missingFilter }, { $group: { _id: null,
    records: { $sum: 1 }, objects: { $sum: '$missing.quantity' } } }]);
  return { records: summary?.records || 0, objects: summary?.objects || 0 };
}
async function getMissingItems({ q = '', limit = 25, offset = 0 } = {}) {
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
  const safeOffset = Math.max(0, parseInt(offset, 10) || 0);
  const filter = { ...missingFilter };
  const text = String(q).trim().slice(0, 200);
  if (text) filter.name = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const [ids, total, summary] = await Promise.all([
    Item.find(filter).select('_id').sort({ 'missing.reportedAt': -1, _id: -1 }).skip(safeOffset).limit(safeLimit).lean(),
    Item.countDocuments(filter), getMissingSummary(),
  ]);
  const items = (await Promise.all(ids.map(row => Item.findItemById(row._id)))).filter(Boolean)
    .map(({ missingHistory, ...item }) => item);
  return { items, total, summary, limit: safeLimit, offset: safeOffset, hasMore: safeOffset + items.length < total };
}
async function mirrorHistory(item, entry) {
  const types = { report: 'item_missing_reported', correction: 'item_missing_corrected', found: 'item_found', departed: 'item_missing_departed' };
  await logEventBestEffort({ event_type: types[entry.action], entity_type: 'item', entity_id: String(item._id),
    entity_label: item.name, summary: `${item.name}: ${entry.action}, ${entry.before} → ${entry.after} missing`,
    details: entry });
}
async function saveMissing(id, body, found = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Provide a missing-item update.');
  return withItemMutationLock(id, async token => {
    const item = await Item.findItemById(id);
    if (!item) fail('Item not found', 404);
    const count = validateMissingRequest(item, body, found);
    const originalPlacement = placementSnapshot(item);
    let destination = originalPlacement;
    let moved = false;
    if (found) {
      if (body.placementConfirmed !== true) fail('Confirm the recovered objects have been put away.');
      if (!body.placement || typeof body.placement !== 'object') fail('Confirm the recorded home or select a new home.');
      const expected = body.placement.expected;
      if (!expected || expected.boxId !== originalPlacement.boxId || (expected.compartmentKey || '') !== originalPlacement.compartmentKey) fail('The recorded home changed. Review its current placement.', 409);
      if (body.placement.mode === 'new') {
        if (count !== missingCount(item) || body.placement.wholeRecordConfirmed !== true) fail('A new home requires recovery of every missing object and confirmation for the entire inventory quantity.');
        if (!body.placement.boxId) fail('Select a destination box.');
        // Validate before moving. Use the existing placement operation under the same lease.
        const target = await Box.findById(body.placement.boxId).lean();
        if (!target) fail('Destination box no longer exists.', 409);
        const { attachItemToBox } = require('./boxItemService');
        await attachItemToBox({ itemId: id, boxId: target._id, compartmentKey: body.placement.compartmentKey,
          mutationToken: token });
        moved = true;
        const refreshed = await Item.findItemById(id);
        destination = placementSnapshot(refreshed);
        if (destination.boxId !== String(target._id) || (body.placement.compartmentKey !== undefined && destination.compartmentKey !== body.placement.compartmentKey)) fail('Placement could not be verified. The missing report remains open.', 409);
      } else if (body.placement.mode !== 'home') fail('Choose the recorded home or a new home.');
    }
    const update = buildMissingUpdate(item, { quantity: found ? missingCount(item) - count : count,
      action: found ? 'found' : body.action, profile: body.profile, note: body.note || '',
      placement: destination, fromPlacement: originalPlacement });
    const revision = missingRevision(item);
    const result = await Item.findOneAndUpdate({ _id: id, quantity: item.quantity, item_status: { $ne: 'gone' },
      'mutationLease.token': token,
      ...(revision ? { 'missing.revision': revision } : { $or: [{ 'missing.revision': 0 }, { 'missing.revision': { $exists: false } }] }),
    }, update, { new: true, runValidators: true });
    if (!result) fail(moved ? 'The home changed, but recovery was not saved. The report remains open; review the current record.' : 'This item changed. Review the current record and try again.', 409);
    await mirrorHistory(result, update.$push.missingHistory);
    return Item.findItemById(id);
  });
}
module.exports = { getMissingItems, getMissingSummary, saveMissing, placementSnapshot, mirrorHistory };
