// const mongoose = require('mongoose');
const Item = require('../models/Item');
const Box = require('../models/Box');

// ---- helpers ---------------------------------------------------------------

function buildBoxMaps(boxes) {
  const boxById = new Map();
  const parentOf = new Map(); // childId -> parentId

  for (const b of boxes) {
    const id = String(b._id);
    boxById.set(id, b);

    // accept multiple possible parent field names (robust to schema variants)
    const p =
      b.parent ??
      b.parentId ??
      b.parent_id ??
      b.parentBox ??
      b.parentBoxId ??
      null;

    if (p) parentOf.set(id, String(p));

    // also infer parent from children[] if present
    if (Array.isArray(b.children)) {
      for (const c of b.children) parentOf.set(String(c), id);
    }
  }

  return { boxById, parentOf };
}

function makeBreadcrumb(leafId, maps) {
  if (!leafId) {
    return { breadcrumb: [], depth: 0, rootBox: null, leafBox: null };
  }
  const { boxById, parentOf } = maps;
  const chain = [];
  const seen = new Set();
  let cur = String(leafId);
  let hops = 0;

  while (cur && !seen.has(cur) && hops < 100) {
    seen.add(cur);
    const b = boxById.get(cur);
    if (!b) break;
    chain.unshift({ _id: b._id, box_id: b.box_id, label: b.label });
    cur = parentOf.get(cur);
    hops += 1;
  }

  return {
    breadcrumb: chain,
    depth: chain.length,
    rootBox: chain[0] || null,
    leafBox: chain[chain.length - 1] || null,
  };
}

async function getAllItems() {
  const items = await Item.find().lean();

  // pull all boxes once; include fields we might need
  const boxes = await Box.find()
    .select(
      '_id box_id label description items parent parentId parent_id parentBox parentBoxId children'
    )
    .lean();

  // itemId -> leaf box id
  const itemToLeafId = new Map();
  for (const b of boxes) {
    for (const itemId of b.items || []) {
      itemToLeafId.set(String(itemId), String(b._id));
    }
  }

  const maps = buildBoxMaps(boxes);

  return items.map((i) => {
    const leafId = itemToLeafId.get(String(i._id));
    const { breadcrumb, depth, rootBox, leafBox } = makeBreadcrumb(
      leafId,
      maps
    );
    // keep a small "box" object like you had, based on the leaf
    const box =
      leafBox && maps.boxById.get(String(leafBox._id))
        ? {
            _id: maps.boxById.get(String(leafBox._id))._id,
            box_id: maps.boxById.get(String(leafBox._id)).box_id,
            label: maps.boxById.get(String(leafBox._id)).label,
          }
        : null;

    return {
      ...i,
      box,
      breadcrumb,
      depth,
      topBox: rootBox,
    };
  });
}

async function getItemById(id, { select } = {}) {
  // allow controller to pass select
  const q = Item.findById(id);
  if (select) q.select(select);
  const item = await q.lean();
  if (!item) return null;

  // find the leaf box (the one that directly contains the item)
  const leaf = await Box.findOne({ items: item._id })
    .select(
      '_id box_id label description parent parentId parent_id parentBox parentBoxId children'
    )
    .lean();

  if (!leaf) {
    // orphaned: still return empty breadcrumb + depth 0
    return { ...item, box: null, breadcrumb: [], depth: 0, topBox: null };
  }

  // fetch all boxes once to compute ancestors robustly
  const allBoxes = await Box.find()
    .select(
      '_id box_id label description parent parentId parent_id parentBox parentBoxId children'
    )
    .lean();

  const maps = buildBoxMaps(allBoxes);
  const { breadcrumb, depth, rootBox } = makeBreadcrumb(leaf._id, maps);

  return {
    ...item,
    box: {
      _id: leaf._id,
      box_id: leaf.box_id,
      label: leaf.label,
      description: leaf.description,
    },
    breadcrumb,
    depth,
    topBox: rootBox,
  };
}

async function getOrphanedItems(sort, limit) {
  const order =
    sort === 'alpha'
      ? { name: 1 }
      : sort === 'oldest'
      ? { orphanedAt: 1 }
      : { orphanedAt: -1 };
  return Item.find({ orphanedAt: { $ne: null } })
    .sort(order)
    .limit(limit)
    .lean();
}

async function createItem(data) {
  assertValidCentsPayload(data);
  return Item.create(data); // schema validators will also run
}

async function updateItem(id, data) {
  assertValidCentsPayload(data);
  return Item.findByIdAndUpdate(id, data, { new: true, runValidators: true });
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

// Hard rule: backend only accepts valueCents as integer >= 0
function assertValidCentsPayload(data = {}) {
  if ('value' in data) {
    const err = new Error(
      'Backend expects cents. Do not send "value"; send "valueCents" as a non-negative integer.'
    );
    err.status = 400;
    throw err;
  }
  if ('valueCents' in data) {
    const v = data.valueCents;
    // Reject strings with dots, decimals, negatives, NaN, etc.
    if (typeof v === 'string' && v.includes('.')) {
      const err = new Error(
        'valueCents must be a whole integer (no decimals).'
      );
      err.status = 400;
      throw err;
    }
    const n = Number(v);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
      const err = new Error('valueCents must be a non-negative integer.');
      err.status = 400;
      throw err;
    }
    // Normalize to Number in case it was a numeric string like "12999"
    data.valueCents = n;
  }
  return data;
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
