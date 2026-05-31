const {
  getItemMediaState,
  getBoxMediaState,
  ensureItemMediaState,
  ensureBoxMediaState,
  enqueueItemMediaProcessing,
  enqueueBoxMediaProcessing,
  setItemActiveVariant,
  setBoxActiveVariant,
} = require('../services/entityMediaService');
const { getMediaStateById } = require('../services/mediaProcessingService');
const {
  getBatchImportReadySummary,
  enqueueBatchImportReadyMedia,
} = require('../services/batchImportedMediaService');
const {
  MEDIA_ERROR_CODES,
  createMediaError,
  toMediaErrorPayload,
  getMediaErrorHttpStatus,
} = require('../services/mediaErrors');

function sendMediaError(res, error, extra = {}) {
  return res.status(getMediaErrorHttpStatus(error)).json({
    ok: false,
    ...extra,
    error: toMediaErrorPayload(error, {
      code: MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT,
      message: 'Entity media request failed',
    }),
  });
}

function toStatusPayload(state) {
  if (!state) return null;
  return {
    mediaId: state.mediaId,
    activeVariant: state.activeVariant,
    processingStatus: state.processingStatus,
    processingError: state.processingError,
    originalPath: state.originalPath,
    processedPath: state.processedPath,
    displayPath: state.displayPath,
    thumbPath: state.thumbPath,
    sourceType: state.sourceType || '',
    renderTokens: state.renderTokens || null,
    processedAt: state.processedAt,
  };
}

async function postItemProcessImageApi(req, res) {
  try {
    const data = await enqueueItemMediaProcessing(req.params?.itemId, {
      renderTokens: req.body?.renderTokens,
    });
    return res.status(202).json({
      ok: true,
      data: {
        mediaId: data.mediaId,
        jobId: data.jobId,
        processingStatus: data.processingStatus,
        processingState: data.processingState || null,
        renderTokens: data.renderTokens || null,
        job: data.job,
        queueStatus: data.queueStatus,
      },
    });
  } catch (error) {
    return sendMediaError(res, error);
  }
}

async function postBoxProcessImageApi(req, res) {
  try {
    const data = await enqueueBoxMediaProcessing(req.params?.boxId, {
      renderTokens: req.body?.renderTokens,
    });
    return res.status(202).json({
      ok: true,
      data: {
        mediaId: data.mediaId,
        jobId: data.jobId,
        processingStatus: data.processingStatus,
        processingState: data.processingState || null,
        renderTokens: data.renderTokens || null,
        job: data.job,
        queueStatus: data.queueStatus,
      },
    });
  } catch (error) {
    return sendMediaError(res, error);
  }
}

async function getItemMediaStatusApi(req, res) {
  try {
    const state = (await getItemMediaState(req.params?.itemId)) ||
      (await ensureItemMediaState(req.params?.itemId));
    return res.status(200).json({
      ok: true,
      data: toStatusPayload(state),
    });
  } catch (error) {
    return sendMediaError(res, error);
  }
}

async function getBoxMediaStatusApi(req, res) {
  try {
    const state = (await getBoxMediaState(req.params?.boxId)) ||
      (await ensureBoxMediaState(req.params?.boxId));
    return res.status(200).json({
      ok: true,
      data: toStatusPayload(state),
    });
  } catch (error) {
    return sendMediaError(res, error);
  }
}

async function getMediaStateByIdApi(req, res) {
  try {
    const mediaId = String(req.params?.mediaId || '').trim();
    if (!mediaId) {
      throw createMediaError(
        MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT,
        'mediaId is required',
        { fieldName: 'mediaId' }
      );
    }

    const state = await getMediaStateById(mediaId);
    if (!state) {
      throw createMediaError(
        MEDIA_ERROR_CODES.MEDIA_SOURCE_NOT_FOUND,
        `Media state not found for mediaId=${mediaId}`,
        { fieldName: 'mediaId' }
      );
    }

    return res.status(200).json({
      ok: true,
      data: toStatusPayload(state),
    });
  } catch (error) {
    return sendMediaError(res, error);
  }
}

async function patchItemActiveVariantApi(req, res) {
  try {
    const activeVariant = String(req.body?.activeVariant || '').trim().toLowerCase();
    if (!activeVariant) {
      throw createMediaError(
        MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT,
        'activeVariant is required',
        { fieldName: 'activeVariant' }
      );
    }

    const state = await setItemActiveVariant(req.params?.itemId, activeVariant);
    return res.status(200).json({
      ok: true,
      data: toStatusPayload(state),
    });
  } catch (error) {
    return sendMediaError(res, error);
  }
}

async function patchBoxActiveVariantApi(req, res) {
  try {
    const activeVariant = String(req.body?.activeVariant || '').trim().toLowerCase();
    if (!activeVariant) {
      throw createMediaError(
        MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT,
        'activeVariant is required',
        { fieldName: 'activeVariant' }
      );
    }

    const state = await setBoxActiveVariant(req.params?.boxId, activeVariant);
    return res.status(200).json({
      ok: true,
      data: toStatusPayload(state),
    });
  } catch (error) {
    return sendMediaError(res, error);
  }
}

async function getBatchImportReadySummaryApi(_req, res) {
  try {
    const data = await getBatchImportReadySummary();
    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    return sendMediaError(res, error);
  }
}

async function postBatchImportProcessReadyApi(req, res) {
  try {
    const data = await enqueueBatchImportReadyMedia({
      limit: req.body?.limit,
    });
    return res.status(202).json({
      ok: true,
      data,
    });
  } catch (error) {
    return sendMediaError(res, error);
  }
}

module.exports = {
  postItemProcessImageApi,
  postBoxProcessImageApi,
  getItemMediaStatusApi,
  getBoxMediaStatusApi,
  getMediaStateByIdApi,
  patchItemActiveVariantApi,
  patchBoxActiveVariantApi,
  getBatchImportReadySummaryApi,
  postBatchImportProcessReadyApi,
};
