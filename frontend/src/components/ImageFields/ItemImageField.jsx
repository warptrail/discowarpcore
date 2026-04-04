import React, { useCallback } from 'react';
import BoxImageField from './BoxImageField';
import { toTrimmed } from './imageAssetState';
import { removeItemImage, uploadItemImage } from '../../api/itemMedia';

export default function ItemImageField({
  item,
  disabled = false,
  onItemImageUpdated,
  onProcessImage,
  processImageStatus = 'idle',
  processImageBusy = false,
  processImageError = '',
  processImageProgressLabel = '',
  persistedRenderTokens = null,
  activeVariant = 'original',
  hasProcessedVariant = false,
  onSwitchActiveVariant,
  switchVariantBusy = false,
  switchVariantError = '',
  processedPreviewUrl = '',
  imageRefreshToken = 0,
}) {
  const itemId = toTrimmed(item?._id);

  const handleUploadImage = useCallback(
    async ({ file }) => {
      if (!itemId) throw new Error('itemId is required');
      return uploadItemImage(itemId, file);
    },
    [itemId]
  );

  const handleRemoveImage = useCallback(async () => {
    if (!itemId) throw new Error('itemId is required');
    return removeItemImage(itemId);
  }, [itemId]);

  const handleImageUpdated = useCallback((payload = {}) => {
    onItemImageUpdated?.({
      image: payload?.image || null,
      imagePath: toTrimmed(payload?.imagePath),
    });
  }, [onItemImageUpdated]);

  return (
    <BoxImageField
      box={item}
      boxId={itemId}
      disabled={disabled}
      title="Item Image"
      placeholder="No item image uploaded."
      previewEntityLabel={toTrimmed(item?.name) || 'Item'}
      messageSubject="Item image"
      uploadLabel="Upload Photo"
      replaceLabel="Replace Photo"
      clearLabel="Remove Image"
      onBoxImageUpdated={handleImageUpdated}
      onUploadImage={handleUploadImage}
      onRemoveImage={handleRemoveImage}
      onProcessImage={onProcessImage}
      processImageStatus={processImageStatus}
      processImageBusy={processImageBusy}
      processImageError={processImageError}
      processImageProgressLabel={processImageProgressLabel}
      persistedRenderTokens={persistedRenderTokens}
      processActionLabels={{
        idle: 'Process Item Image',
        completed: 'Reprocess Item Image',
      }}
      activeVariant={activeVariant}
      hasProcessedVariant={hasProcessedVariant}
      onSwitchActiveVariant={onSwitchActiveVariant}
      switchVariantBusy={switchVariantBusy}
      switchVariantError={switchVariantError}
      processedPreviewUrl={processedPreviewUrl}
      imageRefreshToken={imageRefreshToken}
      hintWhenImage={`Active variant: ${toTrimmed(activeVariant) || 'original'}`}
      hintWhenEmpty="Upload a square photo for best results."
    />
  );
}
