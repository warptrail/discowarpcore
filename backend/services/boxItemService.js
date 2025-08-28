const Box = require('../models/Box');
const Item = require('../models/Item');
const { Types } = require('mongoose');

async function createItemInBox(boxId, itemPayload) {
  const item = await Item.create(itemPayload);
  await addItemToBox(boxId, item._id);
  return item;
}

/**
 * Add existing item to a box (idempotent).
 * - Uses $addToSet (no dupes, atomic)
 * - Clears orphanedAt
 * - Returns the updated box (unpopulated; populate outside if needed)
 */
async function addItemToBox(boxId, itemId) {
  const box = await Box.findByIdAndUpdate(
    boxId,
    { $addToSet: { items: itemId } },
    { new: true }
  );
  if (!box) throw new Error('Box not found');
  await Item.findByIdAndUpdate(itemId, { $set: { orphanedAt: null } });
  return box;
}

async function addItemsToBox(boxMongoId, itemIds = []) {
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    throw new Error('itemIds must be a non-empty array');
  }

  // Load current items to compute counts
  const box = await Box.findById(boxMongoId).lean();
  if (!box) throw new Error('Box not found');

  const currentIds = new Set((box.items || []).map(String));
  const uniqueIncoming = [...new Set(itemIds.map(String))];

  const toAdd = uniqueIncoming.filter((id) => !currentIds.has(id));
  const alreadyPresent = uniqueIncoming.length - toAdd.length;

  // Add to box
  const updatedBox = await Box.findByIdAndUpdate(
    boxMongoId,
    { $addToSet: { items: { $each: toAdd } } },
    { new: true }
  )
    .populate('items')
    .lean();

  // Clear orphanedAt on all incoming items (safe for both new + already-present)
  await Item.updateMany(
    { _id: { $in: uniqueIncoming } },
    { $set: { orphanedAt: null } }
  );

  return {
    addedCount: toAdd.length,
    alreadyPresentCount: alreadyPresent,
    totalInPayload: uniqueIncoming.length,
    box: updatedBox,
  };
}

/**
 * Remove item from box (idempotent).
 * - Uses $pull (atomic)
 * - Sets orphanedAt
 * - Returns the updated box
 */
async function removeItemFromBox(boxId, itemId) {
  // Cast to ObjectId to avoid string vs ObjectId mismatches
  const oid = Types.ObjectId.isValid(itemId)
    ? new Types.ObjectId(itemId)
    : itemId;

  // 1) Pull once with the ObjectId
  let result = await Box.updateOne({ _id: boxId }, { $pull: { items: oid } });

  // Debug log — remove once verified
  console.log('[removeItemFromBox]', {
    matched: result.matchedCount,
    modified: result.modifiedCount,
    boxId,
    itemId,
  });

  // 2) If nothing changed, try pulling the raw string too (covers odd data)
  if (result.matchedCount === 0) {
    throw new Error('Box not found');
  }
  if (result.modifiedCount === 0) {
    // second-chance pull in case the array contains strings
    result = await Box.updateOne({ _id: boxId }, { $pull: { items: itemId } });
  }

  // 3) If still nothing changed, report clearly
  if (result.modifiedCount === 0) {
    // You can choose to throw, or return a flag; throwing is clearer during debug
    throw new Error('Item was not attached to this box (no changes made)');
  }

  // 4) Mark the item orphaned
  await Item.updateOne({ _id: oid }, { $set: { orphanedAt: new Date() } });

  // 5) Return fresh box if you want it
  return Box.findById(boxId);
}
/**
 * Move item between boxes.
 * - Pull from source, addToSet into dest
 * - Does NOT set orphanedAt (item remains boxed)
 * - Returns destination box populated if you want (kept your style)
 */
async function moveItemBetweenBoxes(sourceBoxId, destBoxId, itemId) {
  if (sourceBoxId === destBoxId) {
    // no-op move; just ensure it's present in dest
    const dest = await Box.findByIdAndUpdate(
      destBoxId,
      { $addToSet: { items: itemId } },
      { new: true }
    )
      .populate('items')
      .lean();
    return dest;
  }

  // Step 1: remove from source (no error if not present)
  await Box.findByIdAndUpdate(sourceBoxId, { $pull: { items: itemId } });

  // Step 2: add to destination (idempotent)
  const updatedDestination = await Box.findByIdAndUpdate(
    destBoxId,
    { $addToSet: { items: itemId } },
    { new: true }
  )
    .populate('items')
    .lean();

  if (!updatedDestination) throw new Error('Destination box not found');

  // Ensure item isn’t marked orphaned
  await Item.findByIdAndUpdate(itemId, { $set: { orphanedAt: null } });

  return updatedDestination;
}

async function emptyBoxItems(boxId) {
  // we need to identify the box
  const box = await Box.findById(boxId);
  if (!box) {
    throw new Error(`Box ${boxId} not found`);
  }

  // Validation: already empty
  if (!box.items || box.items.length === 0) {
    return {
      success: false,
      message: `Box ${boxId} is already empty`,
      orphanedCount: 0,
      fromBoxId: boxId,
    };
  }

  // Get the items in the box
  const itemIds = box.items;

  // Get the current timestamp
  const now = new Date();

  // Update each item to be orphaned
  await Item.updateMany(
    { _id: { $in: itemIds } },
    { $set: { orphanedAt: now } }
  );

  // Then clear the box's item array
  box.items = [];
  await box.save();

  return {
    success: true,
    orphanedCount: itemIds.length,
    orphanedAt: now,
    fromBoxId: boxId,
  };
}

// TODO make emptyBoxItemsAPI function controller -->

module.exports = {
  createItemInBox,
  addItemToBox,
  addItemsToBox,
  removeItemFromBox,
  moveItemBetweenBoxes,
  emptyBoxItems,
};
