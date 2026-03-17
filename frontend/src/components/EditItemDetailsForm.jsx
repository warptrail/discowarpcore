import React from 'react';
import * as S from '../styles/EditItemDetailsForm.styles';

import EditItemTextFieldsSection from './EditItemDetailsForm/EditItemTextFieldsSection';
import EditItemTagsSection from './EditItemDetailsForm/EditItemTagsSection';
import EditItemQuantitySection from './EditItemDetailsForm/EditItemQuantitySection';
import EditItemStructuredFieldsSection from './EditItemDetailsForm/EditItemStructuredFieldsSection';
import EditItemImageSection from './EditItemDetailsForm/EditItemImageSection';
import EditItemFormActions from './EditItemDetailsForm/EditItemFormActions';
import useEditItemDetailsFormState from './EditItemDetailsForm/useEditItemDetailsFormState';

export default function EditItemDetailsForm({
  item,
  triggerFlash,
  onSaved,
  onItemImageUpdated,
  onCancel,
}) {
  const {
    formData,
    ownership,
    saving,
    isDirty,
    handleTextChange,
    handleTagsChange,
    handleQuantityChange,
    handleMetadataChange,
    handleMetadataNumberChange,
    handleSave,
    handleRevert,
  } = useEditItemDetailsFormState({
    item,
    triggerFlash,
    onSaved,
  });

  return (
    <S.Form onSubmit={handleSave}>
      <S.Fieldset disabled={saving}>
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
          onMetadataChange={handleMetadataChange}
          onMetadataNumberChange={handleMetadataNumberChange}
        />

        <EditItemFormActions
          saving={saving}
          isDirty={isDirty}
          onRevert={handleRevert}
          onCancel={onCancel}
        />
      </S.Fieldset>
    </S.Form>
  );
}
