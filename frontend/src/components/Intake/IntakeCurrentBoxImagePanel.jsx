import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ToastContext } from '../Toast';
import useBoxImageProcessing from '../../hooks/useBoxImageProcessing';
import BoxImageField from '../ImageFields/BoxImageField';
import ImageProcessingToastContent from '../Processing/ImageProcessingToastContent';
import {
  getImageProcessingToastSignature,
  isImageProcessingInFlight,
} from '../Processing/imageProcessingToastUtils';

function toTrimmed(value) {
  return value == null ? '' : String(value).trim();
}

function pickBoxImageUrl(box) {
  return (
    box?.imagePath ||
    box?.image?.display?.url ||
    box?.image?.thumb?.url ||
    box?.image?.original?.url ||
    box?.image?.url ||
    ''
  );
}

export default function IntakeCurrentBoxImagePanel({
  currentBox,
  onBoxPhotoUpdated,
}) {
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;

  const [previewOverrideUrl, setPreviewOverrideUrl] = useState('');
  const [imageRefreshToken, setImageRefreshToken] = useState(0);
  const lastLifecycleStatusRef = useRef('');

  const boxId = toTrimmed(currentBox?._id);
  const boxShortId = toTrimmed(currentBox?.box_id) || '---';
  const baseImageUrl = pickBoxImageUrl(currentBox);

  const {
    processingStatus,
    processingState,
    processingError,
    jobProgressLabel,
    jobProgressPercent,
    jobId,
    isBusy: processBusy,
    isSwitchingVariant,
    variantSwitchError,
    activeVariant,
    hasProcessedVariant,
    refreshMediaState,
    startProcessing,
    switchActiveVariant,
  } = useBoxImageProcessing({
    boxId,
    onCompleted: ({ state }) => {
      const nextPreview = toTrimmed(
        state?.preferredImageUrl ||
          state?.displayUrl ||
          state?.thumbUrl ||
          state?.processedUrl
      );

      if (nextPreview) {
        setPreviewOverrideUrl(nextPreview);
        setImageRefreshToken(Date.now());
      }

      onBoxPhotoUpdated?.({
        boxId,
        image: currentBox?.image || null,
        imagePath: nextPreview || baseImageUrl,
        message: `Processed box #${boxShortId} image with Glow.`,
      });

      showToast?.({
        variant: 'success',
        title: 'Box image ready',
        message: `Glow processing complete for box #${boxShortId}.`,
        sticky: true,
      });
    },
    onFailed: ({ error }) => {
      const message = toTrimmed(error) || 'Could not process this box image.';
      showToast?.({
        variant: 'danger',
        title: 'Box image processing failed',
        message,
        sticky: true,
      });
    },
  });

  useEffect(() => {
    lastLifecycleStatusRef.current = '';
    setPreviewOverrideUrl('');
    setImageRefreshToken(0);
  }, [boxId]);

  useEffect(() => {
    const nextStatus = toTrimmed(processingStatus).toLowerCase();
    if (!isImageProcessingInFlight(nextStatus)) return;

    const entityLabel = `Box #${boxShortId}`;
    const signature = getImageProcessingToastSignature({
      status: nextStatus,
      label: jobProgressLabel,
      progressPercent: jobProgressPercent,
      entityLabel,
      jobId,
    });
    if (lastLifecycleStatusRef.current === signature) return;
    lastLifecycleStatusRef.current = signature;

    showToast?.({
      variant: 'info',
      title: 'Glow processing',
      message: jobProgressLabel || `Processing box #${boxShortId} image.`,
      content: (
        <ImageProcessingToastContent
          status={nextStatus}
          label={jobProgressLabel || `Processing box #${boxShortId} image.`}
          progressPercent={jobProgressPercent}
          entityLabel={entityLabel}
          jobId={jobId}
        />
      ),
      loading: true,
      sticky: true,
    });
  }, [
    boxShortId,
    jobId,
    jobProgressLabel,
    jobProgressPercent,
    processingStatus,
    showToast,
  ]);

  const normalizedActiveVariant = useMemo(() => {
    return toTrimmed(activeVariant).toLowerCase() === 'processed'
      ? 'processed'
      : 'original';
  }, [activeVariant]);

  const hasImage = Boolean(toTrimmed(previewOverrideUrl || baseImageUrl));
  const mutationBusy = isSwitchingVariant || processBusy;

  const canProcess = Boolean(
    boxId &&
    hasImage &&
    !mutationBusy
  );

  const canRevert = Boolean(
    boxId &&
    hasImage &&
    hasProcessedVariant &&
    normalizedActiveVariant === 'processed' &&
    !mutationBusy
  );

  const handleBoxImageUpdated = useCallback(async ({
    image,
    imagePath,
    message,
  } = {}) => {
    setPreviewOverrideUrl('');
    setImageRefreshToken(Date.now());

    onBoxPhotoUpdated?.({
      boxId,
      image: image || null,
      imagePath: imagePath || '',
      message: toTrimmed(message),
    });

    await refreshMediaState().catch(() => null);
  }, [boxId, onBoxPhotoUpdated, refreshMediaState]);

  const handleImageAction = useCallback((event = {}) => {
    const { action, kind, message } = event;
    const fallback = toTrimmed(message);

    if (kind === 'error') {
      showToast?.({
        variant: 'danger',
        title:
          action === 'choose-existing'
            ? 'Choose Existing failed'
            : action === 'upload'
              ? 'Box image upload failed'
              : 'Box image action failed',
        message: fallback || 'Could not update this box image.',
        timeoutMs: 5000,
      });
      return;
    }

    if (kind === 'info') {
      showToast?.({
        variant: 'info',
        title: 'Choose Existing not available',
        message: fallback,
        timeoutMs: 3600,
      });
      return;
    }

    if (kind === 'success') {
      showToast?.({
        variant: 'success',
        title:
          action === 'choose-existing'
            ? 'Box image selected'
            : action === 'remove'
              ? 'Box image removed'
              : 'Box image updated',
        message: fallback || `Updated image for box #${boxShortId}.`,
        timeoutMs: 3200,
      });
    }
  }, [boxShortId, showToast]);

  const handleProcessWithGlow = useCallback(async (renderTokens) => {
    if (!canProcess) return;

    try {
      if (normalizedActiveVariant !== 'original') {
        await switchActiveVariant('original');
      }

      const queued = await startProcessing({ renderTokens });
      showToast?.({
        variant: 'info',
        title: 'Glow processing queued',
        message: queued?.jobId
          ? `Queued job ${queued.jobId} for box #${boxShortId}.`
          : `Glow processing queued for box #${boxShortId}.`,
        sticky: true,
      });
    } catch (processingStartError) {
      const message =
        toTrimmed(processingStartError?.message) || 'Failed to start Glow processing.';
      showToast?.({
        variant: 'danger',
        title: 'Glow start failed',
        message,
        sticky: true,
      });
    }
  }, [
    boxShortId,
    canProcess,
    normalizedActiveVariant,
    showToast,
    startProcessing,
    switchActiveVariant,
  ]);

  const handleRevertToOriginal = useCallback(async () => {
    if (!canRevert) return;

    try {
      const updatedState = await switchActiveVariant('original');
      const latestState = updatedState || (await refreshMediaState().catch(() => null));
      const nextPreview = toTrimmed(
        latestState?.preferredImageUrl ||
          latestState?.displayUrl ||
          latestState?.thumbUrl ||
          latestState?.originalUrl ||
          baseImageUrl
      );

      if (nextPreview) {
        setPreviewOverrideUrl(nextPreview);
        setImageRefreshToken(Date.now());
      }

      const message = `Using original image for box #${boxShortId}.`;
      onBoxPhotoUpdated?.({
        boxId,
        image: currentBox?.image || null,
        imagePath: nextPreview,
        message,
      });

      showToast?.({
        variant: 'success',
        title: 'Reverted to original',
        message,
        timeoutMs: 3000,
      });
    } catch (revertError) {
      const message = toTrimmed(revertError?.message) || 'Failed to revert image variant.';
      showToast?.({
        variant: 'danger',
        title: 'Revert failed',
        message,
        timeoutMs: 5000,
      });
    }
  }, [
    baseImageUrl,
    boxId,
    boxShortId,
    canRevert,
    currentBox?.image,
    onBoxPhotoUpdated,
    refreshMediaState,
    showToast,
    switchActiveVariant,
  ]);

  if (!boxId) return null;

  return (
    <BoxImageField
      box={currentBox}
      boxId={boxId}
      title="Box Image"
      placeholder="Box Image"
      messageSubject={`Box #${boxShortId} image`}
      uploadLabel="Upload"
      replaceLabel="Upload"
      allowClear={false}
      allowChooseExisting
      chooseExistingLabel="Choose Existing"
      onBoxImageUpdated={handleBoxImageUpdated}
      onImageAction={handleImageAction}
      onProcessImage={handleProcessWithGlow}
      processImageStatus={processingStatus}
      processImageBusy={processBusy}
      processImageError={processingError}
      processImageProgressLabel={jobProgressLabel}
      persistedRenderTokens={processingState?.renderTokens || null}
      processTone="primary"
      processActionLabels={{
        idle: 'Process with Glow',
        queued: 'Glow queued...',
        processing: 'Processing...',
        completed: 'Reprocess Glow',
        failed: 'Retry Glow',
      }}
      activeVariant={activeVariant}
      hasProcessedVariant={hasProcessedVariant}
      onRevertToOriginal={handleRevertToOriginal}
      switchVariantBusy={isSwitchingVariant}
      switchVariantError={variantSwitchError}
      processedPreviewUrl={previewOverrideUrl}
      imageRefreshToken={imageRefreshToken}
      hintWhenImage="Upload/select assigns the source image. Glow processing is explicit and non-destructive."
      hintWhenEmpty="Upload or select an image to enable Glow processing."
    />
  );
}
