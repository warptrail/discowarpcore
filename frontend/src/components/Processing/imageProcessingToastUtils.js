function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

export function normalizeImageProcessingPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function isImageProcessingInFlight(status) {
  const normalized = toTrimmed(status).toLowerCase();
  return normalized === 'queued' || normalized === 'processing';
}

export function getImageProcessingToastSignature({
  status = '',
  label = '',
  progressPercent = null,
  entityLabel = '',
  jobId = '',
} = {}) {
  return [
    toTrimmed(status).toLowerCase(),
    toTrimmed(label),
    normalizeImageProcessingPercent(progressPercent) ?? '',
    toTrimmed(entityLabel),
    toTrimmed(jobId),
  ].join('|');
}
