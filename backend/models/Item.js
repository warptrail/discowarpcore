// models/Item.js
const mongoose = require('mongoose');
const { buildBoxMaps, makeBreadcrumb } = require('../utils/boxHelpers');

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: '' },
    quantity: { type: Number, default: 1 },
    description: { type: String, default: '' },
    notes: { type: String, default: '' },
    tags: { type: [String], default: [] },
    imagePath: { type: String, default: '' },
    location: { type: String, default: '' },
    source: { type: String, default: '' },
    orphanedAt: { type: Date, default: null },
    dateAcquired: { type: Date, default: null },
    dateLastUsed: { type: Date, default: null },
    usageHistory: { type: [Date], default: [] }, // tracks all uses
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

// Virtual to get parent box
itemSchema.virtual('parentBox', {
  ref: 'Box',
  localField: '_id',
  foreignField: 'items',
  justOne: true,
});

// ✅ Static: find item with breadcrumb + virtuals
itemSchema.statics.findItemById = async function (id, { select } = {}) {
  let q = this.findById(id);
  if (select) q = q.select(select);

  const itemDoc = await q; // ⚡ not lean — keep full mongoose doc
  if (!itemDoc) return null;

  // Convert to plain object with virtuals included
  const item = itemDoc.toObject({ virtuals: true });

  const Box = mongoose.model('Box');
  const leaf = await Box.findOne({ items: item._id })
    .select('_id box_id label description parentBox')
    .lean();

  if (!leaf) {
    return { ...item, box: null, breadcrumb: [], depth: 0, topBox: null };
  }

  const allBoxes = await Box.findAllBoxesForMaps();
  const maps = buildBoxMaps(allBoxes);
  const { breadcrumb, depth, rootBox } = makeBreadcrumb(leaf._id, maps);

  return {
    ...item,
    box: {
      _id: leaf._id,
      box_id: leaf.box_id,
      label: leaf.label,
      description: leaf.description,
    },
    breadcrumb,
    depth,
    topBox: rootBox,
  };
};
itemSchema.virtual('avgUseIntervalDays').get(function () {
  if (!this.usageHistory || this.usageHistory.length < 2) return null;

  // Sort oldest → newest
  const sorted = [...this.usageHistory].sort((a, b) => a - b);

  let total = 0;
  for (let i = 1; i < sorted.length; i++) {
    total += (sorted[i] - sorted[i - 1]) / (1000 * 60 * 60 * 24); // ms → days
  }
  return total / (sorted.length - 1);
});

module.exports = mongoose.model('Item', itemSchema);
