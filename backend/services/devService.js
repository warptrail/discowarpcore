// services/devService.js
const Box = require('../models/Box');
const Item = require('../models/Item');
const dayjs = require('dayjs');

async function orphanAllItemsSequential(startAt = '2000-01-01T00:00:00Z') {
  // 1) Collect item IDs from all boxes, preserve encounter order, dedupe
  const boxes = await Box.find(
    { items: { $exists: true, $ne: [] } },
    { items: 1 },
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
      { $set: { items: [] } },
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

module.exports = { orphanAllItemsSequential };
