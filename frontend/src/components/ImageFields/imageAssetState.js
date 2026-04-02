import {
  OBJECT_GLOW_BACKGROUND_MODE_IDS,
  OBJECT_GLOW_BACKGROUND_PRESET_IDS,
  OBJECT_GLOW_DEFAULT_RENDER_REQUEST,
  OBJECT_GLOW_DEFAULT_RENDER_RESOLVED,
  OBJECT_GLOW_GLOW_VARIANT_IDS,
} from '../../constants/objectGlowRenderOptions';

export function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

export function withCacheBuster(url, cacheKey) {
  const normalizedUrl = toTrimmed(url);
  if (!normalizedUrl) return '';
  if (!cacheKey) return normalizedUrl;

  const separator = normalizedUrl.includes('?') ? '&' : '?';
  return `${normalizedUrl}${separator}media_refresh=${encodeURIComponent(cacheKey)}`;
}

export function normalizeProcessingStatus(status, fallback = '') {
  const normalized = toTrimmed(status).toLowerCase();
  if (!normalized) return fallback;
  if (normalized === 'queued') return 'queued';
  if (normalized === 'processing') return 'processing';
  if (normalized === 'completed') return 'completed';
  if (normalized === 'failed') return 'failed';
  if (normalized === 'ready_for_processing') return 'ready_for_processing';
  if (normalized === 'idle') return 'idle';
  return fallback;
}

function isKnownId(candidate, knownIds) {
  const normalized = toTrimmed(candidate).toLowerCase();
  return normalized ? knownIds.includes(normalized) : false;
}

export function normalizeImageRenderRequest(
  renderRequest = {},
  fallback = OBJECT_GLOW_DEFAULT_RENDER_REQUEST
) {
  const fallbackMode = toTrimmed(fallback?.backgroundMode).toLowerCase() || 'preset';
  const fallbackPresetId = toTrimmed(fallback?.backgroundPresetId).toLowerCase()
    || OBJECT_GLOW_DEFAULT_RENDER_REQUEST.backgroundPresetId;
  const fallbackGlowVariant = toTrimmed(fallback?.glowVariant).toLowerCase()
    || OBJECT_GLOW_DEFAULT_RENDER_REQUEST.glowVariant;

  const requestedMode = toTrimmed(renderRequest?.backgroundMode).toLowerCase();
  const backgroundMode = isKnownId(requestedMode, OBJECT_GLOW_BACKGROUND_MODE_IDS)
    ? requestedMode
    : fallbackMode;

  const requestedPresetId = toTrimmed(renderRequest?.backgroundPresetId).toLowerCase();
  const backgroundPresetId = backgroundMode === 'preset'
    ? (isKnownId(requestedPresetId, OBJECT_GLOW_BACKGROUND_PRESET_IDS)
      ? requestedPresetId
      : fallbackPresetId)
    : (isKnownId(requestedPresetId, OBJECT_GLOW_BACKGROUND_PRESET_IDS)
      ? requestedPresetId
      : '');

  const requestedGlowVariant = toTrimmed(renderRequest?.glowVariant).toLowerCase();
  const glowVariant = isKnownId(requestedGlowVariant, OBJECT_GLOW_GLOW_VARIANT_IDS)
    ? requestedGlowVariant
    : fallbackGlowVariant;

  return {
    backgroundMode,
    backgroundPresetId,
    glowVariant,
  };
}

export function normalizeImageRenderResolved(
  renderResolved = {},
  renderRequest = OBJECT_GLOW_DEFAULT_RENDER_REQUEST
) {
  const requestFallback = normalizeImageRenderRequest(renderRequest);
  const fallbackPresetId = toTrimmed(requestFallback.backgroundPresetId)
    || OBJECT_GLOW_DEFAULT_RENDER_RESOLVED.backgroundPresetId;
  const fallbackGlowVariant = toTrimmed(requestFallback.glowVariant)
    || OBJECT_GLOW_DEFAULT_RENDER_RESOLVED.glowVariant;

  const requestedPresetId = toTrimmed(renderResolved?.backgroundPresetId).toLowerCase();
  const backgroundPresetId = isKnownId(requestedPresetId, OBJECT_GLOW_BACKGROUND_PRESET_IDS)
    ? requestedPresetId
    : fallbackPresetId;

  const requestedGlowVariant = toTrimmed(renderResolved?.glowVariant).toLowerCase();
  const glowVariant = isKnownId(requestedGlowVariant, OBJECT_GLOW_GLOW_VARIANT_IDS)
    ? requestedGlowVariant
    : fallbackGlowVariant;

  const outputFormat = toTrimmed(renderResolved?.outputFormat).toLowerCase()
    || OBJECT_GLOW_DEFAULT_RENDER_RESOLVED.outputFormat;

  return {
    backgroundPresetId,
    glowVariant,
    outputFormat,
  };
}

export function isRenderRequestProcessable(renderRequest = {}) {
  const normalized = normalizeImageRenderRequest(renderRequest);
  if (normalized.backgroundMode === 'random-approved') {
    return true;
  }
  return Boolean(
    normalized.backgroundMode === 'preset'
    && isKnownId(normalized.backgroundPresetId, OBJECT_GLOW_BACKGROUND_PRESET_IDS)
  );
}

export function createImageAssetState({
  activeUrl = '',
  originalUrl = '',
  processedUrl = '',
  processingStatus = '',
  processingError = '',
  renderRequest = null,
  renderResolved = null,
} = {}) {
  const normalizedRenderRequest = normalizeImageRenderRequest(renderRequest || {});
  return {
    activeUrl: toTrimmed(activeUrl),
    originalUrl: toTrimmed(originalUrl),
    processedUrl: toTrimmed(processedUrl),
    processingStatus: normalizeProcessingStatus(processingStatus, ''),
    processingError: toTrimmed(
      processingError?.message || processingError?.error || processingError
    ),
    renderRequest: normalizedRenderRequest,
    renderResolved: normalizeImageRenderResolved(
      renderResolved || {},
      normalizedRenderRequest
    ),
  };
}

export function pickEntityImageUrl(entity) {
  return toTrimmed(
    entity?.imagePath ||
    entity?.image?.display?.url ||
    entity?.image?.thumb?.url ||
    entity?.image?.original?.url ||
    entity?.image?.url ||
    ''
  );
}

export function formatProcessActionLabel(status, labels = {}) {
  const normalized = normalizeProcessingStatus(status, '');
  if (normalized === 'queued') return labels.queued || 'Queued...';
  if (normalized === 'processing') return labels.processing || 'Processing...';
  if (normalized === 'completed') return labels.completed || 'Reprocess Image';
  if (normalized === 'failed') return labels.failed || 'Retry Process';
  if (normalized === 'ready_for_processing') {
    return labels.ready_for_processing || labels.idle || 'Process Image';
  }
  return labels.idle || 'Process Image';
}
