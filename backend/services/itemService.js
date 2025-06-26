const Item = require("../models/Item")

async function getAllItems() {
  return Item.find();
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

module.exports = {
  getAllItems,
  createItem,
  updateItem,
  deleteItem,
};