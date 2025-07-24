import React, { useState } from 'react';
import styled from 'styled-components';

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.5rem;
`;

const Input = styled.input`
  background: transparent;
  color: #0f0;
  font-size: 1rem;
  border: none;
  outline: none;
  min-width: 100px;
  padding: 0.25rem;
  padding-left: 0.4rem;
  border-left: 1px solid grey;
`;

const AddButton = styled.button`
  background: #222;
  color: #0f0;
  font-size: 1.25rem;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;

  &:hover {
    background-color: #333;
  }

  &:active {
    transform: scale(0.95);
  }
`;

export default function TagInput({ onAdd }) {
  const [value, setValue] = useState('');

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <InputWrapper>
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add tag"
      />
      <AddButton onClick={handleAdd}>+</AddButton>
    </InputWrapper>
  );
}
