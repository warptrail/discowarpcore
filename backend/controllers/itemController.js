const {
  getAllItems,
  createItem,
  updateItem,
  deleteItem
} = require("../services/itemService");

async function getItems(req, res) {
  try {
    const items = await getAllItems();
    res.json(items);
  } catch (err) {
    console.error("❌ Error fetching items:", err);
    res.status(500).json({ error: "Failed to fetch items" });
  }
}

async function postItem(req, res) {
  try {
    const newItem = await createItem(req.body);
    res.status(201).json(newItem);
  } catch (err) {
    console.error("❌ Error creating item:", err);
    res.status(400).json({ error: "Failed to create item" });
  }
}

async function patchItem(req, res) {
  try {
    const updatedItem = await updateItem(req.params.id, req.body);
    if (!updatedItem) return res.status(404).json({ error: "Item not found" });
    res.json(updatedItem);
  } catch (err) {
    console.error("❌ Error updating item:", err);
    res.status(400).json({ error: "Failed to update item" });
  }
}

async function deleteItemById(req, res) {
  try {
    const deleted = await deleteItem(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item deleted" });
  } catch (err) {
    console.error("❌ Error deleting item:", err);
    res.status(400).json({ error: "Failed to delete item" });
  }
}

module.exports = {
  getItems,
  postItem,
  patchItem,
  deleteItemById,
};