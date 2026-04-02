import { useCallback, useEffect, useRef, useState } from 'react';
import {
  enqueueItemImageProcessing,
  fetchItemMediaStatus,
  fetchMediaStateById,
  isTerminalMediaStatus,
  setItemActiveVariant,
} from '../api/itemMedia';

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

function normalizeStatus(value, fallback = 'idle') {
  const normalized = toTrimmed(value).toLowerCase();
  if (!normalized) return fallback;
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
  return fallback;
}

function statusErrorMessage(state, fallbackMessage) {
  const message =
    state?.processingError?.message ||
    state?.processingError?.error ||
    state?.processingError ||
    fallbackMessage;
  return toTrimmed(message) || fallbackMessage;
}

export default function useItemImageProcessing({
  itemId,
  onCompleted,
  onFailed,
  pollIntervalMs = 2000,
} = {}) {
  const [processingStatus, setProcessingStatus] = useState('idle');
  const [processingState, setProcessingState] = useState(null);
  const [processingError, setProcessingError] = useState('');
  const [mediaId, setMediaId] = useState('');
  const [jobId, setJobId] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [isSwitchingVariant, setIsSwitchingVariant] = useState(false);
  const [variantSwitchError, setVariantSwitchError] = useState('');

  const intervalRef = useRef(null);
  const inFlightRef = useRef(false);
  const startInFlightRef = useRef(false);
  const switchInFlightRef = useRef(false);
  const mediaIdRef = useRef('');
  const callbacksRef = useRef({
    onCompleted,
    onFailed,
  });

  useEffect(() => {
    callbacksRef.current = {
      onCompleted,
      onFailed,
    };
  }, [onCompleted, onFailed]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const setResolvedMediaId = useCallback((nextMediaId) => {
    const normalized = toTrimmed(nextMediaId);
    mediaIdRef.current = normalized;
    setMediaId(normalized);
    return normalized;
  }, []);

  const applyMediaState = useCallback((state, { includeStatus = true } = {}) => {
    if (!state || typeof state !== 'object') return null;

    if (state.mediaId) {
      setResolvedMediaId(state.mediaId);
    }

    setProcessingState(state);
    if (includeStatus) {
      setProcessingStatus(normalizeStatus(state.processingStatus, 'idle'));
    }
    return state;
  }, [setResolvedMediaId]);

  const handleTerminalStatus = useCallback((nextStatus, state, message = '') => {
    stopPolling();

    if (nextStatus === 'completed') {
      callbacksRef.current.onCompleted?.({
        status: nextStatus,
        state,
        mediaId: toTrimmed(state?.mediaId || mediaIdRef.current),
        jobId: toTrimmed(jobId),
      });
      return;
    }

    if (nextStatus === 'failed') {
      callbacksRef.current.onFailed?.({
        status: nextStatus,
        state,
        mediaId: toTrimmed(state?.mediaId || mediaIdRef.current),
        jobId: toTrimmed(jobId),
        error: message || statusErrorMessage(state, 'Image processing failed.'),
      });
    }
  }, [jobId, stopPolling]);

  const pollCurrentStatus = useCallback(async () => {
    const normalizedItemId = toTrimmed(itemId);
    if (!normalizedItemId || inFlightRef.current) return null;

    inFlightRef.current = true;
    try {
      const targetMediaId = toTrimmed(mediaIdRef.current);
      let latestState = null;
      if (targetMediaId) {
        try {
          latestState = await fetchMediaStateById(targetMediaId);
        } catch {
          latestState = await fetchItemMediaStatus(normalizedItemId);
        }
      } else {
        latestState = await fetchItemMediaStatus(normalizedItemId);
      }

      applyMediaState(latestState, { includeStatus: false });

      const nextStatus = normalizeStatus(latestState?.processingStatus, 'idle');
      setProcessingStatus(nextStatus);

      if (nextStatus === 'failed') {
        const message = statusErrorMessage(latestState, 'Image processing failed.');
        setProcessingError(message);
        handleTerminalStatus(nextStatus, latestState, message);
      } else if (isTerminalMediaStatus(nextStatus)) {
        setProcessingError('');
        handleTerminalStatus(nextStatus, latestState);
      } else {
        setProcessingError('');
      }

      return latestState;
    } catch (error) {
      const message = toTrimmed(error?.message) || 'Failed to poll image processing status.';
      setProcessingError(message);
      setProcessingStatus('failed');
      handleTerminalStatus('failed', processingState, message);
      return null;
    } finally {
      inFlightRef.current = false;
    }
  }, [applyMediaState, handleTerminalStatus, itemId, processingState]);

  const startPolling = useCallback(() => {
    stopPolling();

    setIsPolling(true);
    void pollCurrentStatus();

    intervalRef.current = window.setInterval(() => {
      void pollCurrentStatus();
    }, Math.max(1200, Number(pollIntervalMs) || 2000));
  }, [pollCurrentStatus, pollIntervalMs, stopPolling]);

  const startProcessing = useCallback(async ({ renderTokens } = {}) => {
    const normalizedItemId = toTrimmed(itemId);
    if (!normalizedItemId) throw new Error('itemId is required');
    if (isStarting || startInFlightRef.current) return null;

    try {
      startInFlightRef.current = true;
      setIsStarting(true);
      setProcessingError('');
      setProcessingStatus('queued');
      setVariantSwitchError('');

      const queued = await enqueueItemImageProcessing(normalizedItemId, { renderTokens });
      setResolvedMediaId(queued?.mediaId);
      setJobId(toTrimmed(queued?.jobId));
      applyMediaState(queued?.processingState || null, { includeStatus: false });

      const nextStatus = normalizeStatus(queued?.processingStatus, 'queued');
      setProcessingStatus(nextStatus);

      if (nextStatus === 'failed') {
        const message = statusErrorMessage(
          queued?.processingState,
          'Image processing failed to start.'
        );
        setProcessingError(message);
        handleTerminalStatus('failed', queued?.processingState || null, message);
      } else {
        setProcessingError('');
        if (nextStatus !== 'queued' && nextStatus !== 'processing') {
          setProcessingStatus('queued');
        }
        startPolling();
      }

      return queued;
    } catch (error) {
      const message = toTrimmed(error?.message) || 'Failed to enqueue image processing.';
      setProcessingError(message);
      setProcessingStatus('failed');
      handleTerminalStatus('failed', processingState, message);
      throw error;
    } finally {
      startInFlightRef.current = false;
      setIsStarting(false);
    }
  }, [
    applyMediaState,
    handleTerminalStatus,
    isStarting,
    itemId,
    processingState,
    setResolvedMediaId,
    startPolling,
  ]);

  useEffect(() => {
    stopPolling();
    inFlightRef.current = false;
    startInFlightRef.current = false;
    switchInFlightRef.current = false;
    setProcessingStatus('idle');
    setProcessingState(null);
    setProcessingError('');
    setJobId('');
    setResolvedMediaId('');
    setIsStarting(false);
    setIsSwitchingVariant(false);
    setVariantSwitchError('');
  }, [itemId, setResolvedMediaId, stopPolling]);

  const refreshMediaState = useCallback(async () => {
    const normalizedItemId = toTrimmed(itemId);
    if (!normalizedItemId) return null;

    const targetMediaId = toTrimmed(mediaIdRef.current);
    let latestState = null;
    if (targetMediaId) {
      try {
        latestState = await fetchMediaStateById(targetMediaId);
      } catch {
        latestState = await fetchItemMediaStatus(normalizedItemId);
      }
    } else {
      latestState = await fetchItemMediaStatus(normalizedItemId);
    }

    applyMediaState(latestState, { includeStatus: true });
    return latestState;
  }, [applyMediaState, itemId]);

  const switchActiveVariant = useCallback(async (nextVariant) => {
    const normalizedItemId = toTrimmed(itemId);
    const normalizedVariant = toTrimmed(nextVariant).toLowerCase();

    if (!normalizedItemId) throw new Error('itemId is required');
    if (!normalizedVariant) throw new Error('activeVariant is required');
    if (isSwitchingVariant || switchInFlightRef.current) return null;

    try {
      switchInFlightRef.current = true;
      setIsSwitchingVariant(true);
      setVariantSwitchError('');
      const updatedState = await setItemActiveVariant(normalizedItemId, normalizedVariant);
      applyMediaState(updatedState, { includeStatus: true });
      return updatedState;
    } catch (error) {
      const message = toTrimmed(error?.message) || 'Failed to switch active variant.';
      setVariantSwitchError(message);
      throw error;
    } finally {
      switchInFlightRef.current = false;
      setIsSwitchingVariant(false);
    }
  }, [applyMediaState, isSwitchingVariant, itemId]);

  useEffect(() => {
    if (!itemId) return;
    void refreshMediaState().catch(() => {
      // Media state may not exist yet; keep UI usable.
    });
  }, [itemId, refreshMediaState]);

  useEffect(() => {
    if (!itemId) return;
    if (isPolling) return;
    if (processingStatus === 'queued' || processingStatus === 'processing') {
      startPolling();
    }
  }, [itemId, isPolling, processingStatus, startPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return {
    processingStatus,
    processingState,
    processingError,
    mediaId,
    jobId,
    isStarting,
    isPolling,
    isSwitchingVariant,
    variantSwitchError,
    activeVariant: toTrimmed(processingState?.activeVariant).toLowerCase() || 'original',
    hasProcessedVariant: Boolean(
      toTrimmed(processingState?.processedPath) || toTrimmed(processingState?.processedUrl)
    ),
    isBusy: isStarting || isPolling || processingStatus === 'queued' || processingStatus === 'processing',
    refreshMediaState,
    startProcessing,
    switchActiveVariant,
    stopPolling,
  };
}
