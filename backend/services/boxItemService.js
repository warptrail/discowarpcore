const Box = require('../models/Box');
const Item = require('../models/Item');

/**
 * Primitive A:
 * Ensure an item is attached to exactly the given box.
 * - Pull from ANY boxes that currently contain it (single-parent invariant)
 * - Add to the destination box (idempotent via $addToSet)
 * - Clear orphanedAt
 */
async function attachItemToBox({ itemId, boxId }) {
  // remove from any other box
  await Box.updateMany({ items: itemId }, { $pull: { items: itemId } });

  // add to destination
  const r = await Box.updateOne(
    { _id: boxId },
    { $addToSet: { items: itemId } }
  );
  if (r.matchedCount === 0) throw new Error('Box not found');

  // clear orphan flag
  await Item.updateOne({ _id: itemId }, { $unset: { orphanedAt: 1 } });

  // return the destination box (unpopulated)
  return Box.findById(boxId).lean();
}

/**
 * Primitive B:
 * Remove a specific item from a specific box.
 * - Pull from that box (idempotent)
 * - If the item is no longer in ANY box, mark as orphaned
 */
async function removeItemFromBox(boxId, itemId) {
  // remove from the specified box
  await Box.updateOne({ _id: boxId }, { $pull: { items: itemId } });

  // Check if the item remains in any other box
  const stillInABox = await Box.exists({ items: itemId });
  if (!stillInABox) {
    await Item.updateOne({ _id: itemId }, { $set: { orphanedAt: new Date() } });
  }

  return Box.findById(boxId).lean();
}

/** Thin wrapper:
 * Create an Item (required name) and attach to box.
 */
async function createItemInBox(boxId, itemPayload) {
  if (!itemPayload || !itemPayload.name) {
    throw new Error('Item name is required');
  }
  const item = await Item.create(itemPayload);
  await attachItemToBox({ itemId: item._id, boxId });
  return item;
}

/** Thin wrapper:
 * Add existing item to a box (idempotent); canonicalizes through attachItemToBox.
 */
async function addItemToBox(boxId, itemId) {
  return attachItemToBox({ itemId, boxId });
}

/** Thin wrapper:
 * Bulk add items to a box (idempotent). Returns counts + destination box.
 */
async function addItemsToBox(boxId, itemIds) {
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
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

/** Thin wrapper:
 * Move item between two boxes. Canonicalized by calling attachItemToBox(dest).
 * (No need to manually pull from source — attach primitive handles it.)
 */
async function moveItemBetweenBoxes(sourceBoxId, destBoxId, itemId) {
  await attachItemToBox({ itemId, boxId: destBoxId });
  return Box.findById(destBoxId).lean();
}

/** Thin wrapper:
 * Ensure the item is detached from ALL boxes and marked orphaned.
 */
async function detachItem({ itemId }) {
  // remove from any boxes that have it
  await Box.updateMany({ items: itemId }, { $pull: { items: itemId } });
  // mark orphaned
  await Item.updateOne({ _id: itemId }, { $set: { orphanedAt: new Date() } });
  return { itemId, orphaned: true };
}

/** Thin wrapper:
 * Alias for attach (for your API naming). Equivalent of "move to box".
 */
async function moveItem({ itemId, toBoxId }) {
  await attachItemToBox({ itemId, boxId: toBoxId });
  return { itemId, toBoxId };
}

/** Thin wrapper:
 * Empties a box: marks its items orphaned and clears Box.items.
 */
async function emptyBoxItems(boxId) {
  const box = await Box.findById(boxId, { items: 1 }).lean();
  if (!box) throw new Error('Box not found');

  const itemIds = box.items || [];
  if (itemIds.length) {
    await Item.updateMany(
      { _id: { $in: itemIds } },
      { $set: { orphanedAt: new Date() } }
    );
  }

  await Box.updateOne({ _id: boxId }, { $set: { items: [] } });
  return { boxId, removedCount: itemIds.length };
}

/** Query helper:
 * List orphaned items; optional time filter (?since ISO 8601)
 */
async function getOrphanItems({ since } = {}) {
  const q = { orphanedAt: { $ne: null } };
  if (since) {
    q.orphanedAt = { $gte: new Date(since) };
  }
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
