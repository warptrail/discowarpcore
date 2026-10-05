import { controlStyles } from '../styles/primitives';
import React from 'react';
import styled, { css } from 'styled-components';
import { MOBILE_BREAKPOINT } from '../styles/tokens';

const Bar = styled.div`
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  min-width: 0;
  gap: 1.35rem;
  width: 100%;
  margin: 0.16rem 0 0.55rem;
  padding: 0.6rem 0 0;
  border-top: 1px solid var(--dw-border);
  border-bottom: 1px solid var(--dw-border-soft);
  background: var(--dw-surface);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    align-items: stretch;
    gap: 0.72rem;
    padding-top: 0.52rem;
  }
`;

const Group = styled.fieldset`
  display: grid;
  grid-template-columns: repeat(2, minmax(6.8rem, auto));
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    flex: 1 1 0;
  }
`;

const Legend = styled.legend`
  grid-column: 1 / -1;
  padding: 0 0 0.34rem;
  color: var(--dw-text-secondary);
  font: 700 0.75rem/1 var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-transform: none;
`;

const Btn = styled.button`
  ${controlStyles}
  appearance: none;
  position: relative;
  min-width: 0;
  min-height: 44px;
  padding: 0.42rem 0.72rem 0.62rem;
  border: 0;
  border-right: 1px solid rgba(127, 215, 255, 0.1);
  border-radius: 0;
  cursor: pointer;
  color: var(--dw-text-secondary);
  background: transparent;
  font: 700 0.75rem/1.1 var(--dw-font-ui);
  letter-spacing: 0.01em;
  text-align: left;
  transition: color 180ms ease, background 180ms ease;
  user-select: none;

  &::after {
    content: '';
    position: absolute;
    right: 0.68rem;
    bottom: -1px;
    left: 0.68rem;
    height: 2px;
    background: transparent;
    transition: background 180ms ease, box-shadow 180ms ease;
  }

  ${({ $active }) =>
    $active &&
    css`
      color: rgba(229, 255, 251, 0.96);
      background: var(--dw-surface-raised);

      &::after {
        background: var(--dw-amber);
        box-shadow: none;
      }
    `}

  &:hover:not(:disabled) {
    color: rgba(239, 247, 255, 0.94);
    background: rgba(103, 86, 158, 0.09);
  }

  &:focus-visible {
    z-index: 1;
    outline: 2px solid rgba(127, 215, 255, 0.76);
    outline-offset: -2px;
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: 44px;
    padding-inline: 0.5rem;
    font-size: 0.75rem;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &::after {
      transition: none;
    }
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
    <Bar aria-label="Box browsing controls">
      <Group aria-label="Content organization">
        <Legend>Content organization</Legend>
        <Btn
          type="button"
          $active={mode === 'flat'}
          onClick={() => onChange?.('flat')}
          disabled={busy}
          aria-pressed={mode === 'flat'}
        >
          All items
        </Btn>
        <Btn
          type="button"
          $active={mode === 'tree'}
          onClick={() => onChange?.('tree')}
          disabled={busy}
          aria-pressed={mode === 'tree'}
        >
          {hasChildBoxes ? 'Box tree' : 'Hierarchy'}
        </Btn>
      </Group>

      {mode === 'tree' ? (
        <Group aria-label="Row detail">
          <Legend>Row detail</Legend>
          <Btn
            type="button"
            $active={viewMode === 'condensed'}
            onClick={() => onViewModeChange?.('condensed')}
            disabled={busy}
            aria-pressed={viewMode === 'condensed'}
          >
            Detailed
          </Btn>
          <Btn
            type="button"
            $active={viewMode === 'full'}
            onClick={() => onViewModeChange?.('full')}
            disabled={busy}
            aria-pressed={viewMode === 'full'}
          >
            Compact
          </Btn>
        </Group>
      ) : null}
    </Bar>
  );
}
