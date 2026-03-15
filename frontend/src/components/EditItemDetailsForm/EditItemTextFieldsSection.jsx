import React from 'react';
import * as S from '../../styles/EditItemDetailsForm.styles';

export default function EditItemTextFieldsSection({
  formData,
  onTextChange,
  ownership,
}) {
  const isBoxed = !!ownership?.isBoxed;
  const parentBoxLabel = ownership?.parentBoxLabel || '';
  const inheritedLocation = ownership?.inheritedLocation || formData.location || '';

  return (
    <>
      <S.Field>
        <S.Label>Name</S.Label>
        <S.Input
          name="name"
          value={formData.name || ''}
          onChange={onTextChange}
        />
      </S.Field>

      <S.Field>
        <S.Label>Description</S.Label>
        <S.TextArea
          name="description"
          value={formData.description || ''}
          onChange={onTextChange}
        />
      </S.Field>

      <S.Field>
        <S.Label>Notes</S.Label>
        <S.TextArea
          name="notes"
          value={formData.notes || ''}
          onChange={onTextChange}
        />
      </S.Field>

      <S.Field>
        <S.Label>Location</S.Label>
        <S.Input
          name="location"
          value={isBoxed ? inheritedLocation : formData.location || ''}
          onChange={onTextChange}
          disabled={isBoxed}
          readOnly={isBoxed}
          placeholder={isBoxed ? 'Inherited from parent box' : 'Room, shelf, area...'}
        />
        {isBoxed ? (
          <S.FieldHint>
            Location is inherited from parent box
            {parentBoxLabel ? ` (${parentBoxLabel})` : ''}.
          </S.FieldHint>
        ) : null}
      </S.Field>
    </>
  );
}
