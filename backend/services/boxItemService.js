// services/boxItemService.js
const Box = require('../models/Box');
const Item = require('../models/Item');
const { withNormalizedItemCategory } = require('../utils/itemCategory');
const {
  ORPHANED_LABEL,
  formatBoxLabel,
  formatItemLabel,
  logEventBestEffort,
  quoteLabel,
  toIdString,
} = require('./eventLogService');

const ACTIVE_ITEM_FILTER = { item_status: { $ne: 'gone' } };

function toBoxRef(box, fallback = ORPHANED_LABEL) {
  if (!box) return { id: null, label: fallback, box_id: null };
  return {
    id: toIdString(box._id || box.id),
    label: formatBoxLabel(box, fallback),
    box_id: box.box_id || null,
  };
}

function toItemRef(item) {
  if (!item) return { id: null, label: 'Item' };
  return {
    id: toIdString(item._id || item.id),
    label: formatItemLabel(item),
  };
}

async function findContainingBoxForItem(itemId) {
  return Box.findOne({ items: itemId }).select('_id box_id label').lean();
}

async function logItemMovedEvent({
  item,
  fromBox,
  toBox,
  reason,
  extraDetails,
} = {}) {
  const itemRef = toItemRef(item);
  if (!itemRef.id) return;

  const fromRef = toBoxRef(fromBox, ORPHANED_LABEL);
  const toRef = toBoxRef(toBox, ORPHANED_LABEL);

  if (fromRef.id && toRef.id && fromRef.id === toRef.id) return;

  const details = {
    from_box_id: fromRef.id,
    from_box_label: fromRef.label,
    to_box_id: toRef.id,
    to_box_label: toRef.label,
    ...(reason ? { reason } : {}),
    ...(extraDetails || {}),
  };

  await logEventBestEffort(
    {
      event_type: 'item_moved',
      entity_type: 'item',
      entity_id: itemRef.id,
      entity_label: itemRef.label,
      summary: `Moved item ${quoteLabel(itemRef.label)} from ${quoteLabel(
        fromRef.label
      )} to ${quoteLabel(toRef.label)}`,
      details,
    },
    { label: `item_moved:${itemRef.id}` }
  );
}

/**
 * Primitive A:
 * Attach item to exactly one box (single-parent).
 * - Pull from ALL boxes first
 * - Add to destination box (idempotent via $addToSet)
 * - Clear orphaning flags + location (box owns location)
 */
async function attachItemToBox({ itemId, boxId, suppressMoveLog = false }) {
  const [item, destinationBox, sourceBox] = await Promise.all([
    Item.findById(itemId).select('_id name item_status').lean(),
    Box.findById(boxId).select('_id box_id label').lean(),
    findContainingBoxForItem(itemId),
  ]);

  if (!item) {
    throw new Error('Item not found');
  }
  if (item.item_status === 'gone') {
    throw new Error(
      'This item is marked gone. Restore it to active inventory before assigning it to a box.'
    );
  }
  if (!destinationBox) {
    throw new Error('Box not found');
  }

  const destinationRef = toBoxRef(destinationBox, 'Box');
  if (sourceBox && String(sourceBox._id) === destinationRef.id) {
    await Item.updateOne(
      { _id: itemId, ...ACTIVE_ITEM_FILTER },
      { $unset: { orphanedAt: 1 }, $set: { location: '' } }
    );
    return Box.findById(boxId).lean();
  }

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
    { _id: itemId, ...ACTIVE_ITEM_FILTER },
    { $unset: { orphanedAt: 1 }, $set: { location: '' } }
  );

  if (!suppressMoveLog) {
    await logItemMovedEvent({
      item,
      fromBox: sourceBox,
      toBox: destinationBox,
      reason: 'attach_item_to_box',
    });
  }

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
  const [item, sourceBox] = await Promise.all([
    Item.findById(itemId).select('_id name item_status').lean(),
    Box.findOne({ _id: boxId, items: itemId }).select('_id box_id label').lean(),
  ]);

  await Box.updateOne({ _id: boxId }, { $pull: { items: itemId } });

  const destinationBox = await findContainingBoxForItem(itemId);
  if (!destinationBox) {
    await Item.updateOne(
      { _id: itemId, ...ACTIVE_ITEM_FILTER },
      { $set: { orphanedAt: new Date(), location: '' } }
    );
  }

  if (sourceBox && item) {
    await logItemMovedEvent({
      item,
      fromBox: sourceBox,
      toBox: destinationBox,
      reason: 'remove_item_from_box',
    });
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

  const destinationBox = await Box.findById(boxId).select('_id box_id label').lean();
  if (!destinationBox) {
    throw new Error('Box not found');
  }

  const item = await Item.create(itemPayload);
  await attachItemToBox({ itemId: item._id, boxId, suppressMoveLog: true });

  const itemRef = toItemRef(item);
  const destinationRef = toBoxRef(destinationBox, 'Box');
  await logEventBestEffort(
    {
      event_type: 'item_created',
      entity_type: 'item',
      entity_id: itemRef.id,
      entity_label: itemRef.label,
      summary: `Created item ${quoteLabel(itemRef.label)} in ${quoteLabel(
        destinationRef.label
      )}`,
      details: {
        to_box_id: destinationRef.id,
        to_box_label: destinationRef.label,
      },
    },
    { label: `item_created:${itemRef.id}` }
  );

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
  const [item, sourceBoxes] = await Promise.all([
    Item.findById(itemId).select('_id name item_status').lean(),
    Box.find({ items: itemId }).select('_id box_id label').lean(),
  ]);

  await Box.updateMany({ items: itemId }, { $pull: { items: itemId } });
  await Item.updateOne(
    { _id: itemId, ...ACTIVE_ITEM_FILTER },
    { $set: { orphanedAt: new Date(), location: '' } }
  );

  if (item && sourceBoxes.length) {
    const fromBox = sourceBoxes[0];
    const extraDetails =
      sourceBoxes.length > 1
        ? {
            from_box_ids: sourceBoxes.map((entry) => toIdString(entry._id)),
            from_box_labels: sourceBoxes.map((entry) =>
              formatBoxLabel(entry, 'Box')
            ),
          }
        : undefined;

    await logItemMovedEvent({
      item,
      fromBox,
      toBox: null,
      reason: 'detach_item',
      extraDetails,
    });
  }

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
  const box = await Box.findById(boxId, { _id: 1, box_id: 1, label: 1, items: 1 }).lean();
  if (!box) throw new Error('Box not found');

  const itemIds = box.items || [];
  let itemDocs = [];
  if (itemIds.length) {
    itemDocs = await Item.find({ _id: { $in: itemIds } })
      .select('_id name item_status')
      .lean();

    await Item.updateMany(
      { ...ACTIVE_ITEM_FILTER, _id: { $in: itemIds } },
      { $set: { orphanedAt: new Date(), location: '' } }
    );
  }

  await Box.updateOne({ _id: boxId }, { $set: { items: [] } });

  if (itemDocs.length) {
    for (const item of itemDocs) {
      if (item.item_status === 'gone') continue;
      await logItemMovedEvent({
        item,
        fromBox: box,
        toBox: null,
        reason: 'empty_box_items',
      });
    }
  }

  return { boxId, removedCount: itemIds.length };
}

/**
 * Query orphaned items; optional ?since=ISO
 */
async function getOrphanItems({ since } = {}) {
  const q = { orphanedAt: { $ne: null } };
  q.item_status = { $ne: 'gone' };
  if (since) q.orphanedAt = { $gte: new Date(since) };
  const items = await Item.find(q).lean();
  return items.map((item) => withNormalizedItemCategory(item));
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
