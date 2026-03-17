// models/Item.js
const mongoose = require('mongoose');
const { buildBoxMaps, makeBreadcrumb } = require('../utils/boxHelpers');
const {
  ITEM_CATEGORIES,
  DEFAULT_ITEM_CATEGORY,
  normalizeItemCategory,
  withNormalizedItemCategory,
} = require('../utils/itemCategory');

function isNonNegativeIntegerOrNull(v) {
  return v == null || (Number.isInteger(v) && v >= 0);
}

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: '' },
    quantity: { type: Number, default: 1 },
    description: { type: String, default: '' },
    notes: { type: String, default: '' },
    tags: { type: [String], default: [] },
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
    keepPriority: {
      type: String,
      enum: ['low', 'medium', 'high', 'essential'],
      default: null,
    },
    primaryOwnerName: { type: String, default: null },
    condition: {
      type: String,
      enum: ['unknown', 'new', 'good', 'fair', 'poor', 'needs_repair'],
      default: 'unknown',
    },
    category: {
      type: String,
      enum: ITEM_CATEGORIES,
      default: DEFAULT_ITEM_CATEGORY,
      index: true,
      set: normalizeItemCategory,
    },
    isConsumable: { type: Boolean, default: false },
    minimumDesiredQuantity: {
      type: Number,
      default: null,
      validate: {
        validator: isNonNegativeIntegerOrNull,
        message:
          'minimumDesiredQuantity must be null or a non-negative integer',
      },
    },
    lastCheckedAt: { type: Date, default: null },
    acquisitionType: {
      type: String,
      enum: ['unknown', 'purchase', 'gift', 'found', 'made', 'inherited'],
      default: 'unknown',
    },
    purchasePriceCents: {
      type: Number,
      default: null,
      validate: {
        validator: isNonNegativeIntegerOrNull,
        message: 'purchasePriceCents must be null or a non-negative integer',
      },
    },
    lastMaintainedAt: { type: Date, default: null },
    maintenanceIntervalDays: {
      type: Number,
      default: null,
      validate: {
        validator: isNonNegativeIntegerOrNull,
        message: 'maintenanceIntervalDays must be null or a non-negative integer',
      },
    },
    maintenanceNotes: { type: String, default: '' },
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
  const item = withNormalizedItemCategory(itemDoc.toObject({ virtuals: true }));

  const Box = mongoose.model('Box');
  const leaf = await Box.findOne({ items: item._id })
    .select('_id box_id label description parentBox')
    .lean();

  if (!leaf) {
    return withNormalizedItemCategory({
      ...item,
      box: null,
      breadcrumb: [],
      depth: 0,
      topBox: null,
    });
  }

  const allBoxes = await Box.findAllBoxesForMaps();
  const maps = buildBoxMaps(allBoxes);
  const { breadcrumb, depth, rootBox } = makeBreadcrumb(leaf._id, maps);

  return withNormalizedItemCategory({
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
  });
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
