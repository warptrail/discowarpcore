import React from 'react';
import TagContainer from '../TagContainer';
import * as S from '../../styles/EditItemDetailsForm.styles';

export default function EditItemTagsSection({ tags, onTagsChange }) {
  return (
    <S.Field>
      <S.Label>Tags</S.Label>
      <TagContainer tags={tags} onChange={onTagsChange} mode="edit" />
    </S.Field>
  );
}
