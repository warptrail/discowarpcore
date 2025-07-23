import React, { useState, useEffect } from 'react';
import TagInput from './TagInput';
import TagBubble from './TagBubble';
import styled from 'styled-components';

const TagEditorWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  background: #111;
  border: 2px solid #333;
  border-radius: 8px;
  padding: 0.5rem;
`;

export default function TagEdit({
  initialTags = [],
  onTagsChange,
  newTagSet = new Set(),
  saveSuccess = false,
}) {
  const [tags, setTags] = useState(initialTags);

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  useEffect(() => {
    console.log('Tags changed:', tags);

    onTagsChange?.(tags);
  }, [tags]);

  const addTag = (newTag) => {
    if (!newTag || tags.includes(newTag)) return;
    setTags([...tags, newTag]);
  };

  const removeTag = (tagToRemove) => {
    setTags((prevTags) => prevTags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <TagEditorWrapper>
      {tags.map((tag) => (
        <TagBubble
          key={tag}
          tag={tag}
          onRemove={() => removeTag(tag)}
          isNew={newTagSet.has(tag)}
          justSaved={saveSuccess}
        />
      ))}
      <TagInput onAdd={addTag} />
    </TagEditorWrapper>
  );
}
