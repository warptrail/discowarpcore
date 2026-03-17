// services/itemService.js
const Item = require('../models/Item');
const Box = require('../models/Box');
const {
  normalizeItemCategory,
  withNormalizedItemCategory,
} = require('../utils/itemCategory');

/**
 * Get all items with breadcrumb + box info.
 * (This one still builds maps — fine for bulk fetch.)
 */
async function getAllItems() {
  const itemDocs = await Item.find();
  const items = itemDocs.map((doc) =>
    withNormalizedItemCategory(doc.toObject({ virtuals: true }))
  );

  const boxes = await Box.find()
    .select('_id box_id label description items parentBox')
    .lean();

  // itemId -> leaf box id
  const itemToLeafId = new Map();
  for (const b of boxes) {
    for (const itemId of b.items || []) {
      itemToLeafId.set(String(itemId), String(b._id));
    }
  }

  // build maps using helpers
  const { buildBoxMaps, makeBreadcrumb } = require('../utils/boxHelpers');
  const maps = buildBoxMaps(boxes);

  return items.map((i) => {
    const leafId = itemToLeafId.get(String(i._id));
    const { breadcrumb, depth, rootBox, leafBox } = makeBreadcrumb(
      leafId,
      maps
    );

    const box =
      leafBox && maps.byId.get(String(leafBox._id))
        ? {
            _id: maps.byId.get(String(leafBox._id))._id,
            box_id: maps.byId.get(String(leafBox._id)).box_id,
            label: maps.byId.get(String(leafBox._id)).label,
            description: maps.byId.get(String(leafBox._id)).description,
          }
        : null;

    return withNormalizedItemCategory({ ...i, box, breadcrumb, depth, topBox: rootBox });
  });
}

/**
 * Get a single item by id with breadcrumb + box info.
 * Delegates to Item model static.
 */
async function getItemById(id, { select } = {}) {
  const item = await Item.findItemById(id, { select });
  return withNormalizedItemCategory(item);
}

/**
 * Orphaned items
 */
async function getOrphanedItems(sort, limit) {
  const order =
    sort === 'alpha'
      ? { name: 1 }
      : sort === 'oldest'
      ? { orphanedAt: 1 }
      : { orphanedAt: -1 };

  const items = await Item.find({ orphanedAt: { $ne: null } })
    .sort(order)
    .limit(limit)
    .lean();
  return items.map((item) => withNormalizedItemCategory(item));
}

/**
 * CRUD operations
 */
async function createItem(data) {
  assertValidCentsPayload(data);
  return Item.create(data);
}

async function updateItem(id, data) {
  assertValidCentsPayload(data);
  return Item.findByIdAndUpdate(id, data, { new: true, runValidators: true });
}

async function deleteItem(id) {
  return Item.findByIdAndDelete(id);
}

async function setItemImage(id, image) {
  return Item.findByIdAndUpdate(
    id,
    {
      image,
      imagePath: image?.display?.url || image?.original?.url || '',
    },
    { new: true, runValidators: true }
  );
}

function buildEmptyItemImage() {
  return {
    originalName: '',
    uploadedAt: null,
    original: {
      storagePath: '',
      url: '',
      mimeType: '',
      width: null,
      height: null,
      sizeBytes: null,
    },
    display: {
      storagePath: '',
      url: '',
      mimeType: '',
      width: null,
      height: null,
      sizeBytes: null,
    },
    thumb: {
      storagePath: '',
      url: '',
      mimeType: '',
      width: null,
      height: null,
      sizeBytes: null,
    },
  };
}

async function clearItemImage(id) {
  return Item.findByIdAndUpdate(
    id,
    {
      image: buildEmptyItemImage(),
      imagePath: '',
    },
    { new: true, runValidators: true }
  );
}

/**
 * Maintenance helpers
 */
async function backfillOrphanedTimestamps() {
  const items = await Item.find({ orphanedAt: null }).lean();
  const boxes = await Box.find().select('items').lean();

  const boxedItemIds = new Set();
  boxes.forEach((box) => {
    box.items.forEach((itemId) => boxedItemIds.add(itemId.toString()));
  });

  let updatedCount = 0;
  for (const item of items) {
    if (!boxedItemIds.has(item._id.toString())) {
      await Item.findByIdAndUpdate(item._id, { orphanedAt: new Date() });
      updatedCount++;
    }
  }
  return updatedCount;
}

async function orphanAllItemsInBox(boxId) {
  const box = await Box.findById(boxId).select('items').lean();
  const itemIds = Array.isArray(box?.items) ? box.items : [];

  if (!itemIds.length) {
    return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
  }

  return Item.updateMany(
    { _id: { $in: itemIds } },
    { $set: { orphanedAt: new Date(), location: '' } }
  );
}

/**
 * Validation helper for valueCents
 */
function assertValidCentsPayload(data = {}) {
  if ('value' in data) {
    const err = new Error(
      'Backend expects cents. Do not send "value"; send "valueCents" as a non-negative integer.'
    );
    err.status = 400;
    throw err;
  }

  assertNonNegativeIntegerField(data, 'valueCents');
  assertNonNegativeIntegerField(data, 'purchasePriceCents', { allowNull: true });
  assertNonNegativeIntegerField(data, 'maintenanceIntervalDays', {
    allowNull: true,
  });
  normalizeNullableStringField(data, 'primaryOwnerName');
  normalizeStringField(data, 'maintenanceNotes');
  normalizeKeepPriority(data);
  normalizeItemCategoryField(data);

  return data;
}

function assertNonNegativeIntegerField(
  data,
  field,
  { allowNull = false } = {}
) {
  if (!(field in data)) return;

  const raw = data[field];

  if (allowNull && (raw === null || raw === '')) {
    data[field] = null;
    return;
  }

  if (typeof raw === 'string' && raw.includes('.')) {
    const err = new Error(`${field} must be a whole integer (no decimals).`);
    err.status = 400;
    throw err;
  }

  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    const err = new Error(`${field} must be a non-negative integer.`);
    err.status = 400;
    throw err;
  }

  data[field] = n;
}

function normalizeNullableStringField(data, field) {
  if (!(field in data)) return;
  if (data[field] == null) {
    data[field] = null;
    return;
  }
  const s = String(data[field]).trim();
  data[field] = s ? s : null;
}

function normalizeStringField(data, field) {
  if (!(field in data)) return;
  if (data[field] == null) {
    data[field] = '';
    return;
  }
  data[field] = String(data[field]).trim();
}

function normalizeKeepPriority(data) {
  if (!('keepPriority' in data)) return;
  if (data.keepPriority == null || data.keepPriority === '') {
    data.keepPriority = null;
    return;
  }
  const mapped = String(data.keepPriority).trim().toLowerCase();
  data.keepPriority = mapped === 'normal' ? 'medium' : mapped;
}

function normalizeItemCategoryField(data) {
  if (!('category' in data)) return;
  data.category = normalizeItemCategory(data.category);
}

module.exports = {
  getAllItems,
  getItemById,
  getOrphanedItems,
  createItem,
  updateItem,
  setItemImage,
  clearItemImage,
  deleteItem,
  backfillOrphanedTimestamps,
  orphanAllItemsInBox,
};
