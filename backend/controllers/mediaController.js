const {
  processImageWithObjectGlow,
} = require('../services/mediaProcessingService');
const { runMediaBatchOperation } = require('../services/mediaBatchService');
const {
  enqueueMediaProcessingJob,
  getMediaJobStatus,
  listMediaJobs,
  subscribeToMediaJobEvents,
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

async function getMediaJobEventsApi(req, res) {
  let unsubscribe = null;
  let keepAliveId = null;

  try {
    const jobId = toTrimmedString(req.params?.jobId);
    const snapshot = await getMediaJobStatus(jobId);

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    const writeEvent = (eventName, payload) => {
      res.write(`event: ${eventName}\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    writeEvent('snapshot', {
      type: 'snapshot',
      job: snapshot?.job || null,
      queueStatus: snapshot?.queueStatus || null,
      event: null,
    });

    if (['completed', 'failed'].includes(String(snapshot?.job?.status || '').toLowerCase())) {
      writeEvent('terminal', {
        type: 'terminal',
        job: snapshot?.job || null,
        queueStatus: snapshot?.queueStatus || null,
        event: null,
      });
      res.end();
      return;
    }

    unsubscribe = subscribeToMediaJobEvents(jobId, (payload) => {
      const jobStatus = String(payload?.job?.status || '').toLowerCase();
      writeEvent('update', {
        ...payload,
        queueStatus: snapshot?.queueStatus || null,
      });

      if (jobStatus === 'completed' || jobStatus === 'failed') {
        writeEvent('terminal', {
          ...payload,
          type: 'terminal',
          queueStatus: snapshot?.queueStatus || null,
        });
        unsubscribe?.();
        unsubscribe = null;
        if (keepAliveId) {
          clearInterval(keepAliveId);
          keepAliveId = null;
        }
        res.end();
      }
    });

    keepAliveId = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 15000);

    req.on('close', () => {
      unsubscribe?.();
      unsubscribe = null;
      if (keepAliveId) {
        clearInterval(keepAliveId);
        keepAliveId = null;
      }
    });
  } catch (error) {
    if (!res.headersSent) {
      return sendMediaError(res, error);
    }
    res.end();
  }
}

module.exports = {
  postMediaProcessTestApi,
  postMediaBatchTestApi,
  postMediaJobEnqueueApi,
  getMediaJobStatusApi,
  getMediaJobEventsApi,
  getMediaJobsApi,
};
