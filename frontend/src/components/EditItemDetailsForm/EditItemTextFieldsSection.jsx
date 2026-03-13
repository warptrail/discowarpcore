import React from 'react';
import * as S from '../../styles/EditItemDetailsForm.styles';

export default function EditItemTextFieldsSection({ formData, onTextChange }) {
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
    </>
  );
}
