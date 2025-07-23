import React, { useState } from 'react';
import styled from 'styled-components';

const Input = styled.input`
  flex: 1;
  min-width: 120px;
  border: none;
  background: transparent;
  color: #0f0;
  font-size: 1rem;
  outline: none;
  padding: 0.25rem;
`;

export default function TagInput({ onAdd }) {
  const [value, setValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const newTag = value.trim();
      if (newTag) {
        onAdd(newTag);
        setValue('');
      }
      e.preventDefault();
    }
  };

  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Add tag"
    />
  );
}
