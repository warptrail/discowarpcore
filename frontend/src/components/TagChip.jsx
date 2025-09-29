import React from 'react';
import * as S from '../styles/TagChip.styles';

export default function TagChip({ tag, onDelete }) {
  if (!tag || typeof tag.value !== 'string') return null;
  const { value, status = 'unchanged' } = tag;

  return (
    <S.Chip $status={status}>
      <S.Text $status={status}>{value}</S.Text>
      {onDelete && (
        <S.RemoveButton
          type="button"
          onClick={onDelete}
          aria-label={`Remove ${value}`}
        >
          ×
        </S.RemoveButton>
      )}
    </S.Chip>
  );
}
