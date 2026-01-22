// src/components/TabControlBar.jsx
import React from 'react';
import styled, { css } from 'styled-components';

const Bar = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 12px 0;
`;

const Btn = styled.button`
  all: unset;
  cursor: pointer;
  text-align: center;
  padding: 10px 12px;
  border-radius: 14px; /* slight LCARS */
  border: 1px solid #2a2a2a;
  background: #111; /* dark mode */
  transition:
    transform 0.05s ease,
    background 0.2s ease,
    border-color 0.2s ease;
  user-select: none;

  ${({ $active }) =>
    $active &&
    css`
      background: #17191c;
      border-color: #55c0ff;
      box-shadow: inset 0 0 0 1px rgba(85, 192, 255, 0.25);
    `}

  &:active {
    transform: translateY(1px);
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

export default function TabControlBar({ mode, onChange, busy = false }) {
  // mode: 'boxes' | 'flat' | 'edit'
  return (
    <Bar>
      <Btn
        type="button"
        $active={mode === 'tree'}
        onClick={() => onChange?.('tree')}
        disabled={busy}
      >
        Box Tree
      </Btn>
      <Btn
        type="button"
        $active={mode === 'flat'}
        onClick={() => onChange?.('flat')}
        disabled={busy}
      >
        Flat Items
      </Btn>
      <Btn
        type="button"
        $active={mode === 'edit'}
        onClick={() => onChange?.('edit')}
        disabled={busy}
      >
        Box Actions
      </Btn>
    </Bar>
  );
}
