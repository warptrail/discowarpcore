const {
  getAllItems,
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
    const updatedItem = await updateItem(req.params.id, req.body);
    if (!updatedItem) return res.status(404).json({ error: 'Item not found' });
    res.json(updatedItem);
  } catch (err) {
    console.error('❌ Error updating item:', err);
    res.status(400).json({ error: 'Failed to update item' });
  }
}

// todo --> add a logging system to log deleted items
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
  getOrphanedItemsApi,
  postItem,
  patchItem,
  deleteItemById,
  backfillOrphanedTimestampsApi,
};
