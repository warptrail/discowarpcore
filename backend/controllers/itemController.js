// controllers/itemController.js
const {
  getAllItems,
  getItemById,
  getOrphanedItems,
  createItem,
  updateItem,
  deleteItem,
  backfillOrphanedTimestamps,
} = require('../services/itemService');

async function getAllItemsApi(req, res) {
  try {
    const items = await getAllItems();
    res.json(items);
  } catch (err) {
    console.error('❌ Error fetching items:', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
}

async function getItemByIdApi(req, res) {
  try {
    const { id } = req.params;
    // optional: allow ?select= to trim fields, else return full doc
    const select = req.query.select
      ? req.query.select
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .join(' ')
      : undefined;

    const data = await getItemById(id, { select });

    if (!data)
      return res.status(404).json({ ok: false, error: 'Item not found' });
    return res.status(200).json({ ok: true, data });
  } catch (err) {
    console.error('❌ getItemByIdApi:', err);
    return res.status(400).json({ ok: false, error: 'Bad request' });
  }
}

// (others unchanged)
async function getOrphanedItemsApi(req, res) {
  const sort = req.query.sort || 'recent';
  const limit = parseInt(req.query.limit) || 20;

  try {
    const items = await getOrphanedItems(sort, limit);
    res.json(items);
  } catch (err) {
    console.error('❌ Error fetching orphaned items:', err);
    res.status(500).json({ error: 'Failed to fetch orphaned items' });
  }
}

async function postItem(req, res) {
  try {
    const newItem = await createItem(req.body);
    res.status(201).json(newItem);
  } catch (err) {
    console.error('❌ Error creating item:', err);
    res.status(400).json({ error: 'Failed to create item' });
  }
}

async function patchItem(req, res) {
  try {
    const { id } = req.params;

    // Update the item
    const updated = await updateItem(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Re-fetch full enriched shape
    const refreshed = await getItemById(id);
    if (!refreshed) {
      return res.status(404).json({ error: 'Item not found after update' });
    }

    res.json({ ok: true, data: refreshed });
  } catch (err) {
    console.error('❌ Error updating item:', err);
    res.status(400).json({ error: 'Failed to update item' });
  }
}

async function deleteItemById(req, res) {
  try {
    const deleted = await deleteItem(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error('❌ Error deleting item:', err);
    res.status(400).json({ error: 'Failed to delete item' });
  }
}

async function backfillOrphanedTimestampsApi(req, res) {
  try {
    const updatedCount = await backfillOrphanedTimestamps();
    res.json({ message: `✅ Updated ${updatedCount} orphaned items.` });
  } catch (err) {
    console.error('❌ Error in backfill controller:', err);
    res.status(500).json({ error: 'Backfill failed' });
  }
}

module.exports = {
  getAllItemsApi,
  getItemByIdApi,
  getOrphanedItemsApi,
  postItem,
  patchItem,
  deleteItemById,
  backfillOrphanedTimestampsApi,
};
