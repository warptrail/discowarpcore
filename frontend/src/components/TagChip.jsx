import React from 'react';
import * as S from '../styles/TagChip.styles';
import TagNavigationLink from './TagNavigationLink';
import { getTagHref, normalizeTagName } from '../util/tagNavigation';

export default function TagChip({ tag, onDelete }) {
  if (!tag || typeof tag.value !== 'string') return null;
  const { value, status = 'unchanged' } = tag;

  return (
    <S.Chip $status={status} data-tag-status={status}>
      {onDelete ? <S.Text $status={status}>{value}</S.Text> : <S.Text as={TagNavigationLink} to={getTagHref(value)} $status={status}
        onClick={event => event.stopPropagation()}>#{normalizeTagName(value)}</S.Text>}
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
