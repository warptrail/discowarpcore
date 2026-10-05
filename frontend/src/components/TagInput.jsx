import { inputStyles, controlStyles } from '../styles/primitives';
import React, { useState } from 'react';
import styled from 'styled-components';

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  max-width: 100%;
  flex: 1 1 160px;
`;

const Input = styled.input`
  background: transparent;
  color: var(--dw-text);
  font-size: 1rem;
  border: none;
  outline: none;
  min-width: 0;
  width: 100%;
  flex: 1;
  padding: 0.25rem;
  padding-left: 0.4rem;
  border-left: 1px solid var(--dw-border);

  ${inputStyles}
`;

const AddButton = styled.button`
  background: var(--dw-surface-raised);
  color: var(--dw-text);
  font-size: 1.25rem;
  min-width: 44px;
  min-height: 44px;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  padding: 0.25rem 0.5rem;
  cursor: pointer;

  &:hover {
    background-color: var(--dw-surface);
  }

  flex: 0 0 40px;
  width: 40px;

  ${controlStyles}
  color: var(--dw-cyan);
  border-color: var(--dw-cyan);
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
        aria-label="New tag"
      />
      <AddButton type="button" onClick={handleAdd} disabled={!value.trim()} aria-label="Add tag">+</AddButton>
    </InputWrapper>
  );
}
