import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  archiveIntakeBatch,
  fetchIntakeBatchById,
  fetchIntakeBatches,
  importIntakeBatch,
  permanentlyDeleteIntakeBatch,
  processIntakeBatchSelectedItems,
  recreateIntakeBatchLocalFolder,
  renameIntakeBatch,
  updateIntakeBatchDestination,
  uploadIntakeBatchPackage,
  uploadSimpleIntakeBatchJson,
  validateIntakeBatch,
} from '../../api/intakeBatches';
import { DEFAULT_RENDER_TOKENS, normalizeRenderTokens } from '../../constants/renderTokens';
import useBatchImageProcessingConsole from '../../hooks/useBatchImageProcessingConsole.jsx';
import { ToastContext } from '../Toast';
import IntakeBatchCreatePanel from './IntakeBatchCreatePanel';
import IntakeBatchList from './IntakeBatchList';
import IntakeBatchDetailsPanel from './IntakeBatchDetailsPanel';

const Wrap = styled.section`
  display: grid;
  gap: 0.84rem;
  min-width: 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(270px, 0.72fr) minmax(0, 1.28fr);
  gap: 0.84rem;
  align-items: start;
  min-width: 0;
  min-height: 0;

  > * {
    min-width: 0;
  }

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

const Feedback = styled.div`
  border-radius: 10px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'success'
        ? 'rgba(104, 177, 141, 0.6)'
        : $tone === 'error'
          ? 'rgba(206, 114, 114, 0.62)'
          : 'rgba(105, 153, 196, 0.45)'};
  background: ${({ $tone }) =>
    $tone === 'success'
      ? 'rgba(16, 40, 31, 0.85)'
      : $tone === 'error'
        ? 'rgba(56, 18, 20, 0.85)'
        : 'rgba(14, 24, 35, 0.85)'};
  color: ${({ $tone }) =>
    $tone === 'success' ? '#c9f1dd' : $tone === 'error' ? '#f2c8c8' : '#bad2e8'};
  padding: 0.56rem 0.62rem;
  font-size: 0.8rem;
`;

function formatPackageUploadError(error) {
  const baseMessage = String(error?.message || 'Failed to stage intake batch package.').trim();
  const responseBody =
    error?.responseBody && typeof error.responseBody === 'object'
      ? error.responseBody
      : null;
  const details = [];

  if (error?.status && Number(error.status) > 0) {
    details.push(`HTTP ${error.status}`);
  }

  if (Array.isArray(responseBody?.errors) && responseBody.errors.length) {
    details.push(responseBody.errors.slice(0, 2).join(' | '));
  } else if (Array.isArray(responseBody?.warnings) && responseBody.warnings.length) {
    details.push(responseBody.warnings.slice(0, 2).join(' | '));
  } else if (typeof responseBody?.nextStepSuggestion === 'string' && responseBody.nextStepSuggestion.trim()) {
    details.push(responseBody.nextStepSuggestion.trim());
  }

  if (error?.isNetworkError && error?.requestPath) {
    details.push(`request ${error.requestPath}`);
  }

  return [baseMessage, ...details].filter(Boolean).join(' • ');
}

const DEFAULT_IMPORTED_ITEMS_PAGE = Object.freeze({
  itemsLimit: 50,
  itemsOffset: 0,
  itemsSort: 'name',
});

export default function IntakeBatchManager({
  selectedBatchIdOverride = '',
  onSelectedBatchIdChange = null,
  onSelectedBatchIdInvalid = null,
}) {
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const hideToast = toastCtx?.hideToast;
  const showToastRef = useRef(showToast);
  const createPackageInputRef = useRef(null);
  const simpleJsonInputRef = useRef(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(() =>
    String(selectedBatchIdOverride || '').trim()
  );
  const [selectedBatchDetail, setSelectedBatchDetail] = useState(null);
  const [importedItemsPageState, setImportedItemsPageState] = useState(DEFAULT_IMPORTED_ITEMS_PAGE);
  const [processingModeEnabled, setProcessingModeEnabled] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [batchRenderTokens, setBatchRenderTokens] = useState(() =>
    normalizeRenderTokens(DEFAULT_RENDER_TOKENS)
  );
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [createPackageFile, setCreatePackageFile] = useState(null);
  const [simpleJsonFile, setSimpleJsonFile] = useState(null);
  const [feedback, setFeedback] = useState({ tone: 'info', message: '' });
  const refreshTimeoutRef = useRef(null);
  const selectedBatchIdRef = useRef('');
  const detailRequestIdRef = useRef(0);
  const handleProcessSelectedRef = useRef(null);
  const resetTrackedBatchProcessingRef = useRef(() => {});

  const selectedBatchSummary = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchId) || null,
    [batches, selectedBatchId]
  );
  const selectedBatch = useMemo(() => {
    if (!selectedBatchSummary) return null;
    if (selectedBatchDetail?.id === selectedBatchSummary.id) {
      return {
        ...selectedBatchSummary,
        ...selectedBatchDetail,
      };
    }
    return selectedBatchSummary;
  }, [selectedBatchDetail, selectedBatchSummary]);
  const selectedBatchValidationOk =
    selectedBatch?.validationStatus === 'passed' && !selectedBatch?.isArchived;
  const loadedImportedItems = useMemo(
    () => (
      Array.isArray(selectedBatch?.importedItemsPage?.items)
        ? selectedBatch.importedItemsPage.items
        : []
    ),
    [selectedBatch?.importedItemsPage?.items]
  );
  const loadedImportedItemIds = useMemo(
    () => loadedImportedItems
      .map((item) => String(item?.id || '').trim())
      .filter(Boolean),
    [loadedImportedItems]
  );
  const loadedProcessableItemIds = useMemo(
    () => loadedImportedItems
      .filter((item) => item?.processing?.isProcessable)
      .map((item) => String(item?.id || '').trim())
      .filter(Boolean),
    [loadedImportedItems]
  );
  const loadedPageLabel = useMemo(() => {
    if (!loadedImportedItems.length) return 'no loaded items';
    const start = importedItemsPageState.itemsOffset + 1;
    const end = importedItemsPageState.itemsOffset + loadedImportedItems.length;
    return `loaded page ${start}-${end}`;
  }, [importedItemsPageState.itemsOffset, loadedImportedItems.length]);
  const selectedLoadedItemCount = useMemo(
    () => selectedItemIds.filter((itemId) => loadedImportedItemIds.includes(itemId)).length,
    [loadedImportedItemIds, selectedItemIds]
  );

  useEffect(() => {
    selectedBatchIdRef.current = selectedBatchId;
  }, [selectedBatchId]);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    const validIds = new Set(loadedProcessableItemIds);
    setSelectedItemIds((current) => current.filter((itemId) => validIds.has(itemId)));
  }, [loadedProcessableItemIds]);

  const applySelectedBatchId = useCallback((nextBatchId, { notify = true } = {}) => {
    const normalizedBatchId = String(nextBatchId || '').trim();
    const batchChanged = normalizedBatchId !== selectedBatchIdRef.current;
    setSelectedBatchId(normalizedBatchId);
    if (batchChanged) {
      setSelectedBatchDetail(null);
      setImportedItemsPageState(DEFAULT_IMPORTED_ITEMS_PAGE);
      setProcessingModeEnabled(false);
      setSelectedItemIds([]);
      setBatchRenderTokens(normalizeRenderTokens(DEFAULT_RENDER_TOKENS));
      resetTrackedBatchProcessingRef.current?.();
    }
    if (notify) {
      onSelectedBatchIdChange?.(normalizedBatchId);
    }
  }, [onSelectedBatchIdChange]);

  useEffect(() => {
    const normalizedOverride = String(selectedBatchIdOverride || '').trim();
    if (!normalizedOverride || normalizedOverride === selectedBatchIdRef.current) {
      return;
    }
    applySelectedBatchId(normalizedOverride, { notify: false });
  }, [applySelectedBatchId, selectedBatchIdOverride]);

  const refreshBatches = useCallback(async () => {
    setLoading(true);
    try {
      const nextBatches = await fetchIntakeBatches({ includeArchived: true });
      setBatches(nextBatches);
      setFeedback((current) => (
        current?.tone === 'error' && /Backend API unavailable/i.test(String(current?.message || ''))
          ? { tone: 'info', message: '' }
          : current
      ));
      const currentSelectedBatchId = selectedBatchIdRef.current;
      if (!currentSelectedBatchId && nextBatches[0]?.id) {
        applySelectedBatchId(nextBatches[0].id);
      } else if (
        currentSelectedBatchId &&
        !nextBatches.some((batch) => batch.id === currentSelectedBatchId)
      ) {
        applySelectedBatchId(nextBatches[0]?.id || '');
      }
    } catch (error) {
      console.error('[IntakeBatchManager] refreshBatches failed', error);
      setFeedback({
        tone: 'error',
        message: error?.message || 'Failed to load intake batches.',
      });

      if (error?.isNetworkError) {
        if (refreshTimeoutRef.current) {
          window.clearTimeout(refreshTimeoutRef.current);
        }
        refreshTimeoutRef.current = window.setTimeout(() => {
          refreshTimeoutRef.current = null;
          void refreshBatches();
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  }, [applySelectedBatchId]);

  const loadSelectedBatchDetail = useCallback(async (
    batchId,
    {
      silent = false,
      page = importedItemsPageState,
    } = {}
  ) => {
    const normalizedBatchId = String(batchId || '').trim();
    if (!normalizedBatchId) {
      setSelectedBatchDetail(null);
      return null;
    }

    const requestId = detailRequestIdRef.current + 1;
    detailRequestIdRef.current = requestId;
    if (!silent) {
      setDetailLoading(true);
    }

    try {
      const detail = await fetchIntakeBatchById(normalizedBatchId, {
        itemsLimit: page?.itemsLimit,
        itemsOffset: page?.itemsOffset,
        itemsSort: page?.itemsSort,
      });
      if (detailRequestIdRef.current !== requestId) {
        return null;
      }
      setSelectedBatchDetail(detail);
      return detail;
    } catch (error) {
      if (detailRequestIdRef.current === requestId) {
        const isMissingBatch = /batch not found/i.test(String(error?.message || ''));
        const isMalformedRequest = Number(error?.status) === 400;
        setSelectedBatchDetail(null);
        setFeedback({
          tone: 'error',
          message:
            isMalformedRequest
              ? 'Failed to load intake batch detail because the request was malformed.'
              : error?.message || 'Failed to load intake batch detail.',
        });
        toastCtx?.showToast?.({
          title: 'Batch detail unavailable',
          message:
            isMalformedRequest
              ? 'Failed to load intake batch detail because the request URL or parameters were invalid.'
              : error?.message || `Failed to load batch ${normalizedBatchId}.`,
          variant: 'danger',
          sticky: true,
        });
        if (isMissingBatch) {
          const fallbackBatchId = batches[0]?.id || '';
          if (fallbackBatchId && fallbackBatchId !== normalizedBatchId) {
            applySelectedBatchId(fallbackBatchId);
          }
          onSelectedBatchIdInvalid?.(normalizedBatchId);
        }
      }
      return null;
    } finally {
      if (!silent && detailRequestIdRef.current === requestId) {
        setDetailLoading(false);
      }
    }
  }, [applySelectedBatchId, batches, importedItemsPageState, onSelectedBatchIdInvalid, toastCtx]);

  useEffect(() => {
    void refreshBatches();
    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [refreshBatches]);

  useEffect(() => {
    void loadSelectedBatchDetail(selectedBatchId);
  }, [importedItemsPageState, loadSelectedBatchDetail, selectedBatchId]);

  const replaceBatch = useCallback((nextBatch) => {
    setBatches((current) => {
      const existing = current.some((entry) => entry.id === nextBatch.id);
      const next = existing
        ? current.map((entry) => (entry.id === nextBatch.id ? nextBatch : entry))
        : [nextBatch, ...current];
      return [...next].sort((left, right) => {
        const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
        const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
        return rightTime - leftTime;
      });
    });
    applySelectedBatchId(nextBatch.id);
    setSelectedBatchDetail((current) => (
      current?.id === nextBatch.id
        ? { ...current, ...nextBatch }
        : current
    ));
  }, [applySelectedBatchId]);

  const handleImportedItemsSortChange = useCallback((nextSort) => {
    setImportedItemsPageState((current) => ({
      ...current,
      itemsOffset: 0,
      itemsSort: String(nextSort || '').trim() || 'name',
    }));
  }, []);

  const handleImportedItemsPageChange = useCallback((nextOffset) => {
    setImportedItemsPageState((current) => ({
      ...current,
      itemsOffset: Math.max(0, Number(nextOffset) || 0),
    }));
  }, []);

  const handleToggleProcessingMode = useCallback(() => {
    setProcessingModeEnabled((current) => !current);
  }, []);

  const handleSelectionChange = useCallback((nextSelection) => {
    const validIds = new Set(loadedProcessableItemIds);
    setSelectedItemIds(
      Array.isArray(nextSelection)
        ? nextSelection
            .map((entry) => String(entry || '').trim())
            .filter((entry) => entry && validIds.has(entry))
        : []
    );
  }, [loadedProcessableItemIds]);

  const handleBatchRenderTokenChange = useCallback((field, value) => {
    setBatchRenderTokens((current) => normalizeRenderTokens({
      ...current,
      [field]: value,
    }));
  }, []);

  const handleSelectAllLoaded = useCallback(() => {
    setSelectedItemIds(loadedProcessableItemIds);
  }, [loadedProcessableItemIds]);

  const handleSelectNoneLoaded = useCallback(() => {
    setSelectedItemIds([]);
  }, []);

  const handleSelectUnprocessedLoaded = useCallback(() => {
    setSelectedItemIds(
      loadedImportedItems
        .filter((item) => item?.processing?.isProcessable)
        .map((item) => item.id)
    );
  }, [loadedImportedItems]);

  const handleSelectFailedLoaded = useCallback(() => {
    setSelectedItemIds(
      loadedImportedItems
        .filter((item) => item?.processing?.status === 'failed')
        .map((item) => item.id)
    );
  }, [loadedImportedItems]);

  const {
    trackedJobByMediaId,
    trackedProgressSummary: trackedBatchProgressSummary,
    beginTrackedRun,
    resetTracking: resetTrackedBatchProcessing,
    renderConsoleContent,
  } = useBatchImageProcessingConsole({
    contextId: selectedBatch?.id || '',
    contextLabel: selectedBatch?.name || 'Batch processing',
    processingModeEnabled,
    setProcessingModeEnabled,
    renderTokens: batchRenderTokens,
    busyAction,
    selectedCount: selectedLoadedItemCount,
    pageLabel: loadedPageLabel,
    failedSelectableCount: loadedImportedItems.filter((item) => item?.processing?.status === 'failed').length,
    selectionScopeMessage: 'Selection and processing controls apply only to the currently loaded ledger page.',
    processingModeOffMessage: 'Processing mode is off. This view is in archival review mode.',
    selectAllLabel: 'Select All Loaded',
    selectUnprocessedLabel: 'Select Unprocessed',
    showFailedSelector: true,
    onSelectAllLoaded: handleSelectAllLoaded,
    onSelectNoneLoaded: handleSelectNoneLoaded,
    onSelectUnprocessedLoaded: handleSelectUnprocessedLoaded,
    onSelectFailedLoaded: handleSelectFailedLoaded,
    onProcessSelected: () => {
      void handleProcessSelectedRef.current?.(selectedItemIds);
    },
    onRenderTokenChange: handleBatchRenderTokenChange,
    showToast,
    hideToast,
    onRefreshStatus:
      selectedBatch?.id
        ? () => loadSelectedBatchDetail(selectedBatch.id, { silent: true })
        : null,
  });

  useEffect(() => {
    resetTrackedBatchProcessingRef.current = resetTrackedBatchProcessing;
  }, [resetTrackedBatchProcessing]);

  const handleUploadPackage = async () => {
    if (!createPackageFile) return;
    setBusyAction('upload-package');
    setFeedback({ tone: 'info', message: '' });
    showToastRef.current?.({
      title: 'Staging batch package',
      message: `${createPackageFile.name}...`,
      variant: 'info',
      loading: true,
    });
    try {
      const result = await uploadIntakeBatchPackage(createPackageFile);
      const batch = result.batch;
      if (!batch) {
        throw new Error('Package staging did not return a batch record.');
      }
      replaceBatch(batch);
      setCreatePackageFile(null);
      if (createPackageInputRef.current) {
        createPackageInputRef.current.value = '';
      }
      setFeedback({
        tone: 'success',
        message: result.nextStepSuggestion || `Staged package ${batch.name}.`,
      });
      showToastRef.current?.({
        title: 'Batch package staged',
        message: result.nextStepSuggestion || `${batch.name} is ready for validation.`,
        variant: 'success',
      });
    } catch (error) {
      const formattedError = formatPackageUploadError(error);
      setFeedback({
        tone: 'error',
        message: formattedError,
      });
      showToastRef.current?.({
        title: 'Batch package staging failed',
        message: formattedError,
        variant: 'danger',
        sticky: true,
      });
    } finally {
      setBusyAction('');
    }
  };

  const handleUploadSimpleJson = async () => {
    if (!simpleJsonFile) return;
    setBusyAction('upload-simple-json');
    setFeedback({ tone: 'info', message: '' });
    showToastRef.current?.({
      title: 'Staging simple JSON',
      message: `${simpleJsonFile.name}...`,
      variant: 'info',
      loading: true,
    });
    try {
      const result = await uploadSimpleIntakeBatchJson(simpleJsonFile);
      const batch = result.batch;
      if (!batch) {
        throw new Error('Simple JSON staging did not return a batch record.');
      }
      replaceBatch(batch);
      setSimpleJsonFile(null);
      if (simpleJsonInputRef.current) {
        simpleJsonInputRef.current.value = '';
      }
      setFeedback({
        tone: 'success',
        message: result.nextStepSuggestion || `Staged simple JSON ${batch.name}.`,
      });
      showToastRef.current?.({
        title: 'Simple JSON staged',
        message: result.nextStepSuggestion || `${batch.name} is ready for validation.`,
        variant: 'success',
      });
    } catch (error) {
      const formattedError = formatPackageUploadError(error);
      setFeedback({
        tone: 'error',
        message: formattedError,
      });
      showToastRef.current?.({
        title: 'Simple JSON staging failed',
        message: formattedError,
        variant: 'danger',
        sticky: true,
      });
    } finally {
      setBusyAction('');
    }
  };

  const handleValidate = async () => {
    if (!selectedBatch) return;
    setBusyAction('validate');
    setFeedback({ tone: 'info', message: '' });
    showToastRef.current?.({
      title: 'Validating batch',
      message: `${selectedBatch.name}...`,
      variant: 'info',
      loading: true,
    });
    try {
      const result = await validateIntakeBatch(selectedBatch.id);
      replaceBatch(result.batch);
      await loadSelectedBatchDetail(result.batch.id, { silent: true });
      const rowCount = Number(result.batch?.validationSnapshot?.rowCount) || 0;
      const errorCount = Number(result.batch?.validationSnapshot?.errorCount) || 0;
      setFeedback({
        tone: result.batch?.validationStatus === 'passed' ? 'success' : 'error',
        message: result.batch?.validationStatus === 'passed'
          ? `Validation passed for ${result.batch.name}.`
          : `Validation failed for ${result.batch.name}.`,
      });
      showToastRef.current?.({
        title: result.batch?.validationStatus === 'passed' ? 'Validation passed' : 'Validation failed',
        message:
          result.batch?.validationStatus === 'passed'
            ? `${rowCount} row${rowCount === 1 ? '' : 's'}, ${errorCount} error${errorCount === 1 ? '' : 's'}.`
            : `${errorCount} error${errorCount === 1 ? '' : 's'}.`,
        variant: result.batch?.validationStatus === 'passed' ? 'success' : 'danger',
        sticky: result.batch?.validationStatus !== 'passed',
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error?.message || 'Failed to validate intake batch.',
      });
      showToastRef.current?.({
        title: 'Validation failed',
        message: error?.message || 'Failed to validate intake batch.',
        variant: 'danger',
        sticky: true,
      });
    } finally {
      setBusyAction('');
    }
  };

  const handleImport = async () => {
    if (!selectedBatch) return;
    setBusyAction('import');
    setFeedback({ tone: 'info', message: '' });
    showToastRef.current?.({
      title: 'Importing batch',
      message: `${selectedBatch.name}...`,
      variant: 'info',
      loading: true,
    });
    try {
      const result = await importIntakeBatch(selectedBatch.id);
      replaceBatch(result.batch);
      await loadSelectedBatchDetail(result.batch.id, { silent: true });
      const createdCount = Number(result.batch?.importSnapshot?.createdItemCount) || 0;
      const updatedCount = Number(result.batch?.importSnapshot?.updatedItemCount) || 0;
      const skippedCount = Number(result.batch?.importSnapshot?.skippedItemCount) || 0;
      const failedCount = Number(result.batch?.importSnapshot?.failedItemCount) || 0;
      setFeedback({
        tone: result.batch?.importLifecycleStatus === 'success' ? 'success' : 'error',
        message:
          result.batch?.importLifecycleStatus === 'success'
            ? `Import complete for ${result.batch.name}.`
            : `Import failed for ${result.batch.name}.`,
      });
      showToastRef.current?.({
        title: result.batch?.importLifecycleStatus === 'success' ? 'Import complete' : 'Import failed',
        message:
          result.batch?.importLifecycleStatus === 'success'
            ? `${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped, ${failedCount} failed.`
            : `${failedCount} failed. See import details.`,
        variant: result.batch?.importLifecycleStatus === 'success' ? 'success' : 'danger',
        sticky: result.batch?.importLifecycleStatus !== 'success',
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error?.message || 'Failed to import intake batch.',
      });
      toastCtx?.showToast?.({
        title: 'Import failed',
        message: error?.message || 'Failed to import intake batch.',
        variant: 'danger',
        sticky: true,
      });
    } finally {
      setBusyAction('');
    }
  };

  const handleApplyDestination = async ({ location = null, box = null } = {}) => {
    if (!selectedBatch) return;
    setBusyAction('destination');
    setFeedback({ tone: 'info', message: '' });
    showToastRef.current?.({
      title: 'Updating batch destination',
      message: `${selectedBatch.name}...`,
      variant: 'info',
      loading: true,
    });
    try {
      const batch = await updateIntakeBatchDestination(selectedBatch.id, { location, box });
      replaceBatch(batch);
      await loadSelectedBatchDetail(batch.id, { silent: true });
      const destinationLabel = [
        batch.destinationDefaults?.location ? `location ${batch.destinationDefaults.location}` : 'unknown location',
        batch.destinationDefaults?.box ? `box ${batch.destinationDefaults.box}` : 'orphaned',
      ].join(' · ');
      setFeedback({
        tone: 'success',
        message: `Destination reviewed for ${batch.name}: ${destinationLabel}.`,
      });
      showToastRef.current?.({
        title: 'Destination reviewed',
        message: destinationLabel,
        variant: 'success',
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error?.message || 'Failed to update intake batch destination.',
      });
      showToastRef.current?.({
        title: 'Destination update failed',
        message: error?.message || 'Failed to update intake batch destination.',
        variant: 'danger',
        sticky: true,
      });
    } finally {
      setBusyAction('');
    }
  };

  const handleRenameBatch = async (name) => {
    if (!selectedBatch) return null;
    setBusyAction('rename');
    setFeedback({ tone: 'info', message: '' });
    showToastRef.current?.({
      title: 'Renaming batch',
      message: `${selectedBatch.name}...`,
      variant: 'info',
      loading: true,
    });
    try {
      const batch = await renameIntakeBatch(selectedBatch.id, name);
      replaceBatch(batch);
      await loadSelectedBatchDetail(batch.id, { silent: true });
      setFeedback({
        tone: 'success',
        message: `Renamed batch to ${batch.name}.`,
      });
      showToastRef.current?.({
        title: 'Batch renamed',
        message: batch.name,
        variant: 'success',
      });
      return batch;
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error?.message || 'Failed to rename intake batch.',
      });
      showToastRef.current?.({
        title: 'Rename failed',
        message: error?.message || 'Failed to rename intake batch.',
        variant: 'danger',
        sticky: true,
      });
      throw error;
    } finally {
      setBusyAction('');
    }
  };

  const handleArchive = async () => {
    if (!selectedBatch) return;
    const confirmed = window.confirm(
      `Archive intake batch "${selectedBatch.name}"? This keeps the provenance record but removes the active source-file workspace.`
    );
    if (!confirmed) return;

    setBusyAction('archive');
    setFeedback({ tone: 'info', message: '' });
    showToastRef.current?.({
      title: 'Archiving batch',
      message: `${selectedBatch.name}...`,
      variant: 'info',
      loading: true,
    });
    try {
      const result = await archiveIntakeBatch(selectedBatch.id);
      if (result?.batch) {
        replaceBatch(result.batch);
        await loadSelectedBatchDetail(result.batch.id, { silent: true });
      }
      setFeedback({
        tone: 'success',
        message: `Archived batch ${selectedBatch.name}.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error?.message || 'Failed to archive intake batch.',
      });
    } finally {
      setBusyAction('');
    }
  };

  const handlePermanentDelete = async () => {
    if (!selectedBatch) return;
    const confirmed = window.confirm(
      `Permanently delete intake batch "${selectedBatch.name}"?\n\nThis removes the batch record, deletes any items linked to this batch, deletes those item images, and cannot be undone.`
    );
    if (!confirmed) return;

    setBusyAction('delete-permanent');
    setFeedback({ tone: 'info', message: '' });
    showToastRef.current?.({
      title: 'Deleting batch',
      message: `${selectedBatch.name} and its imported items...`,
      variant: 'warning',
      loading: true,
      sticky: true,
    });
    try {
      const result = await permanentlyDeleteIntakeBatch(selectedBatch.id);
      let nextSelectedBatchId = '';
      setBatches((current) => {
        const remaining = current.filter((entry) => entry.id !== selectedBatch.id);
        nextSelectedBatchId = remaining[0]?.id || '';
        return remaining;
      });
      applySelectedBatchId(nextSelectedBatchId);
      setSelectedBatchDetail(null);
      setFeedback({
        tone: 'success',
        message: `Deleted batch ${result.batchName || selectedBatch.name}. Removed ${result.deletedItemCount} item(s) and ${result.deletedMediaFileCount} media file(s).`,
      });
      showToastRef.current?.({
        title: 'Batch permanently deleted',
        message: `${result.deletedItemCount} item(s) removed • ${result.deletedMediaFileCount} media file(s) deleted.`,
        variant: 'warning',
        sticky: true,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error?.message || 'Failed to permanently delete intake batch.',
      });
      showToastRef.current?.({
        title: 'Batch delete failed',
        message: error?.message || 'Failed to permanently delete intake batch.',
        variant: 'danger',
        sticky: true,
      });
    } finally {
      setBusyAction('');
    }
  };

  const handleRecreateLocalFolder = async () => {
    if (!selectedBatch) return;
    setBusyAction('recreate-local-folder');
    setFeedback({ tone: 'info', message: '' });
    showToastRef.current?.({
      title: 'Recreating local staging folder',
      message: `${selectedBatch.name}...`,
      variant: 'info',
      loading: true,
    });
    try {
      const result = await recreateIntakeBatchLocalFolder(selectedBatch.id);
      replaceBatch(result.batch);
      await loadSelectedBatchDetail(result.batch.id, { silent: true });
      setFeedback({
        tone: 'success',
        message: `Recreated local staging folder for ${result.batch.name}.`,
      });
      showToastRef.current?.({
        title: 'Local staging folder recreated',
        message: `${result.batch.localFolderName || result.batch.batchId} is available again for asset updates.`,
        variant: 'success',
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error?.message || 'Failed to recreate local staging folder.',
      });
    } finally {
      setBusyAction('');
    }
  };

  const handleProcessSelected = useCallback(async (itemIds = []) => {
    if (!selectedBatch) return;
    const normalizedItemIds = Array.isArray(itemIds)
      ? itemIds.map((entry) => String(entry || '').trim()).filter(Boolean)
      : [];
    if (!normalizedItemIds.length) return;

    setBusyAction('process-selected');
    setFeedback({ tone: 'info', message: '' });
      showToastRef.current?.({
        title: 'Queueing batch processing',
        message: `${selectedBatch.name}: ${normalizedItemIds.length} selected item${normalizedItemIds.length === 1 ? '' : 's'}.`,
        variant: 'info',
        sticky: true,
        loading: true,
        content: renderConsoleContent({
          onProcessSelectedOverride: () => {
            void handleProcessSelected(normalizedItemIds);
          },
        }),
      });

    try {
      const result = await processIntakeBatchSelectedItems(selectedBatch.id, normalizedItemIds, {
        renderTokens: batchRenderTokens,
      });
      replaceBatch(result.batch);
      await loadSelectedBatchDetail(result.batch?.id || selectedBatch.id, {
        silent: true,
      });

      const request = result.processingRequest || {};
      const queuedCount = Number(request.queuedCount) || 0;
      const skippedAlreadyProcessedCount = Number(request.skippedAlreadyProcessedCount) || 0;
      const skippedMissingOriginalCount = Number(request.skippedMissingOriginalCount) || 0;
      const skippedInFlightCount = Number(request.skippedInFlightCount) || 0;
      const failedCount = Number(request.failedCount) || 0;
      const requestJobIds = Array.isArray(request.jobIds) ? request.jobIds : [];

      beginTrackedRun({
        jobIds: requestJobIds,
        expectedCount: requestJobIds.length,
      });

      const parts = [];
      if (queuedCount > 0) parts.push(`Queued ${queuedCount}`);
      if (skippedAlreadyProcessedCount > 0) {
        parts.push(`skipped ${skippedAlreadyProcessedCount} already processed`);
      }
      if (skippedInFlightCount > 0) {
        parts.push(`left ${skippedInFlightCount} already in progress`);
      }
      if (skippedMissingOriginalCount > 0) {
        parts.push(`${skippedMissingOriginalCount} unavailable`);
      }
      if (failedCount > 0) {
        parts.push(`${failedCount} failed to queue`);
      }

      setFeedback({
        tone: queuedCount > 0 ? 'success' : 'info',
        message: parts.length
          ? `${selectedBatch.name}: ${parts.join(' · ')}.`
          : `No new items were queued for ${selectedBatch.name}.`,
      });

      showToastRef.current?.({
        title: queuedCount > 0 ? 'Batch processing queued' : 'No items queued',
        message: parts.length
          ? parts.join(' • ')
          : 'Selected items were already processed, unavailable, or already in progress.',
        variant: failedCount > 0 ? 'warning' : queuedCount > 0 ? 'success' : 'info',
        sticky: failedCount > 0 || queuedCount > 0,
        content: renderConsoleContent({
          onProcessSelectedOverride: () => {
            void handleProcessSelected(normalizedItemIds);
          },
        }),
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error?.message || 'Failed to queue selected batch items for processing.',
      });
      showToastRef.current?.({
        title: 'Batch processing start failed',
        message: error?.message || 'Failed to queue selected batch items for processing.',
        variant: 'danger',
        sticky: true,
      });
    } finally {
      setBusyAction('');
    }
  }, [
    batchRenderTokens,
    beginTrackedRun,
    loadSelectedBatchDetail,
    replaceBatch,
    renderConsoleContent,
    selectedBatch,
  ]);

  useEffect(() => {
    handleProcessSelectedRef.current = (itemIds) => {
      void handleProcessSelected(itemIds);
    };
  }, [handleProcessSelected]);

  return (
    <Wrap>
      <IntakeBatchCreatePanel
        packageFile={createPackageFile}
        packageInputRef={createPackageInputRef}
        onPackageFileChange={(event) => setCreatePackageFile(event.target.files?.[0] || null)}
        onUploadPackage={handleUploadPackage}
        simpleJsonFile={simpleJsonFile}
        simpleJsonInputRef={simpleJsonInputRef}
        onSimpleJsonFileChange={(event) => setSimpleJsonFile(event.target.files?.[0] || null)}
        onUploadSimpleJson={handleUploadSimpleJson}
        onRefresh={() => void refreshBatches()}
        busyAction={busyAction}
        loading={loading}
      />

      <Grid>
        <IntakeBatchList
          batches={batches}
          selectedBatchId={selectedBatchId}
          onSelect={applySelectedBatchId}
        />

        <IntakeBatchDetailsPanel
          selectedBatch={selectedBatch}
          selectedBatchValidationOk={selectedBatchValidationOk}
          importedItemsPageState={importedItemsPageState}
          processingModeEnabled={processingModeEnabled}
          selectedItemIds={selectedItemIds}
          liveBatchJobSummary={trackedBatchProgressSummary}
          liveJobProgressByMediaId={trackedJobByMediaId}
          detailLoading={detailLoading}
          onValidate={handleValidate}
          onImport={handleImport}
          onRenameBatch={handleRenameBatch}
          onApplyDestination={handleApplyDestination}
          onToggleProcessingMode={handleToggleProcessingMode}
          onSelectedItemIdsChange={handleSelectionChange}
          onImportedItemsPageChange={handleImportedItemsPageChange}
          onImportedItemsSortChange={handleImportedItemsSortChange}
          onRecreateLocalFolder={handleRecreateLocalFolder}
          onDeletePermanently={handlePermanentDelete}
          onDelete={handleArchive}
          busyAction={busyAction}
        />
      </Grid>

      {feedback.message ? <Feedback $tone={feedback.tone}>{feedback.message}</Feedback> : null}
    </Wrap>
  );
}
