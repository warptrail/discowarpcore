// controllers/boxItemController.js
const {
  createItemInBox,
  addItemToBox, // thin wrapper → attachItemToBox
  addItemsToBox, // thin wrapper over attach in a loop
  removeItemFromBox, // primitive
  moveItemBetweenBoxes, // thin wrapper → attach to dest
  emptyBoxItems, // thin wrapper that clears box.items + sets orphanedAt
} = require('../services/boxItemService');

/** Small helper so we accept either :boxId or :boxMongoId in routes */
function getBoxParam(req) {
  return req.params.boxMongoId || req.params.boxId;
}

/**
 * POST /api/boxes/:boxId/items
 * Create a new item and attach it to the box (one-step create).
 */
async function postCreateItemInBox(req, res) {
  try {
    const boxId = getBoxParam(req);
    const { name, quantity = 1, ...rest } = req.body || {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'name is required' });
    }
    const item = await createItemInBox(boxId, {
      name: name.trim(),
      quantity,
      ...rest,
    });
    return res.status(201).json({ ok: true, item, boxId });
  } catch (err) {
    return res
      .status(400)
      .json({
        ok: false,
        message: err.message || 'Failed to create item in box',
      });
  }
}

/**
 * PATCH /api/boxes/:boxId/items/attach
 * Body: { itemId }
 * Attaches an existing item to the box (idempotent, pulls from any other box first).
 */
async function patchAttachExistingItem(req, res) {
  try {
    const boxId = getBoxParam(req);
    const { itemId } = req.body || {};
    if (!itemId) return res.status(400).json({ message: 'itemId is required' });

    const box = await addItemToBox(boxId, itemId);
    return res.status(200).json({ ok: true, boxId: box?._id });
  } catch (err) {
    return res
      .status(400)
      .json({ ok: false, message: err.message || 'Failed to attach item' });
  }
}

/**
 * PATCH /api/boxes/:boxId/items/add-many
 * Body: { itemIds: [string] }
 * Bulk attach; canonicalizes through attach. (No “alreadyPresentCount” now.)
 */
async function patchAddItems(req, res) {
  try {
    const boxId = getBoxParam(req);
    const { itemIds } = req.body || {};
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res
        .status(400)
        .json({ ok: false, message: 'itemIds must be a non-empty array' });
    }

    // New service returns { attached, box }
    const result = await addItemsToBox(boxId, itemIds);

    return res.status(200).json({
      ok: true,
      attachedCount: result.attached,
      totalInPayload: itemIds.length,
      box: result.box,
    });
  } catch (err) {
    return res
      .status(400)
      .json({ ok: false, message: err.message || 'Failed to add items' });
  }
}

/**
 * PATCH /api/boxes/:boxId/items/:itemId/orphan
 * Removes item from this box. If item not in any box afterward → marked orphaned.
 */
async function patchRemoveItemFromBox(req, res) {
  try {
    const boxId = getBoxParam(req);
    const { itemId } = req.params.itemId ? req.params : req.body || {};
    if (!itemId) return res.status(400).json({ message: 'itemId is required' });

    const box = await removeItemFromBox(boxId, itemId);
    return res.status(200).json({ ok: true, boxId: box?._id });
  } catch (err) {
    // If service throws “not attached”, that’s a safe no-op; treat as 409
    const msg = String(err?.message || '');
    const status = /not attached/i.test(msg) ? 409 : 400;
    return res
      .status(status)
      .json({ ok: false, message: msg || 'Failed to orphan item' });
  }
}

/**
 * PATCH /api/boxed-items/moveItem
 * Body: { itemId, sourceBoxId?, destBoxId }
 * Note: sourceBoxId is optional with the new attach-based move.
 */
async function patchMoveItem(req, res) {
  try {
    const { itemId, destBoxId } = req.body || {};
    if (!itemId || !destBoxId) {
      return res
        .status(400)
        .json({ message: 'itemId and destBoxId are required' });
    }

    const dest = await moveItemBetweenBoxes(undefined, destBoxId, itemId);
    return res.status(200).json({ ok: true, destBoxId: dest?._id });
  } catch (err) {
    return res
      .status(400)
      .json({ ok: false, message: err.message || 'Failed to move item' });
  }
}

/**
 * PATCH /api/boxes/:boxId/empty-items
 * Orphan all items in the box and clear the items array.
 */
async function patchEmptyBoxItems(req, res) {
  try {
    const boxId = getBoxParam(req);
    const result = await emptyBoxItems(boxId);
    // New service returns { boxId, removedCount }
    return res.status(200).json({
      ok: true,
      boxId: result.boxId,
      orphanedCount: result.removedCount,
      message:
        result.removedCount === 0
          ? 'Box already empty.'
          : `Emptied ${result.removedCount} item(s).`,
    });
  } catch (err) {
    return res
      .status(400)
      .json({ ok: false, message: err.message || 'Failed to empty box' });
  }
}

module.exports = {
  postCreateItemInBox,
  patchAttachExistingItem,
  patchAddItems,
  patchRemoveItemFromBox,
  patchMoveItem,
  patchEmptyBoxItems,
};
