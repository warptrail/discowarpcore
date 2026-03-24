import React from 'react';
import * as S from '../styles/EditItemDetailsForm.styles';

import EditItemTextFieldsSection from './EditItemDetailsForm/EditItemTextFieldsSection';
import EditItemTagsSection from './EditItemDetailsForm/EditItemTagsSection';
import EditItemQuantitySection from './EditItemDetailsForm/EditItemQuantitySection';
import EditItemStructuredFieldsSection from './EditItemDetailsForm/EditItemStructuredFieldsSection';
import EditItemExternalLinksSection from './EditItemDetailsForm/EditItemExternalLinksSection';
import EditItemImageSection from './EditItemDetailsForm/EditItemImageSection';
import EditItemFormActions from './EditItemDetailsForm/EditItemFormActions';
import EditItemLifecycleSection from './EditItemDetailsForm/EditItemLifecycleSection';
import useEditItemDetailsFormState from './EditItemDetailsForm/useEditItemDetailsFormState';

export default function EditItemDetailsForm({
  item,
  triggerFlash,
  onSaved,
  onItemImageUpdated,
  onCancel,
  actionDocked = false,
  lifecycleBusy = false,
  onMarkGoneRequest,
  onDeletePermanentlyRequest,
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

  return (
    <S.Form onSubmit={handleSave} $actionDocked={actionDocked}>
      <S.Fieldset disabled={saving || lifecycleBusy}>
        <EditItemImageSection
          item={item}
          disabled={saving}
          onItemImageUpdated={onItemImageUpdated}
        />

        <EditItemTextFieldsSection
          formData={formData}
          onTextChange={handleTextChange}
          ownership={ownership}
        />

        <EditItemTagsSection tags={formData.tags} onTagsChange={handleTagsChange} />

        <EditItemQuantitySection
          quantity={formData.quantity}
          onQuantityChange={handleQuantityChange}
        />

        <EditItemStructuredFieldsSection
          formData={formData}
          derivedDates={derivedDates}
          onMetadataChange={handleMetadataChange}
          onHistoryDateChange={handleHistoryDateChange}
          onAddHistoryDate={handleAddHistoryDate}
          onRemoveHistoryDate={handleRemoveHistoryDate}
        />

        <EditItemExternalLinksSection
          links={formData.links}
          onLinkChange={handleLinkChange}
          onAddLink={handleAddLink}
          onRemoveLink={handleRemoveLink}
        />

        <EditItemLifecycleSection
          item={item}
          disabled={saving || lifecycleBusy}
          onMarkGoneRequest={onMarkGoneRequest}
          onDeletePermanentlyRequest={onDeletePermanentlyRequest}
          onReclaimRequest={onReclaimRequest}
        />

        <EditItemFormActions
          saving={saving}
          isDirty={isDirty}
          docked={actionDocked}
          onRevert={handleRevert}
          onCancel={onCancel}
        />
      </S.Fieldset>
    </S.Form>
  );
}
