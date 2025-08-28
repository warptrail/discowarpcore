// controllers/boxItemController.js
const {
  addItemToBox,
  addItemsToBox,
  removeItemFromBox,
  moveItemBetweenBoxes,
  createItemInBox,
  emptyBoxItems, // still used by POST /boxes/:boxId/items (one-step create)
} = require('../services/boxItemService');

/**
 * POST /api/boxes/:boxId/items
 * Create a new item and attach it to the box (one-step create).
 */
async function postCreateItemInBox(req, res) {
  try {
    const { boxId } = req.params;
    const { name, quantity = 1, ...rest } = req.body || {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'name is required' });
    }
    const item = await createItemInBox(boxId, {
      name: name.trim(),
      quantity,
      ...rest,
    });
    return res.status(201).json({ item, boxId });
  } catch (err) {
    return res
      .status(400)
      .json({ message: err.message || 'Failed to create item in box' });
  }
}

/**
 * PATCH /api/boxes/:boxId/items/attach
 * Partially update Box by attaching an existing item.
 * Body: { itemId: string }
 */
async function patchAttachExistingItem(req, res) {
  try {
    const { boxMongoId } = req.params;
    const { itemId } = req.body || {};
    if (!itemId) return res.status(400).json({ message: 'itemId is required' });

    const box = await addItemToBox(boxMongoId, itemId);
    return res.status(200).json({ ok: true, boxId: box._id });
  } catch (err) {
    return res
      .status(400)
      .json({ message: err.message || 'Failed to attach item' });
  }
}

async function patchAddItems(req, res) {
  try {
    const { boxMongoId } = req.params;
    const { itemIds } = req.body;

    const result = await addItemsToBox(boxMongoId, itemIds);

    return res.status(200).json({
      ok: true,
      addedCount: result.addedCount,
      alreadyPresentCount: result.alreadyPresentCount,
      totalInPayload: result.totalInPayload,
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
 * Partially update Box by removing (orphaning) an item.
 */
// controllers/boxItemController.js
async function patchRemoveItemFromBox(req, res) {
  try {
    const { boxMongoId } = req.params;
    const { itemId } = req.body || {};
    if (!itemId) return res.status(400).json({ message: 'itemId is required' });

    const box = await removeItemFromBox(boxMongoId, itemId);
    return res.status(200).json({ ok: true, boxId: box._id });
  } catch (err) {
    // If service throws "not attached", return 409 to signal no-op
    const msg = String(err?.message || '');
    const status = /not attached/.test(msg) ? 409 : 400;
    return res.status(status).json({ message: msg || 'Failed to orphan item' });
  }
}

/**
 * PATCH /api/boxed-items/moveItem
 * Body: { itemId, sourceBoxId, destBoxId }
 */
async function patchMoveItem(req, res) {
  try {
    const { itemId, sourceBoxId, destBoxId } = req.body || {};
    if (!itemId || !sourceBoxId || !destBoxId) {
      return res
        .status(400)
        .json({ message: 'itemId, sourceBoxId, and destBoxId are required' });
    }

    const dest = await moveItemBetweenBoxes(sourceBoxId, destBoxId, itemId);
    return res.status(200).json({
      ok: true,
      destBoxId: dest?._id,
    });
  } catch (err) {
    return res
      .status(400)
      .json({ message: err.message || 'Failed to move item' });
  }
}

/**
 * PATCH /api/boxes/:boxMongoId/empty-items
 * Orphan all items in the box and clear the items array.
 */
async function patchEmptyBoxItems(req, res) {
  try {
    const { boxMongoId } = req.params;
    const result = await emptyBoxItems(boxMongoId);
    // 200 OK even when already empty; include counts for UX
    return res.status(200).json({
      ok: true,
      boxId: result.boxId,
      orphanedCount: result.orphanedCount,
      message:
        result.orphanedCount === 0
          ? 'Box already empty.'
          : `Emptied ${result.orphanedCount} item(s).`,
    });
  } catch (err) {
    return res
      .status(400)
      .json({ message: err.message || 'Failed to empty box' });
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
