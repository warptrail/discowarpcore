// services/boxItemService.js
const Box = require('../models/Box');
const Item = require('../models/Item');

/**
 * Primitive A:
 * Attach item to exactly one box (single-parent).
 * - Pull from ALL boxes first
 * - Add to destination box (idempotent via $addToSet)
 * - Clear orphaning flags + location (box owns location)
 */
async function attachItemToBox({ itemId, boxId }) {
  // 1) remove from any other box
  await Box.updateMany({ items: itemId }, { $pull: { items: itemId } });

  // 2) add to destination
  const r = await Box.updateOne(
    { _id: boxId },
    { $addToSet: { items: itemId } }
  );
  if (!r.matchedCount && !r.n) throw new Error('Box not found');

  // 3) clear orphan state and wipe ad-hoc item location
  await Item.updateOne(
    { _id: itemId },
    { $unset: { orphanedAt: 1 }, $set: { location: '' } }
  );

  // 4) return destination box (unpopulated)
  return Box.findById(boxId).lean();
}

/**
 * Primitive B:
 * Remove a specific item from a specific box.
 * - Pull from that box (idempotent)
 * - If the item is no longer in ANY box, mark as orphaned and wipe location
 */
async function removeItemFromBox(boxId, itemId) {
  await Box.updateOne({ _id: boxId }, { $pull: { items: itemId } });

  const stillInABox = await Box.exists({ items: itemId });
  if (!stillInABox) {
    await Item.updateOne(
      { _id: itemId },
      { $set: { orphanedAt: new Date(), location: '' } }
    );
  }

  return Box.findById(boxId).lean();
}

/**
 * Create an Item (requires name) and attach to a box.
 * - New items start with orphan flags cleared by the attach primitive
 */
async function createItemInBox(boxId, itemPayload) {
  if (!itemPayload || !itemPayload.name)
    throw new Error('Item name is required');
  const item = await Item.create(itemPayload);
  await attachItemToBox({ itemId: item._id, boxId });
  return item;
}

/**
 * Alias for attach (keep API naming)
 */
async function addItemToBox(boxId, itemId) {
  return attachItemToBox({ itemId, boxId });
}

/**
 * Bulk add items to a box (idempotent). Returns counts + destination box.
 */
async function addItemsToBox(boxId, itemIds) {
  if (!Array.isArray(itemIds) || !itemIds.length) {
    throw new Error('itemIds must be a non-empty array');
  }
  let attached = 0;
  for (const id of itemIds) {
    await attachItemToBox({ itemId: id, boxId });
    attached += 1;
  }
  const box = await Box.findById(boxId).lean();
  return { attached, box };
}

/**
 * Move item between boxes.
 * (No need to pull from the source; attach handles single-parent.)
 */
async function moveItemBetweenBoxes(sourceBoxId, destBoxId, itemId) {
  await attachItemToBox({ itemId, boxId: destBoxId });
  return Box.findById(destBoxId).lean();
}

/**
 * Ensure the item is detached from ALL boxes and marked orphaned (location wiped).
 */
async function detachItem({ itemId }) {
  await Box.updateMany({ items: itemId }, { $pull: { items: itemId } });
  await Item.updateOne(
    { _id: itemId },
    { $set: { orphanedAt: new Date(), location: '' } }
  );
  return { itemId, orphaned: true };
}

/**
 * Alias for "move to box"
 */
async function moveItem({ itemId, toBoxId }) {
  await attachItemToBox({ itemId, boxId: toBoxId });
  return { itemId, toBoxId };
}

/**
 * Empties a box:
 * - Pull all its items
 * - Mark all those items as orphaned and wipe location
 */
async function emptyBoxItems(boxId) {
  const box = await Box.findById(boxId, { items: 1 }).lean();
  if (!box) throw new Error('Box not found');

  const itemIds = box.items || [];
  if (itemIds.length) {
    await Item.updateMany(
      { _id: { $in: itemIds } },
      { $set: { orphanedAt: new Date(), location: '' } }
    );
  }

  await Box.updateOne({ _id: boxId }, { $set: { items: [] } });
  return { boxId, removedCount: itemIds.length };
}

/**
 * Query orphaned items; optional ?since=ISO
 */
async function getOrphanItems({ since } = {}) {
  const q = { orphanedAt: { $ne: null } };
  if (since) q.orphanedAt = { $gte: new Date(since) };
  return Item.find(q).lean();
}

module.exports = {
  // primitives
  attachItemToBox,
  removeItemFromBox,

  // thin wrappers
  createItemInBox,
  addItemToBox,
  addItemsToBox,
  moveItemBetweenBoxes,
  emptyBoxItems,
  detachItem,
  moveItem,
  getOrphanItems,
};
