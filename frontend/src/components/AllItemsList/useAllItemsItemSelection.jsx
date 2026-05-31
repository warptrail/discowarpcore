import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../../api/API_BASE';
import { addItemsToBox } from '../../api/boxedItems';
import { ToastContext } from '../Toast';

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

function getItemId(item) {
  return String(item?._id || '').trim();
}

function isSelectableItem(item) {
  const meta = item?._allItems || {};
  return Boolean(getItemId(item)) && !meta.isGone;
}

function normalizeDestination(destination) {
  const destBoxId = String(destination?.destBoxId || '').trim();
  if (!destBoxId) return null;

  return {
    destBoxId,
    destLabel: String(destination?.destLabel || '').trim(),
    destShortId: String(destination?.destShortId || '').trim(),
  };
}

export default function useAllItemsItemSelection({
  enabled = false,
  visibleItems = [],
  onRefreshItems = null,
  onExit = null,
}) {
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [pendingSourceBatchId, setPendingSourceBatchId] = useState('');
  const [destination, setDestination] = useState(null);
  const [destinationPickerOpen, setDestinationPickerOpen] = useState(false);
  const [moving, setMoving] = useState(false);

  const selectableItems = useMemo(
    () => (Array.isArray(visibleItems) ? visibleItems.filter(isSelectableItem) : []),
    [visibleItems],
  );

  const visibleItemsById = useMemo(() => {
    const next = new Map();
    for (const item of Array.isArray(visibleItems) ? visibleItems : []) {
      const itemId = getItemId(item);
      if (!itemId) continue;
      next.set(itemId, item);
    }
    return next;
  }, [visibleItems]);

  const selectableItemIds = useMemo(
    () => normalizeItemIds(selectableItems.map(getItemId)),
    [selectableItems],
  );

  const selectableItemIdsByBatch = useMemo(() => {
    const next = new Map();

    for (const item of selectableItems) {
      const batchId = String(item?._allItems?.sourceBatchId || '').trim();
      const itemId = getItemId(item);
      if (!batchId || !itemId) continue;
      const current = next.get(batchId) || [];
      current.push(itemId);
      next.set(batchId, current);
    }

    return next;
  }, [selectableItems]);

  const sourceBatchOptions = useMemo(() => {
    const lookup = new Map();

    for (const item of Array.isArray(visibleItems) ? visibleItems : []) {
      const meta = item?._allItems || {};
      const batchId = String(meta.sourceBatchId || '').trim();
      if (!batchId) continue;

      const current = lookup.get(batchId) || {
        value: batchId,
        label: String(meta.sourceBatchLabel || batchId).trim() || batchId,
        archiveStatus: String(meta.sourceBatchArchiveStatus || '').trim().toLowerCase(),
        totalCount: 0,
        selectableCount: 0,
      };

      current.totalCount += 1;
      if (isSelectableItem(item)) current.selectableCount += 1;
      lookup.set(batchId, current);
    }

    return [...lookup.values()].sort((left, right) =>
      String(left.label || '').localeCompare(String(right.label || ''), undefined, {
        sensitivity: 'base',
        numeric: true,
      }),
    );
  }, [visibleItems]);

  useEffect(() => {
    if (enabled) return;
    setSelectedItemIds([]);
    setPendingSourceBatchId('');
    setDestination(null);
    setDestinationPickerOpen(false);
    setMoving(false);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const selectableIds = new Set(selectableItemIds);
    setSelectedItemIds((current) =>
      normalizeItemIds(current).filter((itemId) => selectableIds.has(itemId)),
    );

    if (pendingSourceBatchId && !selectableItemIdsByBatch.has(pendingSourceBatchId)) {
      setPendingSourceBatchId('');
    }
  }, [enabled, pendingSourceBatchId, selectableItemIds, selectableItemIdsByBatch]);

  const clearSelection = useCallback(() => {
    setSelectedItemIds([]);
    setPendingSourceBatchId('');
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedItemIds(selectableItemIds);
  }, [selectableItemIds]);

  const selectSourceBatch = useCallback((batchId = pendingSourceBatchId) => {
    const normalizedBatchId = String(batchId || '').trim();
    if (!normalizedBatchId) return;
    setPendingSourceBatchId(normalizedBatchId);
    setSelectedItemIds(selectableItemIdsByBatch.get(normalizedBatchId) || []);
  }, [pendingSourceBatchId, selectableItemIdsByBatch]);

  const toggleItemSelection = useCallback((item) => {
    if (!isSelectableItem(item)) return;
    const itemId = getItemId(item);
    if (!itemId) return;

    setSelectedItemIds((current) => {
      const normalized = normalizeItemIds(current);
      return normalized.includes(itemId)
        ? normalized.filter((entry) => entry !== itemId)
        : [...normalized, itemId];
    });
  }, []);

  const handleDestinationSelected = useCallback((nextDestination) => {
    const normalized = normalizeDestination(nextDestination);
    if (!normalized) return;
    setDestination(normalized);
    setDestinationPickerOpen(false);
  }, []);

  const moveSelectedItems = useCallback(async () => {
    const normalizedItemIds = normalizeItemIds(selectedItemIds).filter((itemId) => {
      const item = visibleItemsById.get(itemId);
      return isSelectableItem(item);
    });
    const normalizedDestination = normalizeDestination(destination);

    if (!normalizedItemIds.length) {
      showToast?.({
        variant: 'warning',
        title: 'No items selected',
        message: 'Select one or more active items before moving.',
        timeoutMs: 3600,
      });
      return;
    }

    if (!normalizedDestination) {
      showToast?.({
        variant: 'warning',
        title: 'Destination required',
        message: 'Choose a destination box before moving selected items.',
        timeoutMs: 3600,
      });
      setDestinationPickerOpen(true);
      return;
    }

    try {
      setMoving(true);
      const result = await addItemsToBox({
        itemIds: normalizedItemIds,
        destBoxId: normalizedDestination.destBoxId,
        baseUrl: API_BASE,
      });
      await onRefreshItems?.();
      setSelectedItemIds([]);
      setPendingSourceBatchId('');

      const attachedCount = Number(result?.attachedCount || result?.attached || normalizedItemIds.length);
      showToast?.({
        variant: 'success',
        title: 'Items moved',
        message: `Moved ${attachedCount} item${attachedCount === 1 ? '' : 's'} to ${
          normalizedDestination.destLabel ||
          (normalizedDestination.destShortId
            ? `Box #${normalizedDestination.destShortId}`
            : 'the selected box')
        }.`,
        timeoutMs: 4200,
      });
    } catch (error) {
      showToast?.({
        variant: 'danger',
        title: 'Move failed',
        message: error?.message || 'Could not move selected items.',
        timeoutMs: 5200,
      });
    } finally {
      setMoving(false);
    }
  }, [destination, onRefreshItems, selectedItemIds, showToast, visibleItemsById]);

  const exitSelectionMode = useCallback(() => {
    clearSelection();
    setDestination(null);
    setDestinationPickerOpen(false);
    onExit?.();
  }, [clearSelection, onExit]);

  return {
    selectedItemIds,
    selectedCount: selectedItemIds.length,
    selectableCount: selectableItemIds.length,
    pendingSourceBatchId,
    sourceBatchOptions,
    destination,
    destinationPickerOpen,
    moving,
    clearSelection,
    selectAllVisible,
    selectSourceBatch,
    toggleItemSelection,
    setPendingSourceBatchId,
    setDestinationPickerOpen,
    handleDestinationSelected,
    moveSelectedItems,
    exitSelectionMode,
  };
}
