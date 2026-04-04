import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ToastContext } from '../Toast';
import { enqueueItemImageProcessing } from '../../api/itemMedia';
import {
  DEFAULT_RENDER_TOKENS,
  normalizeRenderTokens,
} from '../../constants/renderTokens';
import useBatchImageProcessingConsole from '../../hooks/useBatchImageProcessingConsole.jsx';

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

function isSelectableForBatchProcessing(item) {
  return Boolean(item?._allItems?.isBatchProcessable);
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
  const selectedBatchIdRef = useRef('');
  const selectedItemIdsRef = useRef([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [processingModeEnabled, setProcessingModeEnabled] = useState(false);
  const [busyAction, setBusyAction] = useState('');
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

  const selectedBatchItems = useMemo(
    () => visibleItemsByBatch.get(selectedBatchId) || [],
    [selectedBatchId, visibleItemsByBatch],
  );
  const visibleItemsById = useMemo(() => {
    const next = new Map();

    for (const item of Array.isArray(visibleItems) ? visibleItems : []) {
      const itemId = String(item?._id || '').trim();
      if (!itemId) continue;
      next.set(itemId, item);
    }

    return next;
  }, [visibleItems]);

  useEffect(() => {
    selectedBatchIdRef.current = selectedBatchId;
  }, [selectedBatchId]);

  useEffect(() => {
    selectedItemIdsRef.current = selectedItemIds;
  }, [selectedItemIds]);

  const selectedBatchLabel = useMemo(() => {
    const first = selectedBatchItems[0]?._allItems;
    if (!first) return '';
    return String(first.sourceBatchLabel || first.sourceBatchId || '').trim();
  }, [selectedBatchItems]);

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
    setSelectedBatchId('');
    setProcessingModeEnabled(false);
    setBusyAction('');
    stickyConsoleOpenRef.current = false;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const visibleIds = new Set(
      visibleItems.map((item) => String(item?._id || '').trim()).filter(Boolean),
    );
    const nextSelectedIds = normalizeItemIds(
      selectedItemIds.filter((itemId) => {
        if (!visibleIds.has(itemId)) return false;
        const item = visibleItems.find((entry) => String(entry?._id || '').trim() === itemId);
        return isSelectableForBatchProcessing(item);
      }),
    );

    if (nextSelectedIds.join('|') !== normalizeItemIds(selectedItemIds).join('|')) {
      setSelectedItemIds(nextSelectedIds);
    }

    if (selectedBatchId && !visibleItemsByBatch.has(selectedBatchId)) {
      setSelectedBatchId('');
      setSelectedItemIds([]);
    }
  }, [enabled, selectedBatchId, selectedItemIds, visibleItems, visibleItemsByBatch]);

  const clearSelection = useCallback(() => {
    setSelectedBatchId('');
    setSelectedItemIds([]);
  }, []);

  const selectAllVisible = useCallback(() => {
    const allVisibleIds = normalizeItemIds(
      visibleItems
        .filter((item) => isSelectableForBatchProcessing(item))
        .map((item) => String(item?._id || '').trim()),
    );
    setSelectedBatchId('');
    setSelectedItemIds(allVisibleIds);
  }, [visibleItems]);

  const focusBatch = useCallback((batchId) => {
    const normalizedBatchId = String(batchId || '').trim();
    if (!normalizedBatchId) {
      clearSelection();
      return;
    }

    const batchItems = visibleItemsByBatch.get(normalizedBatchId) || [];
    const batchItemIds = new Set(
      batchItems.map((item) => String(item?._id || '').trim()).filter(Boolean),
    );

    setSelectedBatchId(normalizedBatchId);
    setSelectedItemIds((currentSelectedIds) =>
      normalizeItemIds(currentSelectedIds.filter((itemId) => batchItemIds.has(itemId))),
    );
  }, [clearSelection, visibleItemsByBatch]);

  const selectBatch = useCallback((batchId) => {
    const normalizedBatchId = String(batchId || '').trim();
    if (!normalizedBatchId) {
      clearSelection();
      return;
    }

    const batchItemIds = normalizeItemIds(
      (visibleItemsByBatch.get(normalizedBatchId) || [])
        .filter((item) => isSelectableForBatchProcessing(item))
        .map((item) => String(item?._id || '').trim()),
    );
    const currentSelectedIds = normalizeItemIds(selectedItemIdsRef.current);
    const isFullySelected =
      batchItemIds.length > 0 &&
      batchItemIds.every((itemId) => currentSelectedIds.includes(itemId));

    if (isFullySelected) {
      setSelectedItemIds(
        currentSelectedIds.filter((itemId) => !batchItemIds.includes(itemId)),
      );
      if (selectedBatchIdRef.current === normalizedBatchId) {
        setSelectedBatchId('');
      }
      return;
    }

    setSelectedBatchId(normalizedBatchId);
    setSelectedItemIds(normalizeItemIds([...currentSelectedIds, ...batchItemIds]));
  }, [clearSelection, visibleItemsByBatch]);

  const toggleItemSelection = useCallback((item) => {
    const itemId = String(item?._id || '').trim();
    const batchId = String(item?._allItems?.sourceBatchId || '').trim();
    if (!itemId || !batchId || !isSelectableForBatchProcessing(item)) return;

    setSelectedBatchId(batchId);
    setSelectedItemIds((currentSelectedIds) => {
      const baseSelectedIds = normalizeItemIds(currentSelectedIds);
      const nextSelectedIds = baseSelectedIds.includes(itemId)
        ? baseSelectedIds.filter((entry) => entry !== itemId)
        : [...baseSelectedIds, itemId];
      return normalizeItemIds(nextSelectedIds);
    });
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
    selectAllLabel: 'Select All Visible',
    selectNoneLabel: 'Select None Visible',
    showSelectUnprocessed: false,
    showFailedSelector: false,
    onSelectAllLoaded: selectAllVisible,
    onSelectNoneLoaded: clearSelection,
    onSelectUnprocessedLoaded: null,
    onProcessSelected: () => {
      void processSelected();
    },
    onRenderTokenChange: setRenderTokens,
    showToast,
    hideToast,
    onRefreshStatus: onRefreshItems,
    onJobsCompleted: () => {
      void onRefreshItems?.();
    },
  });

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

      if (!item?._allItems?.isBatchProcessable) {
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

    try {
      const results = await Promise.allSettled(
        processableSelections.map((item) =>
          enqueueItemImageProcessing(item?._id, { renderTokens }),
        ),
      );

      const successfulResults = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);
      const failedResults = results
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason);

      if (!successfulResults.length) {
        throw failedResults[0] || new Error('Failed to queue selected batch items for processing.');
      }

      const queuedCount = successfulResults.reduce((sum, result) => {
        return sum + (result?.jobId ? 1 : 0);
      }, 0);
      const jobIds = successfulResults
        .map((result) => String(result?.jobId || '').trim())
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
    hideConsole,
    renderTokens,
    selectedItemIds,
    visibleItemsById,
    showToast,
  ]);

  return {
    selectedItemIds,
    selectedBatchId,
    selectedBatchItems,
    selectedBatchLabel,
    selectedBatchCount,
    processingModeEnabled,
    busyAction,
    showConsole,
    hideConsole,
    clearSelection,
    selectAllVisible,
    focusBatch,
    selectBatch,
    toggleItemSelection,
    trackedProgressSummary: batchConsole.trackedProgressSummary,
  };
}
