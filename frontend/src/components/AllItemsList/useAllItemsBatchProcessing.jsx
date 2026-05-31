import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ToastContext } from '../Toast';
import {
  enqueueItemImageProcessing,
  setItemActiveVariant,
  subscribeToMediaJobEvents,
} from '../../api/itemMedia';
import {
  DEFAULT_RENDER_TOKENS,
  normalizeRenderTokens,
} from '../../constants/renderTokens';
import useBatchImageProcessingConsole from '../../hooks/useBatchImageProcessingConsole.jsx';
import {
  getBatchActionEligibility,
  normalizeBatchActionMode,
} from './allItemsList.utils';

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

function normalizeItemIds(itemIds = []) {
  if (!Array.isArray(itemIds)) return [];

  const seen = new Set();
  const next = [];

  for (const entry of itemIds) {
    const normalized = String(entry || '').trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    next.push(normalized);
  }

  return next;
}

function isSelectableForBatchProcessing(item, mode = 'process') {
  return getBatchActionEligibility(item?._allItems, mode).selectable;
}

function normalizeTrackedItemStatus(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'running' || normalized === 'processing') return 'processing';
  if (normalized === 'completed' || normalized === 'done') return 'done';
  if (normalized === 'failed' || normalized === 'error') return 'error';
  if (normalized === 'queued') return 'queued';
  return '';
}

function parseDateMs(value) {
  if (!value) return 0;
  const ms = Date.parse(String(value));
  return Number.isFinite(ms) ? ms : 0;
}

function formatDateLabel(value) {
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  return DATE_FORMATTER.format(new Date(ms));
}

export default function useAllItemsBatchProcessing({
  enabled = false,
  visibleItems = [],
  onRefreshItems = null,
}) {
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const hideToast = toastCtx?.hideToast;
  const stickyConsoleOpenRef = useRef(false);
  const trackedItemByJobIdRef = useRef(new Map());
  const trackedJobUnsubscribersRef = useRef(new Map());
  const refreshTimeoutRef = useRef(null);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [pendingSourceBatchId, setPendingSourceBatchId] = useState('');
  const [appliedSourceBatchId, setAppliedSourceBatchId] = useState('');
  const [processingModeEnabled, setProcessingModeEnabled] = useState(false);
  const [batchActionMode, setBatchActionMode] = useState('process');
  const [busyAction, setBusyAction] = useState('');
  const [itemProcessingById, setItemProcessingById] = useState({});
  const [renderTokens, setRenderTokens] = useState(() =>
    normalizeRenderTokens(DEFAULT_RENDER_TOKENS),
  );
  const visibleItemsByBatch = useMemo(() => {
    const next = new Map();

    for (const item of Array.isArray(visibleItems) ? visibleItems : []) {
      const itemId = String(item?._id || '').trim();
      const batchId = String(item?._allItems?.sourceBatchId || '').trim();
      if (!itemId || !batchId) continue;
      const current = next.get(batchId);
      if (current) current.push(item);
      else next.set(batchId, [item]);
    }

    return next;
  }, [visibleItems]);

  const appliedBatchItems = useMemo(
    () => visibleItemsByBatch.get(appliedSourceBatchId) || [],
    [appliedSourceBatchId, visibleItemsByBatch],
  );
  const eligibleItemIdsByBatch = useMemo(() => {
    const next = new Map();

    visibleItemsByBatch.forEach((items, batchId) => {
      const eligibleItemIds = normalizeItemIds(
        items
          .filter((item) => isSelectableForBatchProcessing(item, batchActionMode))
          .map((item) => String(item?._id || '').trim()),
      );
      next.set(batchId, eligibleItemIds);
    });

    return next;
  }, [batchActionMode, visibleItemsByBatch]);
  const sourceBatchOptions = useMemo(() => {
    const options = [];

    visibleItemsByBatch.forEach((items, batchId) => {
      const firstMeta = items[0]?._allItems || {};
      const sourceBatch = firstMeta?.sourceBatch || {};
      const label = String(firstMeta.sourceBatchLabel || batchId).trim() || batchId;
      const archiveStatus = String(firstMeta.sourceBatchArchiveStatus || '').trim().toLowerCase();
      const eligibleCount = (eligibleItemIdsByBatch.get(batchId) || []).length;
      const importedAtMs = Math.max(
        parseDateMs(sourceBatch?.importedAt),
        parseDateMs(sourceBatch?.createdAt),
        parseDateMs(sourceBatch?.updatedAt),
        ...items.map((item) => Number(item?._allItems?.createdAtMs) || 0),
      );
      const batchIdentifier = String(sourceBatch?.batchId || batchId).trim() || batchId;

      options.push({
        value: batchId,
        label,
        archiveStatus,
        totalCount: items.length,
        eligibleCount,
        importedAtMs,
        importedAtLabel: formatDateLabel(importedAtMs),
        batchIdentifier,
      });
    });

    return options.sort((left, right) => {
      const byImportedAt = (Number(right.importedAtMs) || 0) - (Number(left.importedAtMs) || 0);
      if (byImportedAt !== 0) return byImportedAt;
      return String(left.label || '').localeCompare(String(right.label || ''), undefined, {
        sensitivity: 'base',
      });
    });
  }, [eligibleItemIdsByBatch, visibleItemsByBatch]);
  const visibleItemsById = useMemo(() => {
    const next = new Map();

    for (const item of Array.isArray(visibleItems) ? visibleItems : []) {
      const itemId = String(item?._id || '').trim();
      if (!itemId) continue;
      next.set(itemId, item);
    }

    return next;
  }, [visibleItems]);

  const clearTrackedJob = useCallback((jobId) => {
    const normalizedJobId = String(jobId || '').trim();
    if (!normalizedJobId) return;

    const unsubscribe = trackedJobUnsubscribersRef.current.get(normalizedJobId);
    if (unsubscribe) unsubscribe();
    trackedJobUnsubscribersRef.current.delete(normalizedJobId);
    trackedItemByJobIdRef.current.delete(normalizedJobId);
  }, []);

  const upsertItemProcessing = useCallback((itemId, next) => {
    const normalizedItemId = String(itemId || '').trim();
    if (!normalizedItemId || !next || typeof next !== 'object') return;

    setItemProcessingById((current) => {
      const previous = current[normalizedItemId] || {};
      return {
        ...current,
        [normalizedItemId]: {
          ...previous,
          ...next,
        },
      };
    });
  }, []);

  const scheduleItemsRefresh = useCallback((delayMs = 350) => {
    if (typeof onRefreshItems !== 'function') return;

    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = window.setTimeout(() => {
      refreshTimeoutRef.current = null;
      void onRefreshItems();
    }, delayMs);
  }, [onRefreshItems]);

  const selectedBatchLabel = useMemo(() => {
    const first = appliedBatchItems[0]?._allItems;
    if (!first) return '';
    return String(first.sourceBatchLabel || first.sourceBatchId || '').trim();
  }, [appliedBatchItems]);

  const selectedBatchCount = (() => {
    const selectedIds = new Set(normalizeItemIds(selectedItemIds));
    let count = 0;

    visibleItemsByBatch.forEach((items) => {
      const batchItemIds = items
        .map((item) => String(item?._id || '').trim())
        .filter(Boolean);
      if (batchItemIds.some((itemId) => selectedIds.has(itemId))) {
        count += 1;
      }
    });

    return count;
  })();

  useEffect(() => {
    if (enabled) return;
    setSelectedItemIds([]);
    setPendingSourceBatchId('');
    setAppliedSourceBatchId('');
    setProcessingModeEnabled(false);
    setBatchActionMode('process');
    setBusyAction('');
    stickyConsoleOpenRef.current = false;
    setItemProcessingById({});
  }, [enabled]);

  useEffect(() => {
    const visibleIds = new Set(
      visibleItems.map((item) => String(item?._id || '').trim()).filter(Boolean),
    );

    setItemProcessingById((current) => {
      const next = {};
      Object.entries(current).forEach(([itemId, state]) => {
        if (!visibleIds.has(itemId)) return;
        next[itemId] = state;
      });
      return next;
    });
  }, [visibleItems]);

  useEffect(
    () => () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      trackedJobUnsubscribersRef.current.forEach((unsubscribe) => {
        unsubscribe?.();
      });
      trackedJobUnsubscribersRef.current.clear();
      trackedItemByJobIdRef.current.clear();
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;

    const visibleIds = new Set(
      visibleItems.map((item) => String(item?._id || '').trim()).filter(Boolean),
    );
    const nextSelectedIds = normalizeItemIds(
      selectedItemIds.filter((itemId) => {
        if (!visibleIds.has(itemId)) return false;
        const item = visibleItems.find((entry) => String(entry?._id || '').trim() === itemId);
        return isSelectableForBatchProcessing(item, batchActionMode);
      }),
    );

    if (nextSelectedIds.join('|') !== normalizeItemIds(selectedItemIds).join('|')) {
      setSelectedItemIds(nextSelectedIds);
    }

    if (appliedSourceBatchId && !visibleItemsByBatch.has(appliedSourceBatchId)) {
      setAppliedSourceBatchId('');
      setSelectedItemIds([]);
    }

    if (pendingSourceBatchId && !visibleItemsByBatch.has(pendingSourceBatchId)) {
      setPendingSourceBatchId('');
    }
  }, [
    appliedSourceBatchId,
    batchActionMode,
    enabled,
    pendingSourceBatchId,
    selectedItemIds,
    visibleItems,
    visibleItemsByBatch,
  ]);

  const clearSelection = useCallback(() => {
    setPendingSourceBatchId('');
    setAppliedSourceBatchId('');
    setSelectedItemIds([]);
  }, []);

  const applySourceBatchSelection = useCallback((batchId) => {
    const normalizedBatchId = String(batchId || '').trim();
    if (!normalizedBatchId) {
      clearSelection();
      return;
    }

    setAppliedSourceBatchId(normalizedBatchId);
    setSelectedItemIds(eligibleItemIdsByBatch.get(normalizedBatchId) || []);
  }, [clearSelection, eligibleItemIdsByBatch]);

  const handlePendingSourceBatchChange = useCallback((batchId) => {
    setPendingSourceBatchId(String(batchId || '').trim());
  }, []);

  const applyPendingSourceBatch = useCallback((batchIdOverride = '') => {
    const resolvedBatchId = String(batchIdOverride || pendingSourceBatchId || '').trim();
    applySourceBatchSelection(resolvedBatchId);
    setPendingSourceBatchId(resolvedBatchId);
  }, [applySourceBatchSelection, pendingSourceBatchId]);

  const selectBatch = useCallback((batchId) => {
    const normalizedBatchId = String(batchId || '').trim();
    if (!normalizedBatchId) {
      clearSelection();
      return;
    }
    const batchItemIds = eligibleItemIdsByBatch.get(normalizedBatchId) || [];
    const currentSelectedIds = normalizeItemIds(selectedItemIds);
    const isFullySelected =
      batchItemIds.length > 0 &&
      batchItemIds.every((itemId) => currentSelectedIds.includes(itemId));

    if (isFullySelected) {
      setSelectedItemIds(currentSelectedIds.filter((itemId) => !batchItemIds.includes(itemId)));
      if (appliedSourceBatchId === normalizedBatchId) {
        setAppliedSourceBatchId('');
      }
      if (pendingSourceBatchId === normalizedBatchId) {
        setPendingSourceBatchId('');
      }
      return;
    }

    setPendingSourceBatchId(normalizedBatchId);
    applySourceBatchSelection(normalizedBatchId);
  }, [
    appliedSourceBatchId,
    applySourceBatchSelection,
    clearSelection,
    eligibleItemIdsByBatch,
    pendingSourceBatchId,
    selectedItemIds,
  ]);

  const selectAllVisible = useCallback(() => {
    if (appliedSourceBatchId) {
      setSelectedItemIds(eligibleItemIdsByBatch.get(appliedSourceBatchId) || []);
      return;
    }

    const allVisibleIds = normalizeItemIds(
      visibleItems
        .filter((item) => isSelectableForBatchProcessing(item, batchActionMode))
        .map((item) => String(item?._id || '').trim()),
    );
    setSelectedItemIds(allVisibleIds);
  }, [appliedSourceBatchId, batchActionMode, eligibleItemIdsByBatch, visibleItems]);

  const clearSelectionInScope = useCallback(() => {
    if (appliedSourceBatchId) {
      const batchEligibleIds = new Set(eligibleItemIdsByBatch.get(appliedSourceBatchId) || []);
      setSelectedItemIds((currentSelectedIds) =>
        normalizeItemIds(currentSelectedIds).filter((itemId) => !batchEligibleIds.has(itemId)),
      );
      return;
    }

    setSelectedItemIds([]);
  }, [appliedSourceBatchId, eligibleItemIdsByBatch]);

  const focusBatch = useCallback((batchId) => {
    const normalizedBatchId = String(batchId || '').trim();
    if (!normalizedBatchId) {
      clearSelection();
      return;
    }

    setPendingSourceBatchId(normalizedBatchId);
    applySourceBatchSelection(normalizedBatchId);
  }, [applySourceBatchSelection, clearSelection]);

  const toggleItemSelection = useCallback((item) => {
    const itemId = String(item?._id || '').trim();
    if (!itemId || !isSelectableForBatchProcessing(item, batchActionMode)) return;

    setSelectedItemIds((currentSelectedIds) => {
      const baseSelectedIds = normalizeItemIds(currentSelectedIds);
      const nextSelectedIds = baseSelectedIds.includes(itemId)
        ? baseSelectedIds.filter((entry) => entry !== itemId)
        : [...baseSelectedIds, itemId];
      return normalizeItemIds(nextSelectedIds);
    });
  }, [batchActionMode]);

  const appliedBatchEligibleIds = useMemo(
    () => eligibleItemIdsByBatch.get(appliedSourceBatchId) || [],
    [appliedSourceBatchId, eligibleItemIdsByBatch],
  );
  const appliedBatchSummary = useMemo(() => {
    if (!appliedSourceBatchId) return null;
    const eligibleIds = new Set(appliedBatchEligibleIds);
    const selectedInBatchCount = normalizeItemIds(selectedItemIds).filter((itemId) =>
      eligibleIds.has(itemId)
    ).length;
    const eligibleInBatchCount = appliedBatchEligibleIds.length;
    return {
      selectedCount: selectedInBatchCount,
      eligibleInBatchCount,
      excludedCount: Math.max(0, eligibleInBatchCount - selectedInBatchCount),
    };
  }, [appliedBatchEligibleIds, appliedSourceBatchId, selectedItemIds]);

  const handleActionModeChange = useCallback((nextMode) => {
    const normalizedMode = normalizeBatchActionMode(nextMode);
    setBatchActionMode((currentMode) => (currentMode === normalizedMode ? currentMode : normalizedMode));
  }, []);

  const hideConsole = useCallback(() => {
    stickyConsoleOpenRef.current = false;
    setProcessingModeEnabled(false);
    hideToast?.();
  }, [hideToast]);

  const showConsole = useCallback(() => {
    if (!enabled || !showToast) return;
    stickyConsoleOpenRef.current = true;
    setProcessingModeEnabled(true);
  }, [enabled, showToast]);

  const handleRenderTokenChange = useCallback((field, value) => {
    const normalizedField = String(field || '').trim();
    if (!normalizedField) return;

    setRenderTokens((current) => normalizeRenderTokens({
      ...(current || DEFAULT_RENDER_TOKENS),
      [normalizedField]: value,
    }));
  }, []);

  const batchConsole = useBatchImageProcessingConsole({
    contextId: enabled ? 'all-items-batch-focused' : '',
    contextLabel: 'Batch Focused',
    processingModeEnabled,
    setProcessingModeEnabled,
    renderTokens,
    busyAction,
    selectedCount: selectedItemIds.length,
    pageLabel: 'All Items',
    failedSelectableCount: 0,
    selectionScopeMessage:
      'Controls apply to the currently visible items on this All Items batch-focused page.',
    processingModeOffMessage:
      'Processing mode is off. Enable it to select and process visible imported items from this page.',
    actionMode: batchActionMode,
    onActionModeChange: handleActionModeChange,
    actionModeOptions: [
      { value: 'process', label: 'Process' },
      { value: 'reprocess', label: 'Re-process' },
      { value: 'revert', label: 'Revert' },
    ],
    sourceBatchOptions,
    pendingSourceBatchId,
    appliedSourceBatchId,
    onPendingSourceBatchChange: handlePendingSourceBatchChange,
    onApplySourceBatch: applyPendingSourceBatch,
    sourceBatchApplyLabel: 'Select Batch',
    sourceBatchSummary: appliedBatchSummary,
    selectAllLabel: appliedSourceBatchId ? 'Select All In Batch' : 'Select All In View',
    selectNoneLabel: appliedSourceBatchId ? 'Clear Batch Selection' : 'Clear View Selection',
    primaryActionLabel:
      batchActionMode === 'revert'
        ? 'Revert Selected'
        : batchActionMode === 'reprocess'
          ? 'Re-process Selected'
          : 'Process Selected',
    primaryBusyActionLabel:
      batchActionMode === 'revert'
        ? 'Reverting…'
        : batchActionMode === 'reprocess'
          ? 'Re-processing…'
          : 'Processing…',
    showSelectUnprocessed: false,
    showFailedSelector: false,
    onSelectAllLoaded: selectAllVisible,
    onSelectNoneLoaded: clearSelectionInScope,
    onSelectUnprocessedLoaded: null,
    onProcessSelected: () => {
      void runSelectedAction();
    },
    onRenderTokenChange: handleRenderTokenChange,
    showToast,
    hideToast,
    onRefreshStatus: onRefreshItems,
    onJobsCompleted: () => {
      void onRefreshItems?.();
    },
  });

  const trackedProgressSummary = batchConsole.trackedProgressSummary;
  const isSelectionStepActive = batchConsole.consoleStage === 'select';

  const processingSummary = useMemo(() => {
    const local = {
      total: 0,
      queued: 0,
      processing: 0,
      done: 0,
      error: 0,
    };

    Object.values(itemProcessingById).forEach((entry) => {
      const status = normalizeTrackedItemStatus(entry?.status);
      if (!status) return;
      local.total += 1;
      if (status === 'queued') local.queued += 1;
      else if (status === 'processing') local.processing += 1;
      else if (status === 'done') local.done += 1;
      else if (status === 'error') local.error += 1;
    });

    const completedCount = local.done + local.error;
    const percent = local.total > 0 ? Math.round((completedCount / local.total) * 100) : 0;

    return {
      ...local,
      completedCount,
      percent,
      active: local.queued + local.processing > 0,
      trackedJobSummary: trackedProgressSummary,
    };
  }, [itemProcessingById, trackedProgressSummary]);

  const processSelected = useCallback(async () => {
    const normalizedItemIds = normalizeItemIds(selectedItemIds);
    if (!normalizedItemIds.length) return;

    const processableSelections = [];
    const skippedSelections = [];

    for (const itemId of normalizedItemIds) {
      const item = visibleItemsById.get(itemId);
      if (!item) continue;

      if (!item?._allItems?.hasProcessableImage) {
        skippedSelections.push(item);
        continue;
      }

      if (!item?._allItems?.canProcessImage) {
        skippedSelections.push(item);
        continue;
      }

      processableSelections.push(item);
    }

    if (!processableSelections.length) {
      showToast?.({
        title: 'No processable items selected',
        message:
          skippedSelections.length > 0
            ? 'Selected items are missing a usable source image for processing.'
            : 'Select one or more items with images before starting batch processing.',
        variant: 'warning',
        sticky: true,
        onClose: hideConsole,
      });
      return;
    }

    setBusyAction('process-selected');
    processableSelections.forEach((item) => {
      const itemId = String(item?._id || '').trim();
      if (!itemId) return;
      upsertItemProcessing(itemId, {
        status: 'queued',
        progressPercent: null,
        message: '',
      });
    });

    try {
      const queueResults = await Promise.allSettled(
        processableSelections.map(async (item) => {
          const itemId = String(item?._id || '').trim();
          const queued = await enqueueItemImageProcessing(itemId, { renderTokens });
          return { itemId, queued };
        }),
      );

      const successfulResults = queueResults
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);
      const failedResults = queueResults
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason);

      successfulResults.forEach(({ itemId, queued }) => {
        const jobId = String(queued?.jobId || '').trim();
        upsertItemProcessing(itemId, {
          status: normalizeTrackedItemStatus(queued?.processingStatus) || 'queued',
          progressPercent: null,
          jobId,
          message: '',
        });

        if (!jobId || trackedJobUnsubscribersRef.current.has(jobId)) return;
        trackedItemByJobIdRef.current.set(jobId, itemId);

        try {
          const unsubscribe = subscribeToMediaJobEvents(jobId, {
            onSnapshot: ({ job }) => {
              const trackedItemId = trackedItemByJobIdRef.current.get(jobId);
              if (!trackedItemId) return;
              upsertItemProcessing(trackedItemId, {
                status: normalizeTrackedItemStatus(job?.status) || 'queued',
                progressPercent:
                  typeof job?.progressPercent === 'number'
                    ? job.progressPercent
                    : typeof job?.progress?.progressPercent === 'number'
                      ? job.progress.progressPercent
                      : null,
                message: String(job?.message || job?.progress?.message || '').trim(),
              });
            },
            onUpdate: ({ job }) => {
              const trackedItemId = trackedItemByJobIdRef.current.get(jobId);
              if (!trackedItemId) return;
              upsertItemProcessing(trackedItemId, {
                status: normalizeTrackedItemStatus(job?.status) || 'processing',
                progressPercent:
                  typeof job?.progressPercent === 'number'
                    ? job.progressPercent
                    : typeof job?.progress?.progressPercent === 'number'
                      ? job.progress.progressPercent
                      : null,
                message: String(job?.message || job?.progress?.message || '').trim(),
              });
            },
            onTerminal: ({ job }) => {
              const trackedItemId = trackedItemByJobIdRef.current.get(jobId);
              if (!trackedItemId) {
                clearTrackedJob(jobId);
                return;
              }
              const status = normalizeTrackedItemStatus(job?.status);
              upsertItemProcessing(trackedItemId, {
                status: status || 'done',
                progressPercent: status === 'done' ? 100 : null,
                message: String(
                  job?.error?.message || job?.message || job?.progress?.message || '',
                ).trim(),
              });
              if (status === 'done') {
                scheduleItemsRefresh();
              }
              clearTrackedJob(jobId);
            },
            onError: () => {
              const trackedItemId = trackedItemByJobIdRef.current.get(jobId);
              if (trackedItemId) {
                upsertItemProcessing(trackedItemId, {
                  status: 'error',
                  message: 'Job stream disconnected',
                });
              }
              clearTrackedJob(jobId);
            },
          });
          trackedJobUnsubscribersRef.current.set(jobId, unsubscribe);
        } catch {
          upsertItemProcessing(itemId, {
            status: 'error',
            message: 'Unable to subscribe to job progress',
          });
          clearTrackedJob(jobId);
        }
      });

      queueResults.forEach((result, index) => {
        if (result.status === 'fulfilled') return;
        const item = processableSelections[index];
        const itemId = String(item?._id || '').trim();
        if (!itemId) return;
        upsertItemProcessing(itemId, {
          status: 'error',
          progressPercent: null,
          message: String(result.reason?.message || 'Failed to queue processing job').trim(),
        });
      });

      if (!successfulResults.length) {
        throw failedResults[0] || new Error('Failed to queue selected batch items for processing.');
      }

      const queuedCount = successfulResults.reduce((sum, result) => {
        return sum + (result?.queued?.jobId ? 1 : 0);
      }, 0);
      const jobIds = successfulResults
        .map((result) => String(result?.queued?.jobId || '').trim())
        .filter(Boolean);
      batchConsole.beginTrackedRun({
        jobIds,
        expectedCount: jobIds.length || queuedCount,
      });

      if (failedResults.length || skippedSelections.length) {
        const failedMessage = failedResults
          .map((error) => String(error?.message || '').trim())
          .filter(Boolean)
          .join(' ');
        const skippedMessage = skippedSelections.length
          ? `${skippedSelections.length} skipped without source images.`
          : '';
        showToast?.({
          title: 'Some selected items were skipped',
          message: [failedMessage, skippedMessage]
            .filter(Boolean)
            .join(' • ') || 'Some selected items could not be queued, but valid items were still processed.',
          variant: 'warning',
          sticky: true,
          onClose: hideConsole,
        });
      }
    } catch (error) {
      showToast?.({
        title: 'Batch processing start failed',
        message: error?.message || 'Failed to queue selected batch items for processing.',
        variant: 'danger',
        sticky: true,
        onClose: hideConsole,
      });
    } finally {
      setBusyAction('');
    }
  }, [
    batchConsole,
    clearTrackedJob,
    hideConsole,
    renderTokens,
    scheduleItemsRefresh,
    selectedItemIds,
    upsertItemProcessing,
    visibleItemsById,
    showToast,
  ]);

  const reprocessSelected = useCallback(async () => {
    const normalizedItemIds = normalizeItemIds(selectedItemIds);
    if (!normalizedItemIds.length) return;

    const reprocessSelections = [];
    const skippedSelections = [];

    for (const itemId of normalizedItemIds) {
      const item = visibleItemsById.get(itemId);
      if (!item) continue;

      if (!item?._allItems?.hasProcessableImage) {
        skippedSelections.push(item);
        continue;
      }

      if (!item?._allItems?.canReprocessImage) {
        skippedSelections.push(item);
        continue;
      }

      reprocessSelections.push(item);
    }

    if (!reprocessSelections.length) {
      showToast?.({
        title: 'No re-processable items selected',
        message:
          skippedSelections.length > 0
            ? 'Selected items are not currently processed or are already in flight.'
            : 'Select one or more processed items before re-processing.',
        variant: 'warning',
        sticky: true,
        onClose: hideConsole,
      });
      return;
    }

    setBusyAction('reprocess-selected');
    reprocessSelections.forEach((item) => {
      const itemId = String(item?._id || '').trim();
      if (!itemId) return;
      upsertItemProcessing(itemId, {
        status: 'queued',
        progressPercent: null,
        message: 'Queued for re-process',
      });
    });

    try {
      const queueResults = await Promise.allSettled(
        reprocessSelections.map(async (item) => {
          const itemId = String(item?._id || '').trim();
          const queued = await enqueueItemImageProcessing(itemId, { renderTokens });
          return { itemId, queued };
        }),
      );

      const successfulResults = queueResults
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);
      const failedResults = queueResults
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason);

      successfulResults.forEach(({ itemId, queued }) => {
        const jobId = String(queued?.jobId || '').trim();
        upsertItemProcessing(itemId, {
          status: normalizeTrackedItemStatus(queued?.processingStatus) || 'queued',
          progressPercent: null,
          jobId,
          message: '',
        });

        if (!jobId || trackedJobUnsubscribersRef.current.has(jobId)) return;
        trackedItemByJobIdRef.current.set(jobId, itemId);

        try {
          const unsubscribe = subscribeToMediaJobEvents(jobId, {
            onSnapshot: ({ job }) => {
              const trackedItemId = trackedItemByJobIdRef.current.get(jobId);
              if (!trackedItemId) return;
              upsertItemProcessing(trackedItemId, {
                status: normalizeTrackedItemStatus(job?.status) || 'queued',
                progressPercent:
                  typeof job?.progressPercent === 'number'
                    ? job.progressPercent
                    : typeof job?.progress?.progressPercent === 'number'
                      ? job.progress.progressPercent
                      : null,
                message: String(job?.message || job?.progress?.message || '').trim(),
              });
            },
            onUpdate: ({ job }) => {
              const trackedItemId = trackedItemByJobIdRef.current.get(jobId);
              if (!trackedItemId) return;
              upsertItemProcessing(trackedItemId, {
                status: normalizeTrackedItemStatus(job?.status) || 'processing',
                progressPercent:
                  typeof job?.progressPercent === 'number'
                    ? job.progressPercent
                    : typeof job?.progress?.progressPercent === 'number'
                      ? job.progress.progressPercent
                      : null,
                message: String(job?.message || job?.progress?.message || '').trim(),
              });
            },
            onTerminal: ({ job }) => {
              const trackedItemId = trackedItemByJobIdRef.current.get(jobId);
              if (!trackedItemId) {
                clearTrackedJob(jobId);
                return;
              }
              const status = normalizeTrackedItemStatus(job?.status);
              upsertItemProcessing(trackedItemId, {
                status: status || 'done',
                progressPercent: status === 'done' ? 100 : null,
                message: String(
                  job?.error?.message || job?.message || job?.progress?.message || '',
                ).trim(),
              });
              if (status === 'done') {
                scheduleItemsRefresh();
              }
              clearTrackedJob(jobId);
            },
            onError: () => {
              const trackedItemId = trackedItemByJobIdRef.current.get(jobId);
              if (trackedItemId) {
                upsertItemProcessing(trackedItemId, {
                  status: 'error',
                  message: 'Job stream disconnected',
                });
              }
              clearTrackedJob(jobId);
            },
          });
          trackedJobUnsubscribersRef.current.set(jobId, unsubscribe);
        } catch {
          upsertItemProcessing(itemId, {
            status: 'error',
            message: 'Unable to subscribe to job progress',
          });
          clearTrackedJob(jobId);
        }
      });

      queueResults.forEach((result, index) => {
        if (result.status === 'fulfilled') return;
        const item = reprocessSelections[index];
        const itemId = String(item?._id || '').trim();
        if (!itemId) return;
        upsertItemProcessing(itemId, {
          status: 'error',
          progressPercent: null,
          message: String(result.reason?.message || 'Failed to queue re-processing job').trim(),
        });
      });

      if (!successfulResults.length) {
        throw failedResults[0] || new Error('Failed to queue selected items for re-processing.');
      }

      const queuedCount = successfulResults.reduce((sum, result) => {
        return sum + (result?.queued?.jobId ? 1 : 0);
      }, 0);
      const jobIds = successfulResults
        .map((result) => String(result?.queued?.jobId || '').trim())
        .filter(Boolean);
      batchConsole.beginTrackedRun({
        jobIds,
        expectedCount: jobIds.length || queuedCount,
      });

      if (failedResults.length || skippedSelections.length) {
        const failedMessage = failedResults
          .map((error) => String(error?.message || '').trim())
          .filter(Boolean)
          .join(' ');
        const skippedMessage = skippedSelections.length
          ? `${skippedSelections.length} skipped because they were not eligible for re-process.`
          : '';
        showToast?.({
          title: 'Some selected items were skipped',
          message: [failedMessage, skippedMessage]
            .filter(Boolean)
            .join(' • ') || 'Some selected items could not be queued.',
          variant: 'warning',
          sticky: true,
          onClose: hideConsole,
        });
      }
    } catch (error) {
      showToast?.({
        title: 'Batch re-process start failed',
        message: error?.message || 'Failed to queue selected items for re-processing.',
        variant: 'danger',
        sticky: true,
        onClose: hideConsole,
      });
    } finally {
      setBusyAction('');
    }
  }, [
    batchConsole,
    clearTrackedJob,
    hideConsole,
    renderTokens,
    scheduleItemsRefresh,
    selectedItemIds,
    showToast,
    upsertItemProcessing,
    visibleItemsById,
  ]);

  const revertSelected = useCallback(async () => {
    const normalizedItemIds = normalizeItemIds(selectedItemIds);
    if (!normalizedItemIds.length) return;

    const revertableSelections = [];
    const skippedSelections = [];

    for (const itemId of normalizedItemIds) {
      const item = visibleItemsById.get(itemId);
      if (!item) continue;

      if (!item?._allItems?.canRevertImage) {
        skippedSelections.push(item);
        continue;
      }

      revertableSelections.push(item);
    }

    if (!revertableSelections.length) {
      showToast?.({
        title: 'No revertable items selected',
        message:
          skippedSelections.length > 0
            ? 'Selected items are not currently processed or are already in flight.'
            : 'Select one or more processed items before reverting.',
        variant: 'warning',
        sticky: true,
        onClose: hideConsole,
      });
      return;
    }

    setBusyAction('revert-selected');
    revertableSelections.forEach((item) => {
      const itemId = String(item?._id || '').trim();
      if (!itemId) return;
      upsertItemProcessing(itemId, {
        status: 'processing',
        progressPercent: null,
        message: 'Reverting to original',
      });
    });

    try {
      const results = await Promise.allSettled(
        revertableSelections.map(async (item) => {
          const itemId = String(item?._id || '').trim();
          await setItemActiveVariant(itemId, 'original');
          return { itemId };
        }),
      );

      let successCount = 0;
      const failedMessages = [];

      results.forEach((result, index) => {
        const itemId = String(revertableSelections[index]?._id || '').trim();
        if (!itemId) return;

        if (result.status === 'fulfilled') {
          successCount += 1;
          upsertItemProcessing(itemId, {
            status: 'done',
            progressPercent: 100,
            message: 'Reverted to original',
          });
          return;
        }

        failedMessages.push(String(result.reason?.message || '').trim());
        upsertItemProcessing(itemId, {
          status: 'error',
          progressPercent: null,
          message: String(result.reason?.message || 'Failed to revert image').trim(),
        });
      });

      if (!successCount) {
        throw new Error(
          failedMessages.find(Boolean) || 'Failed to revert selected item images.',
        );
      }

      void onRefreshItems?.();

      if (failedMessages.length || skippedSelections.length) {
        const failedMessage = failedMessages.filter(Boolean).join(' ');
        const skippedMessage = skippedSelections.length
          ? `${skippedSelections.length} skipped because they were not eligible for revert.`
          : '';
        showToast?.({
          title: 'Some selected items were skipped',
          message: [failedMessage, skippedMessage]
            .filter(Boolean)
            .join(' • ') || 'Some selected items could not be reverted.',
          variant: 'warning',
          sticky: true,
          onClose: hideConsole,
        });
      }
    } catch (error) {
      showToast?.({
        title: 'Batch revert failed',
        message: error?.message || 'Failed to revert selected batch items.',
        variant: 'danger',
        sticky: true,
        onClose: hideConsole,
      });
    } finally {
      setBusyAction('');
    }
  }, [
    hideConsole,
    onRefreshItems,
    selectedItemIds,
    showToast,
    upsertItemProcessing,
    visibleItemsById,
  ]);

  const runSelectedAction = useCallback(async () => {
    if (batchActionMode === 'revert') {
      await revertSelected();
      return;
    }
    if (batchActionMode === 'reprocess') {
      await reprocessSelected();
      return;
    }
    await processSelected();
  }, [batchActionMode, processSelected, reprocessSelected, revertSelected]);

  return {
    batchActionMode,
    setBatchActionMode: handleActionModeChange,
    selectedItemIds,
    selectedBatchId: appliedSourceBatchId,
    selectedBatchItems: appliedBatchItems,
    pendingSourceBatchId,
    appliedSourceBatchId,
    sourceBatchOptions,
    appliedBatchSummary,
    applyPendingSourceBatch,
    setPendingSourceBatchId: handlePendingSourceBatchChange,
    selectedBatchLabel,
    selectedBatchCount,
    processingModeEnabled,
    busyAction,
    showConsole,
    hideConsole,
    clearSelection,
    clearSelectionInScope,
    selectAllVisible,
    focusBatch,
    selectBatch,
    toggleItemSelection,
    processSelected: () => {
      void processSelected();
    },
    runSelectedAction: () => {
      void runSelectedAction();
    },
    isItemSelectableForAction: (item) => isSelectableForBatchProcessing(item, batchActionMode),
    itemProcessingById,
    processingSummary,
    trackedProgressSummary,
    isSelectionStepActive,
  };
}
