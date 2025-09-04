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

// Virtual: find the one Box that contains this item._id in its `items` array
itemSchema.virtual('parentBox', {
  ref: 'Box',
  localField: '_id',
  foreignField: 'items',
  justOne: true, // enforce single-parent assumption at the model boundary
});

itemSchema.set('toObject', { virtuals: true });
itemSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Item', itemSchema);
