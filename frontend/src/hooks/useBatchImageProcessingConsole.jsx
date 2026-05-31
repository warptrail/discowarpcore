import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchMediaJobStatus,
  isTerminalMediaJobStatus,
  subscribeToMediaJobEvents,
} from '../api/itemMedia';
import BatchProcessingToastContent from '../components/BulkImport/BatchProcessingToastContent';

export default function useBatchImageProcessingConsole({
  contextId = '',
  contextLabel = '',
  processingModeEnabled = false,
  actionMode = 'process',
  onActionModeChange = null,
  actionModeOptions = null,
  sourceBatchOptions = null,
  pendingSourceBatchId = '',
  appliedSourceBatchId = '',
  onPendingSourceBatchChange = null,
  onApplySourceBatch = null,
  sourceBatchApplyLabel = 'Select Batch',
  sourceBatchSummary = null,
  setProcessingModeEnabled = null,
  renderTokens = null,
  busyAction = '',
  selectedCount = 0,
  pageLabel = '',
  failedSelectableCount = 0,
  selectionScopeMessage = '',
  processingModeOffMessage = '',
  selectAllLabel = 'Select All Loaded',
  selectNoneLabel = 'Select None',
  selectUnprocessedLabel = 'Select Unprocessed',
  showSelectUnprocessed = true,
  showFailedSelector = true,
  primaryActionLabel = 'Process Selected',
  primaryBusyActionLabel = 'Processing…',
  onSelectAllLoaded = null,
  onSelectNoneLoaded = null,
  onSelectUnprocessedLoaded = null,
  onSelectFailedLoaded = null,
  onProcessSelected = null,
  onRenderTokenChange = null,
  showToast = null,
  hideToast = null,
  onRefreshStatus = null,
  onJobsCompleted = null,
}) {
  const processingMonitorRef = useRef(null);
  const processingProgressRef = useRef({ contextId: '', signature: '' });
  const consoleToastSignatureRef = useRef('');
  const consoleToastVisibleRef = useRef(false);
  const trackedJobStreamsRef = useRef(new Map());
  const showToastRef = useRef(showToast);
  const hideToastRef = useRef(hideToast);
  const onJobsCompletedRef = useRef(onJobsCompleted);
  const [consoleStage, setConsoleStage] = useState('setup');
  const [trackedJobIds, setTrackedJobIds] = useState([]);
  const [trackedJobsById, setTrackedJobsById] = useState({});

  useEffect(() => {
    if (!processingModeEnabled) {
      setConsoleStage('setup');
    }
  }, [processingModeEnabled]);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    hideToastRef.current = hideToast;
  }, [hideToast]);

  useEffect(() => {
    onJobsCompletedRef.current = onJobsCompleted;
  }, [onJobsCompleted]);

  const trackedJobs = useMemo(
    () => trackedJobIds.map((jobId) => trackedJobsById[jobId]).filter(Boolean),
    [trackedJobIds, trackedJobsById],
  );

  const trackedProgressSummary = useMemo(
    () =>
      trackedJobs.reduce(
        (summary, job) => {
          const status = String(job?.status || '').trim().toLowerCase();
          summary.total += 1;
          if (status === 'completed') summary.completed += 1;
          else if (status === 'failed') summary.failed += 1;
          else if (status === 'running') summary.running += 1;
          else summary.queued += 1;
          return summary;
        },
        {
          total: 0,
          queued: 0,
          running: 0,
          completed: 0,
          failed: 0,
        },
      ),
    [trackedJobs],
  );

  const trackedJobByMediaId = useMemo(
    () =>
      trackedJobs.reduce((accumulator, job) => {
        const mediaId = String(job?.mediaId || '').trim();
        if (!mediaId) return accumulator;
        const existing = accumulator[mediaId];
        if (!existing) {
          accumulator[mediaId] = job;
          return accumulator;
        }

        const existingUpdatedAt = new Date(
          existing.updatedAt || existing.lastProgressAt || 0,
        ).getTime();
        const nextUpdatedAt = new Date(
          job.updatedAt || job.lastProgressAt || 0,
        ).getTime();
        accumulator[mediaId] = nextUpdatedAt >= existingUpdatedAt ? job : existing;
        return accumulator;
      }, {}),
    [trackedJobs],
  );

  const upsertTrackedJob = useCallback((job) => {
    const normalizedJobId = String(job?.id || '').trim();
    if (!normalizedJobId) return;

    setTrackedJobsById((current) => ({
      ...current,
      [normalizedJobId]: job,
    }));
  }, []);

  const trackJobIds = useCallback((jobIds = []) => {
    const normalizedIds = Array.isArray(jobIds)
      ? jobIds.map((entry) => String(entry || '').trim()).filter(Boolean)
      : [];
    if (!normalizedIds.length) return;

    setTrackedJobIds((current) => {
      const next = new Set(current);
      normalizedIds.forEach((jobId) => next.add(jobId));
      return [...next];
    });
  }, []);

  const resetTracking = useCallback(({ dismissToast = false } = {}) => {
    processingMonitorRef.current = null;
    processingProgressRef.current = { contextId: '', signature: '' };
    consoleToastSignatureRef.current = '';
    setTrackedJobIds([]);
    setTrackedJobsById({});
    trackedJobStreamsRef.current.forEach((unsubscribe) => {
      unsubscribe?.();
    });
    trackedJobStreamsRef.current.clear();

    if (dismissToast) {
      consoleToastVisibleRef.current = false;
      hideToastRef.current?.();
    }
  }, []);

  const closeProcessingMode = useCallback(
    ({ dismissToast = false } = {}) => {
      setProcessingModeEnabled?.(false);
      consoleToastSignatureRef.current = '';
      if (dismissToast) {
        consoleToastVisibleRef.current = false;
        hideToastRef.current?.();
      }
    },
    [setProcessingModeEnabled],
  );

  const renderConsoleContent = useCallback(
    ({ onProcessSelectedOverride } = {}) => (
      <BatchProcessingToastContent
        contextLabel={contextLabel}
        selectedCount={selectedCount}
        queuedCount={trackedProgressSummary.queued}
        runningCount={trackedProgressSummary.running}
        completedCount={trackedProgressSummary.completed}
        failedCount={trackedProgressSummary.failed}
        renderTokens={renderTokens}
        pageLabel={pageLabel}
        processingModeEnabled={processingModeEnabled}
        consoleStage={consoleStage}
        actionMode={actionMode}
        onActionModeChange={onActionModeChange}
        actionModeOptions={actionModeOptions}
        sourceBatchOptions={sourceBatchOptions}
        pendingSourceBatchId={pendingSourceBatchId}
        appliedSourceBatchId={appliedSourceBatchId}
        onPendingSourceBatchChange={onPendingSourceBatchChange}
        onApplySourceBatch={onApplySourceBatch}
        sourceBatchApplyLabel={sourceBatchApplyLabel}
        sourceBatchSummary={sourceBatchSummary}
        busyAction={busyAction}
        failedSelectableCount={failedSelectableCount}
        selectionScopeMessage={selectionScopeMessage}
        processingModeOffMessage={processingModeOffMessage}
        selectAllLabel={selectAllLabel}
        selectNoneLabel={selectNoneLabel}
        selectUnprocessedLabel={selectUnprocessedLabel}
        showSelectUnprocessed={showSelectUnprocessed}
        showFailedSelector={showFailedSelector}
        primaryActionLabel={primaryActionLabel}
        primaryBusyActionLabel={primaryBusyActionLabel}
        onSelectAllLoaded={onSelectAllLoaded}
        onSelectNoneLoaded={onSelectNoneLoaded}
        onSelectUnprocessedLoaded={onSelectUnprocessedLoaded}
        onSelectFailedLoaded={onSelectFailedLoaded}
        onProcessSelected={onProcessSelectedOverride || onProcessSelected}
        onEnterSelectionStage={() => setConsoleStage('select')}
        onReturnToSetupStage={() => setConsoleStage('setup')}
        onRenderTokenChange={onRenderTokenChange}
      />
    ),
    [
      busyAction,
      consoleStage,
      actionMode,
      actionModeOptions,
      appliedSourceBatchId,
      onActionModeChange,
      onApplySourceBatch,
      onPendingSourceBatchChange,
      contextLabel,
      failedSelectableCount,
      onProcessSelected,
      onRenderTokenChange,
      onSelectAllLoaded,
      onSelectFailedLoaded,
      onSelectNoneLoaded,
      onSelectUnprocessedLoaded,
      pageLabel,
      processingModeEnabled,
      processingModeOffMessage,
      renderTokens,
      selectAllLabel,
      selectNoneLabel,
      selectUnprocessedLabel,
      selectedCount,
      selectionScopeMessage,
      showSelectUnprocessed,
      showFailedSelector,
      primaryActionLabel,
      primaryBusyActionLabel,
      pendingSourceBatchId,
      sourceBatchApplyLabel,
      sourceBatchOptions,
      sourceBatchSummary,
      trackedProgressSummary.completed,
      trackedProgressSummary.failed,
      trackedProgressSummary.queued,
      trackedProgressSummary.running,
    ],
  );

  const beginTrackedRun = useCallback(
    ({ jobIds = [], expectedCount = 0 } = {}) => {
      const normalizedContextId = String(contextId || '').trim();
      const normalizedIds = Array.isArray(jobIds)
        ? jobIds.map((entry) => String(entry || '').trim()).filter(Boolean)
        : [];
      processingMonitorRef.current = normalizedIds.length
        ? {
            contextId: normalizedContextId,
            queuedCount: Number(expectedCount) || normalizedIds.length,
          }
        : null;
      processingProgressRef.current = { contextId: '', signature: '' };
      trackJobIds(normalizedIds);
    },
    [contextId, trackJobIds],
  );

  useEffect(() => {
    if (!trackedJobIds.length) return undefined;

    trackedJobIds.forEach((jobId) => {
      if (trackedJobStreamsRef.current.has(jobId)) {
        return;
      }

      try {
        const unsubscribe = subscribeToMediaJobEvents(jobId, {
          onSnapshot: ({ job }) => upsertTrackedJob(job),
          onUpdate: ({ job }) => upsertTrackedJob(job),
          onTerminal: ({ job }) => {
            upsertTrackedJob(job);
            trackedJobStreamsRef.current.get(jobId)?.();
            trackedJobStreamsRef.current.delete(jobId);
          },
          onError: () => {
            trackedJobStreamsRef.current.get(jobId)?.();
            trackedJobStreamsRef.current.delete(jobId);
          },
        });
        trackedJobStreamsRef.current.set(jobId, unsubscribe);
      } catch {
        // Polling fallback remains active below.
      }

      void fetchMediaJobStatus(jobId)
        .then(({ job }) => {
          if (job) {
            upsertTrackedJob(job);
          }
        })
        .catch(() => {
          // Best-effort hydrate only.
        });
    });

    return undefined;
  }, [trackedJobIds, upsertTrackedJob]);

  useEffect(() => {
    const activeJobIds = trackedJobIds.filter((jobId) => {
      const job = trackedJobsById[jobId];
      return !job || !isTerminalMediaJobStatus(job.status);
    });
    if (!activeJobIds.length) return undefined;

    const intervalId = window.setInterval(() => {
      activeJobIds.forEach((jobId) => {
        void fetchMediaJobStatus(jobId)
          .then(({ job }) => {
            if (job) {
              upsertTrackedJob(job);
            }
          })
          .catch(() => {
            // SSE may still be live.
          });
      });
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [trackedJobIds, trackedJobsById, upsertTrackedJob]);

  useEffect(
    () => () => {
      trackedJobStreamsRef.current.forEach((unsubscribe) => {
        unsubscribe?.();
      });
      trackedJobStreamsRef.current.clear();
    },
    [],
  );

  useEffect(() => {
    const normalizedContextId = String(contextId || '').trim();
    const inFlightCount = trackedProgressSummary.queued + trackedProgressSummary.running;
    if (!normalizedContextId || inFlightCount <= 0 || typeof onRefreshStatus !== 'function') {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void onRefreshStatus();
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    contextId,
    onRefreshStatus,
    trackedProgressSummary.queued,
    trackedProgressSummary.running,
  ]);

  useEffect(() => {
    const monitor = processingMonitorRef.current;
    const normalizedContextId = String(contextId || '').trim();
    if (!monitor || !normalizedContextId || monitor.contextId !== normalizedContextId) {
      return;
    }

    const progressCount = trackedProgressSummary.completed + trackedProgressSummary.failed;
    const inFlightCount = trackedProgressSummary.queued + trackedProgressSummary.running;
    const signature = [
      normalizedContextId,
      progressCount,
      trackedProgressSummary.completed,
      trackedProgressSummary.failed,
      inFlightCount,
    ].join(':');

    if (
      inFlightCount > 0 &&
      processingProgressRef.current.contextId === normalizedContextId &&
      processingProgressRef.current.signature !== signature &&
      progressCount > 0
    ) {
      showToastRef.current?.({
        title: 'Batch processing progress',
        message: `Processing ${Math.min(progressCount, monitor.queuedCount)}/${monitor.queuedCount} complete.`,
        variant: 'info',
        sticky: true,
        loading: true,
      });
    }

    processingProgressRef.current = {
      contextId: normalizedContextId,
      signature,
    };

    if (inFlightCount <= 0) {
      const succeededCount = trackedProgressSummary.completed;
      const failedCount = trackedProgressSummary.failed;
      showToastRef.current?.({
        title: 'Batch processing complete',
        message: `${succeededCount} succeeded, ${failedCount} failed.`,
        variant: failedCount > 0 ? 'warning' : 'success',
        sticky: failedCount > 0,
      });
      processingMonitorRef.current = null;
      processingProgressRef.current = { contextId: '', signature: '' };
      void onRefreshStatus?.();
      onJobsCompletedRef.current?.({
        completedCount: succeededCount,
        failedCount,
      });
    }
  }, [
    contextId,
    onRefreshStatus,
    trackedProgressSummary.completed,
    trackedProgressSummary.failed,
    trackedProgressSummary.queued,
    trackedProgressSummary.running,
  ]);

  useEffect(() => {
    if (!showToastRef.current || !contextId) return;

    const shouldShowConsole = processingModeEnabled || trackedProgressSummary.total > 0;
    if (!shouldShowConsole) {
      consoleToastSignatureRef.current = '';
      if (consoleToastVisibleRef.current) {
        consoleToastVisibleRef.current = false;
        hideToastRef.current?.();
      }
      return;
    }

    const liveInFlightCount = trackedProgressSummary.queued + trackedProgressSummary.running;
    const title = processingModeEnabled
      ? 'Batch processing console'
      : 'Batch processing live status';
    const message = processingModeEnabled
      ? `${contextLabel}: ${selectedCount} selected${pageLabel ? ` on ${pageLabel}` : ''}.`
      : `${contextLabel}: ${liveInFlightCount} item${liveInFlightCount === 1 ? '' : 's'} still in flight.`;
    const consoleSignature = [
      contextId,
      processingModeEnabled ? 'mode:on' : 'mode:off',
      `stage:${consoleStage}`,
      `action:${String(actionMode || '').trim().toLowerCase() || 'process'}`,
      selectedCount,
      pageLabel,
      busyAction,
      trackedProgressSummary.queued,
      trackedProgressSummary.running,
      trackedProgressSummary.completed,
      trackedProgressSummary.failed,
      trackedProgressSummary.total,
      JSON.stringify(renderTokens || {}),
    ].join('|');

    if (consoleToastSignatureRef.current === consoleSignature) {
      return;
    }

    consoleToastSignatureRef.current = consoleSignature;
    consoleToastVisibleRef.current = true;

    showToastRef.current({
      title,
      message,
      variant:
        liveInFlightCount > 0
          ? 'info'
          : trackedProgressSummary.failed > 0
            ? 'warning'
            : 'success',
      sticky: true,
      loading: liveInFlightCount > 0 || Boolean(busyAction),
      onClose: () => {
        closeProcessingMode({ dismissToast: true });
      },
      content: renderConsoleContent(),
    });
  }, [
    actionMode,
    busyAction,
    consoleStage,
    closeProcessingMode,
    contextId,
    contextLabel,
    pageLabel,
    processingModeEnabled,
    renderConsoleContent,
    renderTokens,
    selectedCount,
    trackedProgressSummary.completed,
    trackedProgressSummary.failed,
    trackedProgressSummary.queued,
    trackedProgressSummary.running,
    trackedProgressSummary.total,
  ]);

  return {
    trackedJobIds,
    trackedJobsById,
    trackedJobByMediaId,
    trackedProgressSummary,
    consoleStage,
    upsertTrackedJob,
    trackJobIds,
    beginTrackedRun,
    resetTracking,
    closeProcessingMode,
    renderConsoleContent,
  };
}
