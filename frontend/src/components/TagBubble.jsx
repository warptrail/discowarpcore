import React from 'react';
import styled from 'styled-components';

const Bubble = styled.div`
  display: inline-flex;
  align-items: center;
  background: ${({ isNew, justSaved }) =>
    justSaved ? '#144' : isNew ? '#222' : '#333'};
  color: #fff;
  padding: 0.25rem 0.5rem;
  margin: 0.1rem 0.13rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  border: ${({ isNew, justSaved }) =>
    justSaved
      ? '2px solid #0f0'
      : isNew
      ? '2px dashed yellow'
      : '1px solid #555'};
  transition: all 0.2s ease;
`;

const RemoveButton = styled.button`
  background: transparent;
  border: none;
  color: grey;
  font-weight: bold;
  margin-left: 0.5rem;
  cursor: pointer;

  &:hover {
    color: #f44;
  }
`;

export default function TagBubble({ tag, onRemove, isNew, justSaved }) {
  return (
    <Bubble isNew={isNew} justSaved={justSaved}>
      {tag}
      <RemoveButton onClick={onRemove}>×</RemoveButton>
    </Bubble>
  );
}
