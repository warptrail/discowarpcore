const {
  processImageWithObjectGlow,
} = require('../services/mediaProcessingService');
const { runMediaBatchOperation } = require('../services/mediaBatchService');
const {
  enqueueMediaProcessingJob,
  getMediaJobStatus,
  listMediaJobs,
} = require('../services/mediaJobService');
const {
  MEDIA_ERROR_CODES,
  createMediaError,
  toMediaErrorPayload,
  getMediaErrorHttpStatus,
} = require('../services/mediaErrors');

function toTrimmedString(value) {
  return value == null ? '' : String(value).trim();
}

function sendMediaError(res, error, extra = {}) {
  const statusCode = getMediaErrorHttpStatus(error);
  return res.status(statusCode).json({
    ok: false,
    ...extra,
    error: toMediaErrorPayload(error, {
      code: MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT,
      message: 'Media request failed',
    }),
  });
}

async function postMediaProcessTestApi(req, res) {
  const inputPath = toTrimmedString(req.body?.inputPath);
  const outputPath = toTrimmedString(req.body?.outputPath);
  const renderTokens = req.body?.renderTokens;

  if (!inputPath) {
    return sendMediaError(
      res,
      createMediaError(MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT, 'inputPath is required', {
        inputPath: '',
        outputPath: outputPath || '',
      }),
      { data: null, processingState: null }
    );
  }

  try {
    const { result, processingState } = await processImageWithObjectGlow(
      inputPath,
      outputPath || undefined,
      { renderTokens }
    );
    return res.status(200).json({
      ok: true,
      data: {
        result,
        processingState,
      },
    });
  } catch (error) {
    return sendMediaError(res, error, {
      data: null,
      processingState: error?.processingState || null,
    });
  }
}

async function postMediaBatchTestApi(req, res) {
  try {
    const summary = await runMediaBatchOperation({
      operation: req.body?.operation,
      filter: req.body?.filter,
      limit: req.body?.limit,
      dryRun: req.body?.dryRun,
    });

    return res.status(200).json({
      ok: true,
      data: summary,
    });
  } catch (error) {
    return sendMediaError(res, error);
  }
}

async function postMediaJobEnqueueApi(req, res) {
  const mediaId = toTrimmedString(req.body?.mediaId);
  const inputPath = toTrimmedString(req.body?.inputPath);
  const outputPath = toTrimmedString(req.body?.outputPath);
  const renderTokens = req.body?.renderTokens;

  try {
    const data = await enqueueMediaProcessingJob({
      mediaId: mediaId || undefined,
      inputPath,
      outputPath: outputPath || undefined,
      renderTokens,
    });

    return res.status(202).json({
      ok: true,
      data,
    });
  } catch (error) {
    return sendMediaError(res, error);
  }
}

async function getMediaJobStatusApi(req, res) {
  try {
    const data = await getMediaJobStatus(req.params?.jobId);
    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    return sendMediaError(res, error);
  }
}

async function getMediaJobsApi(req, res) {
  try {
    const data = await listMediaJobs({
      status: req.query?.status,
      limit: req.query?.limit,
    });
    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    return sendMediaError(res, error);
  }
}

module.exports = {
  postMediaProcessTestApi,
  postMediaBatchTestApi,
  postMediaJobEnqueueApi,
  getMediaJobStatusApi,
  getMediaJobsApi,
};
