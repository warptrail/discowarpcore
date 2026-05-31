import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';

import BoxControlBar from './BoxControlBar';
import NestBoxSection from './NestBoxSection';
import EditBoxDetailsForm from './EditBoxDetailsForm';
import ExportBoxPanel from './BoxActionPanel/ExportBoxPanel';
import DestroyBoxSection from './DestroyBoxSection';

import useBoxActionPanelController from './BoxActionPanel/useBoxActionPanelController';
import { DetailsPanel, PanelContainer } from './BoxActionPanel/BoxActionPanel.styles';
import { ToastContext } from './Toast';
import { destroyBoxById, releaseChildrenToFloor, updateBoxById } from '../api/boxes';
import useBoxImageProcessing from '../hooks/useBoxImageProcessing';
import ImageProcessingToastContent from './Processing/ImageProcessingToastContent';
import {
  getImageProcessingToastSignature,
  isImageProcessingInFlight,
} from './Processing/imageProcessingToastUtils';

const DESTROY_CONFIRM_PHRASE = 'DESTROY';

export default function BoxActionPanel({
  boxTree,
  boxMongoId,
  refreshBox,
  onBoxSaved,
  busy,
  onRequestDelete,
  activePanelState = null,
  onActivePanelStateChange,
  onImageStateChanged,
}) {
  const controller = useBoxActionPanelController({
    boxTree,
    boxMongoId,
    onBoxSaved,
    refreshBox,
    initialActivePanel: activePanelState,
  });

  const {
    activePanel,
    isMoving,
    routeShortId,
    setActivePanel,
    clearActivePanel,
    togglePanel,
    handleEmptyTab,
    handleFormSaved,
  } = controller;

  const [mode, setMode] = useState('default');
  const [destroyConfirmInput, setDestroyConfirmInput] = useState('');
  const [imageRefreshToken, setImageRefreshToken] = useState(0);
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState('');
  const lastImageLifecycleStatusRef = useRef('');
  const destroyToastActiveRef = useRef(false);
  const undoNestBusyRef = useRef(false);
  const navigate = useNavigate();

  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const hideToast = toastCtx?.hideToast;

  const isDestroyConfirmMode = mode === 'destroyConfirm';
  const isDestroyConfirmValid = destroyConfirmInput === DESTROY_CONFIRM_PHRASE;
  const isDestroyBusy = !!busy || isMoving;

  useEffect(() => {
    setProcessedPreviewUrl('');
    setImageRefreshToken(0);
    lastImageLifecycleStatusRef.current = '';
  }, [boxMongoId]);

  const handleImageProcessingCompleted = useCallback(async ({ state } = {}) => {
    const nextPreviewUrl = String(
      state?.preferredImageUrl ||
      state?.displayUrl ||
      state?.thumbUrl ||
      state?.processedUrl ||
      ''
    ).trim();

    setProcessedPreviewUrl(nextPreviewUrl || '');
    await refreshBox?.();
    setImageRefreshToken(Date.now());
    onImageStateChanged?.();
    showToast?.({
      variant: 'success',
      title: 'Box image processing complete',
      message: 'Updated processed image is ready.',
      sticky: true,
    });
  }, [onImageStateChanged, refreshBox, showToast]);

  const handleImageProcessingFailed = useCallback(({ error }) => {
    showToast?.({
      variant: 'danger',
      title: 'Box image processing failed',
      message: error || 'Could not process this box image.',
      sticky: true,
    });
  }, [showToast]);

  const {
    processingStatus: processImageStatus,
    processingState: processImageState,
    processingError: processImageError,
    jobProgressLabel: processImageProgressLabel,
    jobProgressPercent: processImageProgressPercent,
    jobId: processImageJobId,
    isBusy: processImageBusy,
    startProcessing: startBoxImageProcessing,
  } = useBoxImageProcessing({
    boxId: boxMongoId,
    onCompleted: handleImageProcessingCompleted,
    onFailed: handleImageProcessingFailed,
  });

  const handleProcessBoxImage = useCallback(async (renderTokens) => {
    try {
      const queued = await startBoxImageProcessing({ renderTokens });
      showToast?.({
        variant: 'info',
        title: 'Box image processing queued',
        message: queued?.jobId
          ? `Queued job ${queued.jobId}.`
          : 'Image processing request accepted.',
        sticky: true,
      });
      return queued;
    } catch (error) {
      showToast?.({
        variant: 'danger',
        title: 'Box image processing start failed',
        message: error?.message || 'Failed to enqueue box image processing.',
        sticky: true,
      });
      throw error;
    }
  }, [showToast, startBoxImageProcessing]);

  useEffect(() => {
    const nextStatus = String(processImageStatus || '').trim().toLowerCase();
    if (!isImageProcessingInFlight(nextStatus)) return;

    const entityLabel = routeShortId ? `Box #${routeShortId}` : 'Box image';
    const signature = getImageProcessingToastSignature({
      status: nextStatus,
      label: processImageProgressLabel,
      progressPercent: processImageProgressPercent,
      entityLabel,
      jobId: processImageJobId,
    });
    if (signature === lastImageLifecycleStatusRef.current) return;
    lastImageLifecycleStatusRef.current = signature;

    showToast?.({
      variant: 'info',
      title: 'Box image processing',
      message: processImageProgressLabel || 'ObjectGlow/media processing is running.',
      content: (
        <ImageProcessingToastContent
          status={nextStatus}
          label={processImageProgressLabel}
          progressPercent={processImageProgressPercent}
          entityLabel={entityLabel}
          jobId={processImageJobId}
        />
      ),
      loading: true,
      sticky: true,
    });
  }, [
    processImageJobId,
    processImageProgressLabel,
    processImageProgressPercent,
    processImageStatus,
    routeShortId,
    showToast,
  ]);

  const resetDestroyConfirmState = useCallback(() => {
    setDestroyConfirmInput('');
    setMode('default');
  }, []);

  const handleEnterDestroyConfirm = useCallback(() => {
    clearActivePanel();
    setDestroyConfirmInput('');
    setMode('destroyConfirm');
  }, [clearActivePanel]);

  const handleCancelDestroyConfirm = useCallback(() => {
    clearActivePanel();
    resetDestroyConfirmState();
  }, [clearActivePanel, resetDestroyConfirmState]);

  const runDestroySequence = useCallback(
    async ({ boxId, shortId }) => {
      try {
        if (typeof onRequestDelete === 'function') {
          await onRequestDelete();
        } else {
          await releaseChildrenToFloor(boxId);
          await destroyBoxById(boxId);
        }

        showToast?.({
          variant: 'success',
          title: `Box #${shortId} destroyed`,
          message:
            'Direct items were orphaned and direct child boxes were released to floor level.',
          timeoutMs: 2800,
        });

        navigate('/', {
          replace: true,
          state: { destroyFlow: 'done', at: Date.now() },
        });
      } catch (error) {
        console.error('[BoxActionPanel] destroy failed:', error);
        showToast?.({
          variant: 'danger',
          title: 'Destroy failed',
          message: error?.message || 'Failed to destroy this box.',
          sticky: true,
        });
      }
    },
    [navigate, onRequestDelete, showToast],
  );

  const handleConfirmDestroy = useCallback(() => {
    if (isDestroyBusy || !isDestroyConfirmValid || !boxMongoId) {
      return;
    }

    clearActivePanel();
    resetDestroyConfirmState();
    destroyToastActiveRef.current = false;
    hideToast?.();

    // Per UX requirement: navigate home first, then perform backend mutation.
    navigate('/', {
      state: { destroyFlow: 'start', at: Date.now() },
    });

    setTimeout(() => {
      runDestroySequence({ boxId: boxMongoId, shortId: routeShortId });
    }, 0);
  }, [
    isDestroyBusy,
    isDestroyConfirmValid,
    boxMongoId,
    clearActivePanel,
    resetDestroyConfirmState,
    hideToast,
    navigate,
    runDestroySequence,
    routeShortId,
  ]);

  const handleEmptyTabClick = () => {
    if (isDestroyConfirmMode) resetDestroyConfirmState();
    handleEmptyTab();
  };

  const handleNestClick = () => {
    if (isDestroyConfirmMode) resetDestroyConfirmState();
    togglePanel('nest');
  };

  const handleExportClick = () => {
    if (isDestroyConfirmMode) resetDestroyConfirmState();
    togglePanel('export');
  };

  const refreshAfterNestMutation = useCallback(async () => {
    try {
      await refreshBox?.();
    } catch (err) {
      console.error('[BoxActionPanel] refresh after nest mutation failed:', err);
      showToast?.({
        variant: 'danger',
        title: 'Refresh failed',
        message: 'Box hierarchy changed, but the panel failed to refresh.',
        timeoutMs: 4200,
      });
    }
  }, [refreshBox, showToast]);

  const handleDidNest = useCallback(async (nestEvent = {}) => {
    await refreshAfterNestMutation();
    const previousParentId = nestEvent?.previousParentId || null;
    const toLabel =
      nestEvent?.nextParentLabel ||
      (nestEvent?.nextParentShortId ? `Box #${nestEvent.nextParentShortId}` : 'selected parent');

    showToast?.({
      variant: 'success',
      title: 'Box nested',
      message: `Moved box #${routeShortId} under ${toLabel}.`,
      sticky: true,
      actions: [
        {
          id: `undo-nest-${boxMongoId}-${Date.now()}`,
          label: 'Undo',
          kind: 'primary',
          onClick: async () => {
            if (undoNestBusyRef.current) return;
            undoNestBusyRef.current = true;
            try {
              await updateBoxById(boxMongoId, {
                parentBox: previousParentId || null,
              });
              await refreshAfterNestMutation();
              hideToast?.();
              showToast?.({
                variant: 'success',
                title: 'Nest undone',
                message:
                  previousParentId
                    ? `Box #${routeShortId} returned to its previous parent.`
                    : `Box #${routeShortId} returned to floor level.`,
                timeoutMs: 3600,
              });
            } catch (err) {
              console.error('[BoxActionPanel] undo nest failed:', err);
              showToast?.({
                variant: 'danger',
                title: 'Undo failed',
                message: err?.message || 'Could not reverse this box move.',
                timeoutMs: 5200,
              });
            } finally {
              undoNestBusyRef.current = false;
            }
          },
        },
      ],
    });
  }, [
    refreshAfterNestMutation,
    showToast,
    routeShortId,
    boxMongoId,
    hideToast,
  ]);

  const handleDidUnnest = useCallback(async () => {
    await refreshAfterNestMutation();
    showToast?.({
      variant: 'success',
      title: 'Box moved to floor',
      message: `Box #${routeShortId} is now at floor level.`,
      timeoutMs: 3200,
    });
  }, [refreshAfterNestMutation, showToast, routeShortId]);

  const handleDidReleaseChildren = useCallback(
    async (modifiedCount = 0) => {
      await refreshAfterNestMutation();
      showToast?.({
        variant: 'success',
        title: 'Children released',
        message: `Released ${modifiedCount} direct child box${
          modifiedCount === 1 ? '' : 'es'
        } to floor level.`,
        timeoutMs: 3600,
      });
    },
    [refreshAfterNestMutation, showToast],
  );

  useEffect(() => {
    if (!isDestroyConfirmMode) return;

    destroyToastActiveRef.current = true;
    showToast?.({
      variant: 'danger',
      title: `Destroy Box #${routeShortId}`,
      message: 'Permanent action. Confirm carefully.',
      sticky: true,
      content: (
        <DestroyBoxSection
          busy={isDestroyBusy}
          shortId={routeShortId}
          confirmText={destroyConfirmInput}
          onConfirmTextChange={setDestroyConfirmInput}
          isConfirmValid={isDestroyConfirmValid}
          onCancel={handleCancelDestroyConfirm}
          onConfirm={handleConfirmDestroy}
        />
      ),
      onClose: handleCancelDestroyConfirm,
    });
  }, [
    isDestroyConfirmMode,
    showToast,
    routeShortId,
    isDestroyBusy,
    destroyConfirmInput,
    isDestroyConfirmValid,
    handleCancelDestroyConfirm,
    handleConfirmDestroy,
  ]);

  useEffect(() => {
    if (isDestroyConfirmMode || !destroyToastActiveRef.current) return;
    destroyToastActiveRef.current = false;
    hideToast?.();
  }, [isDestroyConfirmMode, hideToast]);

  useEffect(
    () => () => {
      if (!destroyToastActiveRef.current) return;
      destroyToastActiveRef.current = false;
      hideToast?.();
    },
    [hideToast],
  );

  useEffect(() => {
    if (typeof onActivePanelStateChange !== 'function') return;
    onActivePanelStateChange(activePanel);
  }, [activePanel, onActivePanelStateChange]);

  return (
    <PanelContainer>
      <BoxControlBar
        active={isDestroyConfirmMode ? 'destroy' : activePanel}
        onClickEmpty={handleEmptyTabClick}
        onClickNest={handleNestClick}
        onClickExport={handleExportClick}
        onClickDestroy={handleEnterDestroyConfirm}
        busy={isDestroyBusy}
      />

      <NestBoxSection
        open={!isDestroyConfirmMode && activePanel === 'nest'}
        onClose={() => setActivePanel(null)}
        onConfirm={() => {}}
        sourceBoxMongoId={boxMongoId}
        sourceBoxShortId={routeShortId}
        sourceBoxLabel={boxTree?.label}
        boxTree={boxTree}
        busy={busy || isMoving}
        onDidNest={handleDidNest}
        onDidUnnest={handleDidUnnest}
        onDidReleaseChildren={handleDidReleaseChildren}
      />

      <DetailsPanel $open={!isDestroyConfirmMode && activePanel === 'edit'} $maxHeight={760}>
        {!isDestroyConfirmMode && activePanel === 'edit' && (
          <EditBoxDetailsForm
            boxMongoId={boxMongoId}
            initial={boxTree}
            onSaved={handleFormSaved}
            onImageUpdated={() => {
              setProcessedPreviewUrl('');
              setImageRefreshToken(Date.now());
              refreshBox?.();
              onImageStateChanged?.();
            }}
            onProcessImage={handleProcessBoxImage}
            processImageStatus={processImageStatus}
            processImageBusy={processImageBusy}
            processImageError={processImageError}
            processImageProgressLabel={processImageProgressLabel}
            processImageProgressPercent={processImageProgressPercent}
            persistedRenderTokens={processImageState?.renderTokens || null}
            processedPreviewUrl={processedPreviewUrl}
            imageRefreshToken={imageRefreshToken}
            onCancel={() => {
              setActivePanel(null);
              refreshBox?.();
            }}
          />
        )}
      </DetailsPanel>

      <DetailsPanel $open={!isDestroyConfirmMode && activePanel === 'export'} $maxHeight={220}>
        {!isDestroyConfirmMode && activePanel === 'export' && (
          <ExportBoxPanel
            boxShortId={routeShortId}
            boxMongoId={boxMongoId}
            onClose={() => setActivePanel(null)}
          />
        )}
      </DetailsPanel>
    </PanelContainer>
  );
}
