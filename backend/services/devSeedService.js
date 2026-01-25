// services/devSeedService.js
// Simple seeding logic for development only.
// Creates nested boxes and items from mock data (Star Trek themed).
//
// How this service works:
// - It reserves a safe box_id range (500-599) for dev-only seed data.
// - wipeReservedRange() deletes only boxes/items in that range.
// - seedFromMocks() loads a tree-shaped data structure and creates Box + Item docs.
// - The seed source can be swapped via DEV_SEED_SOURCE without changing code.
//

const path = require('path');
const Box = require('../models/Box');
const Item = require('../models/Item');

/**
 * Default seed source for dev.
 * You can override without code edits via:
 *   DEV_SEED_SOURCE=../seed/garageTrees.mock
 * Path is resolved relative to this file.
 */
const DEFAULT_SEED_SOURCE = '../seed/boxTrees.withImages.mock';

function loadDevSeedTrees() {
  const rel = process.env.DEV_SEED_SOURCE || DEFAULT_SEED_SOURCE;
  // Resolve relative to this file so it works regardless of CWD.
  // eslint-disable-next-line import/no-dynamic-require, global-require
  return require(path.resolve(__dirname, rel));
}

const RANGE_START = 500;
const RANGE_END = 599;

/**
 * Reserved box_id range used ONLY for dev seeding.
 * Keeping dev data in a dedicated range lets us wipe it safely without touching user data.
 */
const RESERVED_IDS = Array.from(
  { length: RANGE_END - RANGE_START + 1 },
  (_, i) => String(RANGE_START + i),
);

/**
 * Clear out all boxes/items that use reserved box_ids.
 */
async function wipeReservedRange() {
  const reserved = RESERVED_IDS;

  // Find all boxes we seeded earlier
  const boxes = await Box.find({ box_id: { $in: reserved } });

  // Collect all item IDs from those boxes (de-duped)
  const itemIdSet = new Set();
  boxes.forEach((b) => {
    if (Array.isArray(b.items)) {
      b.items.forEach((id) => itemIdSet.add(String(id)));
    }
  });
  const itemIds = Array.from(itemIdSet);

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
  if (idCounter >= RESERVED_IDS.length) return null;
  return RESERVED_IDS[idCounter++];
}

/**
 * Seed mock data into the database.
 *
 * - Wipes ONLY the reserved dev range (500-599 by default)
 * - Accepts optional `trees` so callers/tests can inject seed data
 * - Otherwise loads the seed module from DEV_SEED_SOURCE (or DEFAULT_SEED_SOURCE)
 */
async function seedFromMocks(trees = null) {
  await wipeReservedRange();
  resetCounter();

  const TREES = Array.isArray(trees) ? trees : loadDevSeedTrees();

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
    seedSource: process.env.DEV_SEED_SOURCE || DEFAULT_SEED_SOURCE,
  };
}

module.exports = {
  seedFromMocks,
  wipeReservedRange,
};
