const mongoose = require('mongoose');

const boxSchema = new mongoose.Schema({
  box_id: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  location: String,
  description: String,
  notes: String,
  tags: [String],
  imagePath: String, // relative path to box image
  parentBox: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Box',
    default: null,
  },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
});

// 🔑 Helper for generating new ObjectIds without pulling mongoose into services
boxSchema.statics.newId = function () {
  return new mongoose.Types.ObjectId();
};

module.exports = mongoose.model('Box', boxSchema);
