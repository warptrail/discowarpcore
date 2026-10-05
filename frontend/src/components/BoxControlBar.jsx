import { controlStyles } from '../styles/primitives';
// BoxControlBar.jsx
import React from 'react';
import styled, { css } from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
} from '../styles/tokens';

const Bar = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  @media (max-width: 639px) {
    & > *:last-child:nth-child(odd) {
      grid-column: 1 / -1;
    }
  }
  @media (min-width: 640px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }
  margin: 12px 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 6px;
    margin: 8px 0;
  }
`;

const btnActiveStyles = css`
  border-color: var(--dw-cyan);
  box-shadow: inset 3px 0 0 var(--dw-amber);
  background: var(--dw-surface-raised);
  color: var(--dw-text);
`;

const Btn = styled.button`
  ${controlStyles}
  width: 100%;
  padding: 12px 10px;
  border-radius: var(--dw-radius);
  border: 1px solid rgba(230, 237, 243, 0.16);
  background: var(--dw-surface);
  color: var(--dw-text);
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.08s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;

  &:hover {
    border-color: var(--dw-teal);
  }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
  &:active {
    transform: translateY(1px);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 8px 7px;
    border-radius: var(--dw-radius);
    font-size: ${MOBILE_FONT_SM};
    letter-spacing: 0.01em;
  }

  ${(props) => props.$active && btnActiveStyles}
`;

const warningBtnActiveStyles = css`
  border-color: var(--dw-amber);
  background: rgba(232, 177, 92, 0.1);
  color: var(--dw-amber);
`;

const WarningBtn = styled(Btn)`
  border-color: rgba(232, 177, 92, 0.3);

  &:hover {
    border-color: var(--dw-amber);
    background: rgba(232, 177, 92, 0.1);
  }

  ${(props) => props.$active && warningBtnActiveStyles}
`;

const dangerBtnActiveStyles = css`
  border-color: var(--dw-coral);
  background: rgba(240, 138, 123, 0.1);
`;

const DangerBtn = styled(Btn)`
  border-color: rgba(240, 138, 123, 0.3);

  &:hover {
    border-color: var(--dw-coral);
    background: rgba(240, 138, 123, 0.1);
  }

  ${(props) => props.$active && dangerBtnActiveStyles}
`;

/*
 * Props:
 * - active: null | 'empty' | 'nest' | 'export' | 'destroy'
 * - onClickEmpty, onClickNest, onClickExport, onClickDestroy
 * - busy?: boolean
 */

export default function BoxControlBar({
  active,
  onClickEmpty,
  onClickNest,
  onClickExport,
  onClickDestroy,
  busy = false,
}) {
  return (
    <Bar>
      <WarningBtn
        type="button"
        disabled={busy || !onClickEmpty}
        onClick={onClickEmpty}
        $active={active === 'empty'}
        aria-label="Empty this box"
        title="Empty this box"
        aria-pressed={active === 'empty'}
      >
        Empty
      </WarningBtn>

      <Btn
        type="button"
        disabled={busy || !onClickNest}
        onClick={onClickNest}
        $active={active === 'nest'}
        aria-pressed={active === 'nest'}
        aria-label="Nest in another box"
        title="Nest in another box"
      >
        Nest in another box
      </Btn>

      <Btn
        type="button"
        disabled={busy || !onClickExport}
        onClick={onClickExport}
        $active={active === 'export'}
        aria-pressed={active === 'export'}
        aria-label="Export this box"
        title="Export this box"
      >
        Export
      </Btn>

      <DangerBtn
        type="button"
        disabled={busy || !onClickDestroy}
        onClick={onClickDestroy}
        $active={active === 'destroy'}
        aria-pressed={active === 'destroy'}
        aria-label="Destroy this box"
        title="Destroy this box"
      >
        Destroy box
      </DangerBtn>
    </Bar>
  );
}
