// backend/utils/seedEngine.js
// Dev seed engine (logic only).
// - No DB connect/disconnect
// - No wiping
// - No process.exit
//
// Responsibilities:
// 1) Create a nested Box tree (parentBox links) from tree-shaped seed data
// 2) Create Item docs from flat item seed data
// 3) Attach Item ObjectIds onto Box.items based on a placements map
//
// Seed-only fields like `key` must NOT be persisted to Mongo.

const Box = require('../models/Box');
const Item = require('../models/Item');

/**
 * Remove seed-only fields from an object without mutating the original.
 */
function omitSeedFields(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  // eslint-disable-next-line no-unused-vars
  const { key, children, ...rest } = obj;
  return rest;
}

/**
 * Build a stable, unique key path for nodes that do not provide a `key`.
 * Example: root[0] => "0", root[0].children[1] => "0.1"
 */
function makeFallbackNodeKey(parentKey, index) {
  return parentKey ? `${parentKey}.${index}` : String(index);
}

/**
 * Create boxes from a nested tree.
 *
 * @param {Array} trees - array of root nodes (tree-shaped)
 * @param {Function} getNextBoxId - () => string | null; provides box_id values
 * @param {Object} [opts]
 * @param {boolean} [opts.requireKeys=true] - if true, every node must have a unique `key`
 * @returns {Promise<{ boxByKey: Map<string, any>, rootBoxes: any[] }>} boxByKey maps seed key -> Box doc
 */
async function createBoxesFromTrees(trees, getNextBoxId, opts = {}) {
  const { requireKeys = true } = opts;

  if (!Array.isArray(trees)) {
    throw new Error('createBoxesFromTrees: `trees` must be an array');
  }
  if (typeof getNextBoxId !== 'function') {
    throw new Error('createBoxesFromTrees: `getNextBoxId` must be a function');
  }

  const boxByKey = new Map();
  const rootBoxes = [];

  async function walk(node, parentBoxId, parentKey, index) {
    if (!node || typeof node !== 'object') {
      throw new Error('createBoxesFromTrees: encountered invalid node');
    }

    const nodeKey =
      node.key || (requireKeys ? null : makeFallbackNodeKey(parentKey, index));
    if (!nodeKey) {
      throw new Error(
        'createBoxesFromTrees: missing node.key (set requireKeys=false to allow auto keys)',
      );
    }
    if (boxByKey.has(nodeKey)) {
      throw new Error(`createBoxesFromTrees: duplicate box key: ${nodeKey}`);
    }

    const box_id = getNextBoxId();
    if (!box_id) {
      throw new Error('createBoxesFromTrees: ran out of box_id values');
    }

    const payload = omitSeedFields(node);

    // Force schema-consistent fields.
    const doc = await Box.create({
      box_id: String(box_id),
      label: payload.label ?? '',
      location: payload.location ?? '',
      description: payload.description ?? '',
      notes: payload.notes ?? '',
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      imagePath: payload.imagePath ?? null,
      parentBox: parentBoxId ?? null,
      // Ensure empty array; items are attached later.
      items: [],
    });

    boxByKey.set(nodeKey, doc);

    const children = Array.isArray(node.children) ? node.children : [];
    for (let i = 0; i < children.length; i++) {
      await walk(children[i], doc._id, nodeKey, i);
    }

    return doc;
  }

  for (let r = 0; r < trees.length; r++) {
    const root = trees[r];
    const rootDoc = await walk(root, null, '', r);
    rootBoxes.push(rootDoc);
  }

  return { boxByKey, rootBoxes };
}

/**
 * Create items from seed list.
 *
 * @param {Array} items - array of item seed objects (must include seed-only `key`)
 * @param {Object} [opts]
 * @param {boolean} [opts.requireKeys=true]
 * @returns {Promise<{ itemByKey: Map<string, any>, created: any[] }>} itemByKey maps seed key -> Item doc
 */
async function createItemsFromSeed(items, opts = {}) {
  const { requireKeys = true } = opts;

  if (!Array.isArray(items)) {
    throw new Error('createItemsFromSeed: `items` must be an array');
  }

  const itemByKey = new Map();

  const payloads = items.map((it, idx) => {
    if (!it || typeof it !== 'object') {
      throw new Error(`createItemsFromSeed: invalid item at index ${idx}`);
    }

    const k = it.key || (requireKeys ? null : String(idx));
    if (!k) {
      throw new Error(`createItemsFromSeed: item missing key at index ${idx}`);
    }
    if (itemByKey.has(k)) {
      throw new Error(`createItemsFromSeed: duplicate item key: ${k}`);
    }

    // eslint-disable-next-line no-unused-vars
    const { key, ...rest } = it;
    itemByKey.set(k, null); // placeholder

    // Let schema defaults fill in anything not provided.
    // Validate integer valueCents / min constraints via schema.
    return rest;
  });

  const created = await Item.insertMany(payloads, { ordered: true });

  // Rebuild map in insertion order (seed order aligns with created order)
  let createdIdx = 0;
  for (let i = 0; i < items.length; i++) {
    const seedKey = items[i].key || (requireKeys ? null : String(i));
    if (!seedKey) continue;
    itemByKey.set(seedKey, created[createdIdx]);
    createdIdx += 1;
  }

  return { itemByKey, created };
}

/**
 * Attach items to boxes.
 *
 * Placements shape:
 *   [ { boxKey: 'garage.shelf.main', itemKeys: ['hammer_16oz', ...] }, ... ]
 *
 * @param {Array} placements
 * @param {Map<string, any>} boxByKey - from createBoxesFromTrees
 * @param {Map<string, any>} itemByKey - from createItemsFromSeed
 * @param {Object} [opts]
 * @param {'set'|'push'} [opts.mode='set'] - set replaces Box.items, push appends
 */
async function attachItemsToBoxes(placements, boxByKey, itemByKey, opts = {}) {
  const { mode = 'set' } = opts;

  if (!Array.isArray(placements)) {
    throw new Error('attachItemsToBoxes: `placements` must be an array');
  }
  if (!(boxByKey instanceof Map)) {
    throw new Error('attachItemsToBoxes: `boxByKey` must be a Map');
  }
  if (!(itemByKey instanceof Map)) {
    throw new Error('attachItemsToBoxes: `itemByKey` must be a Map');
  }
  if (!['set', 'push'].includes(mode)) {
    throw new Error("attachItemsToBoxes: opts.mode must be 'set' or 'push'");
  }

  const ops = [];

  for (const entry of placements) {
    const { boxKey, itemKeys } = entry || {};

    if (!boxKey || typeof boxKey !== 'string') {
      throw new Error('attachItemsToBoxes: placement missing valid boxKey');
    }
    const boxDoc = boxByKey.get(boxKey);
    if (!boxDoc) {
      throw new Error(`attachItemsToBoxes: unknown boxKey: ${boxKey}`);
    }

    const keys = Array.isArray(itemKeys) ? itemKeys : [];
    const itemIds = [];

    for (const k of keys) {
      const itemDoc = itemByKey.get(k);
      if (!itemDoc) {
        throw new Error(
          `attachItemsToBoxes: unknown itemKey: ${k} (boxKey: ${boxKey})`,
        );
      }
      itemIds.push(itemDoc._id);
    }

    if (mode === 'set') {
      ops.push({
        updateOne: {
          filter: { _id: boxDoc._id },
          update: { $set: { items: itemIds } },
        },
      });
    } else {
      ops.push({
        updateOne: {
          filter: { _id: boxDoc._id },
          update: { $push: { items: { $each: itemIds } } },
        },
      });
    }
  }

  if (ops.length > 0) {
    await Box.bulkWrite(ops, { ordered: true });
  }

  return { updatedBoxes: ops.length };
}

module.exports = {
  createBoxesFromTrees,
  createItemsFromSeed,
  attachItemsToBoxes,
};
