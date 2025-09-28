// services/itemService.js
const Item = require('../models/Item');
const Box = require('../models/Box');

/**
 * Get all items with breadcrumb + box info.
 * (This one still builds maps — fine for bulk fetch.)
 */
async function getAllItems() {
  const items = await Item.find().lean();

  const boxes = await Box.find()
    .select('_id box_id label description items parentBox')
    .lean();

  // itemId -> leaf box id
  const itemToLeafId = new Map();
  for (const b of boxes) {
    for (const itemId of b.items || []) {
      itemToLeafId.set(String(itemId), String(b._id));
    }
  }

  // build maps using helpers
  const { buildBoxMaps, makeBreadcrumb } = require('../utils/boxHelpers');
  const maps = buildBoxMaps(boxes);

  return items.map((i) => {
    const leafId = itemToLeafId.get(String(i._id));
    const { breadcrumb, depth, rootBox, leafBox } = makeBreadcrumb(
      leafId,
      maps
    );

    const box =
      leafBox && maps.byId.get(String(leafBox._id))
        ? {
            _id: maps.byId.get(String(leafBox._id))._id,
            box_id: maps.byId.get(String(leafBox._id)).box_id,
            label: maps.byId.get(String(leafBox._id)).label,
          }
        : null;

    return { ...i, box, breadcrumb, depth, topBox: rootBox };
  });
}

/**
 * Get a single item by id with breadcrumb + box info.
 * Delegates to Item model static.
 */
async function getItemById(id, { select } = {}) {
  return await Item.findItemById(id, { select });
}

/**
 * Orphaned items
 */
async function getOrphanedItems(sort, limit) {
  const order =
    sort === 'alpha'
      ? { name: 1 }
      : sort === 'oldest'
      ? { orphanedAt: 1 }
      : { orphanedAt: -1 };

  return Item.find({ orphanedAt: { $ne: null } })
    .sort(order)
    .limit(limit)
    .lean();
}

/**
 * CRUD operations
 */
async function createItem(data) {
  assertValidCentsPayload(data);
  return Item.create(data);
}

async function updateItem(id, data) {
  assertValidCentsPayload(data);
  return Item.findByIdAndUpdate(id, data, { new: true, runValidators: true });
}

async function deleteItem(id) {
  return Item.findByIdAndDelete(id);
}

/**
 * Maintenance helpers
 */
async function backfillOrphanedTimestamps() {
  const items = await Item.find({ orphanedAt: null }).lean();
  const boxes = await Box.find().select('items').lean();

  const boxedItemIds = new Set();
  boxes.forEach((box) => {
    box.items.forEach((itemId) => boxedItemIds.add(itemId.toString()));
  });

  let updatedCount = 0;
  for (const item of items) {
    if (!boxedItemIds.has(item._id.toString())) {
      await Item.findByIdAndUpdate(item._id, { orphanedAt: new Date() });
      updatedCount++;
    }
  }
  return updatedCount;
}

async function orphanAllItemsInBox(boxId) {
  return Item.updateMany(
    { boxId },
    { $set: { boxId: null, orphanedAt: new Date() } }
  );
}

/**
 * Validation helper for valueCents
 */
function assertValidCentsPayload(data = {}) {
  if ('value' in data) {
    const err = new Error(
      'Backend expects cents. Do not send "value"; send "valueCents" as a non-negative integer.'
    );
    err.status = 400;
    throw err;
  }
  if ('valueCents' in data) {
    const v = data.valueCents;
    if (typeof v === 'string' && v.includes('.')) {
      const err = new Error(
        'valueCents must be a whole integer (no decimals).'
      );
      err.status = 400;
      throw err;
    }
    const n = Number(v);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
      const err = new Error('valueCents must be a non-negative integer.');
      err.status = 400;
      throw err;
    }
    data.valueCents = n;
  }
  return data;
}

module.exports = {
  getAllItems,
  getItemById,
  getOrphanedItems,
  createItem,
  updateItem,
  deleteItem,
  backfillOrphanedTimestamps,
  orphanAllItemsInBox,
};
