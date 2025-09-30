import React, { useState } from 'react';
import TagChip from './TagChip';
import * as S from '../styles/TagContainer.styles';

export default function TagContainer({ tags = [], onChange, mode = 'view' }) {
  const [draft, setDraft] = useState('');

  const hasTag = (val) =>
    tags.some((t) => (t?.value || '').toLowerCase() === val.toLowerCase());

  const stageNewTag = () => {
    const value = draft.trim();
    if (!value) return;
    if (hasTag(value)) {
      setDraft('');
      return;
    }
    const next = [...tags, { value, status: 'new' }];
    onChange?.(next);
    setDraft('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      stageNewTag();
    }
  };

  const handleToggleDeleteByIndex = (index) => {
    const next = tags.map((t, i) =>
      i === index
        ? { ...t, status: t.status === 'deleted' ? 'unchanged' : 'deleted' }
        : t
    );
    onChange?.(next);
  };

  return (
    <S.Container>
      <S.TagList>
        {tags.map((tag, i) => (
          <TagChip
            key={`${tag?.value ?? 'tag'}-${i}`}
            tag={tag}
            onDelete={
              mode === 'edit' ? () => handleToggleDeleteByIndex(i) : undefined
            }
          />
        ))}

        {mode === 'edit' && (
          <S.InputChip>
            <S.Input
              type="text"
              placeholder="Add tag…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <S.AddButton type="button" onClick={stageNewTag}>
              +
            </S.AddButton>
          </S.InputChip>
        )}
      </S.TagList>
    </S.Container>
  );
}
