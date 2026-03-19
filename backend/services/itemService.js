// services/itemService.js
const Item = require('../models/Item');
const Box = require('../models/Box');
const {
  normalizeItemCategory,
  withNormalizedItemCategory,
} = require('../utils/itemCategory');
const {
  buildEmptyImageMetadata,
  collectImageStoragePaths,
} = require('./imageMetadataService');
const { safeDeleteMediaFiles } = require('../utils/mediaCleanup');
const {
  ITEM_STATUSES,
  ITEM_DISPOSITIONS,
  normalizeDisposition,
} = require('../utils/itemDisposition');

const ACTIVE_ITEM_FILTER = { item_status: { $ne: 'gone' } };
const LINK_LABEL_MAX_LENGTH = 80;
const DAY_MS = 1000 * 60 * 60 * 24;

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toItemStatusScope(raw) {
  const value = String(raw ?? '').trim().toLowerCase();
  if (value === 'all') return 'all';
  if (value === 'gone') return 'gone';
  return 'active';
}

function buildItemStatusFilter(statusScope = 'active') {
  const scope = toItemStatusScope(statusScope);
  if (scope === 'all') return {};
  if (scope === 'gone') return { item_status: 'gone' };
  return ACTIVE_ITEM_FILTER;
}

async function enrichItemsWithBoxContext(rawItems = []) {
  const items = (Array.isArray(rawItems) ? rawItems : []).map((item) =>
    withNormalizedItemCategory(
      typeof item?.toObject === 'function'
        ? item.toObject({ virtuals: true })
        : item
    )
  );
  if (!items.length) return [];

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

function buildItemListFilter({
  statusScope = 'active',
  query = '',
  category = '',
  tag = '',
  orphanedOnly = false,
} = {}) {
  const filter = {
    ...buildItemStatusFilter(statusScope),
  };

  if (orphanedOnly) {
    filter.orphanedAt = { $ne: null };
  }

  const normalizedCategory = String(category || '').trim();
  if (normalizedCategory) {
    filter.category = normalizeItemCategory(normalizedCategory);
  }

  const tagQuery = String(tag || '').trim();
  if (tagQuery) {
    filter.tags = { $regex: escapeRegex(tagQuery), $options: 'i' };
  }

  const textQuery = String(query || '').trim();
  if (textQuery) {
    const regex = new RegExp(escapeRegex(textQuery), 'i');
    filter.$or = [
      { name: regex },
      { tags: regex },
      { category: regex },
      { location: regex },
    ];
  }

  return filter;
}

function buildPagedSort(sort = 'alphabetical') {
  const value = String(sort || '').trim();

  if (value === 'boxId') return { mode: 'boxId' };
  if (value === 'created:asc') return { mode: 'find', sort: { createdAt: 1, _id: 1 } };
  if (value === 'created:desc') return { mode: 'find', sort: { createdAt: -1, _id: -1 } };
  if (value === 'updated:asc') return { mode: 'find', sort: { updatedAt: 1, _id: 1 } };
  if (value === 'updated:desc') return { mode: 'find', sort: { updatedAt: -1, _id: -1 } };
  if (value === 'acquired:asc') return { mode: 'find', sort: { dateAcquired: 1, _id: 1 } };
  if (value === 'acquired:desc') return { mode: 'find', sort: { dateAcquired: -1, _id: -1 } };
  if (value === 'lastUsed:asc') return { mode: 'find', sort: { dateLastUsed: 1, _id: 1 } };
  if (value === 'lastUsed:desc') return { mode: 'find', sort: { dateLastUsed: -1, _id: -1 } };
  if (value === 'orphaned:asc') return { mode: 'find', sort: { orphanedAt: 1, _id: 1 } };
  if (value === 'orphaned:desc') return { mode: 'find', sort: { orphanedAt: -1, _id: -1 } };

  return { mode: 'find', sort: { name: 1, _id: 1 } };
}

/**
 * Get all items with breadcrumb + box info.
 * (This one still builds maps — fine for bulk fetch.)
 */
async function getAllItems({ statusScope = 'active' } = {}) {
  const itemDocs = await Item.find(buildItemStatusFilter(statusScope)).lean();
  return enrichItemsWithBoxContext(itemDocs);
}

async function getItemsPage({
  statusScope = 'active',
  limit = 20,
  offset = 0,
  query = '',
  category = '',
  tag = '',
  sort = 'alphabetical',
} = {}) {
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const safeOffset = Math.max(0, Number(offset) || 0);
  const filter = buildItemListFilter({
    statusScope,
    query,
    category,
    tag,
    orphanedOnly: false,
  });
  const total = await Item.countDocuments(filter);
  const sortPlan = buildPagedSort(sort);

  let pageItems = [];
  if (sortPlan.mode === 'boxId') {
    pageItems = await Item.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'boxes',
          let: { itemId: '$_id' },
          pipeline: [
            { $match: { $expr: { $in: ['$$itemId', '$items'] } } },
            { $project: { _id: 1, box_id: 1 } },
            { $limit: 1 },
          ],
          as: '_sortBox',
        },
      },
      { $addFields: { _sortBoxDoc: { $arrayElemAt: ['$_sortBox', 0] } } },
      {
        $addFields: {
          _sortBoxMissing: { $cond: [{ $ifNull: ['$_sortBoxDoc._id', false] }, 0, 1] },
          _sortBoxNumeric: {
            $convert: {
              input: '$_sortBoxDoc.box_id',
              to: 'int',
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $addFields: {
          _sortBoxNumericMissing: { $cond: [{ $eq: ['$_sortBoxNumeric', null] }, 1, 0] },
        },
      },
      {
        $sort: {
          _sortBoxMissing: 1,
          _sortBoxNumericMissing: 1,
          _sortBoxNumeric: 1,
          '_sortBoxDoc.box_id': 1,
          name: 1,
          _id: 1,
        },
      },
      { $skip: safeOffset },
      { $limit: safeLimit },
      {
        $project: {
          _sortBox: 0,
          _sortBoxDoc: 0,
          _sortBoxMissing: 0,
          _sortBoxNumeric: 0,
          _sortBoxNumericMissing: 0,
        },
      },
    ]);
  } else {
    pageItems = await Item.find(filter)
      .sort(sortPlan.sort)
      .skip(safeOffset)
      .limit(safeLimit)
      .lean();
  }

  const items = await enrichItemsWithBoxContext(pageItems);
  return {
    items,
    total,
    limit: safeLimit,
    offset: safeOffset,
    hasMore: safeOffset + items.length < total,
  };
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
  const page = await getOrphanedItemsPage({
    sort,
    limit,
    offset: 0,
  });
  return page.items;
}

async function getOrphanedItemsPage({
  sort = 'recent',
  limit = 20,
  offset = 0,
} = {}) {
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const safeOffset = Math.max(0, Number(offset) || 0);
  const order =
    sort === 'alpha'
      ? { name: 1, _id: 1 }
      : sort === 'oldest'
      ? { orphanedAt: 1, _id: 1 }
      : { orphanedAt: -1, _id: -1 };
  const filter = {
    ...ACTIVE_ITEM_FILTER,
    orphanedAt: { $ne: null },
  };
  const total = await Item.countDocuments(filter);
  const items = await Item.find(filter)
    .sort(order)
    .skip(safeOffset)
    .limit(safeLimit)
    .lean();
  return {
    items: items.map((item) => withNormalizedItemCategory(item)),
    total,
    limit: safeLimit,
    offset: safeOffset,
    hasMore: safeOffset + items.length < total,
  };
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

async function markItemGone(id, payload = {}) {
  const disposition = normalizeDisposition(
    payload.disposition ?? payload.reason ?? payload.dispositionReason
  );
  if (!disposition) {
    const err = new Error(
      'A valid disposition is required: lost, stolen, trashed, recycled, gifted, or donated.'
    );
    err.status = 400;
    throw err;
  }

  const dispositionAt = normalizeDateValue(
    payload.disposition_at ?? payload.dispositionAt
  );
  const dispositionNotes = normalizeLifecycleNotes(
    payload.disposition_notes ?? payload.dispositionNotes
  );
  const previousBox = await Box.findOne({ items: id }).select('_id').lean();

  await Box.updateMany({ items: id }, { $pull: { items: id } });

  return Item.findByIdAndUpdate(
    id,
    {
      $set: {
        item_status: 'gone',
        disposition,
        disposition_at: dispositionAt || new Date(),
        disposition_notes: dispositionNotes,
        orphanedAt: null,
        last_active_box: previousBox?._id || null,
      },
    },
    { new: true, runValidators: true }
  );
}

async function restoreItemToActive(id) {
  const item = await Item.findById(id).select('_id last_active_box').lean();
  if (!item) return null;

  await Box.updateMany({ items: id }, { $pull: { items: id } });

  let restoredToBoxId = null;
  if (item.last_active_box) {
    const targetExists = await Box.exists({ _id: item.last_active_box });
    if (targetExists) {
      await Box.updateOne(
        { _id: item.last_active_box },
        { $addToSet: { items: id } }
      );
      restoredToBoxId = item.last_active_box;
    }
  }

  const lifecycleUpdate = {
    item_status: 'active',
    disposition: null,
    disposition_at: null,
    disposition_notes: '',
    orphanedAt: restoredToBoxId ? null : new Date(),
    last_active_box: null,
  };
  if (restoredToBoxId) {
    lifecycleUpdate.location = '';
  }

  return Item.findByIdAndUpdate(
    id,
    {
      $set: lifecycleUpdate,
    },
    { new: true, runValidators: true }
  );
}

async function hardDeleteItem(id) {
  const current = await Item.findById(id).select('_id image imagePath').lean();
  if (!current) return null;

  const previousPaths = collectImageStoragePaths(current);

  await Box.updateMany({ items: id }, { $pull: { items: id } });
  const deleted = await Item.findByIdAndDelete(id);
  if (!deleted) return null;

  await safeDeleteMediaFiles(previousPaths, {
    label: `item-delete:${id}`,
  });

  return deleted;
}

async function deleteItem(id) {
  return hardDeleteItem(id);
}

async function setItemImage(id, image) {
  const current = await Item.findById(id).select('image imagePath').lean();
  if (!current) return null;

  const previousPaths = collectImageStoragePaths(current);
  const nextPaths = new Set(collectImageStoragePaths({ image, imagePath: '' }));

  const updated = await Item.findByIdAndUpdate(
    id,
    {
      image,
      imagePath: image?.display?.url || image?.original?.url || '',
    },
    { new: true, runValidators: true }
  );

  if (!updated) return null;

  const stalePaths = previousPaths.filter((entry) => !nextPaths.has(entry));

  await safeDeleteMediaFiles(stalePaths, {
    label: `item-image-replace:${id}`,
  });

  return updated;
}

async function clearItemImage(id) {
  return Item.findByIdAndUpdate(
    id,
    {
      image: buildEmptyImageMetadata(),
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
    { ...ACTIVE_ITEM_FILTER, _id: { $in: itemIds } },
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
  normalizeHistoryAndDerivedFields(data);
  normalizeNullableStringField(data, 'primaryOwnerName');
  normalizeStringField(data, 'maintenanceNotes');
  normalizeLinksField(data);
  normalizeKeepPriority(data);
  normalizeItemCategoryField(data);
  normalizeItemStatusField(data);
  normalizeDispositionField(data);
  normalizeDispositionAtField(data);
  normalizeDispositionNotesField(data);
  validateLifecycleFieldCombination(data);

  return data;
}

function normalizeLinksField(data) {
  if (!('links' in data)) return;

  if (data.links == null) {
    data.links = [];
    return;
  }

  if (!Array.isArray(data.links)) {
    const err = new Error('links must be an array of { label, url } objects.');
    err.status = 400;
    throw err;
  }

  const normalized = [];
  for (let i = 0; i < data.links.length; i += 1) {
    const row = data.links[i];
    if (row == null || typeof row !== 'object' || Array.isArray(row)) {
      const err = new Error(`links[${i}] must be an object with label and url.`);
      err.status = 400;
      throw err;
    }

    const label = String(row.label ?? '').trim();
    const url = String(row.url ?? '').trim();

    // Ignore untouched rows from the UI.
    if (!label && !url) continue;

    if (!label) {
      const err = new Error(`links[${i}].label is required when url is provided.`);
      err.status = 400;
      throw err;
    }

    if (label.length > LINK_LABEL_MAX_LENGTH) {
      const err = new Error(
        `links[${i}].label must be ${LINK_LABEL_MAX_LENGTH} characters or fewer.`
      );
      err.status = 400;
      throw err;
    }

    if (!url) {
      const err = new Error(`links[${i}].url is required when label is provided.`);
      err.status = 400;
      throw err;
    }

    if (!isValidExternalUrl(url)) {
      const err = new Error(
        `links[${i}].url must be a valid absolute http/https URL.`
      );
      err.status = 400;
      throw err;
    }

    normalized.push({ label, url });
  }

  data.links = normalized;
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

function normalizeItemStatusField(data) {
  if (!('item_status' in data)) return;
  const raw = String(data.item_status ?? '').trim().toLowerCase();
  if (!ITEM_STATUSES.includes(raw)) {
    const err = new Error(
      `item_status must be one of: ${ITEM_STATUSES.join(', ')}`
    );
    err.status = 400;
    throw err;
  }
  data.item_status = raw;
}

function normalizeDispositionField(data) {
  if (!('disposition' in data)) return;
  if (data.disposition == null || data.disposition === '') {
    data.disposition = null;
    return;
  }

  const raw = String(data.disposition).trim().toLowerCase();
  if (!ITEM_DISPOSITIONS.includes(raw)) {
    const err = new Error(
      `disposition must be one of: ${ITEM_DISPOSITIONS.join(', ')}`
    );
    err.status = 400;
    throw err;
  }
  data.disposition = raw;
}

function normalizeDispositionAtField(data) {
  if (!('disposition_at' in data)) return;
  data.disposition_at = normalizeDateValue(data.disposition_at);
}

function normalizeDispositionNotesField(data) {
  if (!('disposition_notes' in data)) return;
  data.disposition_notes = normalizeLifecycleNotes(data.disposition_notes);
}

function validateLifecycleFieldCombination(data) {
  if (!('item_status' in data)) return;

  if (data.item_status === 'active') {
    data.disposition = null;
    data.disposition_at = null;
    if (!('disposition_notes' in data)) {
      data.disposition_notes = '';
    }
    return;
  }

  if (data.item_status === 'gone' && !data.disposition) {
    const err = new Error(
      'disposition is required when item_status is "gone".'
    );
    err.status = 400;
    throw err;
  }
}

function normalizeDateValue(value) {
  if (value == null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const err = new Error('Invalid date value.');
    err.status = 400;
    throw err;
  }
  return date;
}

function normalizeDateArrayField(data, field) {
  if (!(field in data)) return;

  const raw = data[field];
  if (raw == null || raw === '') {
    data[field] = [];
    return;
  }

  if (!Array.isArray(raw)) {
    const err = new Error(`${field} must be an array of date values.`);
    err.status = 400;
    throw err;
  }

  const deduped = new Set();
  for (let i = 0; i < raw.length; i += 1) {
    const value = raw[i];
    if (value == null || value === '') continue;

    const date = normalizeDateValue(value);
    deduped.add(date.toISOString());
  }

  data[field] = Array.from(deduped)
    .sort()
    .map((value) => new Date(value));
}

function getLatestDateValue(values = []) {
  if (!Array.isArray(values) || values.length === 0) return null;
  return values[values.length - 1];
}

function getIntervalDaysFromHistory(values = []) {
  if (!Array.isArray(values) || values.length < 2) return null;
  const previous = values[values.length - 2];
  const latest = values[values.length - 1];
  const days = Math.round((latest.getTime() - previous.getTime()) / DAY_MS);
  return Number.isFinite(days) && days >= 0 ? days : null;
}

function normalizeHistoryAndDerivedFields(data) {
  if ('dateAcquired' in data) {
    data.dateAcquired = normalizeDateValue(data.dateAcquired);
  }

  if ('dateLastUsed' in data && !('usageHistory' in data)) {
    const latestUse = normalizeDateValue(data.dateLastUsed);
    data.usageHistory = latestUse ? [latestUse] : [];
  }
  if ('usageHistory' in data) {
    normalizeDateArrayField(data, 'usageHistory');
    data.dateLastUsed = getLatestDateValue(data.usageHistory);
  }

  if ('lastCheckedAt' in data && !('checkHistory' in data)) {
    const latestCheck = normalizeDateValue(data.lastCheckedAt);
    data.checkHistory = latestCheck ? [latestCheck] : [];
  }
  if ('checkHistory' in data) {
    normalizeDateArrayField(data, 'checkHistory');
    data.lastCheckedAt = getLatestDateValue(data.checkHistory);
  }

  if ('lastMaintainedAt' in data && !('maintenanceHistory' in data)) {
    const latestMaintenance = normalizeDateValue(data.lastMaintainedAt);
    data.maintenanceHistory = latestMaintenance ? [latestMaintenance] : [];
  }
  if ('maintenanceHistory' in data) {
    normalizeDateArrayField(data, 'maintenanceHistory');
    data.lastMaintainedAt = getLatestDateValue(data.maintenanceHistory);
    data.maintenanceIntervalDays = getIntervalDaysFromHistory(
      data.maintenanceHistory
    );
  } else if ('maintenanceIntervalDays' in data) {
    delete data.maintenanceIntervalDays;
  }
}

function normalizeLifecycleNotes(value) {
  if (value == null) return '';
  return String(value).trim();
}

function isValidExternalUrl(value) {
  try {
    const parsed = new URL(String(value || '').trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

module.exports = {
  getAllItems,
  getItemsPage,
  toItemStatusScope,
  getItemById,
  getOrphanedItems,
  getOrphanedItemsPage,
  createItem,
  updateItem,
  setItemImage,
  clearItemImage,
  deleteItem,
  hardDeleteItem,
  markItemGone,
  restoreItemToActive,
  backfillOrphanedTimestamps,
  orphanAllItemsInBox,
};
