import { API_BASE } from './API_BASE';

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

function normalizeRenderTokens(tokens) {
  if (!tokens || typeof tokens !== 'object') return null;
  const mode = toTrimmed(tokens.mode).toLowerCase() === 'random' ? 'random' : 'explicit';
  const normalized = {
    mode,
    background: toTrimmed(tokens.background),
    glow: toTrimmed(tokens.glow),
    accent: toTrimmed(tokens.accent),
  };

  if (
    mode !== 'random' &&
    !normalized.background &&
    !normalized.glow &&
    !normalized.accent
  ) {
    return null;
  }

  return normalized;
}

async function parseApiError(response, fallbackMessage) {
  const raw = await response.text().catch(() => '');
  if (!raw) return fallbackMessage;

  try {
    const parsed = JSON.parse(raw);
    return (
      parsed?.error?.message ||
      parsed?.error ||
      parsed?.message ||
      fallbackMessage
    );
  } catch {
    return raw;
  }
}

function normalizeMediaState(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const originalPath = toTrimmed(payload.originalPath);
  const processedPath = toTrimmed(payload.processedPath);
  const displayPath = toTrimmed(payload.displayPath);
  const thumbPath = toTrimmed(payload.thumbPath);
  const displayUrl = mediaPathToClientUrl(displayPath);
  const thumbUrl = mediaPathToClientUrl(thumbPath);
  const processedUrl = mediaPathToClientUrl(processedPath);

  return {
    mediaId: toTrimmed(payload.mediaId),
    activeVariant: toTrimmed(payload.activeVariant),
    processingStatus: toTrimmed(payload.processingStatus).toLowerCase() || 'idle',
    sourceType: toTrimmed(payload.sourceType).toLowerCase(),
    processingError:
      payload.processingError && typeof payload.processingError === 'object'
        ? payload.processingError
        : payload.processingError || null,
    originalPath,
    processedPath,
    displayPath,
    thumbPath,
    originalUrl: mediaPathToClientUrl(originalPath),
    processedUrl,
    displayUrl,
    thumbUrl,
    preferredImageUrl: displayUrl || thumbUrl || processedUrl || '',
    processedAt: payload.processedAt || null,
    renderTokens: normalizeRenderTokens(payload.renderTokens),
  };
}

function normalizeMediaJobProgress(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const warning =
    payload.warning && typeof payload.warning === 'object'
      ? {
          code: toTrimmed(payload.warning.code),
          message: toTrimmed(payload.warning.message),
        }
      : null;

  return {
    event: toTrimmed(payload.event),
    stage: toTrimmed(payload.stage),
    message: toTrimmed(payload.message),
    progressPercent:
      typeof payload.progressPercent === 'number' && Number.isFinite(payload.progressPercent)
        ? payload.progressPercent
        : null,
    stageCurrent:
      typeof payload.stageCurrent === 'number' && Number.isFinite(payload.stageCurrent)
        ? payload.stageCurrent
        : null,
    stageTotal:
      typeof payload.stageTotal === 'number' && Number.isFinite(payload.stageTotal)
        ? payload.stageTotal
        : null,
    etaSeconds:
      typeof payload.etaSeconds === 'number' && Number.isFinite(payload.etaSeconds)
        ? payload.etaSeconds
        : null,
    elapsedSeconds:
      typeof payload.elapsedSeconds === 'number' && Number.isFinite(payload.elapsedSeconds)
        ? payload.elapsedSeconds
        : null,
    lastProgressAt: payload.lastProgressAt || null,
    outputPath: toTrimmed(payload.outputPath),
    warning,
  };
}

function normalizeMediaJob(payload) {
  if (!payload || typeof payload !== 'object') return null;

  return {
    id: toTrimmed(payload.id),
    operation: toTrimmed(payload.operation),
    status: toTrimmed(payload.status).toLowerCase() || 'queued',
    batchId: toTrimmed(payload.batchId),
    mediaId: toTrimmed(payload.mediaId),
    originalPath: toTrimmed(payload.originalPath),
    outputPath: toTrimmed(payload.outputPath),
    createdAt: payload.createdAt || null,
    startedAt: payload.startedAt || null,
    finishedAt: payload.finishedAt || null,
    updatedAt: payload.updatedAt || null,
    attemptCount: Number(payload.attemptCount) || 0,
    renderTokens: normalizeRenderTokens(payload.renderTokens),
    result: payload.result && typeof payload.result === 'object' ? payload.result : null,
    error: payload.error && typeof payload.error === 'object' ? payload.error : null,
    processingState: normalizeMediaState(payload.processingState || null),
    progress: normalizeMediaJobProgress(payload.progress || null),
    currentStage: toTrimmed(payload.currentStage),
    progressPercent:
      typeof payload.progressPercent === 'number' && Number.isFinite(payload.progressPercent)
        ? payload.progressPercent
        : null,
    message: toTrimmed(payload.message),
    lastProgressAt: payload.lastProgressAt || null,
    elapsedSeconds:
      typeof payload.elapsedSeconds === 'number' && Number.isFinite(payload.elapsedSeconds)
        ? payload.elapsedSeconds
        : null,
    etaSeconds:
      typeof payload.etaSeconds === 'number' && Number.isFinite(payload.etaSeconds)
        ? payload.etaSeconds
        : null,
    recentEvents: Array.isArray(payload.recentEvents) ? payload.recentEvents : [],
  };
}

export function isTerminalMediaJobStatus(status) {
  const normalized = toTrimmed(status).toLowerCase();
  return normalized === 'completed' || normalized === 'failed';
}

export function isTerminalMediaStatus(status) {
  const normalized = toTrimmed(status).toLowerCase();
  return normalized === 'completed' || normalized === 'failed';
}

export function mediaPathToClientUrl(pathValue) {
  const raw = toTrimmed(pathValue);
  if (!raw) return '';

  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
    return raw;
  }

  const normalized = raw.replace(/\\/g, '/');
  if (normalized.startsWith('/media/')) return normalized;
  if (normalized.startsWith('media/')) return `/${normalized}`;

  const backendMarker = '/backend/media/';
  const backendIndex = normalized.toLowerCase().indexOf(backendMarker);
  if (backendIndex !== -1) {
    const tail = normalized.slice(backendIndex + backendMarker.length).replace(/^\/+/, '');
    return tail ? `/media/${tail}` : '/media';
  }

  const mediaMarkerIndex = normalized.toLowerCase().indexOf('/media/');
  if (mediaMarkerIndex !== -1) {
    return normalized.slice(mediaMarkerIndex);
  }

  if (normalized.startsWith('/')) return normalized;
  return `/${normalized}`;
}

export async function enqueueItemImageProcessing(itemId, { signal, renderTokens } = {}) {
  const normalizedItemId = toTrimmed(itemId);
  if (!normalizedItemId) throw new Error('itemId is required');

  const normalizedTokens = normalizeRenderTokens(renderTokens);
  const url = `${API_BASE}/api/items/${encodeURIComponent(normalizedItemId)}/process-image`;
  const response = await fetch(url, {
    method: 'POST',
    signal,
    headers: {
      Accept: 'application/json',
      ...(normalizedTokens ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(normalizedTokens
      ? { body: JSON.stringify({ renderTokens: normalizedTokens }) }
      : {}),
  });

  if (!response.ok) {
    const message = await parseApiError(
      response,
      `Failed to start image processing (${response.status})`
    );
    throw new Error(message);
  }

  const json = await response.json().catch(() => ({}));
  const data = json?.data || {};
  return {
    mediaId: toTrimmed(data.mediaId),
    jobId: toTrimmed(data.jobId),
    processingStatus: toTrimmed(data.processingStatus).toLowerCase() || 'queued',
    processingState: normalizeMediaState(data.processingState || null),
    renderTokens: normalizeRenderTokens(data.renderTokens),
    queueStatus: data.queueStatus || null,
  };
}

export async function fetchItemMediaStatus(itemId, { signal } = {}) {
  const normalizedItemId = toTrimmed(itemId);
  if (!normalizedItemId) throw new Error('itemId is required');

  const url = `${API_BASE}/api/items/${encodeURIComponent(normalizedItemId)}/media-status`;
  const response = await fetch(url, {
    method: 'GET',
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const message = await parseApiError(
      response,
      `Failed to fetch item media status (${response.status})`
    );
    throw new Error(message);
  }

  const json = await response.json().catch(() => ({}));
  return normalizeMediaState(json?.data || null);
}

export async function uploadItemImage(itemId, file, { signal } = {}) {
  const normalizedItemId = toTrimmed(itemId);
  if (!normalizedItemId) throw new Error('itemId is required');
  if (!file) throw new Error('file is required');

  const formData = new FormData();
  formData.append('image', file);

  const url = `${API_BASE}/api/items/${encodeURIComponent(normalizedItemId)}/image`;
  const response = await fetch(url, {
    method: 'POST',
    signal,
    body: formData,
  });

  if (!response.ok) {
    const message = await parseApiError(
      response,
      `Upload failed (${response.status})`
    );
    throw new Error(message);
  }

  return response.json().catch(() => ({}));
}

export async function removeItemImage(itemId, { signal } = {}) {
  const normalizedItemId = toTrimmed(itemId);
  if (!normalizedItemId) throw new Error('itemId is required');

  const url = `${API_BASE}/api/items/${encodeURIComponent(normalizedItemId)}/image`;
  const response = await fetch(url, {
    method: 'DELETE',
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const message = await parseApiError(
      response,
      `Remove failed (${response.status})`
    );
    throw new Error(message);
  }

  return response.json().catch(() => ({}));
}

export async function enqueueBoxImageProcessing(boxId, { signal, renderTokens } = {}) {
  const normalizedBoxId = toTrimmed(boxId);
  if (!normalizedBoxId) throw new Error('boxId is required');

  const normalizedTokens = normalizeRenderTokens(renderTokens);
  const url = `${API_BASE}/api/boxes/${encodeURIComponent(normalizedBoxId)}/process-image`;
  const response = await fetch(url, {
    method: 'POST',
    signal,
    headers: {
      Accept: 'application/json',
      ...(normalizedTokens ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(normalizedTokens
      ? { body: JSON.stringify({ renderTokens: normalizedTokens }) }
      : {}),
  });

  if (!response.ok) {
    const message = await parseApiError(
      response,
      `Failed to start box image processing (${response.status})`
    );
    throw new Error(message);
  }

  const json = await response.json().catch(() => ({}));
  const data = json?.data || {};
  return {
    mediaId: toTrimmed(data.mediaId),
    jobId: toTrimmed(data.jobId),
    processingStatus: toTrimmed(data.processingStatus).toLowerCase() || 'queued',
    processingState: normalizeMediaState(data.processingState || null),
    renderTokens: normalizeRenderTokens(data.renderTokens),
    queueStatus: data.queueStatus || null,
  };
}

export async function fetchBoxMediaStatus(boxId, { signal } = {}) {
  const normalizedBoxId = toTrimmed(boxId);
  if (!normalizedBoxId) throw new Error('boxId is required');

  const url = `${API_BASE}/api/boxes/${encodeURIComponent(normalizedBoxId)}/media-status`;
  const response = await fetch(url, {
    method: 'GET',
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const message = await parseApiError(
      response,
      `Failed to fetch box media status (${response.status})`
    );
    throw new Error(message);
  }

  const json = await response.json().catch(() => ({}));
  return normalizeMediaState(json?.data || null);
}

export async function fetchMediaStateById(mediaId, { signal } = {}) {
  const normalizedMediaId = toTrimmed(mediaId);
  if (!normalizedMediaId) throw new Error('mediaId is required');

  const url = `${API_BASE}/api/media/${encodeURIComponent(normalizedMediaId)}`;
  const response = await fetch(url, {
    method: 'GET',
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const message = await parseApiError(
      response,
      `Failed to fetch media state (${response.status})`
    );
    throw new Error(message);
  }

  const json = await response.json().catch(() => ({}));
  return normalizeMediaState(json?.data || null);
}

export async function fetchMediaJobStatus(jobId, { signal } = {}) {
  const normalizedJobId = toTrimmed(jobId);
  if (!normalizedJobId) throw new Error('jobId is required');

  const url = `${API_BASE}/api/media/jobs/${encodeURIComponent(normalizedJobId)}`;
  const response = await fetch(url, {
    method: 'GET',
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const message = await parseApiError(
      response,
      `Failed to fetch media job (${response.status})`
    );
    throw new Error(message);
  }

  const json = await response.json().catch(() => ({}));
  const data = json?.data || {};
  return {
    job: normalizeMediaJob(data.job || null),
    queueStatus: data.queueStatus || null,
  };
}

export function subscribeToMediaJobEvents(
  jobId,
  {
    onSnapshot,
    onUpdate,
    onTerminal,
    onError,
  } = {}
) {
  const normalizedJobId = toTrimmed(jobId);
  if (!normalizedJobId) {
    throw new Error('jobId is required');
  }

  if (typeof window === 'undefined' || typeof window.EventSource !== 'function') {
    throw new Error('EventSource is not available in this environment.');
  }

  const url = `${API_BASE}/api/media/jobs/${encodeURIComponent(normalizedJobId)}/events`;
  const source = new window.EventSource(url, { withCredentials: false });

  const parsePayload = (rawEvent) => {
    try {
      const parsed = JSON.parse(rawEvent?.data || '{}');
      return {
        type: toTrimmed(parsed.type),
        job: normalizeMediaJob(parsed.job || null),
        queueStatus: parsed.queueStatus || null,
        event: parsed.event && typeof parsed.event === 'object' ? parsed.event : null,
      };
    } catch {
      return null;
    }
  };

  source.addEventListener('snapshot', (event) => {
    const payload = parsePayload(event);
    if (!payload) return;
    onSnapshot?.(payload);
  });

  source.addEventListener('update', (event) => {
    const payload = parsePayload(event);
    if (!payload) return;
    onUpdate?.(payload);
  });

  source.addEventListener('terminal', (event) => {
    const payload = parsePayload(event);
    if (!payload) return;
    onTerminal?.(payload);
    source.close();
  });

  source.onerror = (event) => {
    onError?.(event);
  };

  return () => {
    source.close();
  };
}

export async function setItemActiveVariant(itemId, activeVariant, { signal } = {}) {
  const normalizedItemId = toTrimmed(itemId);
  const normalizedVariant = toTrimmed(activeVariant).toLowerCase();

  if (!normalizedItemId) throw new Error('itemId is required');
  if (!normalizedVariant) throw new Error('activeVariant is required');

  const url = `${API_BASE}/api/items/${encodeURIComponent(normalizedItemId)}/active-variant`;
  const response = await fetch(url, {
    method: 'PATCH',
    signal,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ activeVariant: normalizedVariant }),
  });

  if (!response.ok) {
    const message = await parseApiError(
      response,
      `Failed to set active variant (${response.status})`
    );
    throw new Error(message);
  }

  const json = await response.json().catch(() => ({}));
  return normalizeMediaState(json?.data || null);
}

export async function setBoxActiveVariant(boxId, activeVariant, { signal } = {}) {
  const normalizedBoxId = toTrimmed(boxId);
  const normalizedVariant = toTrimmed(activeVariant).toLowerCase();

  if (!normalizedBoxId) throw new Error('boxId is required');
  if (!normalizedVariant) throw new Error('activeVariant is required');

  const url = `${API_BASE}/api/boxes/${encodeURIComponent(normalizedBoxId)}/active-variant`;
  const response = await fetch(url, {
    method: 'PATCH',
    signal,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ activeVariant: normalizedVariant }),
  });

  if (!response.ok) {
    const message = await parseApiError(
      response,
      `Failed to set box active variant (${response.status})`
    );
    throw new Error(message);
  }

  const json = await response.json().catch(() => ({}));
  return normalizeMediaState(json?.data || null);
}
