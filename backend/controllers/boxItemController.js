const {
  addItemToBox,
  removeItemFromBox,
  moveItemBetweenBoxes,
} = require('../services/boxItemService');

async function addItemToBoxApi(req, res) {
  try {
    const { itemId } = req.body;
    const { boxId } = req.params;
    const updated = await addItemToBox(boxId, itemId);
    if (!updated) {
      return res.status(404).json({ error: 'Box not found' });
    }
    res.json(updated);
  } catch (err) {
    console.error('❌ Error adding item to box:', err);
    res.status(400).json({ error: 'Failed to add item to box' });
  }
}

async function removeItemFromBoxApi(req, res) {
  try {
    const { itemId } = req.body;
    const { boxId } = req.params;
    const updated = await removeItemFromBox(boxId, itemId);
    if (!updated) {
      return res.status(404).json({ error: 'Box not found' });
    }
    res.json(updated);
  } catch (err) {
    console.error('❌ Error removing item from box:', err);
    res.status(400).json({ error: 'Failed to remove item from box' });
  }
}

async function moveItemApi(req, res) {
  try {
    const { sourceBoxId, destBoxId, itemId } = req.body;
    const updated = await moveItemBetweenBoxes(sourceBoxId, destBoxId, itemId);
    if (!updated) {
      return res.status(404).json({ error: 'Destination box not found :<' });
    }
    res.json(updated);
  } catch (err) {
    console.error('❌ Error moving item between boxes:', err);
    res.status(400).json({ error: 'Failed to move item' });
  }
}

module.exports = {
  addItemToBoxApi,
  removeItemFromBoxApi,
  moveItemApi,
};
