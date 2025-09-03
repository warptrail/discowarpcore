// services/boxService.js
const Box = require('../models/Box');
const Item = require('../models/Item');

const { orphanAllItemsInBox } = require('./itemService');

async function getBoxByMongoId(id) {
  return await Box.findById(id);
}

async function getBoxByBoxId(box_id) {
  return await Box.findOne({ box_id }).populate({
    path: 'items',
    select: 'name quantity notes imagePath',
  });
}

async function getAllBoxes() {
  return Box.find()
    .populate({
      path: 'parentBox',
      select: '_id box_id description', // 👈 Only these fields
    })
    .populate('items') // Leave items fully populated (or adjust as needed)
    .lean();
}

async function getBoxesExcludingId(id) {
  return await Box.find({ _id: { $ne: id } }).sort({ label: 1 });
}

/**
 * Recursive function that populates all children and items of a given box.
 */

async function populateChildren(box) {
  // Find all child boxes where this box is the parent
  const children = await Box.find({ parentBox: box._id }).lean();

  // For each child box, recursively fetch its own children
  for (let child of children) {
    // Populate items inside the child box
    child.items = await Item.find({ _id: { $in: child.items } }).lean();

    child.childBoxes = await populateChildren(child);
  }

  return children;
}

/**
 * Get all top-level boxes and build their full tree recursively.
 */

async function getBoxTree() {
  const topLevelBoxes = await Box.find({ parentBox: null }).lean();

  for (let box of topLevelBoxes) {
    box.items = await Item.find({ _id: { $in: box.items } }).lean();
    box.childBoxes = await populateChildren(box);
  }

  return topLevelBoxes;
}

async function getBoxesByParent(parentId) {
  const filter =
    parentId === 'null' ? { parentBox: null } : { parentBox: parentId };
  console.log(filter);
  return Box.find(filter).populate('parentBox');
}

async function getBoxTreeByBoxId(boxId) {
  // Find the root box using the 3-digit box_id
  const rootBox = await Box.findOne({ box_id: boxId }).populate('items').lean();
  if (!rootBox) return null;

  async function populateChildren(box) {
    // Get child boxes where parentBox is the current box's Mongo _id
    const children = await Box.find({ parentBox: box._id }).lean();

    for (let child of children) {
      // Populate this child's items
      child.items = await Item.find({ _id: { $in: child.items } }).lean();

      // Recursively populate childBoxes of this child
      child.childBoxes = await populateChildren(child);
    }

    return children;
  }

  // Populate the full childBoxes tree
  rootBox.childBoxes = await populateChildren(rootBox);

  return rootBox;
}

async function createBox(data) {
  return Box.create(data);
}

async function updateBox(id, data) {
  return Box.findByIdAndUpdate(id, data, { new: true, runValidators: true });
}

async function deleteBoxById(id) {
  const session = await mongoose.startSession();
  let ok = false;

  try {
    await session.withTransaction(async () => {
      const box = await Box.findById(id).session(session);
      if (!box) {
        ok = false;
        return;
      }

      const boxId = box._id; // Mongo _id
      const parentId = box.parentId || null; // if your schema has parentId

      // (A) If parent exists and you maintain a children cache on parent, pull this child id.
      //     If you don't keep a children array, you can remove this block safely.
      if (parentId) {
        await Box.updateOne(
          { _id: parentId },
          { $pull: { children: boxId } }, // only if you have a 'children' cache array
          { session }
        ).catch(() => {}); // ignore if path doesn't exist in your schema
      }

      // (B) Re-parent all direct children of this box to null (de-nest safely).
      await Box.updateMany(
        { parentId: boxId },
        { $set: { parentId: null } },
        { session }
      );

      // (C) Orphan all items assigned to this box (SoT = Item.boxId)
      await orphanAllItemsInBox(boxId, session);

      // (D) Optional: clean any cache arrays elsewhere that might still list these items.
      // If you only store items on the box being deleted, skip. Otherwise:
      // await Box.updateMany({ items: { $in: await Item.find({ boxId: boxId }).distinct('_id') } },
      //   { $pull: { items: { $in: await Item.find({ boxId: boxId }).distinct('_id') } } },
      //   { session });

      // (E) Finally, delete the box
      await Box.deleteOne({ _id: boxId }, { session });

      ok = true;
    });
  } finally {
    session.endSession();
  }

  return ok;
}

async function deleteAllBoxes() {
  const allBoxes = await Box.find({});
  const boxIds = allBoxes.map((box) => box._id);

  // Orphan all items in each box
  await Promise.all(boxIds.map((id) => orphanAllItemsInBox(id)));

  // Delete all boxes
  await Box.deleteMany({});

  return boxIds.length;
}

module.exports = {
  getBoxByMongoId,
  getBoxByBoxId,
  getBoxesByParent,
  createBox,
  updateBox,
  getBoxTreeByBoxId,
  getBoxTree,
  getAllBoxes,
  getBoxesExcludingId,
  deleteBoxById,
  deleteAllBoxes,
};
