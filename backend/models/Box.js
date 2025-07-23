const mongoose = require("mongoose");

const boxSchema = new mongoose.Schema({
  box_id: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  location: String,
  description: String,
  notes: String,
  tags: [String],
  imagePath: String,  // relative path to box image
  parentBox: { type: mongoose.Schema.Types.ObjectId, ref: "Box", default: null },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }]
});

module.exports = mongoose.model("Box", boxSchema);