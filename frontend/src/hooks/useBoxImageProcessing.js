import { useCallback, useEffect, useRef, useState } from 'react';
import {
  enqueueBoxImageProcessing,
  fetchBoxMediaStatus,
  fetchMediaJobStatus,
  fetchMediaStateById,
  isTerminalMediaJobStatus,
  isTerminalMediaStatus,
  setBoxActiveVariant,
  subscribeToMediaJobEvents,
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

function normalizeJobStatus(status, fallback = 'queued') {
  const normalized = toTrimmed(status).toLowerCase();
  if (normalized === 'running') return 'processing';
  if (normalized === 'queued') return 'queued';
  if (normalized === 'completed') return 'completed';
  if (normalized === 'failed') return 'failed';
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

function isInFlightStatus(status) {
  const normalized = normalizeStatus(status, '');
  return normalized === 'queued' || normalized === 'processing';
}

function isMissingMediaJobError(error) {
  return Number(error?.status) === 404 || /media job not found/i.test(toTrimmed(error?.message));
}

function createFailedStateFromStaleJob(state, message) {
  return {
    ...(state && typeof state === 'object' ? state : {}),
    processingStatus: 'failed',
    processingError: {
      message,
    },
  };
}

function titleCaseStage(stage) {
  return toTrimmed(stage)
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDurationSeconds(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return '';
  if (value < 60) return `${Math.round(value)}s`;
  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60);
  if (seconds <= 0) return `${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

function buildJobProgressLabel(job) {
  if (!job || typeof job !== 'object') return '';
  const status = normalizeJobStatus(job.status, '');
  const stage = titleCaseStage(job.currentStage || job.progress?.stage);
  const progressPercent =
    typeof job.progressPercent === 'number'
      ? job.progressPercent
      : typeof job.progress?.progressPercent === 'number'
        ? job.progress.progressPercent
        : null;
  const message = toTrimmed(job.message || job.progress?.message);
  const elapsed = formatDurationSeconds(
    typeof job.elapsedSeconds === 'number' ? job.elapsedSeconds : job.progress?.elapsedSeconds
  );
  const eta = formatDurationSeconds(
    typeof job.etaSeconds === 'number' ? job.etaSeconds : job.progress?.etaSeconds
  );

  if (status === 'queued') {
    const parts = [message || 'Queued for processing.'];
    if (eta) parts.push(`ETA ${eta}`);
    return parts.join(' ');
  }
  if (status === 'processing') {
    const timing = [elapsed ? `elapsed ${elapsed}` : '', eta ? `ETA ${eta}` : '']
      .filter(Boolean)
      .join(' · ');
    if (stage && progressPercent != null) {
      return [`${stage} (${Math.round(progressPercent)}%)`, timing].filter(Boolean).join(' · ');
    }
    if (stage) return [stage, timing].filter(Boolean).join(' · ');
    return [message || 'Processing…', timing].filter(Boolean).join(' · ');
  }
  if (status === 'failed') {
    return message || 'Processing failed.';
  }
  if (status === 'completed') {
    return 'Processing complete.';
  }
  return message;
}

function getJobProgressPercent(job) {
  if (!job || typeof job !== 'object') return null;

  const directPercent =
    typeof job.progressPercent === 'number'
      ? job.progressPercent
      : typeof job.progress?.progressPercent === 'number'
        ? job.progress.progressPercent
        : null;

  if (typeof directPercent === 'number' && Number.isFinite(directPercent)) {
    return directPercent;
  }

  const normalizedStatus = normalizeJobStatus(job.status, '');
  if (normalizedStatus === 'completed') return 100;
  return null;
}

export default function useBoxImageProcessing({
  boxId,
  onCompleted,
  onFailed,
  pollIntervalMs = 2000,
} = {}) {
  const [processingStatus, setProcessingStatus] = useState('idle');
  const [processingState, setProcessingState] = useState(null);
  const [processingError, setProcessingError] = useState('');
  const [mediaId, setMediaId] = useState('');
  const [jobId, setJobId] = useState('');
  const [job, setJob] = useState(null);
  const [jobProgressLabel, setJobProgressLabel] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [isSwitchingVariant, setIsSwitchingVariant] = useState(false);
  const [variantSwitchError, setVariantSwitchError] = useState('');

  const intervalRef = useRef(null);
  const streamCleanupRef = useRef(null);
  const inFlightRef = useRef(false);
  const startInFlightRef = useRef(false);
  const switchInFlightRef = useRef(false);
  const mediaIdRef = useRef('');
  const jobIdRef = useRef('');
  const terminalHandledRef = useRef('');
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

  const stopJobStream = useCallback(() => {
    if (typeof streamCleanupRef.current === 'function') {
      streamCleanupRef.current();
    }
    streamCleanupRef.current = null;
  }, []);

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

  const setResolvedJobId = useCallback((nextJobId) => {
    const normalized = toTrimmed(nextJobId);
    jobIdRef.current = normalized;
    setJobId(normalized);
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

  const handleTerminalStatus = useCallback((nextStatus, state, message = '', nextJobId = '') => {
    const terminalKey = `${toTrimmed(nextJobId || jobIdRef.current)}:${nextStatus}`;
    if (terminalHandledRef.current === terminalKey) return;
    terminalHandledRef.current = terminalKey;

    stopPolling();
    stopJobStream();

    if (nextStatus === 'completed') {
      callbacksRef.current.onCompleted?.({
        status: nextStatus,
        state,
        mediaId: toTrimmed(state?.mediaId || mediaIdRef.current),
        jobId: toTrimmed(nextJobId || jobIdRef.current),
      });
      return;
    }

    if (nextStatus === 'failed') {
      callbacksRef.current.onFailed?.({
        status: nextStatus,
        state,
        mediaId: toTrimmed(state?.mediaId || mediaIdRef.current),
        jobId: toTrimmed(nextJobId || jobIdRef.current),
        error: message || statusErrorMessage(state, 'Image processing failed.'),
      });
    }
  }, [stopJobStream, stopPolling]);

  const applyJobSnapshot = useCallback((nextJob) => {
    if (!nextJob || typeof nextJob !== 'object') return null;

    setJob(nextJob);
    if (nextJob.id) {
      setResolvedJobId(nextJob.id);
    }
    if (nextJob.mediaId) {
      setResolvedMediaId(nextJob.mediaId);
    }
    if (nextJob.processingState) {
      applyMediaState(nextJob.processingState, { includeStatus: false });
    }

    const nextStatus = normalizeJobStatus(nextJob.status, 'queued');
    setProcessingStatus(nextStatus);
    setJobProgressLabel(buildJobProgressLabel(nextJob));

    if (nextStatus === 'failed') {
      const message =
        toTrimmed(nextJob.error?.message) ||
        toTrimmed(nextJob.message) ||
        toTrimmed(nextJob.progress?.message) ||
        'Image processing failed.';
      setProcessingError(message);
    } else {
      setProcessingError('');
    }

    return nextJob;
  }, [applyMediaState, setResolvedJobId, setResolvedMediaId]);

  const refreshJobStatus = useCallback(async () => {
    const targetJobId = toTrimmed(jobIdRef.current);
    if (!targetJobId) return null;

    const snapshot = await fetchMediaJobStatus(targetJobId);
    const nextJob = applyJobSnapshot(snapshot?.job || null);

    if (isTerminalMediaJobStatus(nextJob?.status)) {
      let latestState = nextJob?.processingState || null;
      if (nextJob?.status === 'completed' && !latestState && mediaIdRef.current) {
        latestState = await fetchMediaStateById(mediaIdRef.current).catch(() => latestState);
      }
      if (latestState) {
        applyMediaState(latestState, { includeStatus: true });
      }
      const message =
        nextJob?.status === 'failed'
          ? toTrimmed(nextJob?.error?.message || nextJob?.message || nextJob?.progress?.message)
          : '';
      handleTerminalStatus(normalizeJobStatus(nextJob?.status, 'failed'), latestState, message, nextJob?.id);
    }

    return nextJob;
  }, [applyJobSnapshot, applyMediaState, handleTerminalStatus]);

  const pollCurrentStatus = useCallback(async () => {
    const normalizedBoxId = toTrimmed(boxId);
    if (!normalizedBoxId || inFlightRef.current) return null;

    inFlightRef.current = true;
    try {
      const targetJobId = toTrimmed(jobIdRef.current);
      let activeJobMissing = false;
      if (targetJobId) {
        try {
          const nextJob = await refreshJobStatus();
          if (isTerminalMediaJobStatus(nextJob?.status)) {
            return nextJob?.processingState || null;
          }
        } catch (error) {
          activeJobMissing = isMissingMediaJobError(error);
          // Fall back to media-state polling if job polling is unavailable.
        }
      }

      const targetMediaId = toTrimmed(mediaIdRef.current);
      let latestState = null;
      if (targetMediaId) {
        try {
          latestState = await fetchMediaStateById(targetMediaId);
        } catch {
          latestState = await fetchBoxMediaStatus(normalizedBoxId);
        }
      } else {
        latestState = await fetchBoxMediaStatus(normalizedBoxId);
      }

      applyMediaState(latestState, { includeStatus: false });

      const nextStatus = normalizeStatus(latestState?.processingStatus, 'idle');
      setProcessingStatus(nextStatus);

      if (activeJobMissing && isInFlightStatus(nextStatus)) {
        const message =
          'Image processing job is no longer available. Start processing again.';
        const failedState = createFailedStateFromStaleJob(latestState, message);
        setProcessingState(failedState);
        setProcessingError(message);
        setProcessingStatus('failed');
        handleTerminalStatus('failed', failedState, message);
        return failedState;
      }

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
  }, [applyMediaState, boxId, handleTerminalStatus, processingState, refreshJobStatus]);

  const startPolling = useCallback(() => {
    stopPolling();

    setIsPolling(true);
    void pollCurrentStatus();

    intervalRef.current = window.setInterval(() => {
      void pollCurrentStatus();
    }, Math.max(1200, Number(pollIntervalMs) || 2000));
  }, [pollCurrentStatus, pollIntervalMs, stopPolling]);

  const startProcessing = useCallback(async ({ renderTokens } = {}) => {
    const normalizedBoxId = toTrimmed(boxId);
    if (!normalizedBoxId) throw new Error('boxId is required');
    if (isStarting || startInFlightRef.current) return null;

    try {
      startInFlightRef.current = true;
      terminalHandledRef.current = '';
      stopJobStream();
      setIsStarting(true);
      setProcessingError('');
      setProcessingStatus('queued');
      setVariantSwitchError('');
      setJob(null);
      setJobProgressLabel('Queued for processing.');

      const queued = await enqueueBoxImageProcessing(normalizedBoxId, { renderTokens });
      setResolvedMediaId(queued?.mediaId);
      setResolvedJobId(queued?.jobId);
      applyMediaState(queued?.processingState || null, { includeStatus: false });

      const nextStatus = normalizeStatus(queued?.processingStatus, 'queued');
      setProcessingStatus(nextStatus);

      if (nextStatus === 'failed') {
        const message = statusErrorMessage(
          queued?.processingState,
          'Image processing failed to start.'
        );
        setProcessingError(message);
        handleTerminalStatus('failed', queued?.processingState || null, message, queued?.jobId);
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
    boxId,
    handleTerminalStatus,
    isStarting,
    processingState,
    setResolvedJobId,
    setResolvedMediaId,
    startPolling,
    stopJobStream,
  ]);

  const refreshMediaState = useCallback(async () => {
    const normalizedBoxId = toTrimmed(boxId);
    if (!normalizedBoxId) return null;

    const targetMediaId = toTrimmed(mediaIdRef.current);
    let latestState = null;
    if (targetMediaId) {
      try {
        latestState = await fetchMediaStateById(targetMediaId);
      } catch {
        latestState = await fetchBoxMediaStatus(normalizedBoxId);
      }
    } else {
      latestState = await fetchBoxMediaStatus(normalizedBoxId);
    }

    applyMediaState(latestState, { includeStatus: true });
    return latestState;
  }, [applyMediaState, boxId]);

  const switchActiveVariant = useCallback(async (nextVariant) => {
    const normalizedBoxId = toTrimmed(boxId);
    const normalizedVariant = toTrimmed(nextVariant).toLowerCase();

    if (!normalizedBoxId) throw new Error('boxId is required');
    if (!normalizedVariant) throw new Error('activeVariant is required');
    if (isSwitchingVariant || switchInFlightRef.current) return null;

    try {
      switchInFlightRef.current = true;
      setIsSwitchingVariant(true);
      setVariantSwitchError('');
      const updatedState = await setBoxActiveVariant(normalizedBoxId, normalizedVariant);
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
  }, [applyMediaState, boxId, isSwitchingVariant]);

  useEffect(() => {
    stopPolling();
    stopJobStream();
    inFlightRef.current = false;
    startInFlightRef.current = false;
    switchInFlightRef.current = false;
    terminalHandledRef.current = '';
    setProcessingStatus('idle');
    setProcessingState(null);
    setProcessingError('');
    setJob(null);
    setJobProgressLabel('');
    setResolvedJobId('');
    setResolvedMediaId('');
    setIsStarting(false);
    setIsSwitchingVariant(false);
    setVariantSwitchError('');
  }, [boxId, setResolvedJobId, setResolvedMediaId, stopJobStream, stopPolling]);

  useEffect(() => {
    if (!boxId) return;
    void refreshMediaState().catch(() => {
      // Media state may not exist yet; keep UI usable.
    });
  }, [boxId, refreshMediaState]);

  useEffect(() => {
    const activeJobId = toTrimmed(jobId);
    if (!activeJobId) {
      stopJobStream();
      return undefined;
    }
    if (isTerminalMediaJobStatus(job?.status)) {
      stopJobStream();
      return undefined;
    }

    let cancelled = false;

    try {
      const unsubscribe = subscribeToMediaJobEvents(activeJobId, {
        onSnapshot: (payload) => {
          if (cancelled) return;
          applyJobSnapshot(payload?.job || null);
        },
        onUpdate: (payload) => {
          if (cancelled) return;
          applyJobSnapshot(payload?.job || null);
        },
        onTerminal: (payload) => {
          if (cancelled) return;
          const nextJob = applyJobSnapshot(payload?.job || null);
          const terminalStatus = normalizeJobStatus(nextJob?.status, '');
          const message =
            terminalStatus === 'failed'
              ? toTrimmed(nextJob?.error?.message || nextJob?.message || nextJob?.progress?.message)
              : '';

          void refreshMediaState()
            .catch(() => nextJob?.processingState || null)
            .then((latestState) => {
              handleTerminalStatus(
                terminalStatus || 'failed',
                latestState || nextJob?.processingState || null,
                message,
                nextJob?.id
              );
            });
        },
        onError: () => {
          if (cancelled) return;
          stopJobStream();
        },
      });
      streamCleanupRef.current = unsubscribe;
    } catch {
      stopJobStream();
    }

    return () => {
      cancelled = true;
      stopJobStream();
    };
  }, [applyJobSnapshot, handleTerminalStatus, job?.status, jobId, refreshMediaState, stopJobStream]);

  useEffect(() => {
    if (!boxId) return;
    if (isPolling) return;
    if (processingStatus === 'queued' || processingStatus === 'processing') {
      startPolling();
    }
  }, [boxId, isPolling, processingStatus, startPolling]);

  useEffect(() => () => {
    stopPolling();
    stopJobStream();
  }, [stopJobStream, stopPolling]);

  return {
    processingStatus,
    processingState,
    processingError,
    mediaId,
    jobId,
    job,
    jobProgress: job?.progress || null,
    jobProgressPercent: getJobProgressPercent(job),
    jobStageLabel: titleCaseStage(job?.currentStage || job?.progress?.stage),
    jobProgressLabel,
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
