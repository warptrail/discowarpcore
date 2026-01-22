// services/devSeedService.js
// Simple seeding logic for development only.
// Creates nested boxes and items from mock data (Star Trek themed).

const Box = require('../models/Box');
const Item = require('../models/Item');
const TREES = require('../seed/boxTrees.withImages.mock');

// We’ll reserve this range of shortIds for dev seeds only.
// Adjust if you need more or less.
const RANGE_START = 500;
const RANGE_END = 599;

/**
 * Helper: make an array of all reserved IDs as strings.
 * Example: ["500","501","502",...,"599"]
 */
function getReservedIds() {
  const ids = [];
  for (let i = RANGE_START; i <= RANGE_END; i++) {
    ids.push(String(i));
  }
  return ids;
}

/**
 * Clear out all boxes/items that use reserved box_ids.
 */
async function wipeReservedRange() {
  const reserved = getReservedIds();

  // Find all boxes we seeded earlier
  const boxes = await Box.find({ box_id: { $in: reserved } });

  // Collect all item IDs from those boxes
  const itemIds = [];
  boxes.forEach((b) => {
    if (b.items) itemIds.push(...b.items);
  });

  // Delete items then boxes
  if (itemIds.length > 0) {
    await Item.deleteMany({ _id: { $in: itemIds } });
  }
  await Box.deleteMany({ box_id: { $in: reserved } });

  return {
    ok: true,
    deletedBoxes: boxes.length,
    deletedItems: itemIds.length,
  };
}

/**
 * Recursive helper: create a box, attach items, then children.
 */
async function createBoxFromNode(node, box_id, parentBox = null) {
  // Create the box
  const box = await Box.create({
    label: node.label,
    box_id,
    location: node.location,
    description: node.description,
    notes: node.notes,
    tags: node.tags,
    parentBox,
    items: [],
  });

  // Create items and attach them
  if (node.items && node.items.length > 0) {
    for (const itemName of node.items) {
      const item = await Item.create({ name: itemName });
      box.items.push(item._id);
    }
    await box.save();
  }

  // Recurse into children
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      // Get the next free box_id
      const nextId = getNextId();
      if (!nextId) throw new Error('Ran out of reserved IDs!');
      await createBoxFromNode(child, nextId, box._id);
    }
  }

  return box;
}

// Internal counter for assigning box_ids
let idCounter = 0;
function resetCounter() {
  idCounter = 0;
}
function getNextId() {
  const ids = getReservedIds();
  if (idCounter >= ids.length) return null;
  return ids[idCounter++];
}

/**
 * Seed all mock data into the database.
 * This wipes old seed data first.
 */
async function seedFromMocks() {
  await wipeReservedRange();
  resetCounter();

  const roots = [];
  for (const tree of TREES) {
    const id = getNextId();
    if (!id) break; // stop if we run out
    const rootBox = await createBoxFromNode(tree, id, null);
    roots.push(rootBox);
  }

  return {
    ok: true,
    seededRoots: roots.length,
    reservedRange: `${RANGE_START}-${RANGE_END}`,
  };
}

module.exports = {
  seedFromMocks,
  wipeReservedRange,
};
