// const mongoose = require('mongoose');
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

async function getItemById(id) {
  // Find the item
  const item = await Item.findById(id).lean();
  if (!item) {
    return null; // let controller decide how to handle "not found"
  }

  // Find the box that contains this item
  const box = await Box.findOne({ items: item._id })
    .select('_id box_id label description')
    .lean();

  // Attach box info (or null if orphaned)
  const enrichedItem = {
    ...item,
    box: box
      ? {
          _id: box._id,
          box_id: box.box_id,
          label: box.label,
          description: box.description,
        }
      : null,
  };

  return enrichedItem;
}

async function getOrphanedItems(sort, limit) {
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

// ! Note: Dev Function - Not for production env
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

async function orphanAllItemsInBox(boxId) {
  return Item.updateMany(
    { boxId },
    {
      $set: {
        boxId: null,
        orphanedAt: new Date(),
      },
    }
  );
}

module.exports = {
  getAllItems,
  getItemById,
  getOrphanedItems,
  createItem,
  updateItem,
  deleteItem,
  backfillOrphanedTimestamps,
  orphanAllItemsInBox,
};
