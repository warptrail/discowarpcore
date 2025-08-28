import React, { useState, useEffect } from 'react';
import TagInput from './TagInput';
import TagBubble from './TagBubble';
import styled from 'styled-components';

// TODO The yellow-dashed line should go away after we save, right now it persists.

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
  newTagSet = new Set(),
  onTagsChange,
  justSaved = false,
  flashTagSet,
}) {
  const [tags, setTags] = useState(initialTags);

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  const addTag = (newTag) => {
    if (!newTag || tags.includes(newTag)) return;

    const updatedTags = [...tags, newTag];
    setTags(updatedTags);
    onTagsChange?.(updatedTags); // ✅ fire only on actual change
  };

  const removeTag = (tagToRemove) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(updatedTags);
    onTagsChange?.(updatedTags); // ✅ fire only when user removes something
  };

  return (
    <TagEditorWrapper>
      {tags.map((tag) => (
        <TagBubble
          key={tag}
          tag={tag}
          onRemove={() => removeTag(tag)}
          isNew={newTagSet.has(tag)}
          isFlashing={justSaved && flashTagSet.has(tag)} // 👈 this is key
        />
      ))}
      <TagInput onAdd={addTag} />
    </TagEditorWrapper>
  );
}
