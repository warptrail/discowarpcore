// models/Item.js
const mongoose = require('mongoose');
const {
  ITEM_CATEGORIES,
  DEFAULT_ITEM_CATEGORY,
  normalizeItemCategory,
  withNormalizedItemCategory,
} = require('../utils/itemCategory');
const {
  ITEM_STATUSES,
  ITEM_DISPOSITIONS,
} = require('../utils/itemDisposition');
const { KEEP_PRIORITY_VALUES } = require('../utils/keepPriority');

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const next = toTrimmed(value);
    if (next) return next;
  }
  return '';
}

function isNonNegativeIntegerOrNull(v) {
  return v == null || (Number.isInteger(v) && v >= 0);
}

function isValidExternalUrl(value) {
  try {
    const parsed = new URL(String(value || '').trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeItemLinks(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((link) => {
      const label = String(link?.label || '').trim();
      const url = String(link?.url || '').trim();
      return { label, url };
    })
    .filter((link) => link.label || link.url);
}

const DAY_MS = 1000 * 60 * 60 * 24;

function normalizeDateArray(values) {
  if (!Array.isArray(values)) return [];
  const deduped = new Set();

  values.forEach((value) => {
    if (value == null || value === '') return;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return;
    deduped.add(date.toISOString());
  });

  return Array.from(deduped)
    .sort()
    .map((value) => new Date(value));
}

function getLatestDate(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  return values[values.length - 1];
}

function getIntervalDays(values) {
  if (!Array.isArray(values) || values.length < 2) return null;
  const previous = values[values.length - 2];
  const latest = values[values.length - 1];
  const days = Math.round((latest.getTime() - previous.getTime()) / DAY_MS);
  return Number.isFinite(days) && days >= 0 ? days : null;
}

function elapsedMs(startNs) {
  return Number(process.hrtime.bigint() - startNs) / 1e6;
}

function formatMs(value) {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}

async function loadBoxLineage(Box, leafBox, maxDepth = 64) {
  const lineage = [];
  if (!leafBox?._id) return lineage;

  lineage.push(leafBox);
  const visited = new Set([String(leafBox._id)]);
  let cursorId = leafBox.parentBox ? String(leafBox.parentBox) : '';

  while (cursorId && lineage.length < maxDepth) {
    if (visited.has(cursorId)) break;
    visited.add(cursorId);

    const parent = await Box.findById(cursorId)
      .select('_id box_id label group parentBox location')
      .lean();
    if (!parent) break;

    lineage.push(parent);
    cursorId = parent.parentBox ? String(parent.parentBox) : '';
  }

  return lineage;
}

const itemLinkSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      default: '',
      trim: true,
      maxlength: [80, 'link label must be 80 characters or fewer'],
      validate: {
        validator(value) {
          const label = String(value || '').trim();
          const url = String(this?.url || '').trim();
          if (!label && !url) return true;
          return !!label;
        },
        message: 'link label is required when link url is provided',
      },
    },
    url: {
      type: String,
      default: '',
      trim: true,
      validate: [
        {
          validator(value) {
            const label = String(this?.label || '').trim();
            const url = String(value || '').trim();
            if (!label && !url) return true;
            return !!url;
          },
          message: 'link url is required when link label is provided',
        },
        {
          validator(value) {
            const url = String(value || '').trim();
            if (!url) return true;
            return isValidExternalUrl(url);
          },
          message: 'link url must be a valid http/https URL',
        },
      ],
    },
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: '' },
    quantity: { type: Number, default: 1 },
    description: { type: String, default: '' },
    notes: { type: String, default: '' },
    tags: { type: [String], default: [] },
    links: { type: [itemLinkSchema], default: [], set: normalizeItemLinks },
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
    item_status: {
      type: String,
      enum: ITEM_STATUSES,
      default: 'active',
      index: true,
    },
    disposition: {
      type: String,
      enum: ITEM_DISPOSITIONS,
      default: null,
    },
    disposition_at: { type: Date, default: null },
    disposition_notes: { type: String, default: '' },
    last_active_box: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Box',
      default: null,
    },
    dateAcquired: { type: Date, default: null },
    dateLastUsed: { type: Date, default: null },
    usageHistory: { type: [Date], default: [] }, // tracks all uses
    checkHistory: { type: [Date], default: [] },
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
      enum: KEEP_PRIORITY_VALUES,
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
    maintenanceHistory: { type: [Date], default: [] },
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

itemSchema.pre('validate', function normalizeDispositionFields(next) {
  const status = this.item_status || 'active';
  if (status === 'gone') {
    if (!this.disposition) {
      this.invalidate(
        'disposition',
        'disposition is required when item_status is "gone"'
      );
    }
    if (!this.disposition_at) {
      this.disposition_at = new Date();
    }
    if (this.disposition_notes == null) {
      this.disposition_notes = '';
    }
    return next();
  }

  this.disposition = null;
  this.disposition_at = null;
  if (this.disposition_notes == null) {
    this.disposition_notes = '';
  }
  return next();
});

itemSchema.pre('validate', function syncLifecycleHistory(next) {
  this.usageHistory = normalizeDateArray(this.usageHistory);
  this.dateLastUsed = getLatestDate(this.usageHistory);

  this.checkHistory = normalizeDateArray(this.checkHistory);
  this.lastCheckedAt = getLatestDate(this.checkHistory);

  this.maintenanceHistory = normalizeDateArray(this.maintenanceHistory);
  this.lastMaintainedAt = getLatestDate(this.maintenanceHistory);
  this.maintenanceIntervalDays = getIntervalDays(this.maintenanceHistory);

  return next();
});

// Read-only virtual for convenience (dollars). No setter.
itemSchema.virtual('value').get(function () {
  return (this.valueCents ?? 0) / 100;
});

// Compatibility alias used by intake activity feeds.
itemSchema.virtual('created_at').get(function () {
  return this.createdAt || null;
});

// Virtual to get parent box
itemSchema.virtual('parentBox', {
  ref: 'Box',
  localField: '_id',
  foreignField: 'items',
  justOne: true,
});

// ✅ Static: find item with breadcrumb + virtuals
itemSchema.statics.findItemById = async function (id, { select, perf = false } = {}) {
  const perfStartNs = process.hrtime.bigint();
  const perfData = {
    itemLookupMs: 0,
    containingBoxLookupMs: 0,
    ancestorChainLookupMs: 0,
    // Legacy fields retained in logs so before/after probes stay comparable.
    allBoxesLoadMs: 0,
    boxMapBuildMs: 0,
    breadcrumbBuildMs: 0,
    totalMs: 0,
  };

  let q = this.findById(id);
  if (select) q = q.select(select);
  try {
    const itemLookupStartNs = process.hrtime.bigint();
    const itemDoc = await q; // Keep full mongoose doc (virtual support stays unchanged)
    perfData.itemLookupMs = elapsedMs(itemLookupStartNs);
    if (!itemDoc) return null;

    // Convert to plain object with virtuals included
    const item = withNormalizedItemCategory(itemDoc.toObject({ virtuals: true }));
    const isGone = String(item?.item_status || '').toLowerCase() === 'gone';

    const Box = mongoose.model('Box');
    const containingBoxLookupStartNs = process.hrtime.bigint();
    const leaf = isGone
      ? null
      : await Box.findOne({ items: item._id })
          .select('_id box_id label group description parentBox location locationId')
          .populate('locationId', 'name')
          .lean();
    perfData.containingBoxLookupMs = elapsedMs(containingBoxLookupStartNs);

    if (!leaf) {
      return withNormalizedItemCategory({
        ...item,
        box: null,
        breadcrumb: [],
        depth: 0,
        topBox: null,
      });
    }

    const ancestorChainLookupStartNs = process.hrtime.bigint();
    const lineage = await loadBoxLineage(Box, leaf);
    perfData.ancestorChainLookupMs = elapsedMs(ancestorChainLookupStartNs);

    const breadcrumbBuildStartNs = process.hrtime.bigint();
    const breadcrumb = [...lineage]
      .reverse()
      .map((node) => ({
        _id: node._id,
        box_id: node.box_id,
        label: node.label,
      }));
    const depth = breadcrumb.length;
    const rootBox = breadcrumb.length > 0 ? breadcrumb[0] : null;
    const leafLocation = firstNonEmpty(leaf?.locationId?.name, leaf?.location);
    const leafGroup = firstNonEmpty(leaf?.group);

    // Effective location is the first non-empty location from leaf -> ancestors.
    let resolvedLocation = '';
    for (const node of lineage) {
      const locationValue = firstNonEmpty(node?.location);
      if (locationValue) {
        resolvedLocation = locationValue;
        break;
      }
    }
    const inheritedLocation = firstNonEmpty(leafLocation, resolvedLocation);

    // Effective group is the first non-empty group from leaf -> ancestors.
    let resolvedGroup = '';
    for (const node of lineage) {
      const groupValue = firstNonEmpty(node?.group);
      if (groupValue) {
        resolvedGroup = groupValue;
        break;
      }
    }
    const inheritedGroup = firstNonEmpty(leafGroup, resolvedGroup);
    perfData.breadcrumbBuildMs = elapsedMs(breadcrumbBuildStartNs);

    return withNormalizedItemCategory({
      ...item,
      inheritedLocation,
      inheritedGroup,
      box: {
        _id: leaf._id,
        box_id: leaf.box_id,
        label: leaf.label,
        group: leafGroup,
        groupLabel: leafGroup,
        resolvedGroup: inheritedGroup,
        description: leaf.description,
        location: leafLocation,
        locationName: leafLocation,
        locationId:
          leaf?.locationId && typeof leaf.locationId === 'object'
            ? {
                _id: leaf.locationId._id,
                name: firstNonEmpty(leaf.locationId.name),
              }
            : null,
      },
      breadcrumb,
      depth,
      topBox: rootBox,
    });
  } finally {
    if (perf) {
      perfData.totalMs = elapsedMs(perfStartNs);
      console.log(
        `[perf][item-detail] model.findItemById itemId=${String(id)} ` +
          `itemLookupMs=${formatMs(perfData.itemLookupMs)} ` +
          `containingBoxLookupMs=${formatMs(perfData.containingBoxLookupMs)} ` +
          `ancestorChainLookupMs=${formatMs(perfData.ancestorChainLookupMs)} ` +
          `allBoxesLoadMs=${formatMs(perfData.allBoxesLoadMs)} ` +
          `boxMapBuildMs=${formatMs(perfData.boxMapBuildMs)} ` +
          `breadcrumbBuildMs=${formatMs(perfData.breadcrumbBuildMs)} ` +
          `totalMs=${formatMs(perfData.totalMs)}`
      );
    }
  }
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
