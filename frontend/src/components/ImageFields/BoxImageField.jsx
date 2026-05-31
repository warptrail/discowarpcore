import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  removeBoxImage,
  selectExistingBoxImage,
  uploadBoxImage,
} from '../../api/boxes';
import ImageAssetField from './ImageAssetField';
import {
  DEFAULT_RENDER_TOKENS,
  RENDER_TOKEN_MODE_OPTIONS,
  RENDER_TOKEN_OPTIONS,
  hasProvidedRenderTokens,
  normalizeRenderTokens,
} from '../../constants/renderTokens';
import {
  createImageAssetState,
  formatProcessActionLabel,
  normalizeProcessingStatus,
  pickEntityImageUrl,
  toTrimmed,
  withCacheBuster,
} from './imageAssetState';
import { cropImageToSquare } from '../../util/cropImageToSquare';
import { deriveImageProcessingEligibility } from '../Processing/imageProcessingEligibility';

function createDefaultMessage(action, { hasImage, messageSubject, source } = {}) {
  const subject = toTrimmed(messageSubject) || 'Image';
  const sourceSuffix = source ? ` via ${source}` : '';

  if (action === 'upload') {
    return hasImage ? `${subject} replaced${sourceSuffix}.` : `${subject} uploaded${sourceSuffix}.`;
  }
  if (action === 'remove') {
    return `${subject} removed.`;
  }
  if (action === 'choose-existing') {
    return `${subject} updated from existing source.`;
  }
  return `${subject} updated.`;
}

export default function BoxImageField({
  box,
  boxId,
  disabled = false,
  compact = false,
  title = 'Image',
  placeholder = 'No image uploaded.',
  previewEntityLabel = '',
  messageSubject = 'Image',
  uploadLabel = 'Upload Photo',
  replaceLabel = 'Replace Photo',
  clearLabel = 'Remove Image',
  chooseExistingLabel = 'Choose Existing',
  allowClear = true,
  allowChooseExisting = false,
  onBoxImageUpdated,
  onImageAction,
  onUploadImage,
  onRemoveImage,
  onChooseExistingImage,
  onProcessImage,
  processImageStatus = 'idle',
  processImageBusy = false,
  processImageError = '',
  persistedRenderTokens = null,
  processActionLabels = {},
  processTone = 'default',
  showVariantLabel = true,
  activeVariant = 'original',
  hasProcessedVariant = false,
  onSwitchActiveVariant,
  onRevertToOriginal,
  switchVariantBusy = false,
  switchVariantError = '',
  processedPreviewUrl = '',
  imageRefreshToken = 0,
  hintWhenImage = '',
  hintWhenEmpty = '',
  mobileHeaderPreview = false,
}) {
  const resolvedBoxId = toTrimmed(boxId || box?._id);
  const [previewUrl, setPreviewUrl] = useState(() => pickEntityImageUrl(box));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [renderTokens, setRenderTokens] = useState(() => normalizeRenderTokens(DEFAULT_RENDER_TOKENS));
  const renderTokensDirtyRef = useRef(false);
  const persistedRenderTokensRef = useRef(persistedRenderTokens);

  useEffect(() => {
    setPreviewUrl(pickEntityImageUrl(box));
    setStatus('');
    setError('');
  }, [box]);

  useEffect(() => {
    persistedRenderTokensRef.current = persistedRenderTokens;
  }, [persistedRenderTokens]);

  useEffect(() => {
    renderTokensDirtyRef.current = false;
    setRenderTokens(normalizeRenderTokens(persistedRenderTokensRef.current));
  }, [resolvedBoxId]);

  useEffect(() => {
    if (!resolvedBoxId) return;
    if (!hasProvidedRenderTokens(persistedRenderTokens) && renderTokensDirtyRef.current) {
      return;
    }

    renderTokensDirtyRef.current = false;
    setRenderTokens(normalizeRenderTokens(persistedRenderTokens));
  }, [persistedRenderTokens, resolvedBoxId]);

  const normalizedActiveVariant = useMemo(() => {
    const normalized = toTrimmed(activeVariant).toLowerCase();
    return normalized === 'processed' ? 'processed' : 'original';
  }, [activeVariant]);

  const normalizedProcessingStatus = useMemo(
    () => normalizeProcessingStatus(processImageStatus, ''),
    [processImageStatus]
  );

  const resolvedPreviewEntityLabel =
    toTrimmed(previewEntityLabel) || toTrimmed(box?.label) || 'Box';

  const imageState = useMemo(
    () =>
      createImageAssetState({
        activeUrl: withCacheBuster(
          toTrimmed(processedPreviewUrl) || toTrimmed(previewUrl),
          imageRefreshToken
        ),
        originalUrl: previewUrl,
        processedUrl: processedPreviewUrl,
        processingStatus: normalizedProcessingStatus,
        processingError: processImageError,
      }),
    [
      imageRefreshToken,
      normalizedProcessingStatus,
      previewUrl,
      processImageError,
      processedPreviewUrl,
    ]
  );

  const hasImage = Boolean(imageState.activeUrl);
  const mutationBusy = busy || processImageBusy || switchVariantBusy;
  const processingEligibility = useMemo(
    () =>
      deriveImageProcessingEligibility({
        activeVariant: normalizedActiveVariant,
        processingStatus: normalizedProcessingStatus,
        hasProcessedOutput: hasProcessedVariant || Boolean(toTrimmed(processedPreviewUrl)),
        hasProcessableImage: hasImage,
      }),
    [hasImage, hasProcessedVariant, normalizedActiveVariant, normalizedProcessingStatus, processedPreviewUrl]
  );

  const canProcess = Boolean(
    resolvedBoxId &&
    typeof onProcessImage === 'function' &&
    !disabled &&
    !mutationBusy &&
    (processingEligibility.canProcessImage || processingEligibility.canReprocessImage)
  );

  const canRevert = Boolean(
    resolvedBoxId &&
    processingEligibility.canRevertImage &&
    !disabled &&
    !mutationBusy &&
    (typeof onRevertToOriginal === 'function' || typeof onSwitchActiveVariant === 'function')
  );

  const processActionLabelOverrides = useMemo(() => ({
    idle:
      processingEligibility.canReprocessImage && !processingEligibility.canProcessImage
        ? processActionLabels.completed || 'Reprocess Image'
        : processActionLabels.idle || 'Process Image',
    ready_for_processing:
      processingEligibility.canReprocessImage && !processingEligibility.canProcessImage
        ? processActionLabels.completed || 'Reprocess Image'
        : processActionLabels.ready_for_processing || processActionLabels.idle || 'Process Image',
    queued: processActionLabels.queued,
    processing: processActionLabels.processing,
    completed:
      processingEligibility.canReprocessImage && !processingEligibility.canProcessImage
        ? processActionLabels.completed || 'Reprocess Image'
        : processActionLabels.idle || 'Process Image',
    failed: processActionLabels.failed,
  }), [processActionLabels, processingEligibility.canProcessImage, processingEligibility.canReprocessImage]);

  const processLabel = formatProcessActionLabel(normalizedProcessingStatus, processActionLabelOverrides);

  const statusLines = [
    ...(busy ? [{ key: 'busy', text: 'Working...' }] : []),
    ...(status ? [{ key: 'status', tone: 'success', text: status }] : []),
    ...(error ? [{ key: 'error', tone: 'error', text: error }] : []),
    ...(switchVariantError
      ? [{ key: 'variant-error', tone: 'error', text: switchVariantError }]
      : []),
  ];

  const hint = hasImage ? toTrimmed(hintWhenImage) : toTrimmed(hintWhenEmpty);

  const emitAction = (payload) => {
    onImageAction?.({
      boxId: resolvedBoxId,
      ...payload,
    });
  };

  const handleUpload = async (file, meta = {}) => {
    if (!file || !resolvedBoxId) return;

    setBusy(true);
    setStatus('');
    setError('');

    try {
      const processedFile = await cropImageToSquare(file, { maxDimension: 1200 });
      const data = typeof onUploadImage === 'function'
        ? await onUploadImage({ boxId: resolvedBoxId, file: processedFile, meta })
        : await uploadBoxImage(resolvedBoxId, processedFile);
      const nextImage = data?.image || null;
      const nextPath = toTrimmed(nextImage?.display?.url || nextImage?.original?.url);
      const nextUrl = toTrimmed(nextImage?.display?.url || data?.urls?.display || nextPath);
      if (nextUrl) setPreviewUrl(nextUrl);

      const message = createDefaultMessage('upload', {
        hasImage,
        messageSubject,
        source: meta?.source,
      });

      setStatus(message);
      onBoxImageUpdated?.({
        type: 'upload',
        boxId: resolvedBoxId,
        image: nextImage,
        imagePath: nextPath,
        message,
        source: meta?.source || '',
      });
      emitAction({
        kind: 'success',
        action: 'upload',
        message,
        image: nextImage,
        imagePath: nextPath,
      });
    } catch (uploadError) {
      const message = uploadError?.message || 'Image upload failed.';
      setError(message);
      emitAction({
        kind: 'error',
        action: 'upload',
        message,
        error: uploadError,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!resolvedBoxId || !hasImage || !allowClear) return;

    setBusy(true);
    setStatus('');
    setError('');

    try {
      const data = typeof onRemoveImage === 'function'
        ? await onRemoveImage({ boxId: resolvedBoxId })
        : await removeBoxImage(resolvedBoxId);
      const message = createDefaultMessage('remove', {
        hasImage,
        messageSubject,
      });

      setPreviewUrl('');
      setStatus(message);
      onBoxImageUpdated?.({
        type: 'remove',
        boxId: resolvedBoxId,
        image: data?.image || null,
        imagePath: '',
        message,
      });
      emitAction({
        kind: 'success',
        action: 'remove',
        message,
        image: data?.image || null,
        imagePath: '',
      });
    } catch (removeError) {
      const message = removeError?.message || 'Image removal failed.';
      setError(message);
      emitAction({
        kind: 'error',
        action: 'remove',
        message,
        error: removeError,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleChooseExisting = async () => {
    if (!resolvedBoxId || !allowChooseExisting) return;

    setBusy(true);
    setStatus('');
    setError('');

    try {
      const data = typeof onChooseExistingImage === 'function'
        ? await onChooseExistingImage({ boxId: resolvedBoxId })
        : await selectExistingBoxImage(resolvedBoxId, {});

      const nextImage = data?.image || null;
      const nextPath = toTrimmed(
        data?.imagePath || nextImage?.display?.url || nextImage?.original?.url
      );
      if (nextPath) setPreviewUrl(nextPath);

      const message = toTrimmed(data?.message) || createDefaultMessage('choose-existing', {
        hasImage,
        messageSubject,
      });
      setStatus(message);

      if (nextImage || nextPath) {
        onBoxImageUpdated?.({
          type: 'choose-existing',
          boxId: resolvedBoxId,
          image: nextImage,
          imagePath: nextPath,
          message,
        });
      }

      emitAction({
        kind: 'success',
        action: 'choose-existing',
        message,
        image: nextImage,
        imagePath: nextPath,
      });
    } catch (chooseError) {
      if (chooseError?.code === 'BOX_SELECT_EXISTING_NOT_IMPLEMENTED') {
        const message =
          'Choose Existing is scaffolded. Source image library is not connected yet.';
        setStatus(message);
        emitAction({
          kind: 'info',
          action: 'choose-existing',
          message,
          error: chooseError,
        });
        return;
      }

      const message = chooseError?.message || 'Failed to select existing image.';
      setError(message);
      emitAction({
        kind: 'error',
        action: 'choose-existing',
        message,
        error: chooseError,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleProcess = async () => {
    if (!canProcess) return;
    try {
      await onProcessImage?.(renderTokens);
    } catch {
      // Parent controller surfaces process errors.
    }
  };

  const updateRenderToken = (field, value) => {
    renderTokensDirtyRef.current = true;
    setRenderTokens((current) => normalizeRenderTokens({
      ...current,
      [field]: value,
    }));
  };

  const handleRevert = async () => {
    if (!canRevert) return;
    try {
      if (typeof onRevertToOriginal === 'function') {
        await onRevertToOriginal();
      } else {
        await onSwitchActiveVariant?.('original');
      }
    } catch {
      // Parent controller surfaces variant errors.
    }
  };

  return (
    <ImageAssetField
      title={title}
      variantLabel={showVariantLabel ? normalizedActiveVariant : ''}
      imageState={imageState}
      previewAlt={`${resolvedPreviewEntityLabel} image`}
      placeholder={placeholder}
      compact={compact}
      uploadAction={{
        id: 'upload',
        label: hasImage ? replaceLabel : uploadLabel,
        onUpload: handleUpload,
        disabled: disabled || mutationBusy || !resolvedBoxId,
      }}
      clearAction={allowClear
        ? {
          id: 'clear',
          label: clearLabel,
          tone: 'danger',
          onClick: handleRemove,
          disabled: disabled || mutationBusy || !resolvedBoxId || !hasImage,
        }
        : null}
      chooseExistingAction={allowChooseExisting
        ? {
          id: 'choose-existing',
          label: chooseExistingLabel,
          onClick: handleChooseExisting,
          disabled: disabled || mutationBusy || !resolvedBoxId,
        }
        : null}
      processAction={typeof onProcessImage === 'function'
        ? {
          id: 'process',
          label: processLabel,
          tone: processTone,
          onClick: handleProcess,
          disabled: !canProcess,
        }
        : null}
      revertAction={canRevert
        ? {
          id: 'revert',
          label: 'Revert to Original',
          tone: 'danger',
          onClick: handleRevert,
          disabled: !canRevert,
        }
        : null}
      statusLines={statusLines}
      renderTokens={renderTokens}
      renderTokenOptions={RENDER_TOKEN_OPTIONS}
      renderTokenModeOptions={RENDER_TOKEN_MODE_OPTIONS}
      onRenderTokenChange={updateRenderToken}
      renderTokensDisabled={mutationBusy}
      hint={hint}
      mobileHeaderPreview={mobileHeaderPreview}
    />
  );
}
