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
