const { randomUUID } = require('crypto');

const MediaState = require('../models/MediaState');
const {
  queueMediaProcessing,
  queueMediaProcessingById,
  processImageWithObjectGlow,
  processImageWithObjectGlowById,
  getMediaStateByOriginalPath,
  getMediaStateById,
  reconcileCompletedMediaStateIfArtifactExists,
} = require('./mediaProcessingService');
const {
  MEDIA_ERROR_CODES,
  createMediaError,
  toMediaErrorPayload,
} = require('./mediaErrors');
const {
  DEFAULT_RENDER_TOKENS,
  validateRenderTokens,
} = require('./renderTokenContract');

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

function normalizeRenderTokens(tokens) {
  const mode = toTrimmed(tokens?.mode).toLowerCase() === 'random' ? 'random' : 'explicit';
  return {
    mode,
    background: toTrimmed(tokens?.background),
    glow: toTrimmed(tokens?.glow),
    accent: toTrimmed(tokens?.accent),
  };
}

function toValidatedRenderTokens(tokens, {
  fallbackTokens = DEFAULT_RENDER_TOKENS,
} = {}) {
  const validation = validateRenderTokens(tokens, { fallbackTokens });
  if (!validation.isValid) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT,
      validation.errors[0] || 'Invalid render token selection',
      { fieldName: 'renderTokens', errors: validation.errors }
    );
  }
  return normalizeRenderTokens(validation.renderTokens);
}

function toValidatedRenderTokensOrDefault(tokens) {
  try {
    return toValidatedRenderTokens(tokens);
  } catch (_error) {
    return normalizeRenderTokens(DEFAULT_RENDER_TOKENS);
  }
}

function renderTokensEqual(leftTokens, rightTokens) {
  const left = normalizeRenderTokens(leftTokens);
  const right = normalizeRenderTokens(rightTokens);
  return left.mode === right.mode
    && left.background === right.background
    && left.glow === right.glow
    && left.accent === right.accent;
}

function toBoundedPositiveInteger(value, fallback, { min = 1, max = 1000 } = {}) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}

const DEFAULT_CONFIG = Object.freeze({
  concurrency: toBoundedPositiveInteger(process.env.MEDIA_JOB_CONCURRENCY, 2, {
    min: 1,
    max: 8,
  }),
  maxQueueLength: toBoundedPositiveInteger(process.env.MEDIA_JOB_MAX_QUEUE_LENGTH, 200, {
    min: 1,
    max: 5000,
  }),
  historyLimit: toBoundedPositiveInteger(process.env.MEDIA_JOB_HISTORY_LIMIT, 1000, {
    min: 10,
    max: 50000,
  }),
});

const TERMINAL_JOB_STATUSES = new Set(['completed', 'failed']);
const RUNNING_JOB_STATUSES = new Set(['queued', 'running']);
const RECENT_JOB_EVENTS_LIMIT = 12;

const jobsById = new Map();
const pendingJobIds = [];
const jobSubscribersById = new Map();

let config = { ...DEFAULT_CONFIG };
let activeWorkers = 0;
let pumpScheduled = false;
let fallbackJobCounter = 0;

let queueMediaProcessingRunner = queueMediaProcessing;
let queueMediaProcessingByIdRunner = queueMediaProcessingById;
let processImageRunner = processImageWithObjectGlow;
let processImageByIdRunner = processImageWithObjectGlowById;
let getMediaStateRunner = getMediaStateByOriginalPath;
let getMediaStateByIdRunner = getMediaStateById;
let reconcileCompletedStateRunner = reconcileCompletedMediaStateIfArtifactExists;

function logMediaJobEvent(event, details = {}) {
  console.info(`[mediaJobService] ${event}`, details);
}

function createJobId() {
  if (typeof randomUUID === 'function') {
    return randomUUID();
  }
  fallbackJobCounter += 1;
  return `media-job-${Date.now()}-${fallbackJobCounter}`;
}

function getQueueStatus() {
  return {
    concurrency: config.concurrency,
    activeWorkers,
    queuedCount: pendingJobIds.length,
    maxQueueLength: config.maxQueueLength,
    trackedJobs: jobsById.size,
  };
}

function normalizeJobRecord(job) {
  if (!job) return null;
  return {
    id: job.id,
    operation: job.operation,
    status: job.status,
    batchId: toTrimmed(job.batchId),
    mediaId: toTrimmed(job.mediaId),
    originalPath: job.originalPath,
    outputPath: job.outputPath,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    updatedAt: job.updatedAt,
    attemptCount: job.attemptCount,
    renderTokens: normalizeRenderTokens(job.renderTokens),
    result: job.result || null,
    error: job.error || null,
    processingState: job.processingState || null,
    progress: job.progress || null,
    currentStage: toTrimmed(job.progress?.stage),
    progressPercent:
      typeof job.progress?.progressPercent === 'number' ? job.progress.progressPercent : null,
    message: toTrimmed(job.progress?.message),
    lastProgressAt: toTrimmed(job.progress?.lastProgressAt) || null,
    elapsedSeconds:
      typeof job.progress?.elapsedSeconds === 'number' ? job.progress.elapsedSeconds : null,
    etaSeconds:
      typeof job.progress?.etaSeconds === 'number' ? job.progress.etaSeconds : null,
    recentEvents: Array.isArray(job.recentEvents) ? [...job.recentEvents] : [],
  };
}

function cloneRecentEvent(event) {
  if (!event || typeof event !== 'object') return null;
  return {
    type: toTrimmed(event.type),
    timestamp: toTrimmed(event.timestamp) || new Date().toISOString(),
    status: toTrimmed(event.status),
    stage: toTrimmed(event.stage),
    message: toTrimmed(event.message),
    progressPercent:
      typeof event.progressPercent === 'number' ? event.progressPercent : null,
    elapsedSeconds:
      typeof event.elapsedSeconds === 'number' ? event.elapsedSeconds : null,
    etaSeconds:
      typeof event.etaSeconds === 'number' ? event.etaSeconds : null,
    warning: event.warning || null,
    errorCode: toTrimmed(event.errorCode) || '',
  };
}

function appendRecentJobEvent(job, event) {
  const normalized = cloneRecentEvent(event);
  if (!normalized) return;
  if (!Array.isArray(job.recentEvents)) {
    job.recentEvents = [];
  }
  job.recentEvents.push(normalized);
  if (job.recentEvents.length > RECENT_JOB_EVENTS_LIMIT) {
    job.recentEvents.splice(0, job.recentEvents.length - RECENT_JOB_EVENTS_LIMIT);
  }
}

function emitJobEvent(job, payload = {}) {
  const listeners = jobSubscribersById.get(job.id);
  if (!listeners?.size) return;

  const eventPayload = {
    type: toTrimmed(payload.type) || 'job.updated',
    job: normalizeJobRecord(job),
    event: cloneRecentEvent(payload.event),
  };

  for (const listener of listeners) {
    try {
      listener(eventPayload);
    } catch (error) {
      logMediaJobEvent('subscriber callback failed', {
        jobId: job.id,
        error: error?.message || String(error),
      });
    }
  }
}

function createJobProgressSnapshot(job, event = {}) {
  const warningCode = toTrimmed(event.warningCode);
  const warningMessage = toTrimmed(event.message);

  return {
    event: toTrimmed(event.event),
    stage: toTrimmed(event.stage),
    message: warningMessage,
    progressPercent:
      typeof event.progressPercent === 'number' ? event.progressPercent : null,
    stageCurrent:
      typeof event.stageCurrent === 'number' ? event.stageCurrent : null,
    stageTotal:
      typeof event.stageTotal === 'number' ? event.stageTotal : null,
    etaSeconds:
      typeof event.etaSeconds === 'number' ? event.etaSeconds : null,
    elapsedSeconds:
      typeof event.elapsedSeconds === 'number' ? event.elapsedSeconds : null,
    lastProgressAt: toTrimmed(event.timestamp) || new Date().toISOString(),
    warning:
      warningCode || warningMessage
        ? {
            code: warningCode || '',
            message: warningMessage || '',
          }
        : null,
    outputPath: toTrimmed(event.outputPath) || toTrimmed(job.outputPath) || '',
  };
}

function applyJobProgressEvent(job, event) {
  if (!job || !event || typeof event !== 'object') return;

  job.progress = createJobProgressSnapshot(job, event);
  job.updatedAt = job.progress.lastProgressAt;
  appendRecentJobEvent(job, {
    type: 'progress',
    timestamp: job.progress.lastProgressAt,
    status: job.status,
    stage: job.progress.stage,
    message: job.progress.message,
    progressPercent: job.progress.progressPercent,
    elapsedSeconds: job.progress.elapsedSeconds,
    etaSeconds: job.progress.etaSeconds,
    warning: job.progress.warning,
    errorCode: toTrimmed(event.errorCode),
  });
  emitJobEvent(job, {
    type: 'job.progress',
    event: {
      type: 'progress',
      timestamp: job.progress.lastProgressAt,
      status: job.status,
      stage: job.progress.stage,
      message: job.progress.message,
      progressPercent: job.progress.progressPercent,
      elapsedSeconds: job.progress.elapsedSeconds,
      etaSeconds: job.progress.etaSeconds,
      warning: job.progress.warning,
      errorCode: toTrimmed(event.errorCode),
    },
  });
}

function updateJobStatus(job, status, {
  message = '',
  stage = '',
  progressPercent = null,
  type = 'job.updated',
} = {}) {
  const timestamp = new Date().toISOString();
  job.status = status;
  job.updatedAt = timestamp;
  job.progress = {
    ...(job.progress || {}),
    stage: toTrimmed(stage) || toTrimmed(job.progress?.stage),
    message: toTrimmed(message) || toTrimmed(job.progress?.message),
    progressPercent:
      typeof progressPercent === 'number'
        ? progressPercent
        : typeof job.progress?.progressPercent === 'number'
          ? job.progress.progressPercent
          : null,
    stageCurrent:
      typeof job.progress?.stageCurrent === 'number' ? job.progress.stageCurrent : null,
    stageTotal:
      typeof job.progress?.stageTotal === 'number' ? job.progress.stageTotal : null,
    etaSeconds:
      typeof job.progress?.etaSeconds === 'number' ? job.progress.etaSeconds : null,
    elapsedSeconds:
      typeof job.progress?.elapsedSeconds === 'number' ? job.progress.elapsedSeconds : null,
    warning: job.progress?.warning || null,
    outputPath: toTrimmed(job.progress?.outputPath) || toTrimmed(job.outputPath) || '',
    lastProgressAt: timestamp,
    event: type,
  };
  appendRecentJobEvent(job, {
    type,
    timestamp,
    status: job.status,
    stage: job.progress.stage,
    message: job.progress.message,
    progressPercent:
      typeof job.progress.progressPercent === 'number' ? job.progress.progressPercent : null,
    elapsedSeconds:
      typeof job.progress.elapsedSeconds === 'number' ? job.progress.elapsedSeconds : null,
    etaSeconds:
      typeof job.progress.etaSeconds === 'number' ? job.progress.etaSeconds : null,
    warning: job.progress.warning || null,
  });
  emitJobEvent(job, {
    type,
    event: {
      type,
      timestamp,
      status: job.status,
      stage: job.progress.stage,
      message: job.progress.message,
      progressPercent:
        typeof job.progress.progressPercent === 'number' ? job.progress.progressPercent : null,
      elapsedSeconds:
        typeof job.progress.elapsedSeconds === 'number' ? job.progress.elapsedSeconds : null,
      etaSeconds:
        typeof job.progress.etaSeconds === 'number' ? job.progress.etaSeconds : null,
      warning: job.progress.warning || null,
    },
  });
}

function findOpenJobByIdentity({ mediaId, originalPath, renderTokens } = {}) {
  const normalizedMediaId = toTrimmed(mediaId);
  const normalizedOriginalPath = toTrimmed(originalPath);
  if (!normalizedMediaId && !normalizedOriginalPath) return null;
  const normalizedTokens = normalizeRenderTokens(renderTokens);

  for (const job of jobsById.values()) {
    if (!RUNNING_JOB_STATUSES.has(job.status)) continue;
    if (!renderTokensEqual(job.renderTokens, normalizedTokens)) continue;
    if (normalizedMediaId && toTrimmed(job.mediaId) === normalizedMediaId) {
      return job;
    }
    if (normalizedOriginalPath && job.originalPath === normalizedOriginalPath) {
      return job;
    }
  }

  return null;
}

function pruneCompletedJobHistory() {
  if (jobsById.size <= config.historyLimit) return;

  const removable = [...jobsById.values()]
    .filter((job) => TERMINAL_JOB_STATUSES.has(job.status))
    .sort((a, b) => {
      const left = new Date(a.finishedAt || a.createdAt).getTime();
      const right = new Date(b.finishedAt || b.createdAt).getTime();
      return left - right;
    });

  while (jobsById.size > config.historyLimit && removable.length > 0) {
    const next = removable.shift();
    jobsById.delete(next.id);
  }
}

async function loadLatestProcessingState({ mediaId, originalPath } = {}) {
  try {
    const normalizedMediaId = toTrimmed(mediaId);
    if (normalizedMediaId) {
      const byId = await getMediaStateByIdRunner(normalizedMediaId);
      if (byId) return byId;
    }
    return await getMediaStateRunner(originalPath);
  } catch (_firstError) {
    try {
      if (!mediaId) return null;
      return await getMediaStateRunner(originalPath);
    } catch (_secondError) {
      return null;
    }
  }
}

function schedulePump() {
  if (pumpScheduled) return;
  pumpScheduled = true;

  setImmediate(() => {
    pumpScheduled = false;
    void pumpQueue();
  });
}

async function runJob(job) {
  activeWorkers += 1;
  job.startedAt = new Date().toISOString();
  job.attemptCount += 1;
  updateJobStatus(job, 'running', {
    type: 'job.started',
    stage: 'queued',
    message: 'Media job started.',
  });
  logMediaJobEvent('start processing', {
    jobId: job.id,
    batchId: job.batchId,
    mediaId: job.mediaId,
    originalPath: job.originalPath,
    outputPath: job.outputPath,
    attemptCount: job.attemptCount,
    renderTokens: job.renderTokens,
    queueStatus: getQueueStatus(),
  });

  try {
    const normalizedMediaId = toTrimmed(job.mediaId);
    const outcome = normalizedMediaId
      ? await processImageByIdRunner(
          normalizedMediaId,
          job.outputPath || undefined,
          job.renderTokens,
          {
            progressContext: {
              runId: job.id,
              mediaId: normalizedMediaId,
              batchId: toTrimmed(job.batchId),
            },
            onProgress: (event) => applyJobProgressEvent(job, event),
          }
        )
      : await processImageRunner(
          job.originalPath,
          job.outputPath || undefined,
          {
            renderTokens: job.renderTokens,
            progressContext: {
              runId: job.id,
              mediaId: normalizedMediaId,
              batchId: toTrimmed(job.batchId),
            },
            onProgress: (event) => applyJobProgressEvent(job, event),
          }
        );

    job.finishedAt = new Date().toISOString();
    job.result = outcome?.result || null;
    job.mediaId = toTrimmed(outcome?.processingState?.mediaId || job.mediaId);
    job.renderTokens = normalizeRenderTokens(
      outcome?.result?.renderTokens ||
      outcome?.processingState?.renderTokens ||
      job.renderTokens
    );
    job.processingState = outcome?.processingState || (
      await loadLatestProcessingState({
        mediaId: job.mediaId,
        originalPath: job.originalPath,
      })
    );
    job.error = null;
    updateJobStatus(job, 'completed', {
      type: 'job.completed',
      stage: 'finalize',
      message: 'Media job completed.',
      progressPercent: 100,
    });
    logMediaJobEvent('success', {
      jobId: job.id,
      batchId: job.batchId,
      mediaId: job.mediaId,
      originalPath: job.originalPath,
      outputPath: job.outputPath,
      processingStatus: job.processingState?.processingStatus,
      queueStatus: getQueueStatus(),
    });
  } catch (error) {
    job.finishedAt = new Date().toISOString();
    job.result = null;
    job.error = toMediaErrorPayload(error, {
      code: MEDIA_ERROR_CODES.OBJECT_GLOW_PROCESS_FAILED,
      message: 'Queued media processing job failed',
    });
    job.mediaId = toTrimmed(error?.processingState?.mediaId || job.mediaId);
    job.processingState = error?.processingState || (
      await loadLatestProcessingState({
        mediaId: job.mediaId,
        originalPath: job.originalPath,
      })
    );
    updateJobStatus(job, 'failed', {
      type: 'job.failed',
      stage: toTrimmed(job.progress?.stage) || 'finalize',
      message: toTrimmed(job.error?.message) || 'Queued media processing job failed.',
    });
    logMediaJobEvent('retry/failure', {
      jobId: job.id,
      batchId: job.batchId,
      mediaId: job.mediaId,
      originalPath: job.originalPath,
      outputPath: job.outputPath,
      error: job.error,
      processingStatus: job.processingState?.processingStatus,
      queueStatus: getQueueStatus(),
    });
  } finally {
    activeWorkers -= 1;
    pruneCompletedJobHistory();
    schedulePump();
  }
}

async function pumpQueue() {
  while (activeWorkers < config.concurrency) {
    const nextJobId = pendingJobIds.shift();
    if (!nextJobId) break;

    const job = jobsById.get(nextJobId);
    if (!job || job.status !== 'queued') {
      continue;
    }

    void runJob(job);
  }
}

async function enqueueMediaProcessingJob({
  mediaId,
  inputPath,
  outputPath,
  renderTokens,
  forceReprocess = false,
  batchId = '',
} = {}) {
  const rawMediaId = toTrimmed(mediaId);
  const rawInputPath = toTrimmed(inputPath);
  const rawOutputPath = toTrimmed(outputPath);
  const resolvedRenderTokens = toValidatedRenderTokens(renderTokens);

  if (!rawMediaId && !rawInputPath) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT,
      'mediaId or inputPath is required'
    );
  }

  if (pendingJobIds.length >= config.maxQueueLength) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_JOB_QUEUE_FULL,
      `Media job queue is full (${config.maxQueueLength})`
    );
  }

  const queued = rawMediaId
    ? await queueMediaProcessingByIdRunner(
        rawMediaId,
        rawOutputPath || undefined,
        resolvedRenderTokens,
        { forceReprocess }
      )
    : await queueMediaProcessingRunner(
        rawInputPath,
        rawOutputPath || undefined,
        resolvedRenderTokens,
        { forceReprocess }
      );
  if (queued?.skipped) {
    logMediaJobEvent('skip as already complete', {
      mediaId: toTrimmed(queued?.mediaId || queued?.processingState?.mediaId),
      originalPath: queued?.inputPath,
      outputPath: queued?.outputPath,
      skipReason: queued?.skipReason || 'already_complete',
      forceReprocess,
      queueStatus: getQueueStatus(),
    });
    return {
      job: null,
      queueStatus: getQueueStatus(),
      processingState: queued.processingState || null,
      skipped: true,
      skipReason: queued.skipReason || 'already_complete',
    };
  }
  const resolvedMediaId = toTrimmed(queued?.mediaId || queued?.processingState?.mediaId);
  const queuedRenderTokens = normalizeRenderTokens(
    queued?.renderTokens || queued?.processingState?.renderTokens || resolvedRenderTokens
  );
  const existingOpenJob = findOpenJobByIdentity({
    mediaId: resolvedMediaId,
    originalPath: queued.inputPath,
    renderTokens: queuedRenderTokens,
  });
  if (existingOpenJob) {
    logMediaJobEvent('enqueue deduped to open job', {
      requestedMediaId: rawMediaId || resolvedMediaId,
      originalPath: queued.inputPath,
      existingJobId: existingOpenJob.id,
      forceReprocess,
      queueStatus: getQueueStatus(),
    });
    return {
      job: normalizeJobRecord(existingOpenJob),
      queueStatus: getQueueStatus(),
    };
  }

  const now = new Date().toISOString();
  const job = {
    id: createJobId(),
    operation: 'process_with_object_glow',
    status: 'queued',
    batchId: toTrimmed(batchId),
    mediaId: resolvedMediaId,
    originalPath: queued.inputPath,
    outputPath: queued.outputPath,
    createdAt: now,
    startedAt: null,
    finishedAt: null,
    updatedAt: now,
    attemptCount: 0,
    renderTokens: queuedRenderTokens,
    result: null,
    error: null,
    processingState: queued.processingState,
    progress: {
      event: 'job.queued',
      stage: 'queued',
      message: 'Queued for processing.',
      progressPercent: null,
      stageCurrent: null,
      stageTotal: null,
      etaSeconds: null,
      elapsedSeconds: null,
      lastProgressAt: now,
      warning: null,
      outputPath: toTrimmed(queued.outputPath),
    },
    recentEvents: [],
  };

  jobsById.set(job.id, job);
  pendingJobIds.push(job.id);
  appendRecentJobEvent(job, {
    type: 'job.queued',
    timestamp: now,
    status: job.status,
    stage: 'queued',
    message: 'Queued for processing.',
  });
  logMediaJobEvent('enqueue', {
    jobId: job.id,
    batchId: job.batchId,
    mediaId: job.mediaId,
    originalPath: job.originalPath,
    outputPath: job.outputPath,
    forceReprocess,
    renderTokens: job.renderTokens,
    queueStatus: getQueueStatus(),
  });
  schedulePump();

  return {
    job: normalizeJobRecord(job),
    queueStatus: getQueueStatus(),
  };
}

async function enqueueMediaProcessingJobById(
  mediaId,
  outputPath,
  renderTokens,
  forceReprocess = false,
  context = {}
) {
  return enqueueMediaProcessingJob({
    mediaId,
    outputPath,
    renderTokens,
    forceReprocess,
    batchId: toTrimmed(context?.batchId),
  });
}

async function getMediaJobStatus(jobId) {
  const normalizedJobId = toTrimmed(jobId);
  if (!normalizedJobId) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT,
      'jobId is required'
    );
  }

  const job = jobsById.get(normalizedJobId);
  if (!job) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_JOB_NOT_FOUND,
      `Media job not found: ${normalizedJobId}`
    );
  }

  if (RUNNING_JOB_STATUSES.has(job.status)) {
    job.processingState = await loadLatestProcessingState({
      mediaId: job.mediaId,
      originalPath: job.originalPath,
    });
    job.mediaId = toTrimmed(job.processingState?.mediaId || job.mediaId);
    job.renderTokens = normalizeRenderTokens(
      job.processingState?.renderTokens || job.renderTokens
    );
    job.updatedAt = new Date().toISOString();
  }

  return {
    job: normalizeJobRecord(job),
    queueStatus: getQueueStatus(),
  };
}

function subscribeToMediaJobEvents(jobId, listener) {
  const normalizedJobId = toTrimmed(jobId);
  if (!normalizedJobId) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT,
      'jobId is required'
    );
  }

  const job = jobsById.get(normalizedJobId);
  if (!job) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_JOB_NOT_FOUND,
      `Media job not found: ${normalizedJobId}`
    );
  }

  const normalizedListener = typeof listener === 'function' ? listener : null;
  if (!normalizedListener) {
    throw createMediaError(
      MEDIA_ERROR_CODES.MEDIA_INVALID_INPUT,
      'listener is required'
    );
  }

  const listeners = jobSubscribersById.get(normalizedJobId) || new Set();
  listeners.add(normalizedListener);
  jobSubscribersById.set(normalizedJobId, listeners);

  return () => {
    const current = jobSubscribersById.get(normalizedJobId);
    if (!current) return;
    current.delete(normalizedListener);
    if (current.size === 0) {
      jobSubscribersById.delete(normalizedJobId);
    }
  };
}

function listMediaJobs({ status, limit } = {}) {
  const normalizedStatus = toTrimmed(status).toLowerCase();
  const safeLimit = toBoundedPositiveInteger(limit, 50, { min: 1, max: 500 });

  const jobs = [...jobsById.values()]
    .filter((job) => {
      if (!normalizedStatus) return true;
      return job.status === normalizedStatus;
    })
    .sort((left, right) => {
      const leftTime = new Date(left.createdAt).getTime();
      const rightTime = new Date(right.createdAt).getTime();
      return rightTime - leftTime;
    })
    .slice(0, safeLimit)
    .map((job) => normalizeJobRecord(job));

  return {
    jobs,
    queueStatus: getQueueStatus(),
  };
}

async function recoverQueuedMediaJobs({ limit } = {}) {
  const safeLimit = toBoundedPositiveInteger(limit, 200, { min: 1, max: 2000 });
  const candidates = await MediaState.find({
    processingStatus: { $in: ['queued', 'processing'] },
    originalPath: { $nin: ['', null] },
  })
    .sort({ updatedAt: 1, _id: 1 })
    .limit(safeLimit)
    .lean();

  let recoveredCount = 0;
  let reconciledCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const record of candidates) {
    if (pendingJobIds.length >= config.maxQueueLength) {
      skippedCount += 1;
      continue;
    }

    const recordMediaId = toTrimmed(record.mediaId);
    const recordRenderTokens = toValidatedRenderTokensOrDefault(record.renderTokens);
    logMediaJobEvent('recovery candidate', {
      mediaId: recordMediaId,
      originalPath: record.originalPath,
      outputPath: toTrimmed(record.processedPath),
      processingStatus: toTrimmed(record.processingStatus),
      renderTokens: recordRenderTokens,
    });

    const reconciledState = await reconcileCompletedStateRunner(record.originalPath, {
      state: record,
      outputPath: toTrimmed(record.processedPath) || undefined,
      renderTokens: recordRenderTokens,
      allowQueuedRecovery: true,
      reason: 'startup_recovery',
    });
    if (reconciledState) {
      reconciledCount += 1;
      skippedCount += 1;
      logMediaJobEvent('recovery reconciled terminal completion', {
        mediaId: toTrimmed(reconciledState.mediaId),
        originalPath: reconciledState.originalPath,
        outputPath: reconciledState.processedPath,
        processingStatus: reconciledState.processingStatus,
      });
      continue;
    }

    if (findOpenJobByIdentity({
      mediaId: recordMediaId,
      originalPath: record.originalPath,
      renderTokens: recordRenderTokens,
    })) {
      skippedCount += 1;
      continue;
    }

    try {
      const queued = recordMediaId
        ? await queueMediaProcessingByIdRunner(
            recordMediaId,
            toTrimmed(record.processedPath) || undefined,
            recordRenderTokens,
            { forceReprocess: false }
          )
        : await queueMediaProcessingRunner(
            record.originalPath,
            toTrimmed(record.processedPath) || undefined,
            recordRenderTokens,
            { forceReprocess: false }
          );
      if (queued?.skipped) {
        reconciledCount += 1;
        skippedCount += 1;
        logMediaJobEvent('recovery skipped as already complete', {
          mediaId: toTrimmed(queued?.mediaId || queued?.processingState?.mediaId),
          originalPath: queued?.inputPath,
          outputPath: queued?.outputPath,
          skipReason: queued?.skipReason || 'already_complete',
        });
        continue;
      }
      const resolvedMediaId = toTrimmed(queued?.mediaId || queued?.processingState?.mediaId);
      const queuedRenderTokens = normalizeRenderTokens(
        queued?.renderTokens || queued?.processingState?.renderTokens || recordRenderTokens
      );

      const now = new Date().toISOString();
      const job = {
        id: createJobId(),
        operation: 'process_with_object_glow',
        status: 'queued',
        batchId: '',
        mediaId: resolvedMediaId,
        originalPath: queued.inputPath,
        outputPath: queued.outputPath,
        createdAt: now,
        startedAt: null,
        finishedAt: null,
        updatedAt: now,
        attemptCount: 0,
        renderTokens: queuedRenderTokens,
        result: null,
        error: null,
        processingState: queued.processingState,
        progress: {
          event: 'job.queued',
          stage: 'queued',
          message: 'Queued for processing.',
          progressPercent: null,
          stageCurrent: null,
          stageTotal: null,
          etaSeconds: null,
          elapsedSeconds: null,
          lastProgressAt: now,
          warning: null,
          outputPath: toTrimmed(queued.outputPath),
        },
        recentEvents: [],
      };

      jobsById.set(job.id, job);
      pendingJobIds.push(job.id);
      appendRecentJobEvent(job, {
        type: 'job.queued',
        timestamp: now,
        status: job.status,
        stage: 'queued',
        message: 'Queued for processing.',
      });
      recoveredCount += 1;
      logMediaJobEvent('recovery enqueue', {
        jobId: job.id,
        mediaId: job.mediaId,
        originalPath: job.originalPath,
        outputPath: job.outputPath,
        processingStatus: job.processingState?.processingStatus,
        queueStatus: getQueueStatus(),
      });
    } catch (error) {
      failedCount += 1;
      logMediaJobEvent('recovery failure', {
        mediaId: recordMediaId,
        originalPath: record.originalPath,
        outputPath: toTrimmed(record.processedPath),
        error: toMediaErrorPayload(error, {
          code: MEDIA_ERROR_CODES.OBJECT_GLOW_PROCESS_FAILED,
          message: 'Failed to recover queued media job',
        }),
      });
    }
  }

  if (recoveredCount > 0) {
    schedulePump();
  }

  return {
    matchedCount: candidates.length,
    recoveredCount,
    reconciledCount,
    skippedCount,
    failedCount,
    queueStatus: getQueueStatus(),
  };
}

function __setMediaJobHandlersForTests(handlers = {}) {
  if (typeof handlers.queueMediaProcessing === 'function') {
    queueMediaProcessingRunner = handlers.queueMediaProcessing;
  }
  if (typeof handlers.queueMediaProcessingById === 'function') {
    queueMediaProcessingByIdRunner = handlers.queueMediaProcessingById;
  }
  if (typeof handlers.processImageWithObjectGlow === 'function') {
    processImageRunner = handlers.processImageWithObjectGlow;
  }
  if (typeof handlers.processImageWithObjectGlowById === 'function') {
    processImageByIdRunner = handlers.processImageWithObjectGlowById;
  }
  if (typeof handlers.getMediaStateByOriginalPath === 'function') {
    getMediaStateRunner = handlers.getMediaStateByOriginalPath;
  }
  if (typeof handlers.getMediaStateById === 'function') {
    getMediaStateByIdRunner = handlers.getMediaStateById;
  }
  if (typeof handlers.reconcileCompletedMediaStateIfArtifactExists === 'function') {
    reconcileCompletedStateRunner = handlers.reconcileCompletedMediaStateIfArtifactExists;
  }
}

function __setMediaJobConfigForTests(nextConfig = {}) {
  config = {
    ...config,
    ...(Object.prototype.hasOwnProperty.call(nextConfig, 'concurrency')
      ? {
          concurrency: toBoundedPositiveInteger(nextConfig.concurrency, config.concurrency, {
            min: 1,
            max: 20,
          }),
        }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(nextConfig, 'maxQueueLength')
      ? {
          maxQueueLength: toBoundedPositiveInteger(
            nextConfig.maxQueueLength,
            config.maxQueueLength,
            { min: 1, max: 100000 }
          ),
        }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(nextConfig, 'historyLimit')
      ? {
          historyLimit: toBoundedPositiveInteger(
            nextConfig.historyLimit,
            config.historyLimit,
            { min: 1, max: 100000 }
          ),
        }
      : {}),
  };
}

async function __waitForIdleForTests(timeoutMs = 5000) {
  const deadline = Date.now() + toBoundedPositiveInteger(timeoutMs, 5000, {
    min: 100,
    max: 60000,
  });

  while (Date.now() < deadline) {
    if (activeWorkers === 0 && pendingJobIds.length === 0) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  return false;
}

function __resetMediaJobServiceForTests() {
  jobsById.clear();
  pendingJobIds.length = 0;
  jobSubscribersById.clear();
  activeWorkers = 0;
  pumpScheduled = false;
  fallbackJobCounter = 0;
  config = { ...DEFAULT_CONFIG };
  queueMediaProcessingRunner = queueMediaProcessing;
  queueMediaProcessingByIdRunner = queueMediaProcessingById;
  processImageRunner = processImageWithObjectGlow;
  processImageByIdRunner = processImageWithObjectGlowById;
  getMediaStateRunner = getMediaStateByOriginalPath;
  getMediaStateByIdRunner = getMediaStateById;
  reconcileCompletedStateRunner = reconcileCompletedMediaStateIfArtifactExists;
}

module.exports = {
  enqueueMediaProcessingJob,
  enqueueMediaProcessingJobById,
  getMediaJobStatus,
  subscribeToMediaJobEvents,
  listMediaJobs,
  recoverQueuedMediaJobs,
  getMediaJobQueueStatus: getQueueStatus,
  __setMediaJobHandlersForTests,
  __setMediaJobConfigForTests,
  __waitForIdleForTests,
  __resetMediaJobServiceForTests,
};
