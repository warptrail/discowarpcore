import React from 'react';

import QuantityInput from './QuantityInput';
import TagEdit from './TagEdit';
import * as S from './ItemEditForm.styles';

export default function ItemEditFieldsForm({
  formData,
  onFieldChange,
  onQuantityChange,
  onTagsChange,
  saveSuccess,
  savedTags,
  flashTagSet,
  onClose,
  onSave,
  isDisabled,
  buttonContent,
}) {
  return (
    <>
      <S.Label>
        Name:
        <S.Input
          type="text"
          name="name"
          value={formData.name}
          onChange={onFieldChange}
        />
      </S.Label>

      <S.Label>
        Notes:
        <S.Input
          type="textarea"
          name="notes"
          value={formData.notes}
          onChange={onFieldChange}
        />
      </S.Label>

      <S.Label>Tags:</S.Label>
      <TagEdit
        initialTags={formData.tags}
        onTagsChange={onTagsChange}
        justSaved={saveSuccess}
        newTagSet={new Set(formData.tags.filter((tag) => !savedTags.includes(tag)))}
        flashTagSet={flashTagSet}
      />

      <S.Label>Quantity:</S.Label>
      <QuantityInput value={formData.quantity} onChange={onQuantityChange} />

      <S.ButtonRow>
        <S.Button type="button" $variant="close" onClick={onClose}>
          Close
        </S.Button>

        <S.Button type="button" onClick={onSave} disabled={isDisabled}>
          {buttonContent}
        </S.Button>
      </S.ButtonRow>
    </>
  );
}
