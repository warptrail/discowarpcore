import React from 'react';
import styled from 'styled-components';

const Bubble = styled.div`
  display: inline-block;
  background-color: none;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  margin: 0.25rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  border: ${(props) => {
    if (props.$isFlashing) return '2px solid #4CAF50'; // ✅ flashing green
    if (props.$isNew) return '2px dashed gold'; // 🟡 new tag
    return '1px solid #ccc'; // ⚪ default
  }};
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

export default function TagBubble({ tag, onRemove, isNew, isFlashing }) {
  return (
    <Bubble $isNew={isNew} $isFlashing={isFlashing}>
      {tag}
      <RemoveButton onClick={onRemove}>×</RemoveButton>
    </Bubble>
  );
}
