// BoxControlBar.jsx
import React from 'react';
import styled, { css } from 'styled-components';

const Bar = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr 1fr; /* mobile: 2x2 */
  @media (min-width: 640px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }
  margin: 12px 0;
`;

const btnActiveStyles = css`
  border-color: #4ec77b;
  background: #19231d;
  box-shadow: 0 0 0 2px rgba(78, 199, 123, 0.15) inset;
  color: #e9fcee;
`;

const Btn = styled.button`
  width: 100%;
  padding: 12px 10px;
  border-radius: 10px;
  border: 1px solid #2f2f2f;
  background: #1f1f1f;
  color: #eaeaea;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.08s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;

  &:hover {
    border-color: #4ec77b;
    box-shadow: 0 0 6px rgba(78, 199, 123, 0.35);
  }
  &:active {
    transform: translateY(1px);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${(props) => props.$active && btnActiveStyles}
`;

const dangerBtnActiveStyles = css`
  border-color: #ff4d4f;
  background: #2a1616;
  box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2) inset;
`;

const DangerBtn = styled(Btn)`
  border-color: #3a2323;

  &:hover {
    border-color: #ff4d4f;
    background: #2a1616;
    box-shadow: 0 0 6px rgba(255, 77, 79, 0.35);
  }

  ${(props) => props.$active && dangerBtnActiveStyles}
`;

/*
 * Props:
 * - active: null | 'nest' | 'edit' | 'destroy'
 * - onClickEmpty, onClickNest, onClickEdit, onClickDestroy
 * - busy?: boolean
 */

export default function BoxControlBar({
  active,
  onClickEmpty,
  onClickNest,
  onClickEdit,
  onClickDestroy,
  busy = false,
}) {
  return (
    <Bar>
      <Btn
        type="button"
        disabled={busy || !onClickEmpty}
        onClick={onClickEmpty}
        aria-label="Empty this box"
        title="Empty this box"
        aria-pressed={false}
      >
        Empty
      </Btn>

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
        disabled={busy || !onClickEdit}
        onClick={onClickEdit}
        $active={active === 'edit'}
        aria-pressed={active === 'edit'}
        aria-label="Edit box details"
        title="Edit box details"
      >
        Edit details
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
