// models/Box.js
const mongoose = require('mongoose');

function normalizeOptionalString(value) {
  if (value == null) return undefined;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed || undefined;
}

const boxSchema = new mongoose.Schema({
  box_id: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  group: { type: String, trim: true, set: normalizeOptionalString },
  location: String,
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    default: null,
    index: true,
  },
  description: String,
  notes: String,
  tags: [String],
  imagePath: { type: String, default: '' },
  image: {
    originalName: { type: String, default: '' },
    uploadedAt: { type: Date, default: null },
    original: {
      storagePath: { type: String, default: '' },
      url: { type: String, default: '' },
      mimeType: { type: String, default: '' },
      width: { type: Number, default: null },
      height: { type: Number, default: null },
      sizeBytes: { type: Number, default: null },
    },
    display: {
      storagePath: { type: String, default: '' },
      url: { type: String, default: '' },
      mimeType: { type: String, default: '' },
      width: { type: Number, default: null },
      height: { type: Number, default: null },
      sizeBytes: { type: Number, default: null },
    },
    thumb: {
      storagePath: { type: String, default: '' },
      url: { type: String, default: '' },
      mimeType: { type: String, default: '' },
      width: { type: Number, default: null },
      height: { type: Number, default: null },
      sizeBytes: { type: Number, default: null },
    },
  },
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
  return this.find()
    .select('_id box_id label group description parentBox location locationId')
    .lean();
};

// ✅ Validate Mongo ObjectId without importing mongoose in services
boxSchema.statics.isValidId = function (id) {
  return mongoose.isValidObjectId(id);
};

// ✅ Existence check helper (thin wrapper, keeps services clean)
boxSchema.statics.existsById = function (id) {
  return this.exists({ _id: id });
};

// ✅ Releases only direct children (one level) to the floor
boxSchema.statics.releaseChildrenToFloor = function (parentId) {
  return this.updateMany(
    { parentBox: parentId },
    { $set: { parentBox: null } },
  );
};

// NOTE:
// These indexes are already created via inline schema definitions above:
// - `box_id` uses `unique: true`
// - `parentBox` uses `index: true`
//
// Defining them again here causes duplicate-index warnings at startup.
// Leaving this commented out avoids redundant index creation while preserving intent.
// boxSchema.index({ box_id: 1 }, { unique: true });
// boxSchema.index({ parentBox: 1 });

module.exports = mongoose.model('Box', boxSchema);
