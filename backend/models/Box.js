const mongoose = require("mongoose");

const boxSchema = new mongoose.Schema({
  label: { type: String, required: true },
  location: { type: String },
  contents: [{ type: String }],
  parentBox: { type: mongoose.Schema.Types.ObjectId, ref: "Box", default: null }
});

module.exports = mongoose.model("Box", boxSchema);