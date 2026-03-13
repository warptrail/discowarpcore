import React from 'react';
import * as S from '../styles/EditItemDetailsForm.styles';

import EditItemTextFieldsSection from './EditItemDetailsForm/EditItemTextFieldsSection';
import EditItemTagsSection from './EditItemDetailsForm/EditItemTagsSection';
import EditItemQuantitySection from './EditItemDetailsForm/EditItemQuantitySection';
import EditItemStructuredFieldsSection from './EditItemDetailsForm/EditItemStructuredFieldsSection';
import EditItemFormActions from './EditItemDetailsForm/EditItemFormActions';
import useEditItemDetailsFormState from './EditItemDetailsForm/useEditItemDetailsFormState';

export default function EditItemDetailsForm({ item, triggerFlash, onSaved }) {
  const {
    formData,
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
        <EditItemTextFieldsSection
          formData={formData}
          onTextChange={handleTextChange}
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
        />
      </S.Fieldset>
    </S.Form>
  );
}
