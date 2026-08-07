import React from 'react';
import * as S from '../styles/EditItemDetailsForm.styles';

import ItemDossierCarousel from './EditItemDetailsForm/ItemDossierCarousel';
import useEditItemDetailsFormState from './EditItemDetailsForm/useEditItemDetailsFormState';
import useEditItemActionToast from './EditItemDetailsForm/useEditItemActionToast';

export default function EditItemDetailsForm({
  item,
  triggerFlash,
  onSaved,
  onItemImageUpdated,
  onProcessImage,
  processImageStatus = 'idle',
  processImageBusy = false,
  processImageError = '',
  processImageProgressLabel = '',
  processImageProgressPercent = null,
  persistedRenderTokens = null,
  activeVariant = 'original',
  hasProcessedVariant = false,
  onSwitchActiveVariant,
  switchVariantBusy = false,
  switchVariantError = '',
  processedPreviewUrl = '',
  imageRefreshToken = 0,
  onCancel,
  preserveToastOnCancel = false,
  lifecycleBusy = false,
  onMarkGoneRequest,
  onReclaimRequest,
}) {
  const {
    formData,
    derivedDates,
    ownership,
    saving,
    isDirty,
    handleTextChange,
    handleTagsChange,
    handleQuantityChange,
    handleMetadataChange,
    handleHistoryDateChange,
    handleAddHistoryDate,
    handleRemoveHistoryDate,
    handleLinkChange,
    handleAddLink,
    handleRemoveLink,
    handleSave,
    handleRevert,
  } = useEditItemDetailsFormState({
    item,
    triggerFlash,
    onSaved,
  });
  useEditItemActionToast({
    item,
    isDirty,
    saving,
    lifecycleBusy,
    onCancel,
    onSave: handleSave,
    onRevert: handleRevert,
    preserveToastOnCancel,
  });

  return (
    <S.Form onSubmit={handleSave}>
      <S.Fieldset disabled={saving || lifecycleBusy}>
        <ItemDossierCarousel
          item={item}
          formData={formData}
          derivedDates={derivedDates}
          ownership={ownership}
          isDirty={isDirty}
          disabled={saving || lifecycleBusy}
          onTextChange={handleTextChange}
          onTagsChange={handleTagsChange}
          onQuantityChange={handleQuantityChange}
          onMetadataChange={handleMetadataChange}
          onHistoryDateChange={handleHistoryDateChange}
          onAddHistoryDate={handleAddHistoryDate}
          onRemoveHistoryDate={handleRemoveHistoryDate}
          onLinkChange={handleLinkChange}
          onAddLink={handleAddLink}
          onRemoveLink={handleRemoveLink}
          onItemImageUpdated={onItemImageUpdated}
          onProcessImage={onProcessImage}
          processImageStatus={processImageStatus}
          processImageBusy={processImageBusy}
          processImageError={processImageError}
          processImageProgressLabel={processImageProgressLabel}
          processImageProgressPercent={processImageProgressPercent}
          persistedRenderTokens={persistedRenderTokens}
          activeVariant={activeVariant}
          hasProcessedVariant={hasProcessedVariant}
          onSwitchActiveVariant={onSwitchActiveVariant}
          switchVariantBusy={switchVariantBusy}
          switchVariantError={switchVariantError}
          processedPreviewUrl={processedPreviewUrl}
          imageRefreshToken={imageRefreshToken}
          onMarkGoneRequest={onMarkGoneRequest}
          onReclaimRequest={onReclaimRequest}
        />
      </S.Fieldset>
    </S.Form>
  );
}
