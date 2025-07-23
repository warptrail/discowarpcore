const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  notes: String,
  tags: [String],
  imagePath: String, // relative path to image file
  orphanedAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model('Item', itemSchema);
