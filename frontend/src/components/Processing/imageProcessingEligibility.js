function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

function normalizeVariant(value) {
  const normalized = toTrimmed(value).toLowerCase();
  if (normalized === 'processed') return 'processed';
  if (normalized === 'original') return 'original';
  return '';
}

function normalizeStatus(value) {
  const normalized = toTrimmed(value).toLowerCase();
  if (
    normalized === 'idle' ||
    normalized === 'ready_for_processing' ||
    normalized === 'queued' ||
    normalized === 'processing' ||
    normalized === 'completed' ||
    normalized === 'failed'
  ) {
    return normalized;
  }
  return '';
}

function hasExplicitActiveVariant(activeVariant) {
  return activeVariant === 'original' || activeVariant === 'processed';
}

function hasProcessedStateWithoutExplicitVariant({
  activeVariant,
  processingStatus,
  hasProcessedOutput,
}) {
  if (hasExplicitActiveVariant(activeVariant)) return false;
  return processingStatus === 'completed' || hasProcessedOutput;
}

function hasInFlightStateWithoutExplicitVariant({ activeVariant, processingStatus }) {
  if (hasExplicitActiveVariant(activeVariant)) return false;
  return processingStatus === 'queued' || processingStatus === 'processing';
}

export function deriveImageProcessingEligibility({
  activeVariant = '',
  processingStatus = '',
  hasProcessedOutput = false,
  hasProcessableImage = false,
} = {}) {
  const normalizedVariant = normalizeVariant(activeVariant);
  const normalizedStatus = normalizeStatus(processingStatus);
  const isAlreadyProcessed =
    normalizedVariant === 'processed' ||
    hasProcessedStateWithoutExplicitVariant({
      activeVariant: normalizedVariant,
      processingStatus: normalizedStatus,
      hasProcessedOutput: Boolean(hasProcessedOutput),
    });
  const isInFlight =
    normalizedStatus === 'queued' ||
    normalizedStatus === 'processing' ||
    hasInFlightStateWithoutExplicitVariant({
      activeVariant: normalizedVariant,
      processingStatus: normalizedStatus,
    });

  return {
    activeVariant: normalizedVariant || 'original',
    processingStatus: normalizedStatus || 'idle',
    hasProcessedOutput: Boolean(hasProcessedOutput),
    hasProcessableImage: Boolean(hasProcessableImage),
    isAlreadyProcessed,
    isInFlight,
    canProcessImage: Boolean(hasProcessableImage) && !isAlreadyProcessed && !isInFlight,
    canReprocessImage: Boolean(hasProcessableImage) && isAlreadyProcessed && !isInFlight,
    canRevertImage: isAlreadyProcessed && !isInFlight,
  };
}
