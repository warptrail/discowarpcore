// services/devService.js
const Box = require('../models/Box');
const Item = require('../models/Item');
const TREES = require('../seed/boxTrees.mock');
const dayjs = require('dayjs');

const SEED_PREFIX = '[DEV SEED]';
const RANGE_START = 525;
const RANGE_END = 575;

const s = (n) => String(n);

// Guard: ensure reserved range is free
async function ensureRangeFree() {
  const exists = await Box.findOne({
    box_id: { $gte: s(RANGE_START), $lte: s(RANGE_END) },
  }).lean();
  if (exists) {
    const err = new Error(
      `Cannot seed: reserved box_id range ${RANGE_START}-${RANGE_END} already in use (found ${exists.box_id}).`
    );
    err.status = 409;
    throw err;
  }
}

// Wipe: delete only boxes in the reserved range + their items
async function wipeReservedRange() {
  const boxes = await Box.find(
    {
      box_id: { $gte: s(RANGE_START), $lte: s(RANGE_END) },
    },
    { _id: 1 }
  ).lean();

  const boxIds = boxes.map((b) => b._id);
  let deletedItems = 0;
  let deletedBoxes = 0;

  if (boxIds.length) {
    const di = await Item.deleteMany({ box: { $in: boxIds } }).catch(
      async () => {
        // If your Item schema uses a different ref field, attempt alt:
        const alt = await Item.deleteMany({ boxId: { $in: boxIds } });
        return { deletedCount: alt.deletedCount || 0 };
      }
    );
    deletedItems = di.deletedCount || 0;
  }

  const db = await Box.deleteMany({
    box_id: { $gte: s(RANGE_START), $lte: s(RANGE_END) },
  });
  deletedBoxes = db.deletedCount || 0;

  return { deletedBoxes, deletedItems };
}

// Helpers to create docs via models (no mongoose import)
async function createBox({ label, box_id, parentBox = null }) {
  const doc = await Box.create({
    _id: Box.newId(),
    label: `${SEED_PREFIX} ${label}`,
    box_id: s(box_id),
    parentBox,
  });
  return doc;
}

async function createItemAndAttach({ label, boxId }) {
  const item = await Item.create({
    // _id: Item.newId ? Item.newId() : undefined,
    name: `${SEED_PREFIX} ${label}`, // <-- FIXED: use name, not label
    box: boxId, // or boxId: boxId depending on your Item schema
  });

  // keep Box.items in sync
  await Box.updateOne({ _id: boxId }, { $push: { items: item._id } });

  return item;
}

// Depth-first walk over a tree definition and create boxes/items
async function walkAndCreate(node, ctx, parentId = null) {
  if (ctx.cur > RANGE_END) {
    const err = new Error(
      `Seed exhausted reserved range ${RANGE_START}-${RANGE_END}.`
    );
    err.status = 409;
    throw err;
  }

  const myBoxId = ctx.cur++;
  const boxDoc = await createBox({
    label: node.label,
    box_id: myBoxId,
    parentBox: parentId,
  });

  // items on this node
  for (const itemLabel of node.items || []) {
    await createItemAndAttach({ label: itemLabel, boxId: boxDoc._id });
  }

  // children (if any)
  for (const child of node.children || []) {
    await walkAndCreate(child, ctx, boxDoc._id);
  }

  ctx.rootsIfNoParent.push(
    !parentId
      ? { _id: boxDoc._id, label: boxDoc.label, box_id: boxDoc.box_id }
      : null
  );
  return boxDoc;
}

async function seedFromMocks() {
  await ensureRangeFree();

  const ctx = { cur: RANGE_START, rootsIfNoParent: [] };
  let createdBoxes = 0;
  let createdItems = 0;

  // Wrap in a simple loop; you can promote to a session/transaction later if needed
  for (const tree of TREES) {
    await walkAndCreate(tree, ctx, null);
  }

  // Count what we inserted (cheap recount)
  createdBoxes = await Box.countDocuments({
    box_id: { $gte: s(RANGE_START), $lte: s(ctx.cur - 1) },
  });
  createdItems = await Item.countDocuments({
    // If your Item schema uses 'box' ref:
    box: {
      $in: await Box.find(
        { box_id: { $gte: s(RANGE_START), $lte: s(ctx.cur - 1) } },
        { _id: 1 }
      )
        .lean()
        .then((rs) => rs.map((r) => r._id)),
    },
  }).catch(async () => {
    // Fallback if using 'boxId' instead:
    const ids = await Box.find(
      { box_id: { $gte: s(RANGE_START), $lte: s(ctx.cur - 1) } },
      { _id: 1 }
    ).lean();
    const di = await Item.countDocuments({
      boxId: { $in: ids.map((r) => r._id) },
    });
    return di;
  });

  const roots = ctx.rootsIfNoParent.filter(Boolean);
  return {
    createdBoxes,
    createdItems,
    reservedRange: `${RANGE_START}-${RANGE_END}`,
    usedShortIds: Array.from({ length: ctx.cur - RANGE_START }, (_, i) =>
      s(RANGE_START + i)
    ),
    roots,
  };
}

async function orphanAllItemsSequential(startAt = '2000-01-01T00:00:00Z') {
  // 1) Collect item IDs from all boxes, preserve encounter order, dedupe
  const boxes = await Box.find(
    { items: { $exists: true, $ne: [] } },
    { items: 1 }
  )
    .sort({ box_id: 1, createdAt: 1, _id: 1 })
    .lean();

  const seen = new Set();
  const boxedItemIds = [];
  for (const b of boxes) {
    if (Array.isArray(b.items)) {
      for (const id of b.items) {
        const key = String(id);
        if (!seen.has(key)) {
          seen.add(key);
          boxedItemIds.push(key);
        }
      }
    }
  }

  const start = dayjs(startAt);
  let cursorTime = start; // will advance as we assign timestamps

  // 2) Orphan all items that were inside boxes (sequential timestamps)
  if (boxedItemIds.length) {
    const ops = boxedItemIds.map((id, idx) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { orphanedAt: start.add(idx, 'second').toDate() } },
      },
    }));
    await Item.bulkWrite(ops, { ordered: true });

    // Move the cursor to the next second after the last boxed item
    cursorTime = start.add(boxedItemIds.length, 'second');

    // Clear items arrays in boxes (keep nesting intact)
    await Box.updateMany(
      { items: { $exists: true, $ne: [] } },
      { $set: { items: [] } }
    );
  }

  // 3) Backfill any remaining items with orphanedAt === null (detached/never stamped)
  //    Append them after the boxed sequence, 1s apart, deterministically ordered
  const unstamped = await Item.find({ orphanedAt: null }, { _id: 1 })
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  if (unstamped.length) {
    const ops2 = unstamped.map((it, idx) => ({
      updateOne: {
        filter: { _id: it._id },
        update: {
          $set: { orphanedAt: cursorTime.add(idx, 'second').toDate() },
        },
      },
    }));
    await Item.bulkWrite(ops2, { ordered: true });
    cursorTime = cursorTime.add(unstamped.length, 'second');
  }

  const total = boxedItemIds.length + unstamped.length;

  return {
    totalOrphaned: total,
    // First timestamp (or null if no items at all)
    startAt: total ? start.toISOString() : start.toISOString(),
    // End timestamp (or null if none)
    endAt: total ? cursorTime.subtract(1, 'second').toISOString() : null,
    details: {
      fromBoxes: boxedItemIds.length,
      backfilledDetached: unstamped.length,
    },
  };
}

module.exports = { orphanAllItemsSequential, seedFromMocks, wipeReservedRange };
