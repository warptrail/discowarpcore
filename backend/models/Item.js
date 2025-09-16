// models/Item.js
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: '' },
    quantity: { type: Number, default: 1 },
    description: { type: String, default: '' },
    notes: { type: String, default: '' },
    tags: { type: [String], default: [] },
    imagePath: { type: String, default: '' },
    location: { type: String, default: '' },
    orphanedAt: { type: Date, default: null },

    // 🔒 Always cents. Must be a non-negative whole integer.
    valueCents: {
      type: Number,
      default: 0,
      min: [0, 'valueCents must be >= 0'],
      validate: {
        validator: Number.isInteger,
        message: 'valueCents must be an integer number of cents',
      },
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// Read-only virtual for convenience (dollars). No setter.
itemSchema.virtual('value').get(function () {
  return (this.valueCents ?? 0) / 100;
});

// Keep your parentBox virtual if you use it
itemSchema.virtual('parentBox', {
  ref: 'Box',
  localField: '_id',
  foreignField: 'items',
  justOne: true,
});

module.exports = mongoose.model('Item', itemSchema);
