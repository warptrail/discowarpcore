// services/boxService.js
const Box = require("../models/Box");

async function getBoxesByParent(parentId) {
  const filter = parentId === "null" ? { parentBox: null } : { parentBox: parentId };
  console.log(filter)
  return Box.find(filter).populate("parentBox");
}

async function updateBox(id, data) {
  return Box.findByIdAndUpdate(id, data, { new: true, runValidators: true });
}

module.exports = {
    getBoxesByParent,
    updateBox
}