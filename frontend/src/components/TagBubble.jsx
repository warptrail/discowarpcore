import { controlStyles } from '../styles/primitives';
import React from 'react';
import styled from 'styled-components';

const Bubble = styled.div`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  overflow-wrap: anywhere;
  background-color: var(--dw-surface-raised);
  color: var(--dw-text);
  padding: 0.25rem 0.5rem;
  border-radius: var(--dw-radius);
  font-size: 0.875rem;
  margin: 0.25rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  border: ${(props) => {
    if (props.$isFlashing) return '1px solid var(--dw-teal)';
    if (props.$isNew) return '1px dashed var(--dw-amber)';
    return '1px solid rgba(230, 237, 243, 0.16)';
  }};
`;

const RemoveButton = styled.button`
  ${controlStyles}
  background: transparent;
  border: none;
  color: var(--dw-text-muted);
  font-weight: bold;
  min-width: 44px;
  min-height: 44px;
  margin-left: 0.5rem;
  cursor: pointer;

  &:hover {
    color: var(--dw-coral);
  }
`;

export default function TagBubble({ tag, onRemove, isNew, isFlashing }) {
  return (
    <Bubble $isNew={isNew} $isFlashing={isFlashing}>
      {tag}
      <RemoveButton type="button" onClick={onRemove} aria-label={`Remove ${tag}`}>×</RemoveButton>
    </Bubble>
  );
}
