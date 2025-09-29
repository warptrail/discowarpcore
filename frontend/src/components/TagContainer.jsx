import React, { useState, useEffect } from 'react';
import * as S from '../styles/TagContainer.styles';
import TagChip from './TagChip';

export default function TagContainer({ tags = [], onChange, mode = 'view' }) {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const newTag = { value: inputValue.trim(), status: 'new' };
    onChange([...tags, newTag]); // bubble to EditItemDetailsForm
    setInputValue('');
  };

  const handleRemoveTag = (index) => {
    const updated = tags.map((t, i) =>
      i === index ? { ...t, status: 'delete' } : t
    );
    onChange(updated); // bubble to EditItemDetailsForm
  };

  return (
    <S.Container>
      <S.TagList>
        {tags.map((tag, i) => (
          <TagChip
            key={`${tag.value}-${i}`}
            tag={tag}
            onDelete={() => handleRemoveTag(i)} // ✅ now wired
            mode={mode}
          />
        ))}
      </S.TagList>

      {mode === 'edit' && (
        <S.InputRow onSubmit={handleAddTag}>
          <S.Input
            type="text"
            placeholder="Add tag..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <S.AddButton type="submit">+</S.AddButton>
        </S.InputRow>
      )}
    </S.Container>
  );
}
