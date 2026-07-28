// src/components/TabControlBar.jsx
import React from 'react';
import styled, { css } from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
} from '../styles/tokens';

const Bar = styled.div`
  display: inline-flex;
  gap: 4px;
  margin: 8px 0;
  padding: 3px;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 999px;
  background: rgba(7, 11, 16, 0.72);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 6px;
    margin: 8px 0;
  }
`;

const Btn = styled.button`
  all: unset;
  cursor: pointer;
  text-align: center;
  padding: 5px 16px;
  border-radius: 999px;
  border: 0;
  background: transparent;
  transition:
    transform 0.05s ease,
    background 0.2s ease,
    border-color 0.2s ease;
  user-select: none;
  min-height: 34px;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 8px 7px;
    border-radius: 10px;
    font-size: ${MOBILE_FONT_SM};
    letter-spacing: 0.01em;
  }

  ${({ $active }) =>
    $active &&
    css`
      color: #f4f7fa;
      background: linear-gradient(110deg, rgba(76,198,193,.16), rgba(167,139,250,.12));
      box-shadow: inset 0 0 0 1px rgba(99, 215, 207, 0.26);
    `}

  &:active {
    transform: translateY(1px);
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

export default function TabControlBar({ mode, onChange, busy = false, showTree = true }) {
  if (!showTree) return null;
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
    </Bar>
  );
}
