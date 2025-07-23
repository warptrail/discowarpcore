const Box = require('../models/Box');
const Item = require('../models/Item');

async function addItemToBox(boxId, itemId) {
  const box = await Box.findById(boxId);
  if (!box) throw new Error('Box not found');

  if (!box.items.includes(itemId)) {
    box.items.push(itemId);
    await box.save();
  }

  // ✅ Clear orphanedAt
  await Item.findByIdAndUpdate(itemId, { orphanedAt: null });

  return box;
}

async function removeItemFromBox(boxId, itemId) {
  const box = await Box.findById(boxId);
  if (!box) throw new Error('Box not found');

  box.items = box.items.filter((id) => id.toString() !== itemId);
  await box.save();

  // ✅ Set orphanedAt on the item
  await Item.findByIdAndUpdate(itemId, { orphanedAt: new Date() });

  return box;
}
async function moveItemBetweenBoxes(sourceBoxId, destBoxId, itemId) {
  // Step 1: remove from source
  await Box.findByIdAndUpdate(sourceBoxId, { $pull: { items: itemId } });

  // Step 2: add to destination
  const updatedDestination = await Box.findByIdAndUpdate(
    destBoxId,
    { $addToSet: { items: itemId } },
    { new: true }
  )
    .populate('items')
    .lean();

  return updatedDestination;
}

module.exports = {
  addItemToBox,
  removeItemFromBox,
  moveItemBetweenBoxes,
};
