const path = require('path');
const mongoose = require('mongoose');

const { MEDIA_ROOT, toMediaUrl } = require('../config/media');
const Box = require('../models/Box');
const DeclutterSession = require('../models/DeclutterSession');
const DeclutterSessionItem = require('../models/DeclutterSessionItem');
const Item = require('../models/Item');
const MediaState = require('../models/MediaState');
const { buildBoxMaps, makeBreadcrumb } = require('../utils/boxHelpers');
const {
  normalizeItemCategory,
} = require('../utils/itemCategory');
const {
  formatKeepPriorityLabel,
  normalizeKeepPriorityValue,
} = require('../utils/keepPriority');
const { collectImageStoragePaths } = require('./imageMetadataService');

const DECISIONS = DeclutterSessionItem.DECISIONS;
const SESSION_STATUSES = DeclutterSession.STATUSES;

function createHttpError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  if (code) err.code = code;
  return err;
}

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

function toIdString(value) {
  if (!value) return '';
  return String(value?._id || value?.id || value).trim();
}

function assertObjectId(value, label) {
  const normalized = toIdString(value);
  if (!mongoose.isValidObjectId(normalized)) {
    throw createHttpError(400, `Invalid ${label}.`);
  }
  return normalized;
}

function normalizeSessionName(value) {
  const name = toTrimmed(value);
  if (!name) {
    throw createHttpError(400, 'Declutter session name is required.');
  }
  return name.slice(0, 140);
}

function normalizeDescription(value) {
  return toTrimmed(value).slice(0, 2000);
}

function normalizeStatus(value, fallback = 'active') {
  const normalized = toTrimmed(value).toLowerCase();
  if (!normalized) return fallback;
  return SESSION_STATUSES.includes(normalized) ? normalized : fallback;
}

function normalizeDecision(value, fallback = 'pending') {
  const normalized = toTrimmed(value).toLowerCase();
  if (!normalized) return fallback;
  if (!DECISIONS.includes(normalized)) {
    throw createHttpError(
      400,
      `Decision must be one of: ${DECISIONS.join(', ')}.`
    );
  }
  return normalized;
}

function emptyCounts() {
  return DECISIONS.reduce(
    (counts, decision) => {
      counts[decision] = 0;
      return counts;
    },
    { total: 0 }
  );
}

function toCategoryLabel(categoryKey) {
  return toTrimmed(categoryKey)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function mediaPathToClientUrl(pathValue) {
  const normalized = toTrimmed(pathValue);
  if (!normalized) return '';

  const relativePath = path.isAbsolute(normalized)
    ? path.relative(MEDIA_ROOT, normalized)
    : normalized.replace(/^\/+/, '');

  if (!relativePath || relativePath.startsWith('..')) return '';
  return toMediaUrl(relativePath);
}

async function attachMediaStateSummaries(rawItems = []) {
  const items = Array.isArray(rawItems) ? rawItems : [];
  if (!items.length) return [];

  const mediaIds = Array.from(
    new Set(
      items
        .map((item) => toTrimmed(item?.image?.mediaId))
        .filter(Boolean)
    )
  );
  const originalPaths = Array.from(
    new Set(items.flatMap((item) => collectImageStoragePaths(item)).filter(Boolean))
  );

  if (!mediaIds.length && !originalPaths.length) return items;

  const clauses = [];
  if (mediaIds.length) clauses.push({ mediaId: { $in: mediaIds } });
  if (originalPaths.length) clauses.push({ originalPath: { $in: originalPaths } });

  const mediaStates = clauses.length
    ? await MediaState.find(clauses.length === 1 ? clauses[0] : { $or: clauses })
        .select('mediaId originalPath processedPath displayPath thumbPath activeVariant')
        .lean()
    : [];

  const byMediaId = new Map();
  const byOriginalPath = new Map();
  for (const state of mediaStates) {
    const mediaId = toTrimmed(state?.mediaId);
    const originalPath = toTrimmed(state?.originalPath);
    if (mediaId) byMediaId.set(mediaId, state);
    if (originalPath) byOriginalPath.set(originalPath, state);
  }

  return items.map((item) => {
    const mediaId = toTrimmed(item?.image?.mediaId);
    const matchedState =
      (mediaId ? byMediaId.get(mediaId) : null) ||
      collectImageStoragePaths(item)
        .map((entry) => byOriginalPath.get(entry))
        .find(Boolean) ||
      null;

    if (!matchedState) return item;

    const processedUrl = mediaPathToClientUrl(matchedState?.processedPath);
    const displayUrl = mediaPathToClientUrl(matchedState?.displayPath);
    const thumbUrl = mediaPathToClientUrl(matchedState?.thumbPath);

    return {
      ...item,
      image: {
        ...(item?.image || {}),
        display: {
          ...(item?.image?.display || {}),
          url: firstNonEmpty(displayUrl, item?.image?.display?.url),
        },
        thumb: {
          ...(item?.image?.thumb || {}),
          url: firstNonEmpty(thumbUrl, item?.image?.thumb?.url),
        },
        processed: {
          ...(item?.image?.processed || {}),
          url: firstNonEmpty(processedUrl, item?.image?.processed?.url),
        },
        activeVariant: firstNonEmpty(
          matchedState?.activeVariant,
          item?.image?.activeVariant,
          'original'
        ).toLowerCase(),
      },
    };
  });
}

function resolveItemImageUrls(item) {
  const activeVariant = toTrimmed(item?.image?.activeVariant).toLowerCase();
  const processedUrl = firstNonEmpty(item?.image?.processed?.url);
  const displayUrl = firstNonEmpty(item?.image?.display?.url);
  const thumbUrl = firstNonEmpty(item?.image?.thumb?.url);
  const originalUrl = firstNonEmpty(
    item?.image?.original?.url,
    item?.image?.url,
    item?.imagePath
  );

  if (activeVariant === 'processed' || (!activeVariant && processedUrl)) {
    return {
      thumbnailUrl: firstNonEmpty(thumbUrl, displayUrl, processedUrl, originalUrl),
      previewImageUrl: firstNonEmpty(processedUrl, displayUrl, originalUrl, thumbUrl),
    };
  }

  return {
    thumbnailUrl: firstNonEmpty(thumbUrl, displayUrl, originalUrl, processedUrl),
    previewImageUrl: firstNonEmpty(originalUrl, displayUrl, processedUrl, thumbUrl),
  };
}

function resolveInheritedBoxValue(leafBoxId, maps, fieldName) {
  let cursor = toIdString(leafBoxId);
  const visited = new Set();

  while (cursor && !visited.has(cursor)) {
    visited.add(cursor);
    const node = maps.byId.get(cursor);
    if (!node) break;

    const value =
      fieldName === 'location'
        ? firstNonEmpty(node?.locationId?.name, node?.location)
        : firstNonEmpty(node?.[fieldName]);
    if (value) return value;
    cursor = maps.parentOf.get(cursor);
  }

  return '';
}

function buildItemToLeafBoxId(boxes = []) {
  const itemToLeafBoxId = new Map();
  for (const box of boxes) {
    const boxId = toIdString(box?._id);
    if (!boxId) continue;

    for (const itemId of Array.isArray(box?.items) ? box.items : []) {
      const normalizedItemId = toIdString(itemId);
      if (!normalizedItemId) continue;
      itemToLeafBoxId.set(normalizedItemId, boxId);
    }
  }
  return itemToLeafBoxId;
}

async function buildDeclutterItemSummaries(rawItems = []) {
  const items = await attachMediaStateSummaries(
    (Array.isArray(rawItems) ? rawItems : []).map((item) => ({ ...item }))
  );
  if (!items.length) return new Map();

  const boxes = await Box.find()
    .select('_id box_id label group description items parentBox location locationId')
    .populate('locationId', 'name')
    .lean();
  const maps = buildBoxMaps(boxes);
  const itemToLeafBoxId = buildItemToLeafBoxId(boxes);

  const summaries = new Map();
  for (const item of items) {
    const itemId = toIdString(item?._id);
    if (!itemId) continue;

    const leafBoxId = itemToLeafBoxId.get(itemId) || '';
    const leafBox = leafBoxId ? maps.byId.get(leafBoxId) : null;
    const breadcrumbData = leafBoxId ? makeBreadcrumb(leafBoxId, maps) : {};
    const breadcrumb = Array.isArray(breadcrumbData?.breadcrumb)
      ? breadcrumbData.breadcrumb
      : [];
    const inheritedLocation = leafBoxId
      ? resolveInheritedBoxValue(leafBoxId, maps, 'location')
      : '';
    const inheritedGroup = leafBoxId
      ? resolveInheritedBoxValue(leafBoxId, maps, 'group')
      : '';
    const categoryKey = normalizeItemCategory(item?.category);
    const keepPriority = normalizeKeepPriorityValue(item?.keepPriority);
    const imageUrls = resolveItemImageUrls(item);

    summaries.set(itemId, {
      ...item,
      _id: itemId,
      id: itemId,
      name: firstNonEmpty(item?.name, 'Unnamed item'),
      category: categoryKey,
      categoryKey,
      categoryLabel: toCategoryLabel(categoryKey),
      tags: Array.isArray(item?.tags) ? item.tags.filter(Boolean) : [],
      keepPriority: keepPriority || '',
      keepPriorityLabel: formatKeepPriorityLabel(keepPriority),
      primaryOwnerName: firstNonEmpty(item?.primaryOwnerName),
      item_status: firstNonEmpty(item?.item_status, 'active').toLowerCase(),
      sourceBatchId: toIdString(item?.sourceBatchId),
      inheritedLocation,
      inheritedGroup,
      breadcrumb,
      box: leafBox
        ? {
            _id: toIdString(leafBox._id),
            box_id: firstNonEmpty(leafBox.box_id),
            label: firstNonEmpty(leafBox.label),
            group: firstNonEmpty(leafBox.group),
            groupLabel: firstNonEmpty(leafBox.group),
            resolvedGroup: inheritedGroup,
            description: firstNonEmpty(leafBox.description),
            location: firstNonEmpty(leafBox?.locationId?.name, leafBox.location),
            locationName: firstNonEmpty(leafBox?.locationId?.name, leafBox.location),
          }
        : null,
      thumbnailUrl: imageUrls.thumbnailUrl,
      previewImageUrl: imageUrls.previewImageUrl,
    });
  }

  return summaries;
}

async function getCountsBySessionId(sessionIds = []) {
  const ids = sessionIds.map((id) => assertObjectId(id, 'sessionId'));
  const countsBySessionId = new Map(ids.map((id) => [id, emptyCounts()]));
  if (!ids.length) return countsBySessionId;

  const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
  const rows = await DeclutterSessionItem.aggregate([
    { $match: { sessionId: { $in: objectIds } } },
    {
      $group: {
        _id: { sessionId: '$sessionId', decision: '$decision' },
        count: { $sum: 1 },
      },
    },
  ]);

  for (const row of rows) {
    const sessionId = toIdString(row?._id?.sessionId);
    const decision = toTrimmed(row?._id?.decision).toLowerCase();
    const count = Number(row?.count || 0);
    const counts = countsBySessionId.get(sessionId) || emptyCounts();

    counts.total += count;
    if (DECISIONS.includes(decision)) counts[decision] += count;
    countsBySessionId.set(sessionId, counts);
  }

  return countsBySessionId;
}

function toClientSession(session, counts = emptyCounts()) {
  if (!session) return null;
  const id = toIdString(session._id || session.id);
  return {
    id,
    _id: id,
    name: firstNonEmpty(session.name, 'Declutter Session'),
    description: firstNonEmpty(session.description),
    status: normalizeStatus(session.status),
    completedAt: session.completedAt || null,
    createdAt: session.createdAt || null,
    updatedAt: session.updatedAt || null,
    counts: { ...emptyCounts(), ...(counts || {}) },
  };
}

function toClientSessionItem(row, item) {
  const id = toIdString(row?._id || row?.id);
  const itemId = toIdString(row?.itemId);
  return {
    id,
    _id: id,
    sessionId: toIdString(row?.sessionId),
    itemId,
    decision: normalizeDecision(row?.decision, 'pending'),
    notes: firstNonEmpty(row?.notes),
    proposedBy: firstNonEmpty(row?.proposedBy),
    decidedBy: firstNonEmpty(row?.decidedBy),
    decidedAt: row?.decidedAt || null,
    createdAt: row?.createdAt || null,
    updatedAt: row?.updatedAt || null,
    item: item || null,
  };
}

async function listDeclutterSessions({ status } = {}) {
  const normalizedStatus = normalizeStatus(status, '');
  const filter = normalizedStatus ? { status: normalizedStatus } : {};
  const sessions = await DeclutterSession.find(filter)
    .sort({ status: 1, updatedAt: -1, _id: -1 })
    .lean();
  const countsBySessionId = await getCountsBySessionId(
    sessions.map((session) => session._id)
  );

  return sessions.map((session) =>
    toClientSession(session, countsBySessionId.get(toIdString(session._id)))
  );
}

async function listDeclutterSessionsForItem(itemId, { status = 'active' } = {}) {
  const normalizedItemId = assertObjectId(itemId, 'itemId');
  const normalizedStatus = normalizeStatus(status, 'active');
  const rows = await DeclutterSessionItem.find({ itemId: normalizedItemId })
    .select('sessionId')
    .lean();
  const sessionIds = rows.map((row) => row.sessionId).filter(Boolean);

  if (!sessionIds.length) return [];

  const sessions = await DeclutterSession.find({
    _id: { $in: sessionIds },
    status: normalizedStatus,
  })
    .sort({ updatedAt: -1, _id: -1 })
    .lean();
  const countsBySessionId = await getCountsBySessionId(
    sessions.map((session) => session._id)
  );

  return sessions.map((session) =>
    toClientSession(session, countsBySessionId.get(toIdString(session._id)))
  );
}

async function createDeclutterSession(payload = {}) {
  const name = normalizeSessionName(payload.name);
  const status = normalizeStatus(payload.status, 'active');
  const session = await DeclutterSession.create({
    name,
    description: normalizeDescription(payload.description),
    status,
    completedAt: status === 'archived' ? new Date() : null,
  });

  return toClientSession(session.toObject(), emptyCounts());
}

async function getDeclutterSessionDetail(sessionId) {
  const normalizedSessionId = assertObjectId(sessionId, 'sessionId');
  const session = await DeclutterSession.findById(normalizedSessionId).lean();
  if (!session) throw createHttpError(404, 'Declutter session not found.');

  const rows = await DeclutterSessionItem.find({ sessionId: normalizedSessionId })
    .sort({ createdAt: 1, _id: 1 })
    .lean();
  const itemIds = rows.map((row) => row.itemId).filter(Boolean);
  const itemDocs = itemIds.length
    ? await Item.find({ _id: { $in: itemIds } }).lean()
    : [];
  const itemSummariesById = await buildDeclutterItemSummaries(itemDocs);
  const countsBySessionId = await getCountsBySessionId([normalizedSessionId]);

  return {
    session: toClientSession(
      session,
      countsBySessionId.get(normalizedSessionId)
    ),
    items: rows.map((row) =>
      toClientSessionItem(row, itemSummariesById.get(toIdString(row.itemId)) || null)
    ),
  };
}

async function updateDeclutterSession(sessionId, payload = {}) {
  const normalizedSessionId = assertObjectId(sessionId, 'sessionId');
  const update = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'name')) {
    update.name = normalizeSessionName(payload.name);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
    update.description = normalizeDescription(payload.description);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
    const nextStatus = normalizeStatus(payload.status, '');
    if (!nextStatus) {
      throw createHttpError(
        400,
        `Status must be one of: ${SESSION_STATUSES.join(', ')}.`
      );
    }
    update.status = nextStatus;
    update.completedAt = nextStatus === 'archived' ? new Date() : null;
  }

  if (!Object.keys(update).length) {
    throw createHttpError(400, 'No supported session fields were provided.');
  }

  const session = await DeclutterSession.findByIdAndUpdate(
    normalizedSessionId,
    { $set: update },
    { new: true, runValidators: true }
  ).lean();
  if (!session) throw createHttpError(404, 'Declutter session not found.');

  const countsBySessionId = await getCountsBySessionId([normalizedSessionId]);
  return toClientSession(session, countsBySessionId.get(normalizedSessionId));
}

async function deleteDeclutterSession(sessionId) {
  const normalizedSessionId = assertObjectId(sessionId, 'sessionId');
  const session = await DeclutterSession.findById(normalizedSessionId).lean();
  if (!session) throw createHttpError(404, 'Declutter session not found.');

  const itemDeleteResult = await DeclutterSessionItem.deleteMany({
    sessionId: normalizedSessionId,
  });
  await DeclutterSession.deleteOne({ _id: normalizedSessionId });

  return {
    deletedSessionId: normalizedSessionId,
    deletedSessionItemCount: itemDeleteResult.deletedCount || 0,
  };
}

async function resetDeclutterSession(sessionId) {
  const normalizedSessionId = assertObjectId(sessionId, 'sessionId');
  const session = await DeclutterSession.findById(normalizedSessionId).lean();
  if (!session) throw createHttpError(404, 'Declutter session not found.');

  const result = await DeclutterSessionItem.updateMany(
    { sessionId: normalizedSessionId },
    {
      $set: {
        decision: 'pending',
        decidedAt: null,
        decidedBy: '',
      },
    }
  );

  const updatedSession = await DeclutterSession.findByIdAndUpdate(
    normalizedSessionId,
    { $set: { updatedAt: new Date() } },
    { new: true }
  ).lean();
  const countsBySessionId = await getCountsBySessionId([normalizedSessionId]);

  return {
    resetCount: Number(result?.modifiedCount || 0),
    session: toClientSession(
      updatedSession || session,
      countsBySessionId.get(normalizedSessionId)
    ),
  };
}

function normalizeItemIdsPayload(payload = {}) {
  const rawItemIds = Array.isArray(payload.itemIds)
    ? payload.itemIds
    : payload.itemId
      ? [payload.itemId]
      : [];
  const seen = new Set();
  const normalized = [];

  for (const rawId of rawItemIds) {
    const itemId = toIdString(rawId);
    if (!itemId || seen.has(itemId)) continue;
    assertObjectId(itemId, 'itemId');
    seen.add(itemId);
    normalized.push(itemId);
  }

  if (!normalized.length) {
    throw createHttpError(400, 'At least one itemId is required.');
  }

  return normalized;
}

async function addItemsToDeclutterSession(sessionId, payload = {}) {
  const normalizedSessionId = assertObjectId(sessionId, 'sessionId');
  const sessionExists = await DeclutterSession.exists({ _id: normalizedSessionId });
  if (!sessionExists) throw createHttpError(404, 'Declutter session not found.');

  const requestedItemIds = normalizeItemIdsPayload(payload);
  const existingItems = await Item.find({ _id: { $in: requestedItemIds } })
    .select('_id')
    .lean();
  const existingItemIds = existingItems.map((item) => toIdString(item._id));
  const existingItemIdSet = new Set(existingItemIds);
  const missingItemIds = requestedItemIds.filter((itemId) => !existingItemIdSet.has(itemId));

  if (!existingItemIds.length) {
    throw createHttpError(404, 'No matching inventory items were found.');
  }

  const proposedBy = firstNonEmpty(payload.proposedBy);
  const operations = existingItemIds.map((itemId) => ({
    updateOne: {
      filter: {
        sessionId: normalizedSessionId,
        itemId,
      },
      update: {
        $setOnInsert: {
          sessionId: normalizedSessionId,
          itemId,
          decision: 'pending',
          notes: '',
          proposedBy,
        },
      },
      upsert: true,
    },
  }));

  const result = await DeclutterSessionItem.bulkWrite(operations, { ordered: false });
  const addedCount = Number(result?.upsertedCount || 0);

  return {
    sessionId: normalizedSessionId,
    requestedCount: requestedItemIds.length,
    matchedItemCount: existingItemIds.length,
    addedCount,
    existingCount: existingItemIds.length - addedCount,
    missingItemIds,
  };
}

async function updateDeclutterSessionItem(sessionId, itemId, payload = {}) {
  const normalizedSessionId = assertObjectId(sessionId, 'sessionId');
  const normalizedItemId = assertObjectId(itemId, 'itemId');
  const sessionExists = await DeclutterSession.exists({ _id: normalizedSessionId });
  if (!sessionExists) throw createHttpError(404, 'Declutter session not found.');

  const current = await DeclutterSessionItem.findOne({
    sessionId: normalizedSessionId,
    itemId: normalizedItemId,
  }).lean();
  if (!current) throw createHttpError(404, 'Item is not in this declutter session.');

  const update = {};
  const hasDecision = Object.prototype.hasOwnProperty.call(payload, 'decision');
  const hasNotes = Object.prototype.hasOwnProperty.call(payload, 'notes');

  if (hasDecision) {
    const decision = normalizeDecision(payload.decision, current.decision || 'pending');
    update.decision = decision;
    if (decision === 'pending') {
      update.decidedAt = null;
      update.decidedBy = '';
    } else if (decision !== current.decision) {
      update.decidedAt = new Date();
      update.decidedBy = firstNonEmpty(payload.decidedBy, current.decidedBy);
    }
  }

  if (hasNotes) {
    update.notes = normalizeDescription(payload.notes);
  }

  if (!Object.keys(update).length) {
    throw createHttpError(400, 'No supported session item fields were provided.');
  }

  const updated = await DeclutterSessionItem.findOneAndUpdate(
    {
      sessionId: normalizedSessionId,
      itemId: normalizedItemId,
    },
    { $set: update },
    { new: true, runValidators: true }
  ).lean();

  return toClientSessionItem(updated, null);
}

async function removeItemFromDeclutterSession(sessionId, itemId) {
  const normalizedSessionId = assertObjectId(sessionId, 'sessionId');
  const normalizedItemId = assertObjectId(itemId, 'itemId');
  const result = await DeclutterSessionItem.deleteOne({
    sessionId: normalizedSessionId,
    itemId: normalizedItemId,
  });

  if (!result.deletedCount) {
    throw createHttpError(404, 'Item is not in this declutter session.');
  }

  return {
    sessionId: normalizedSessionId,
    itemId: normalizedItemId,
    removed: true,
  };
}

module.exports = {
  DECISIONS,
  SESSION_STATUSES,
  listDeclutterSessions,
  listDeclutterSessionsForItem,
  createDeclutterSession,
  getDeclutterSessionDetail,
  updateDeclutterSession,
  deleteDeclutterSession,
  resetDeclutterSession,
  addItemsToDeclutterSession,
  updateDeclutterSessionItem,
  removeItemFromDeclutterSession,
};
