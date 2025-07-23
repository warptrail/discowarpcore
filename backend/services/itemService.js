const Item = require('../models/Item');
const Box = require('../models/Box');

async function getAllItems() {
  const items = await Item.find().lean();

  const boxes = await Box.find()
    .select('_id box_id label description items')
    .lean();

  // Create a map from itemId => box data
  const itemIdToBoxMap = {};
  for (const box of boxes) {
    for (const itemId of box.items) {
      itemIdToBoxMap[itemId.toString()] = {
        _id: box._id,
        box_id: box.box_id,
        label: box.label,
      };
    }
  }

  // Attach box info to each item, or null if orphaned
  const enrichedItems = items.map((item) => ({
    ...item,
    box: itemIdToBoxMap[item._id.toString()] || null,
  }));

  return enrichedItems;
}

async function getOrphanedItems(sort, limit) {
  const query = { box: null }; // just in case we store this as a ref in the future
  const sortOptions = {
    recent: { orphanedAt: -1 },
    alpha: { name: 1 },
    oldest: { orphanedAt: 1 },
  };

  const sortField = sortOptions[sort] || sortOptions.recent;

  return await Item.find({ orphanedAt: { $ne: null } })
    .sort(sortField)
    .limit(limit)
    .lean();
}

async function createItem(data) {
  return Item.create(data);
}

async function updateItem(id, data) {
  return Item.findByIdAndUpdate(id, data, { new: true });
}

async function deleteItem(id) {
  return Item.findByIdAndDelete(id);
}

async function backfillOrphanedTimestamps() {
  const items = await Item.find({ orphanedAt: null }).lean();
  const boxes = await Box.find().select('items').lean();

  const boxedItemIds = new Set();
  boxes.forEach((box) => {
    box.items.forEach((itemId) => boxedItemIds.add(itemId.toString()));
  });

  let updatedCount = 0;

  for (const item of items) {
    if (!boxedItemIds.has(item._id.toString())) {
      await Item.findByIdAndUpdate(item._id, { orphanedAt: new Date() });
      updatedCount++;
    }
  }

  return updatedCount;
}

module.exports = {
  getAllItems,
  getOrphanedItems,
  createItem,
  updateItem,
  deleteItem,
  backfillOrphanedTimestamps,
};
