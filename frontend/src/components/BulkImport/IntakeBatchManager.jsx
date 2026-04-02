import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  createIntakeBatch,
  deleteIntakeBatch,
  fetchIntakeBatches,
  importIntakeBatch,
  stageIntakeBatch,
  updateIntakeBatchAssets,
  validateIntakeBatch,
} from '../../api/intakeBatches';
import {
  fetchBatchImportReadySummary,
  processBatchImportReadyImages,
} from '../../api/bulkImport';
import { ToastContext } from '../Toast';
import IntakeBatchCreatePanel from './IntakeBatchCreatePanel';
import IntakeBatchList from './IntakeBatchList';
import IntakeBatchDetailsPanel from './IntakeBatchDetailsPanel';

const Wrap = styled.section`
  display: grid;
  gap: 0.84rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(270px, 0.72fr) minmax(0, 1.28fr);
  gap: 0.84rem;

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

function summarizeAssetSelection(files = []) {
  const count = Array.isArray(files) ? files.length : 0;
  if (!count) return 'No image folder selected.';
  const first = String(files[0]?.webkitRelativePath || '').trim();
  const label = first.split('/').filter(Boolean)[0] || 'selected folder';
  return `${count} image file${count === 1 ? '' : 's'} selected from ${label}.`;
}

export default function IntakeBatchManager() {
  const toastCtx = useContext(ToastContext);
  const createImagesRef = useRef(null);
  const updateImagesRef = useRef(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [createName, setCreateName] = useState('');
  const [createImages, setCreateImages] = useState([]);
  const [createJsonFile, setCreateJsonFile] = useState(null);
  const [createCsvFile, setCreateCsvFile] = useState(null);
  const [createCollageFile, setCreateCollageFile] = useState(null);
  const [updateImages, setUpdateImages] = useState([]);
  const [updateJsonFile, setUpdateJsonFile] = useState(null);
  const [updateCsvFile, setUpdateCsvFile] = useState(null);
  const [updateCollageFile, setUpdateCollageFile] = useState(null);
  const [feedback, setFeedback] = useState({ tone: 'info', message: '' });
  const refreshTimeoutRef = useRef(null);

  useEffect(() => {
    const createInput = createImagesRef.current;
    if (createInput) {
      createInput.setAttribute('webkitdirectory', '');
      createInput.setAttribute('directory', '');
    }
    const updateInput = updateImagesRef.current;
    if (updateInput) {
      updateInput.setAttribute('webkitdirectory', '');
      updateInput.setAttribute('directory', '');
    }
  }, []);

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchId) || null,
    [batches, selectedBatchId]
  );
  const selectedBatchValidationOk = Boolean(selectedBatch?.validation?.ok);
  const selectedBatchHasImageLinkedJson = Number(selectedBatch?.validation?.itemsWithImageKeysCount) > 0;

  const refreshBatches = async () => {
    setLoading(true);
    try {
      const nextBatches = await fetchIntakeBatches();
      setBatches(nextBatches);
      setFeedback((current) => (
        current?.tone === 'error' && /Backend API unavailable/i.test(String(current?.message || ''))
          ? { tone: 'info', message: '' }
          : current
      ));
      if (!selectedBatchId && nextBatches[0]?.id) {
        setSelectedBatchId(nextBatches[0].id);
      } else if (selectedBatchId && !nextBatches.some((batch) => batch.id === selectedBatchId)) {
        setSelectedBatchId(nextBatches[0]?.id || '');
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
  };

  useEffect(() => {
    void refreshBatches();
    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, []);

  const replaceBatch = (nextBatch) => {
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
    setSelectedBatchId(nextBatch.id);
  };

  const handleCreateBatch = async () => {
    setBusyAction('create');
    setFeedback({ tone: 'info', message: '' });
    try {
      const batch = await createIntakeBatch({
        name: createName,
        imageFiles: createImages,
        jsonFile: createJsonFile,
        csvFile: createCsvFile,
        collageFile: createCollageFile,
      });
      replaceBatch(batch);
      setCreateName('');
      setCreateImages([]);
      setCreateJsonFile(null);
      setCreateCsvFile(null);
      setCreateCollageFile(null);
      if (createImagesRef.current) createImagesRef.current.value = '';
      setFeedback({
        tone: 'success',
        message: `Created batch ${batch.name}.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error?.message || 'Failed to create intake batch.',
      });
    } finally {
      setBusyAction('');
    }
  };

  const handleUpdateAssets = async () => {
    if (!selectedBatch) return;
    setBusyAction('update-assets');
    setFeedback({ tone: 'info', message: '' });
    try {
      const batch = await updateIntakeBatchAssets(selectedBatch.id, {
        imageFiles: updateImages,
        jsonFile: updateJsonFile,
        csvFile: updateCsvFile,
        collageFile: updateCollageFile,
      });
      replaceBatch(batch);
      setUpdateImages([]);
      setUpdateJsonFile(null);
      setUpdateCsvFile(null);
      setUpdateCollageFile(null);
      if (updateImagesRef.current) updateImagesRef.current.value = '';
      setFeedback({
        tone: 'success',
        message: `Updated assets for ${batch.name}.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error?.message || 'Failed to update intake batch assets.',
      });
    } finally {
      setBusyAction('');
    }
  };

  const handleValidate = async () => {
    if (!selectedBatch) return;
    setBusyAction('validate');
    setFeedback({ tone: 'info', message: '' });
    try {
      const result = await validateIntakeBatch(selectedBatch.id);
      replaceBatch(result.batch);
      setFeedback({
        tone: result.validation?.ok ? 'success' : 'error',
        message: result.validation?.ok
          ? `Validation passed for ${result.batch.name}.`
          : `Validation failed for ${result.batch.name}.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error?.message || 'Failed to validate intake batch.',
      });
    } finally {
      setBusyAction('');
    }
  };

  const handleStage = async () => {
    if (!selectedBatch) return;
    setBusyAction('stage');
    setFeedback({ tone: 'info', message: '' });
    try {
      const result = await stageIntakeBatch(selectedBatch.id);
      replaceBatch(result.batch);
      setFeedback({
        tone: 'success',
        message: `Staged ${Number(result.stageResult?.stagedCount) || 0} image file(s) for ${result.batch.name}.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error?.message || 'Failed to stage intake batch.',
      });
    } finally {
      setBusyAction('');
    }
  };

  const handleImport = async () => {
    if (!selectedBatch) return;
    setBusyAction('import');
    setFeedback({ tone: 'info', message: '' });
    try {
      const result = await importIntakeBatch(selectedBatch.id);
      replaceBatch(result.batch);
      const readyCount = Number(result.importResult?.imageImportSummary?.readyCount) || 0;
      setFeedback({
        tone: result.importResult?.status === 'failed' ? 'error' : 'success',
        message:
          result.importResult?.status === 'success'
            ? `Imported ${result.importResult?.createdCount || 0} items from ${result.batch.name}.`
            : result.importResult?.status === 'partial_success'
              ? `Imported ${result.importResult?.createdCount || 0} items from ${result.batch.name} with ${result.importResult?.failedCount || 0} issue(s).`
              : `Import failed for ${result.batch.name}.`,
      });

      if (readyCount > 0) {
        const latestSummary = await fetchBatchImportReadySummary().catch(() => null);
        const totalReadyCount = Number(latestSummary?.readyCount) || readyCount;
        toastCtx?.showToast?.({
          title: 'Imported images ready',
          message: `${readyCount} new image${readyCount === 1 ? '' : 's'} are ready for batch processing.${totalReadyCount > readyCount ? ` ${totalReadyCount} total pending.` : ''}`,
          variant: 'warning',
          sticky: true,
          actions: [
            {
              label: 'Process Now',
              kind: 'primary',
              onClick: async () => {
                try {
                  const queued = await processBatchImportReadyImages();
                  const queuedCount = Number(queued?.queuedCount) || 0;
                  toastCtx?.showToast?.({
                    title: 'Batch processing queued',
                    message: `Queued ${queuedCount} imported image${queuedCount === 1 ? '' : 's'} for processing.`,
                    variant: 'success',
                  });
                } catch (error) {
                  toastCtx?.showToast?.({
                    title: 'Batch processing start failed',
                    message: error?.message || 'Failed to queue imported images for processing.',
                    variant: 'danger',
                    sticky: true,
                  });
                }
              },
            },
            {
              label: 'Later',
              onClick: () => toastCtx?.hideToast?.(),
            },
          ],
        });
      }
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error?.message || 'Failed to import intake batch.',
      });
    } finally {
      setBusyAction('');
    }
  };

  const handleDelete = async () => {
    if (!selectedBatch) return;
    const confirmed = window.confirm(
      `Delete intake batch "${selectedBatch.name}" from the temporary intake cache?`
    );
    if (!confirmed) return;

    setBusyAction('delete');
    setFeedback({ tone: 'info', message: '' });
    try {
      await deleteIntakeBatch(selectedBatch.id);
      setBatches((current) => current.filter((batch) => batch.id !== selectedBatch.id));
      setSelectedBatchId((current) => (current === selectedBatch.id ? '' : current));
      setFeedback({
        tone: 'success',
        message: `Deleted batch ${selectedBatch.name}.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error?.message || 'Failed to delete intake batch.',
      });
    } finally {
      setBusyAction('');
    }
  };

  return (
    <Wrap>
      <IntakeBatchCreatePanel
        createName={createName}
        setCreateName={setCreateName}
        createImagesRef={createImagesRef}
        createImages={createImages}
        createJsonFile={createJsonFile}
        createCsvFile={createCsvFile}
        createCollageFile={createCollageFile}
        summarizeAssetSelection={summarizeAssetSelection}
        onCreateImagesChange={(event) => setCreateImages(Array.from(event.target.files || []))}
        onCreateJsonChange={(event) => setCreateJsonFile(event.target.files?.[0] || null)}
        onCreateCsvChange={(event) => setCreateCsvFile(event.target.files?.[0] || null)}
        onCreateCollageChange={(event) => setCreateCollageFile(event.target.files?.[0] || null)}
        onCreateBatch={handleCreateBatch}
        onRefresh={() => void refreshBatches()}
        busyAction={busyAction}
        loading={loading}
      />

      <Grid>
        <IntakeBatchList
          batches={batches}
          selectedBatchId={selectedBatchId}
          onSelect={setSelectedBatchId}
        />

        <IntakeBatchDetailsPanel
          selectedBatch={selectedBatch}
          selectedBatchValidationOk={selectedBatchValidationOk}
          selectedBatchHasImageLinkedJson={selectedBatchHasImageLinkedJson}
          updateImagesRef={updateImagesRef}
          updateImages={updateImages}
          updateJsonFile={updateJsonFile}
          updateCsvFile={updateCsvFile}
          updateCollageFile={updateCollageFile}
          summarizeAssetSelection={summarizeAssetSelection}
          onUpdateImagesChange={(event) => setUpdateImages(Array.from(event.target.files || []))}
          onUpdateJsonChange={(event) => setUpdateJsonFile(event.target.files?.[0] || null)}
          onUpdateCsvChange={(event) => setUpdateCsvFile(event.target.files?.[0] || null)}
          onUpdateCollageChange={(event) => setUpdateCollageFile(event.target.files?.[0] || null)}
          onUpdateAssets={handleUpdateAssets}
          onValidate={handleValidate}
          onStage={handleStage}
          onImport={handleImport}
          onDelete={handleDelete}
          busyAction={busyAction}
        />
      </Grid>

      {feedback.message ? <Feedback $tone={feedback.tone}>{feedback.message}</Feedback> : null}
    </Wrap>
  );
}
