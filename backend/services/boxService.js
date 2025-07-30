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

async function deleteBox(id) {
  // step 1: set parentBox to null for any children
  await Box.updateMany({ parentBox: id }, { $set: { parentBox: null } });

  // step 2: delete the box itself
  return Box.findByIdAndDelete(id);
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
  deleteBox,
  deleteAllBoxes,
};
