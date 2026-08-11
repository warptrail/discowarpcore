// services/itemService.js
const Item = require('../models/Item');
const mongoose = require('mongoose');
const Box = require('../models/Box');
const Batch = require('../models/Batch');
const MediaState = require('../models/MediaState');
const DeclutterCandidate = require('../models/DeclutterCandidate');
const path = require('path');
const { MEDIA_ROOT, toMediaUrl } = require('../config/media');
const {
  ITEM_CATEGORIES,
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
const {
  KEEP_PRIORITY_VALUES,
  isValidKeepPriority,
  normalizeKeepPriorityValue,
} = require('../utils/keepPriority');
const {
  ORPHANED_LABEL,
  computeChangedFields,
  formatBoxLabel,
  formatItemLabel,
  logEventBestEffort,
  quoteLabel,
  toIdString,
} = require('./eventLogService');

const ACTIVE_ITEM_FILTER = { item_status: { $ne: 'gone' } };
const LINK_LABEL_MAX_LENGTH = 80;
const BULK_IMPORT_ITEM_NAME_MAX_LENGTH = 160;
const BULK_IMPORT_SOURCE_FILENAME_MAX_LENGTH = 180;
const DAY_MS = 1000 * 60 * 60 * 24;

function toPlain(source) {
  if (!source) return null;
  if (typeof source.toObject === 'function') {
    return source.toObject({ virtuals: false });
  }
  return source;
}

function toItemRef(item) {
  if (!item) return { id: null, label: 'Item' };
  return {
    id: toIdString(item._id || item.id),
    label: formatItemLabel(item),
  };
}

function toSourceBatchId(value) {
  const normalized = toIdString(value);
  return normalized ? String(normalized) : null;
}

function mediaPathToClientUrl(pathValue) {
  const normalized = String(pathValue || '').trim();
  if (!normalized) return '';

  const relativePath = path.isAbsolute(normalized)
    ? path.relative(MEDIA_ROOT, normalized)
    : normalized.replace(/^\/+/, '');

  if (!relativePath || relativePath.startsWith('..')) return '';
  return toMediaUrl(relativePath);
}

function toSourceBatchSummary(batch) {
  if (!batch) return null;

  const id = toSourceBatchId(batch._id || batch.id);
  const batchId = String(batch?.identity?.batchId || '').trim();
  const batchName = String(batch?.identity?.batchName || batchId || '').trim();
  const archiveStatus = String(batch?.archiveState?.status || 'active').trim() || 'active';

  return {
    id,
    batchId,
    batchName,
    label: batchName || batchId || 'Batch',
    archiveStatus,
    isArchived: archiveStatus === 'archived',
    importedAt: batch?.importSnapshot?.importedAt || null,
    itemCount: Math.max(
      Array.isArray(batch?.importSnapshot?.importedItemIds)
        ? batch.importSnapshot.importedItemIds.length
        : 0,
      Number(batch?.importSnapshot?.createdItemCount || 0) +
        Number(batch?.importSnapshot?.updatedItemCount || 0),
    ),
    archivedAt: batch?.archiveState?.archivedAt || null,
    createdAt: batch?.identity?.createdAt || batch?.createdAt || null,
    updatedAt: batch?.identity?.updatedAt || batch?.updatedAt || null,
  };
}

async function attachSourceBatchSummaries(rawItems = [], { batchDocs: providedBatchDocs } = {}) {
  const items = Array.isArray(rawItems) ? rawItems : [];
  if (!items.length) return [];

  const sourceBatchIds = Array.from(new Set(
    items
      .map((item) => toSourceBatchId(item?.sourceBatchId))
      .filter(Boolean)
  ));

  if (!sourceBatchIds.length) {
    return items.map((item) => ({
      ...item,
      sourceBatchId: toSourceBatchId(item?.sourceBatchId),
      sourceBatch: null,
    }));
  }

  const batchDocs = Array.isArray(providedBatchDocs)
    ? providedBatchDocs.filter((batch) => sourceBatchIds.includes(toSourceBatchId(batch?._id)))
    : await Batch.find({ _id: { $in: sourceBatchIds } })
      .select(
        '_id identity.batchId identity.batchName identity.createdAt identity.updatedAt archiveState importSnapshot'
      )
      .lean();

  const summaryById = new Map(
    (Array.isArray(batchDocs) ? batchDocs : []).map((batch) => [
      toSourceBatchId(batch?._id),
      toSourceBatchSummary(batch),
    ])
  );

  return items.map((item) => {
    const sourceBatchId = toSourceBatchId(item?.sourceBatchId);
    return {
      ...item,
      sourceBatchId,
      sourceBatch: sourceBatchId ? summaryById.get(sourceBatchId) || null : null,
    };
  });
}

function toBoxRef(box, fallback = ORPHANED_LABEL) {
  if (!box) return { id: null, label: fallback, box_id: null };
  return {
    id: toIdString(box._id || box.id),
    label: formatBoxLabel(box, fallback),
    box_id: box.box_id || null,
  };
}

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

async function enrichItemsWithBoxContext(
  rawItems = [],
  { boxes: providedBoxes, batchDocs: providedBatchDocs } = {},
) {
  const items = (Array.isArray(rawItems) ? rawItems : []).map((item) =>
    withNormalizedItemCategory(
      typeof item?.toObject === 'function'
        ? item.toObject({ virtuals: true })
        : item
    )
  );
  if (!items.length) return [];

  const boxesPromise = Array.isArray(providedBoxes)
    ? Promise.resolve(providedBoxes)
    : Box.find()
      .select('_id box_id label description items parentBox')
      .lean();
  const mediaPromise = attachMediaStateSummaries(items);
  const batchPromise = Array.isArray(providedBatchDocs)
    ? Promise.resolve(providedBatchDocs)
    : Batch.find({
      _id: {
        $in: items.map((item) => item?.sourceBatchId).filter(Boolean),
      },
    })
      .select(
        '_id identity.batchId identity.batchName identity.createdAt identity.updatedAt archiveState importSnapshot'
      )
      .lean();
  const [boxes, itemsWithMedia, batchDocs] = await Promise.all([
    boxesPromise,
    mediaPromise,
    batchPromise,
  ]);

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

  const mediaById = new Map(
    itemsWithMedia.map((item) => [String(item?._id || ''), item]),
  );
  const itemsWithBoxContext = items.map((rawItem) => {
    const i = mediaById.get(String(rawItem?._id || '')) || rawItem;
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

  return attachSourceBatchSummaries(itemsWithBoxContext, { batchDocs });
}

async function attachMediaStateSummaries(rawItems = []) {
  const items = Array.isArray(rawItems) ? rawItems : [];
  if (!items.length) return [];

  const mediaIds = Array.from(
    new Set(
      items
        .map((item) => String(item?.image?.mediaId || '').trim())
        .filter(Boolean),
    ),
  );
  const originalPaths = Array.from(
    new Set(
      items.flatMap((item) => collectImageStoragePaths(item)).filter(Boolean),
    ),
  );

  if (!mediaIds.length && !originalPaths.length) {
    return items;
  }

  const mediaStateClauses = [];
  if (mediaIds.length) {
    mediaStateClauses.push({ mediaId: { $in: mediaIds } });
  }
  if (originalPaths.length) {
    mediaStateClauses.push({ originalPath: { $in: originalPaths } });
  }

  const mediaStates = mediaStateClauses.length
    ? await MediaState.find(mediaStateClauses.length === 1 ? mediaStateClauses[0] : { $or: mediaStateClauses })
      .select('mediaId originalPath processedPath displayPath thumbPath tinyPath activeVariant processedAt updatedAt')
      .lean()
    : [];

  const mediaStateByMediaId = new Map();
  const mediaStateByOriginalPath = new Map();

  for (const state of Array.isArray(mediaStates) ? mediaStates : []) {
    const mediaId = String(state?.mediaId || '').trim();
    const originalPath = String(state?.originalPath || '').trim();
    if (mediaId) mediaStateByMediaId.set(mediaId, state);
    if (originalPath) mediaStateByOriginalPath.set(originalPath, state);
  }

  return items.map((item) => {
    const mediaId = String(item?.image?.mediaId || '').trim();
    const matchedState =
      (mediaId ? mediaStateByMediaId.get(mediaId) : null) ||
      collectImageStoragePaths(item)
        .map((pathValue) => mediaStateByOriginalPath.get(pathValue))
        .find(Boolean) ||
      null;

    if (!matchedState) return item;

    const processedUrl = mediaPathToClientUrl(matchedState?.processedPath);
    const displayUrl = mediaPathToClientUrl(matchedState?.displayPath);
    const thumbUrl = mediaPathToClientUrl(matchedState?.thumbPath);
    const tinyUrl = mediaPathToClientUrl(matchedState?.tinyPath);

    return {
      ...item,
      image: {
        ...(item?.image || {}),
        display: {
          ...(item?.image?.display || {}),
          url: displayUrl || item?.image?.display?.url || '',
        },
        thumb: {
          ...(item?.image?.thumb || {}),
          url: thumbUrl || item?.image?.thumb?.url || '',
        },
        tiny: {
          ...(item?.image?.tiny || {}),
          url: tinyUrl || item?.image?.tiny?.url || '',
        },
        processed: {
          url: processedUrl,
        },
        activeVariant: String(matchedState?.activeVariant || '').trim().toLowerCase() || 'original',
        updatedAt: matchedState?.updatedAt || matchedState?.processedAt || item?.image?.updatedAt || null,
      },
    };
  });
}

function toListImage(image = {}) {
  const toUrlOnly = (variant) => {
    const url = String(variant?.url || '').trim();
    return url ? { url } : undefined;
  };

  return {
    activeVariant: String(image?.activeVariant || '').trim().toLowerCase(),
    processingStatus: String(image?.processingStatus || '').trim().toLowerCase(),
    updatedAt: image?.updatedAt || null,
    original: toUrlOnly(image?.original),
    display: toUrlOnly(image?.display),
    thumb: toUrlOnly(image?.thumb),
    tiny: toUrlOnly(image?.tiny),
    processed: toUrlOnly(image?.processed),
  };
}

function toItemListSummary(item = {}) {
  const sourceBatch = item?.sourceBatch;

  return {
    _id: item?._id,
    name: item?.name,
    quantity: item?.quantity,
    description: item?.description,
    notes: item?.notes,
    tags: item?.tags,
    links: item?.links,
    imagePath: item?.imagePath,
    image: toListImage(item?.image),
    location: item?.location,
    sourceBatchId: item?.sourceBatchId,
    sourceBatch: sourceBatch
      ? {
          id: sourceBatch.id,
          batchId: sourceBatch.batchId,
          batchName: sourceBatch.batchName,
          label: sourceBatch.label,
          archiveStatus: sourceBatch.archiveStatus,
          importedAt: sourceBatch.importedAt,
          itemCount: sourceBatch.itemCount,
          createdAt: sourceBatch.createdAt,
          updatedAt: sourceBatch.updatedAt,
        }
      : null,
    orphanedAt: item?.orphanedAt,
    item_status: item?.item_status,
    disposition: item?.disposition,
    disposition_at: item?.disposition_at,
    disposition_notes: item?.disposition_notes,
    declutterReadiness: item?.declutterReadiness || 'not_considered',
    last_active_box: item?.last_active_box,
    dateAcquired: item?.dateAcquired,
    dateLastUsed: item?.dateLastUsed,
    valueCents: item?.valueCents,
    keepPriority: item?.keepPriority,
    primaryOwnerName: item?.primaryOwnerName,
    condition: item?.condition,
    category: item?.category,
    isConsumable: item?.isConsumable,
    lastCheckedAt: item?.lastCheckedAt,
    acquisitionType: item?.acquisitionType,
    purchasePriceCents: item?.purchasePriceCents,
    lastMaintainedAt: item?.lastMaintainedAt,
    maintenanceNotes: item?.maintenanceNotes,
    box: item?.box,
    breadcrumb: item?.breadcrumb,
    depth: item?.depth,
    topBox: item?.topBox,
    updatedAt: item?.updatedAt,
  };
}

function buildItemListFilter({
  statusScope = 'active',
  query = '',
  category = '',
  tag = '',
  scope = 'all',
  sourceBatchId = '',
  boxedItemIds = [],
  searchBoxItemIds = [],
  searchBatchIds = [],
} = {}) {
  const filter = {
    ...buildItemStatusFilter(statusScope),
  };

  const normalizedScope = String(scope || 'all').trim();
  if (normalizedScope === 'boxed') {
    filter._id = { $in: boxedItemIds };
    filter.$and = [...(filter.$and || []), ACTIVE_ITEM_FILTER];
  } else if (normalizedScope === 'orphaned') {
    filter.orphanedAt = { $ne: null };
    filter.$and = [...(filter.$and || []), ACTIVE_ITEM_FILTER];
  } else if (normalizedScope === 'consumable') {
    filter.isConsumable = true;
  } else if (normalizedScope === 'nonConsumable') {
    filter.isConsumable = { $ne: true };
  } else if (normalizedScope === 'decommissioned') {
    filter.keepPriority = 'decommissioned';
  } else if (normalizedScope === 'batched') {
    filter.sourceBatchId = { $type: 'objectId' };
  }

  const normalizedCategory = String(category || '').trim();
  if (normalizedCategory) {
    filter.category = normalizeItemCategory(normalizedCategory);
  }

  const tagQuery = String(tag || '').trim();
  if (tagQuery) {
    filter.tags = { $regex: escapeRegex(tagQuery), $options: 'i' };
  }

  const normalizedSourceBatchId = String(sourceBatchId || '').trim();
  if (normalizedSourceBatchId) {
    filter.sourceBatchId = mongoose.isValidObjectId(normalizedSourceBatchId)
      ? normalizedSourceBatchId
      : { $in: [] };
  }

  const textQuery = String(query || '').trim();
  if (textQuery) {
    const regex = new RegExp(escapeRegex(textQuery), 'i');
    filter.$or = [
      { name: regex },
      { description: regex },
      { notes: regex },
      { disposition_notes: regex },
      { maintenanceNotes: regex },
      { tags: regex },
      { category: regex },
      { location: regex },
      { primaryOwnerName: regex },
      { keepPriority: regex },
      { condition: regex },
      { acquisitionType: regex },
      { item_status: regex },
      { disposition: regex },
    ];
    if (searchBoxItemIds.length) filter.$or.push({ _id: { $in: searchBoxItemIds } });
    if (searchBatchIds.length) {
      filter.$or.push({ sourceBatchId: { $in: searchBatchIds } });
    }
  }

  return filter;
}

function buildPagedSort(sort = 'alpha', direction = 'asc', randomSeed = '') {
  const value = String(sort || 'alpha').trim();
  const sortDirection = String(direction || '').trim().toLowerCase() === 'desc' ? -1 : 1;
  const legacyMatch = value.match(/^(created|updated|acquired|lastUsed|orphaned):(asc|desc)$/);
  if (legacyMatch) {
    const fieldByLegacySort = {
      created: 'createdAt',
      updated: 'updatedAt',
      acquired: 'dateAcquired',
      lastUsed: 'dateLastUsed',
      orphaned: 'orphanedAt',
    };
    const legacyDirection = legacyMatch[2] === 'desc' ? -1 : 1;
    return {
      mode: 'find',
      sort: { [fieldByLegacySort[legacyMatch[1]]]: legacyDirection, _id: legacyDirection },
    };
  }

  if (value === 'random') {
    return {
      mode: 'memory',
      key: 'random',
      direction: sortDirection,
      seed: String(randomSeed || 'disco-warp-core').slice(0, 64),
    };
  }

  if (value === 'boxId' || value === 'box' || value === 'batch' || value === 'keepPriority') {
    return { mode: 'memory', key: value === 'boxId' ? 'box' : value, direction: sortDirection };
  }

  const fieldBySort = {
    alpha: 'name',
    alphabetical: 'name',
    date: 'createdAt',
    owner: 'primaryOwnerName',
    lastMaintained: 'lastMaintainedAt',
    purchasePrice: 'purchasePriceCents',
    category: 'category',
    dispositionAt: 'disposition_at',
  };
  const field = fieldBySort[value] || 'name';
  return { mode: 'find', sort: { [field]: sortDirection, _id: sortDirection } };
}

const ITEM_LIST_SELECT = [
  '_id', 'name', 'quantity', 'description', 'notes', 'tags', 'links',
  'imagePath', 'image', 'location', 'sourceBatchId', 'orphanedAt',
  'item_status', 'disposition', 'disposition_at', 'disposition_notes',
  'declutterReadiness', 'last_active_box', 'dateAcquired', 'dateLastUsed',
  'valueCents', 'keepPriority', 'primaryOwnerName', 'condition', 'category',
  'isConsumable', 'lastCheckedAt', 'acquisitionType', 'purchasePriceCents',
  'lastMaintainedAt', 'maintenanceNotes', 'createdAt', 'updatedAt',
].join(' ');

function collectBoxItemContext(boxes = []) {
  const boxedItemIds = [];
  const boxByItemId = new Map();
  for (const box of boxes) {
    for (const itemId of box?.items || []) {
      boxedItemIds.push(itemId);
      boxByItemId.set(String(itemId), box);
    }
  }
  return { boxedItemIds, boxByItemId };
}

function compareText(left, right) {
  return String(left || '').localeCompare(String(right || ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function seededItemRank(itemId, seed) {
  const source = `${String(seed || '')}:${String(itemId || '')}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function compareMemorySortedItems(left, right, plan, { boxByItemId, batchById }) {
  let result = 0;
  if (plan.key === 'random') {
    result = seededItemRank(left?._id, plan.seed) - seededItemRank(right?._id, plan.seed);
  } else if (plan.key === 'box') {
    result = compareText(
      boxByItemId.get(String(left?._id))?.box_id,
      boxByItemId.get(String(right?._id))?.box_id,
    );
  } else if (plan.key === 'batch') {
    const leftBatch = batchById.get(String(left?.sourceBatchId || ''));
    const rightBatch = batchById.get(String(right?.sourceBatchId || ''));
    if (Boolean(leftBatch) !== Boolean(rightBatch)) {
      return leftBatch ? -1 : 1;
    }
    const leftDate = Date.parse(
      leftBatch?.importSnapshot?.importedAt || leftBatch?.identity?.createdAt || '',
    );
    const rightDate = Date.parse(
      rightBatch?.importSnapshot?.importedAt || rightBatch?.identity?.createdAt || '',
    );
    if (Number.isFinite(leftDate) && Number.isFinite(rightDate) && leftDate !== rightDate) {
      result = leftDate - rightDate;
    } else {
      result = compareText(
        `${leftBatch?.identity?.batchId || ''} ${leftBatch?.identity?.batchName || ''}`,
        `${rightBatch?.identity?.batchId || ''} ${rightBatch?.identity?.batchName || ''}`,
      );
    }
  } else if (plan.key === 'keepPriority') {
    const priorityRank = { essential: 0, high: 1, medium: 2, low: 3, decommissioned: 4 };
    result = (priorityRank[left?.keepPriority] ?? 5) - (priorityRank[right?.keepPriority] ?? 5);
  }
  if (result === 0) result = compareText(left?.name, right?.name);
  if (result === 0) result = compareText(left?._id, right?._id);
  return result * plan.direction;
}

async function getItemListMetadata({ boxes, batchDocs, boxedItemIds }) {
  const [summaryRows, boxed] = await Promise.all([
    Item.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $ne: ['$item_status', 'gone'] }, 1, 0] } },
          gone: { $sum: { $cond: [{ $eq: ['$item_status', 'gone'] }, 1, 0] } },
          orphaned: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$item_status', 'gone'] }, { $ne: ['$orphanedAt', null] }] },
                1,
                0,
              ],
            },
          },
          consumableCount: { $sum: { $cond: ['$isConsumable', 1, 0] } },
          imageCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $ne: [{ $ifNull: ['$imagePath', ''] }, ''] },
                    { $ne: [{ $ifNull: ['$image.original.url', ''] }, ''] },
                    { $ne: [{ $ifNull: ['$image.original.storagePath', ''] }, ''] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          tagCount: { $sum: { $size: { $ifNull: ['$tags', []] } } },
          totalQuantity: { $sum: { $ifNull: ['$quantity', 0] } },
          categories: { $addToSet: '$category' },
          locations: { $addToSet: '$location' },
        },
      },
    ]),
    boxedItemIds.length
      ? Item.countDocuments({ ...ACTIVE_ITEM_FILTER, _id: { $in: boxedItemIds } })
      : Promise.resolve(0),
  ]);
  const summary = summaryRows[0] || {};
  const categories = (summary.categories || []).filter(Boolean).sort(compareText);
  const locations = (summary.locations || []).filter(Boolean);

  return {
    counts: {
      total: Number(summary.total || 0),
      active: Number(summary.active || 0),
      gone: Number(summary.gone || 0),
      orphaned: Number(summary.orphaned || 0),
      boxed,
      consumableCount: Number(summary.consumableCount || 0),
      imageCount: Number(summary.imageCount || 0),
      tagCount: Number(summary.tagCount || 0),
      totalQuantity: Number(summary.totalQuantity || 0),
      categoryCount: categories.length,
      locationCount: locations.length,
    },
    facets: {
      categories,
      batches: batchDocs.map(toSourceBatchSummary).filter(Boolean),
    },
    boxes,
  };
}

/**
 * Get all items with breadcrumb + box info.
 * (This one still builds maps — fine for bulk fetch.)
 */
async function getAllItems({ statusScope = 'active', listView = false } = {}) {
  const itemDocs = await Item.find(buildItemStatusFilter(statusScope)).lean();
  const items = await enrichItemsWithBoxContext(itemDocs);
  return listView ? items.map(toItemListSummary) : items;
}

async function getItemsPage({
  statusScope = 'active',
  limit = 20,
  offset = 0,
  query = '',
  category = '',
  tag = '',
  scope = 'all',
  sourceBatchId = '',
  sort = 'alpha',
  direction = 'asc',
  randomSeed = '',
  listView = false,
} = {}) {
  const totalStartNs = process.hrtime.bigint();
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const safeOffset = Math.max(0, Number(offset) || 0);
  const contextStartNs = process.hrtime.bigint();
  const [boxes, batchDocs] = await Promise.all([
    Box.find().select('_id box_id label description location items parentBox').lean(),
    Batch.find()
      .select('_id identity.batchId identity.batchName identity.createdAt identity.updatedAt archiveState importSnapshot')
      .lean(),
  ]);
  const { boxedItemIds, boxByItemId } = collectBoxItemContext(boxes);
  const batchById = new Map(batchDocs.map((batch) => [String(batch?._id || ''), batch]));
  const queryRegex = String(query || '').trim()
    ? new RegExp(escapeRegex(String(query).trim()), 'i')
    : null;
  const searchBoxItemIds = queryRegex
    ? boxes
      .filter((box) => [box?.box_id, box?.label, box?.description, box?.location]
        .some((value) => queryRegex.test(String(value || ''))))
      .flatMap((box) => box?.items || [])
    : [];
  const searchBatchIds = queryRegex
    ? batchDocs
      .filter((batch) => [batch?.identity?.batchId, batch?.identity?.batchName, batch?.archiveState?.status]
        .some((value) => queryRegex.test(String(value || ''))))
      .map((batch) => batch._id)
    : [];
  const filter = buildItemListFilter({
    statusScope,
    query,
    category,
    tag,
    scope,
    sourceBatchId,
    boxedItemIds,
    searchBoxItemIds,
    searchBatchIds,
  });
  const contextMs = Number(process.hrtime.bigint() - contextStartNs) / 1e6;
  const sortPlan = buildPagedSort(sort, direction, randomSeed);

  const queryStartNs = process.hrtime.bigint();
  const totalPromise = Item.countDocuments(filter);
  let pageItems = [];
  if (sortPlan.mode === 'memory') {
    const matchingItems = await Item.find(filter).select(ITEM_LIST_SELECT).lean();
    matchingItems.sort((left, right) => compareMemorySortedItems(
      left,
      right,
      sortPlan,
      { boxByItemId, batchById },
    ));
    pageItems = matchingItems.slice(safeOffset, safeOffset + safeLimit);
  } else {
    pageItems = await Item.find(filter)
      .select(ITEM_LIST_SELECT)
      .sort(sortPlan.sort)
      .skip(safeOffset)
      .limit(safeLimit)
      .lean();
  }
  const total = await totalPromise;
  const queryMs = Number(process.hrtime.bigint() - queryStartNs) / 1e6;

  const enrichStartNs = process.hrtime.bigint();
  const enrichedItems = await enrichItemsWithBoxContext(pageItems, { boxes, batchDocs });
  const items = listView ? enrichedItems.map(toItemListSummary) : enrichedItems;
  const enrichMs = Number(process.hrtime.bigint() - enrichStartNs) / 1e6;
  const metadataStartNs = process.hrtime.bigint();
  const metadata = await getItemListMetadata({ boxes, batchDocs, boxedItemIds });
  const metadataMs = Number(process.hrtime.bigint() - metadataStartNs) / 1e6;
  const payload = {
    items,
    total,
    limit: safeLimit,
    offset: safeOffset,
    hasMore: safeOffset + items.length < total,
    counts: metadata.counts,
    facets: metadata.facets,
  };
  Object.defineProperty(payload, '_timing', {
    enumerable: false,
    value: {
      contextMs,
      queryMs,
      enrichMs,
      metadataMs,
      totalMs: Number(process.hrtime.bigint() - totalStartNs) / 1e6,
    },
  });
  return payload;
}

/**
 * Get a single item by id with breadcrumb + box info.
 * Delegates to Item model static.
 */
async function getItemById(id, { select, perf = false } = {}) {
  const perfEnabled = perf === true;
  const startNs = perfEnabled ? process.hrtime.bigint() : null;
  const item = await Item.findItemById(id, { select, perf: perfEnabled });
  const [itemWithSourceBatch] = await attachSourceBatchSummaries(item ? [item] : []);
  const detail = withNormalizedItemCategory(itemWithSourceBatch || item);
  if (detail?._id) {
    const candidate = await DeclutterCandidate.findOne({ itemId: detail._id })
      .select('_id deckState resolution stagingRoute confirmedAt')
      .lean();
    detail.declutterCandidate = candidate
      ? {
          id: String(candidate._id),
          deckState: candidate.deckState,
          resolution: candidate.resolution,
          stagingRoute: candidate.stagingRoute,
          confirmedAt: candidate.confirmedAt,
        }
      : null;
  }
  if (perfEnabled && startNs) {
    const totalMs = Number(process.hrtime.bigint() - startNs) / 1e6;
    console.log(
      `[perf][item-detail] service.getItemById itemId=${String(id)} totalMs=${totalMs.toFixed(2)}`
    );
  }
  return detail;
}

/**
 * Orphaned items
 */
async function getOrphanedItems(sort, limit, query = '', filters = {}) {
  const page = await getOrphanedItemsPage({
    sort,
    limit,
    offset: 0,
    query,
    category: filters?.category,
    location: filters?.location,
  });
  return page.items;
}

function buildOrphanedSort(sort = 'recent') {
  const value = String(sort || '').trim().toLowerCase();
  if (value === 'alpha' || value === 'alphabetical' || value === 'name:asc') {
    return { name: 1, _id: 1 };
  }
  if (value === 'name:desc') {
    return { name: -1, _id: -1 };
  }
  if (value === 'oldest' || value === 'orphaned:asc') {
    return { orphanedAt: 1, _id: 1 };
  }
  if (value === 'orphaned:desc' || value === 'recent') {
    return { orphanedAt: -1, _id: -1 };
  }
  return { orphanedAt: -1, _id: -1 };
}

function buildOrphanedFilter({ query = '', category = '', location = '' } = {}) {
  const filter = {
    ...ACTIVE_ITEM_FILTER,
    orphanedAt: { $ne: null },
  };
  const normalizedCategory = String(category || '').trim().toLowerCase();
  const locationQuery = String(location || '').trim();
  const textQuery = String(query || '').trim();

  if (normalizedCategory) {
    filter.category = ITEM_CATEGORIES.includes(normalizedCategory)
      ? normalizedCategory
      : { $in: [] };
  }
  if (locationQuery) {
    filter.location = new RegExp(escapeRegex(locationQuery), 'i');
  }
  if (textQuery) {
    const regex = new RegExp(escapeRegex(textQuery), 'i');
    filter.$or = [
      { name: regex },
      { description: regex },
      { notes: regex },
      { tags: regex },
      { category: regex },
      { location: regex },
    ];
  }

  return filter;
}

async function getOrphanedItemsPage({
  sort = 'recent',
  limit = 20,
  offset = 0,
  query = '',
  category = '',
  location = '',
} = {}) {
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const safeOffset = Math.max(0, Number(offset) || 0);
  const order = buildOrphanedSort(sort);
  const filter = buildOrphanedFilter({ query, category, location });
  const total = await Item.countDocuments(filter);
  const items = await Item.find(filter)
    .sort(order)
    .skip(safeOffset)
    .limit(safeLimit)
    .lean();
  const itemsWithSourceBatch = await attachSourceBatchSummaries(
    items.map((item) => withNormalizedItemCategory(item))
  );
  return {
    items: itemsWithSourceBatch,
    total,
    limit: safeLimit,
    offset: safeOffset,
    hasMore: safeOffset + items.length < total,
  };
}

function summarizeRandomItem(item) {
  if (!item) return null;

  const itemId = toIdString(item._id || item.id);
  if (!itemId) return null;

  const breadcrumb = Array.isArray(item.breadcrumb) ? item.breadcrumb : [];
  const breadcrumbSummary = breadcrumb
    .map((node) => ({
      _id: toIdString(node?._id || node?.id),
      box_id: node?.box_id || null,
      label: String(node?.label || '').trim(),
    }))
    .filter((node) => node.label);

  const box = item.box
    ? {
        _id: toIdString(item.box._id || item.box.id),
        box_id: item.box.box_id || null,
        label: String(item.box.label || '').trim() || 'Box',
      }
    : null;

  const locationLabel =
    breadcrumbSummary.length > 0
      ? breadcrumbSummary.map((node) => node.label).join(' > ')
      : box?.label || ORPHANED_LABEL;

  return {
    _id: itemId,
    name: String(item.name || '').trim() || 'Unnamed item',
    item_status: String(item.item_status || 'active').trim().toLowerCase() || 'active',
    description: String(item.description || '').trim(),
    notes: String(item.notes || '').trim(),
    quantity:
      item.quantity != null && Number.isFinite(Number(item.quantity))
        ? Number(item.quantity)
        : 1,
    tags: Array.isArray(item.tags)
      ? item.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
      : [],
    category: normalizeItemCategory(item.category),
    locationLabel,
    box,
    breadcrumb: breadcrumbSummary,
    image: {
      thumbUrl:
        item?.image?.thumb?.url ||
        item?.image?.display?.url ||
        '',
      displayUrl:
        item?.image?.display?.url ||
        item?.image?.original?.url ||
        item?.image?.thumb?.url ||
        item?.imagePath ||
        '',
    },
  };
}

async function getRandomActiveItem() {
  const filter = { ...ACTIVE_ITEM_FILTER };

  const total = await Item.countDocuments(filter);
  if (total <= 0) return null;

  // Retry a few times in case a selected row disappears between queries.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offset = Math.floor(Math.random() * total);
    const randomRow = await Item.findOne(filter)
      .sort({ _id: 1 })
      .skip(offset)
      .select('_id')
      .lean();
    if (!randomRow?._id) continue;

    const item = await getItemById(randomRow._id);
    const summary = summarizeRandomItem(item);
    if (summary) return summary;
  }

  return null;
}

/**
 * CRUD operations
 */
async function createItem(data) {
  assertValidCentsPayload(data);
  const created = await Item.create(data);
  const createdPlain = toPlain(created);
  const itemRef = toItemRef(createdPlain);

  await logEventBestEffort(
    {
      event_type: 'item_created',
      entity_type: 'item',
      entity_id: itemRef.id,
      entity_label: itemRef.label,
      summary: `Created item ${quoteLabel(itemRef.label)}`,
      details: {
        to_box_id: null,
        to_box_label: ORPHANED_LABEL,
      },
    },
    { label: `item_created:${itemRef.id}` }
  );

  return created;
}

function normalizeBulkImportNames(names = []) {
  if (!Array.isArray(names)) {
    const err = new Error('itemNames must be an array of strings.');
    err.status = 400;
    throw err;
  }

  const cleanedNames = [];
  let ignoredCount = 0;
  let truncatedCount = 0;

  for (const rawName of names) {
    const trimmed = String(rawName ?? '').trim();
    if (!trimmed) {
      ignoredCount += 1;
      continue;
    }

    let normalizedName = trimmed;
    if (normalizedName.length > BULK_IMPORT_ITEM_NAME_MAX_LENGTH) {
      normalizedName = normalizedName
        .slice(0, BULK_IMPORT_ITEM_NAME_MAX_LENGTH)
        .trim();
      truncatedCount += 1;
    }

    if (!normalizedName) {
      ignoredCount += 1;
      continue;
    }

    cleanedNames.push(normalizedName);
  }

  return {
    cleanedNames,
    ignoredCount,
    truncatedCount,
  };
}

function sanitizeSourceFileName(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  const baseName = raw.split(/[\\/]/).pop() || '';
  const withoutControlChars = baseName.replace(/[\u0000-\u001f\u007f]/g, '');
  const collapsedWhitespace = withoutControlChars.replace(/\s+/g, ' ').trim();
  if (!collapsedWhitespace) return '';

  return collapsedWhitespace.slice(0, BULK_IMPORT_SOURCE_FILENAME_MAX_LENGTH);
}

async function bulkCreateItems({
  itemNames = undefined,
  names = undefined,
  boxShortId = '',
  boxId = '',
  sourceFileName = '',
} = {}) {
  const normalizedBoxShortId = String(boxShortId || '').trim();
  const normalizedBoxId = String(boxId || '').trim();
  const itemNamesInput = Array.isArray(itemNames)
    ? itemNames
    : Array.isArray(names)
      ? names
      : [];
  const safeSourceFileName = sanitizeSourceFileName(sourceFileName);
  let destinationBox = null;

  if (normalizedBoxShortId || normalizedBoxId) {
    const shortIdCandidate =
      normalizedBoxShortId ||
      (/^\d{3}$/.test(normalizedBoxId) ? normalizedBoxId : '');

    if (shortIdCandidate) {
      if (!/^\d{3}$/.test(shortIdCandidate)) {
        const err = new Error('boxShortId must be exactly 3 digits.');
        err.status = 400;
        throw err;
      }

      destinationBox = await Box.findOne({ box_id: shortIdCandidate })
        .select('_id box_id label')
        .lean();

      if (!destinationBox) {
        const err = new Error(`Box #${shortIdCandidate} was not found.`);
        err.status = 400;
        throw err;
      }
    } else {
      if (!Box.isValidId(normalizedBoxId)) {
        const err = new Error('boxId must be a valid Mongo ObjectId.');
        err.status = 400;
        throw err;
      }

      destinationBox = await Box.findById(normalizedBoxId)
        .select('_id box_id label')
        .lean();

      if (!destinationBox) {
        const err = new Error('boxId does not match an existing box.');
        err.status = 400;
        throw err;
      }
    }
  }

  const { cleanedNames, ignoredCount, truncatedCount } =
    normalizeBulkImportNames(itemNamesInput);

  if (!cleanedNames.length) {
    const err = new Error('No valid item names found to import.');
    err.status = 400;
    throw err;
  }

  const orphanedAt = destinationBox ? null : new Date();
  const payload = cleanedNames.map((name) => ({
    name,
    quantity: 1,
    location: '',
    orphanedAt,
  }));

  const createdItems = await Item.insertMany(payload, { ordered: true });
  const createdItemIds = createdItems.map((item) => item._id);

  if (destinationBox && createdItemIds.length) {
    await Box.updateOne(
      { _id: destinationBox._id },
      { $addToSet: { items: { $each: createdItemIds } } }
    );
  }

  const toBoxRefForEvents = toBoxRef(destinationBox, ORPHANED_LABEL);

  // Keep item_created events consistent with single-item creation paths.
  await Promise.allSettled(
    createdItems.map((item) => {
      const itemRef = toItemRef(item);
      return logEventBestEffort(
        {
          event_type: 'item_created',
          entity_type: 'item',
          entity_id: itemRef.id,
          entity_label: itemRef.label,
          summary: `Created item ${quoteLabel(itemRef.label)}`,
          details: {
            to_box_id: toBoxRefForEvents.id,
            to_box_label: toBoxRefForEvents.label,
            import_event_type: 'items_bulk_imported',
            ...(safeSourceFileName ? { source_file_name: safeSourceFileName } : {}),
          },
        },
        { label: `item_created:${itemRef.id}` }
      );
    })
  );

  if (createdItems.length > 0) {
    const destinationDetails = destinationBox
      ? {
          type: 'box',
          box_id: String(destinationBox._id),
          box_label: toBoxRefForEvents.label,
        }
      : {
          type: 'orphaned',
          box_id: null,
          box_label: ORPHANED_LABEL,
        };

    const importSummary = destinationBox
      ? `Imported ${createdItems.length} items into ${quoteLabel(
          toBoxRefForEvents.label
        )}`
      : `Imported ${createdItems.length} orphaned items`;
    const summary = safeSourceFileName
      ? `${importSummary} from ${safeSourceFileName}`
      : importSummary;
    const bulkEntityId =
      createdItemIds.length > 0 ? String(createdItemIds[0]) : 'items-bulk-import';

    await logEventBestEffort(
      {
        event_type: 'items_bulk_imported',
        entity_type: 'item',
        entity_id: bulkEntityId,
        entity_label: 'Bulk Import',
        summary,
        details: {
          count: createdItems.length,
          destination: destinationDetails,
          ...(safeSourceFileName ? { source_file_name: safeSourceFileName } : {}),
          ...(truncatedCount > 0 ? { truncated_count: truncatedCount } : {}),
          ...(ignoredCount > 0 ? { skipped_count: ignoredCount } : {}),
        },
      },
      { label: `items_bulk_imported:${bulkEntityId}` }
    );
  }

  return {
    createdCount: createdItems.length,
    createdItemIds: createdItemIds.map((id) => String(id)),
    ignoredCount,
    truncatedCount,
    maxNameLength: BULK_IMPORT_ITEM_NAME_MAX_LENGTH,
    sourceFileName: safeSourceFileName || undefined,
    destination: destinationBox
      ? {
          _id: String(destinationBox._id),
          box_id: destinationBox.box_id,
          label: destinationBox.label || 'Box',
        }
      : null,
  };
}

async function updateItem(id, data) {
  const patch = { ...data };
  if (Object.prototype.hasOwnProperty.call(patch, 'isIntendedGift')) {
    patch.isIntendedGift = patch.isIntendedGift === true;
  }
  const existing = await Item.findById(id).lean();
  if (!existing) return null;

  assertValidCentsPayload(patch);
  const updated = await Item.findByIdAndUpdate(id, patch, {
    new: true,
    runValidators: true,
  });
  if (!updated) return null;

  const updatedPlain = toPlain(updated);
  const changedFields = computeChangedFields(existing, updatedPlain, Object.keys(patch));

  if (changedFields.length) {
    const itemRef = toItemRef(updatedPlain);
    await logEventBestEffort(
      {
        event_type: 'item_updated',
        entity_type: 'item',
        entity_id: itemRef.id,
        entity_label: itemRef.label,
        summary: `Updated item ${quoteLabel(itemRef.label)} fields: ${changedFields.join(
          ', '
        )}`,
        details: {
          changed_fields: changedFields,
        },
      },
      { label: `item_updated:${itemRef.id}` }
    );

    if (changedFields.includes('isIntendedGift')) {
      await logEventBestEffort(
        {
          event_type: 'item_gift_intent_changed',
          entity_type: 'item',
          entity_id: itemRef.id,
          entity_label: itemRef.label,
          summary: `${updatedPlain.isIntendedGift ? 'Marked' : 'Unmarked'} item ${quoteLabel(itemRef.label)} as intended for gifting`,
          details: {
            previous_value: Boolean(existing.isIntendedGift),
            next_value: Boolean(updatedPlain.isIntendedGift),
            trigger: 'manual_item_edit',
          },
        },
        { label: `item_gift_intent_changed:${itemRef.id}` }
      );
    }
  }

  return updated;
}

async function markItemGone(id, payload = {}) {
  const disposition = normalizeDisposition(
    payload.disposition ?? payload.reason ?? payload.dispositionReason
  );
  if (!disposition) {
    const err = new Error(
      'A valid disposition is required: consumed, broken, lost, stolen, trashed, recycled, gifted, donated, or sold.'
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
  const existingItem = await Item.findById(id).select('_id name').lean();
  if (!existingItem) return null;

  const previousBox = await Box.findOne({ items: id })
    .select('_id box_id label')
    .lean();

  await Box.updateMany({ items: id }, { $pull: { items: id } });

  const updated = await Item.findByIdAndUpdate(
    id,
    {
      $set: {
        item_status: 'gone',
        disposition,
        disposition_at: dispositionAt || new Date(),
        disposition_notes: dispositionNotes,
        location: null,
        orphanedAt: null,
        last_active_box: previousBox?._id || payload.lastActiveBoxId || null,
        declutterReadiness: 'not_considered',
      },
    },
    { new: true, runValidators: true }
  );
  if (!updated) return null;

  const updatedPlain = toPlain(updated);
  const itemRef = toItemRef(updatedPlain);
  const fromBoxRef = toBoxRef(previousBox, ORPHANED_LABEL);

  await logEventBestEffort(
    {
      event_type: 'item_marked_gone',
      entity_type: 'item',
      entity_id: itemRef.id,
      entity_label: itemRef.label,
      summary: `Marked item ${quoteLabel(itemRef.label)} as ${updatedPlain.disposition}`,
      details: {
        from_box_id: fromBoxRef.id,
        from_box_label: fromBoxRef.label,
        disposition: updatedPlain.disposition,
        disposition_at: updatedPlain.disposition_at,
        disposition_notes: updatedPlain.disposition_notes,
      },
    },
    { label: `item_marked_gone:${itemRef.id}` }
  );

  return updated;
}

async function restoreItemToActive(id) {
  const item = await Item.findById(id).select('_id name last_active_box').lean();
  if (!item) return null;

  await Box.updateMany({ items: id }, { $pull: { items: id } });

  let restoredToBoxId = null;
  let restoredToBox = null;
  if (item.last_active_box) {
    restoredToBox = await Box.findById(item.last_active_box)
      .select('_id box_id label')
      .lean();
    if (restoredToBox) {
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

  const updated = await Item.findByIdAndUpdate(
    id,
    {
      $set: lifecycleUpdate,
    },
    { new: true, runValidators: true }
  );
  if (!updated) return null;

  const updatedPlain = toPlain(updated);
  const itemRef = toItemRef(updatedPlain);
  const destinationBoxRef = restoredToBoxId
    ? toBoxRef(restoredToBox || { _id: restoredToBoxId }, 'Box')
    : { id: null, label: ORPHANED_LABEL, box_id: null };

  await logEventBestEffort(
    {
      event_type: 'item_reclaimed',
      entity_type: 'item',
      entity_id: itemRef.id,
      entity_label: itemRef.label,
      summary: `Reclaimed item ${quoteLabel(itemRef.label)} to ${quoteLabel(
        destinationBoxRef.label
      )}`,
      details: {
        to_box_id: destinationBoxRef.id,
        to_box_label: destinationBoxRef.label,
      },
    },
    { label: `item_reclaimed:${itemRef.id}` }
  );

  return updated;
}

async function hardDeleteItem(id) {
  const current = await Item.findById(id)
    .select('_id name image imagePath')
    .lean();
  if (!current) return null;
  const currentRef = toItemRef(current);
  const fromBox = await Box.findOne({ items: id }).select('_id box_id label').lean();
  const fromBoxRef = toBoxRef(fromBox, ORPHANED_LABEL);

  const previousPaths = collectImageStoragePaths(current);

  await Box.updateMany({ items: id }, { $pull: { items: id } });
  const deleted = await Item.findByIdAndDelete(id);
  if (!deleted) return null;

  await safeDeleteMediaFiles(previousPaths, {
    label: `item-delete:${id}`,
  });

  await logEventBestEffort(
    {
      event_type: 'item_deleted',
      entity_type: 'item',
      entity_id: currentRef.id,
      entity_label: currentRef.label,
      summary: `Deleted item ${quoteLabel(currentRef.label)}`,
      details: {
        from_box_id: fromBoxRef.id,
        from_box_label: fromBoxRef.label,
      },
    },
    { label: `item_deleted:${currentRef.id}` }
  );

  return deleted;
}

async function deleteItem(id) {
  return hardDeleteItem(id);
}

async function setItemImage(id, image) {
  const current = await Item.findById(id)
    .select('_id name image imagePath')
    .lean();
  if (!current) return null;

  const previousPaths = collectImageStoragePaths(current);
  const normalizedImage = {
    ...(image && typeof image === 'object' ? image : {}),
    mediaId:
      image && typeof image === 'object' && typeof image.mediaId === 'string'
        ? image.mediaId.trim()
        : '',
  };
  const nextPaths = new Set(
    collectImageStoragePaths({ image: normalizedImage, imagePath: '' })
  );

  const updated = await Item.findByIdAndUpdate(
    id,
    {
      image: normalizedImage,
      imagePath: normalizedImage?.display?.url || normalizedImage?.original?.url || '',
    },
    { new: true, runValidators: true }
  );

  if (!updated) return null;

  const updatedPlain = toPlain(updated);
  const stalePaths = previousPaths.filter((entry) => !nextPaths.has(entry));

  await safeDeleteMediaFiles(stalePaths, {
    label: `item-image-replace:${id}`,
  });

  const changedFields = computeChangedFields(current, updatedPlain, [
    'image',
    'imagePath',
  ]);
  if (changedFields.length) {
    const itemRef = toItemRef(updatedPlain);
    await logEventBestEffort(
      {
        event_type: 'item_photo_updated',
        entity_type: 'item',
        entity_id: itemRef.id,
        entity_label: itemRef.label,
        summary: `Updated photo for item ${quoteLabel(itemRef.label)}`,
        details: {
          changed_fields: changedFields,
        },
      },
      { label: `item_photo_updated:${itemRef.id}` }
    );
  }

  return updated;
}

async function clearItemImage(id) {
  const current = await Item.findById(id)
    .select('_id name image imagePath')
    .lean();
  if (!current) return null;

  const updated = await Item.findByIdAndUpdate(
    id,
    {
      image: buildEmptyImageMetadata(),
      imagePath: '',
    },
    { new: true, runValidators: true }
  );
  if (!updated) return null;

  const updatedPlain = toPlain(updated);
  const changedFields = computeChangedFields(current, updatedPlain, [
    'image',
    'imagePath',
  ]);
  if (changedFields.length) {
    const itemRef = toItemRef(updatedPlain);
    await logEventBestEffort(
      {
        event_type: 'item_photo_updated',
        entity_type: 'item',
        entity_id: itemRef.id,
        entity_label: itemRef.label,
        summary: `Updated photo for item ${quoteLabel(itemRef.label)}`,
        details: {
          changed_fields: changedFields,
        },
      },
      { label: `item_photo_updated:${itemRef.id}` }
    );
  }

  return updated;
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
  const normalized = normalizeKeepPriorityValue(data.keepPriority);
  if (!normalized) {
    data.keepPriority = null;
    return;
  }
  if (!isValidKeepPriority(normalized)) {
    const err = new Error(
      `keepPriority must be one of: unspecified, ${KEEP_PRIORITY_VALUES.join(', ')}`
    );
    err.status = 400;
    throw err;
  }
  data.keepPriority = normalized;
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
  getRandomActiveItem,
  getOrphanedItems,
  getOrphanedItemsPage,
  buildOrphanedSort,
  buildOrphanedFilter,
  createItem,
  bulkCreateItems,
  updateItem,
  setItemImage,
  clearItemImage,
  deleteItem,
  hardDeleteItem,
  markItemGone,
  restoreItemToActive,
  backfillOrphanedTimestamps,
  orphanAllItemsInBox,
  BULK_IMPORT_ITEM_NAME_MAX_LENGTH,
  buildItemListFilter,
  buildPagedSort,
  compareMemorySortedItems,
  toItemListSummary,
};
