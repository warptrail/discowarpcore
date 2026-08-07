// src/components/TabControlBar.jsx
import React from 'react';
import styled, { css } from 'styled-components';
import { MOBILE_BREAKPOINT } from '../styles/tokens';

const Bar = styled.div`
  display: inline-flex;
  align-items: stretch;
  gap: 0.35rem;
  max-width: 100%;
  margin: 0.12rem 0 0.42rem;
  padding: 2px 0.28rem 2px 2px;
  border: 1px solid rgba(76, 198, 193, 0.25);
  border-radius: 7px;
  background: rgba(7, 13, 19, 0.88);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin: 0.08rem 0 0.36rem;
    gap: 0.2rem;
  }
`;

const Group = styled.div`
  display: inline-flex;
  gap: 2px;
  min-width: 0;
`;

const Divider = styled.span`
  align-self: center;
  width: 1px;
  height: 24px;
  background: rgba(167, 139, 250, 0.28);
`;

const Btn = styled.button`
  appearance: none;
  min-width: 5.4rem;
  min-height: 40px;
  padding: 0.42rem 0.7rem;
  border: 1px solid transparent;
  border-radius: 5px;
  cursor: pointer;
  color: rgba(185, 205, 216, 0.72);
  background: transparent;
  font: 700 0.68rem/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
  transition:
    color 180ms ease,
    background 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
  user-select: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-width: 0;
    flex: 1 1 0;
    padding: 0.48rem 0.44rem;
    border-radius: 4px;
  }

  ${({ $active }) =>
    $active &&
    css`
      color: rgba(229, 255, 251, 0.96);
      border-color: rgba(76, 198, 193, 0.52);
      background: rgba(45, 154, 151, 0.14);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.05),
        0 0 12px rgba(76, 198, 193, 0.08);
    `}

  &:hover:not(:disabled) {
    color: rgba(239, 247, 255, 0.94);
    border-color: rgba(167, 139, 250, 0.38);
    background: rgba(103, 86, 158, 0.1);
  }

  &:focus-visible {
    outline: 2px solid rgba(127, 215, 255, 0.72);
    outline-offset: 2px;
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export default function TabControlBar({
  mode,
  onChange,
  busy = false,
  showTree = true,
  hasChildBoxes = true,
  viewMode = 'full',
  onViewModeChange,
}) {
  if (!showTree) return null;

  return (
    <Bar aria-label="Box view and presentation" role="group">
      <Group aria-label="Box scope" role="group">
        <Btn
          type="button"
          $active={mode === 'flat'}
          onClick={() => onChange?.('flat')}
          disabled={busy}
          aria-pressed={mode === 'flat'}
        >
          Items
        </Btn>
        <Btn
          type="button"
          $active={mode === 'tree'}
          onClick={() => onChange?.('tree')}
          disabled={busy}
          aria-pressed={mode === 'tree'}
        >
          {hasChildBoxes ? 'Tree' : 'List'}
        </Btn>
      </Group>
      <Divider aria-hidden="true" />
      <Group aria-label="Tree presentation" role="group">
        <Btn
          type="button"
          $active={viewMode === 'full'}
          onClick={() => onViewModeChange?.('full')}
          disabled={busy}
          aria-pressed={viewMode === 'full'}
        >
          Full View
        </Btn>
        <Btn
          type="button"
          $active={viewMode === 'condensed'}
          onClick={() => onViewModeChange?.('condensed')}
          disabled={busy}
          aria-pressed={viewMode === 'condensed'}
        >
          Condensed
        </Btn>
      </Group>
    </Bar>
  );
}
