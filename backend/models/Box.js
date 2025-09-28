// models/Box.js
const mongoose = require('mongoose');

const boxSchema = new mongoose.Schema({
  box_id: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  location: String,
  description: String,
  notes: String,
  tags: [String],
  imagePath: { type: String, default: null },
  parentBox: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Box',
    default: null,
    index: true,
  },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
});

// 🔑 Helper for generating new ObjectIds without pulling mongoose into services
boxSchema.statics.newId = function () {
  return new mongoose.Types.ObjectId();
};

// 🔎 New helper: fetch slim set for breadcrumb maps
boxSchema.statics.findAllBoxesForMaps = async function () {
  return this.find().select('_id box_id label description parentBox').lean();
};

// Good to have both indexes:
boxSchema.index({ box_id: 1 }, { unique: true });
boxSchema.index({ parentBox: 1 });

module.exports = mongoose.model('Box', boxSchema);
