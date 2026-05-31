const mongoose = require('mongoose');

const Item = require('../models/Item');
const Box = require('../models/Box');
const { storagePathFromMediaUrl } = require('./imageMetadataService');
const {
  getMediaStateById,
  getMediaStateByOriginalPath,
  ensureMediaStateByOriginalPath,
  setActiveVariantById,
} = require('./mediaProcessingService');
const { enqueueMediaProcessingJobById } = require('./mediaJobService');
const { MEDIA_ERROR_CODES, createMediaError } = require('./mediaErrors');

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

function normalizeRenderTokensForRequest(tokens) {
  if (!tokens || typeof tokens !== 'object') return undefined;
  const mode = toTrimmed(tokens.mode).toLowerCase() === 'random' ? 'random' : 'explicit';
  const background = toTrimmed(tokens.background);
  const glow = toTrimmed(tokens.glow);
  if (mode !== 'random' && !background && !glow) return undefined;
  return { mode, background, glow };
}

function normalizePathForComparison(value) {
  const normalized = toTrimmed(value).replace(/\\/g, '/').replace(/\/+/g, '/');
  if (!normalized) return '';
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
}

function pathsLikelyReferToSameSource(leftPath, rightPath) {
  const left = normalizePathForComparison(leftPath);
  const right = normalizePathForComparison(rightPath);
  if (!left || !right) return false;

  if (left === right) return true;

  const leftNoLeadingSlash = left.replace(/^\/+/, '');
  const rightNoLeadingSlash = right.replace(/^\/+/, '');

  if (leftNoLeadingSlash === rightNoLeadingSlash) return true;
  if (left.endsWith(`/${rightNoLeadingSlash}`)) return true;
  if (right.endsWith(`/${leftNoLeadingSlash}`)) return true;

  return false;
}

function normalizeMediaStateForResponse(state) {
  if (!state) return null;
  return {
    mediaId: toTrimmed(state.mediaId),
    activeVariant: toTrimmed(state.activeVariant),
    processingStatus: toTrimmed(state.processingStatus),
    processingError: state.processingError ?? null,
    originalPath: toTrimmed(state.originalPath),
    processedPath: toTrimmed(state.processedPath),
    displayPath: toTrimmed(state.displayPath),
    thumbPath: toTrimmed(state.thumbPath),
    sourceType: toTrimmed(state.sourceType).toLowerCase(),
    renderTokens: {
      mode: toTrimmed(state?.renderTokens?.mode).toLowerCase() || 'explicit',
      background: toTrimmed(state?.renderTokens?.background),
      glow: toTrimmed(state?.renderTokens?.glow),
    },
    processedAt: state.processedAt ?? null,
  };
}

function assertValidEntityId(entityId, fieldName) {
  const normalized = toTrimmed(entityId);
  if (!normalized || !mongoose.isValidObjectId(normalized)) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT,
      `${fieldName} must be a valid Mongo ObjectId`,
      { fieldName }
    );
  }
  return normalized;
}

function resolveOriginalPathFromEntity(entity) {
  return firstNonEmpty(
    entity?.image?.original?.storagePath,
    storagePathFromMediaUrl(entity?.image?.original?.url),
    entity?.image?.storagePath,
    storagePathFromMediaUrl(entity?.image?.url),
    storagePathFromMediaUrl(entity?.imagePath),
    entity?.imagePath
  );
}

let loadItemRunner = async (itemId) =>
  Item.findById(itemId).select('_id image imagePath').lean();
let loadBoxRunner = async (boxId) =>
  Box.findById(boxId).select('_id image imagePath').lean();
let setItemMediaIdRunner = async (itemId, mediaId) => {
  await Item.findByIdAndUpdate(
    itemId,
    { $set: { 'image.mediaId': mediaId } },
    { runValidators: true }
  );
};
let setBoxMediaIdRunner = async (boxId, mediaId) => {
  await Box.findByIdAndUpdate(
    boxId,
    { $set: { 'image.mediaId': mediaId } },
    { runValidators: true }
  );
};
let getMediaStateByIdRunner = getMediaStateById;
let getMediaStateByOriginalPathRunner = getMediaStateByOriginalPath;
let ensureMediaStateByOriginalPathRunner = ensureMediaStateByOriginalPath;
let setActiveVariantByIdRunner = setActiveVariantById;
let enqueueMediaProcessingJobByIdRunner = enqueueMediaProcessingJobById;

function toEntityMediaRef(entityType, entityId, entity) {
  return {
    entityType,
    entityId: toTrimmed(entityId),
    mediaId: toTrimmed(entity?.image?.mediaId),
    originalPath: resolveOriginalPathFromEntity(entity),
  };
}

async function getItemMediaRef(itemId) {
  const normalizedItemId = assertValidEntityId(itemId, 'itemId');
  const item = await loadItemRunner(normalizedItemId);
  if (!item?._id) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_SOURCE_NOT_FOUND,
      `Item not found: ${normalizedItemId}`
    );
  }
  return toEntityMediaRef('item', String(item._id), item);
}

async function getBoxMediaRef(boxId) {
  const normalizedBoxId = assertValidEntityId(boxId, 'boxId');
  const box = await loadBoxRunner(normalizedBoxId);
  if (!box?._id) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_SOURCE_NOT_FOUND,
      `Box not found: ${normalizedBoxId}`
    );
  }
  return toEntityMediaRef('box', String(box._id), box);
}

async function resolveMediaStateForRef(mediaRef) {
  if (mediaRef.mediaId) {
    const byId = await getMediaStateByIdRunner(mediaRef.mediaId);
    if (byId) {
      const mediaRefOriginalPath = toTrimmed(mediaRef.originalPath);
      const byIdOriginalPath = toTrimmed(byId.originalPath);

      if (
        mediaRefOriginalPath &&
        byIdOriginalPath &&
        !pathsLikelyReferToSameSource(byIdOriginalPath, mediaRefOriginalPath)
      ) {
        try {
          const byPath = await getMediaStateByOriginalPathRunner(mediaRefOriginalPath);
          if (byPath) return byPath;
        } catch {
          // Preserve mediaId-resolved state if path reconciliation fails.
        }
      }

      return byId;
    }
  }

  if (mediaRef.originalPath) {
    const byPath = await getMediaStateByOriginalPathRunner(mediaRef.originalPath);
    if (byPath) return byPath;
  }

  return null;
}

async function ensureMediaStateForRef(mediaRef, persistMediaId) {
  const resolved = await resolveMediaStateForRef(mediaRef);
  const state = resolved || (
    mediaRef.originalPath
      ? await ensureMediaStateByOriginalPathRunner(mediaRef.originalPath)
      : null
  );

  if (!state?.mediaId) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_SOURCE_NOT_FOUND,
      `${mediaRef.entityType} has no source image available for processing`
    );
  }

  if (mediaRef.mediaId !== state.mediaId) {
    await persistMediaId(mediaRef.entityId, state.mediaId);
  }

  return state;
}

async function getItemMediaState(itemId) {
  const itemRef = await getItemMediaRef(itemId);
  const state = await resolveMediaStateForRef(itemRef);

  if (state?.mediaId && itemRef.mediaId !== state.mediaId) {
    await setItemMediaIdRunner(itemRef.entityId, state.mediaId);
  }

  return normalizeMediaStateForResponse(state);
}

async function getBoxMediaState(boxId) {
  const boxRef = await getBoxMediaRef(boxId);
  const state = await resolveMediaStateForRef(boxRef);

  if (state?.mediaId && boxRef.mediaId !== state.mediaId) {
    await setBoxMediaIdRunner(boxRef.entityId, state.mediaId);
  }

  return normalizeMediaStateForResponse(state);
}

async function ensureItemMediaState(itemId) {
  const itemRef = await getItemMediaRef(itemId);
  const state = await ensureMediaStateForRef(itemRef, setItemMediaIdRunner);
  return normalizeMediaStateForResponse(state);
}

async function ensureBoxMediaState(boxId) {
  const boxRef = await getBoxMediaRef(boxId);
  const state = await ensureMediaStateForRef(boxRef, setBoxMediaIdRunner);
  return normalizeMediaStateForResponse(state);
}

function toEnqueueResponse(state, enqueueResult) {
  const job = enqueueResult?.job || null;
  const processingState = normalizeMediaStateForResponse(
    job?.processingState || enqueueResult?.processingState || state
  );
  return {
    mediaId: toTrimmed(processingState?.mediaId || state?.mediaId),
    jobId: toTrimmed(job?.id),
    processingStatus:
      toTrimmed(processingState?.processingStatus) ||
      'queued',
    renderTokens: {
      mode: firstNonEmpty(
        job?.renderTokens?.mode,
        processingState?.renderTokens?.mode,
        state?.renderTokens?.mode,
        'explicit'
      ).toLowerCase() === 'random' ? 'random' : 'explicit',
      background: firstNonEmpty(
        job?.renderTokens?.background,
        processingState?.renderTokens?.background,
        state?.renderTokens?.background
      ),
      glow: firstNonEmpty(
        job?.renderTokens?.glow,
        processingState?.renderTokens?.glow,
        state?.renderTokens?.glow
      ),
    },
    processingState,
    job,
    queueStatus: enqueueResult?.queueStatus || null,
  };
}

async function enqueueItemMediaProcessing(itemId, options = {}) {
  const state = await ensureItemMediaState(itemId);
  const enqueueResult = await enqueueMediaProcessingJobByIdRunner(
    state.mediaId,
    undefined,
    normalizeRenderTokensForRequest(options?.renderTokens),
    true
  );
  return toEnqueueResponse(state, enqueueResult);
}

async function enqueueBoxMediaProcessing(boxId, options = {}) {
  const state = await ensureBoxMediaState(boxId);
  const enqueueResult = await enqueueMediaProcessingJobByIdRunner(
    state.mediaId,
    undefined,
    normalizeRenderTokensForRequest(options?.renderTokens),
    true
  );
  return toEnqueueResponse(state, enqueueResult);
}

async function setItemActiveVariant(itemId, nextActiveVariant) {
  const state = await ensureItemMediaState(itemId);
  const updatedState = await setActiveVariantByIdRunner(
    state.mediaId,
    nextActiveVariant
  );
  return normalizeMediaStateForResponse(updatedState);
}

async function setBoxActiveVariant(boxId, nextActiveVariant) {
  const state = await ensureBoxMediaState(boxId);
  const updatedState = await setActiveVariantByIdRunner(
    state.mediaId,
    nextActiveVariant
  );
  return normalizeMediaStateForResponse(updatedState);
}

function __setEntityMediaHandlersForTests(handlers = {}) {
  if (typeof handlers.loadItemById === 'function') {
    loadItemRunner = handlers.loadItemById;
  }
  if (typeof handlers.loadBoxById === 'function') {
    loadBoxRunner = handlers.loadBoxById;
  }
  if (typeof handlers.setItemMediaId === 'function') {
    setItemMediaIdRunner = handlers.setItemMediaId;
  }
  if (typeof handlers.setBoxMediaId === 'function') {
    setBoxMediaIdRunner = handlers.setBoxMediaId;
  }
  if (typeof handlers.getMediaStateById === 'function') {
    getMediaStateByIdRunner = handlers.getMediaStateById;
  }
  if (typeof handlers.getMediaStateByOriginalPath === 'function') {
    getMediaStateByOriginalPathRunner = handlers.getMediaStateByOriginalPath;
  }
  if (typeof handlers.ensureMediaStateByOriginalPath === 'function') {
    ensureMediaStateByOriginalPathRunner = handlers.ensureMediaStateByOriginalPath;
  }
  if (typeof handlers.setActiveVariantById === 'function') {
    setActiveVariantByIdRunner = handlers.setActiveVariantById;
  }
  if (typeof handlers.enqueueMediaProcessingJobById === 'function') {
    enqueueMediaProcessingJobByIdRunner = handlers.enqueueMediaProcessingJobById;
  }
}

function __resetEntityMediaHandlersForTests() {
  loadItemRunner = async (itemId) =>
    Item.findById(itemId).select('_id image imagePath').lean();
  loadBoxRunner = async (boxId) =>
    Box.findById(boxId).select('_id image imagePath').lean();
  setItemMediaIdRunner = async (itemId, mediaId) => {
    await Item.findByIdAndUpdate(
      itemId,
      { $set: { 'image.mediaId': mediaId } },
      { runValidators: true }
    );
  };
  setBoxMediaIdRunner = async (boxId, mediaId) => {
    await Box.findByIdAndUpdate(
      boxId,
      { $set: { 'image.mediaId': mediaId } },
      { runValidators: true }
    );
  };
  getMediaStateByIdRunner = getMediaStateById;
  getMediaStateByOriginalPathRunner = getMediaStateByOriginalPath;
  ensureMediaStateByOriginalPathRunner = ensureMediaStateByOriginalPath;
  setActiveVariantByIdRunner = setActiveVariantById;
  enqueueMediaProcessingJobByIdRunner = enqueueMediaProcessingJobById;
}

module.exports = {
  getItemMediaState,
  getBoxMediaState,
  ensureItemMediaState,
  ensureBoxMediaState,
  enqueueItemMediaProcessing,
  enqueueBoxMediaProcessing,
  setItemActiveVariant,
  setBoxActiveVariant,
  __setEntityMediaHandlersForTests,
  __resetEntityMediaHandlersForTests,
};
