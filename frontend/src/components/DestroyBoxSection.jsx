import React from 'react';
import styled, { keyframes } from 'styled-components';

const riseIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const ConfirmWrap = styled.section`
  margin: 0;
  border: 1px solid #7a2a2a;
  border-radius: 12px;
  background:
    linear-gradient(
      180deg,
      rgba(126, 33, 33, 0.34) 0%,
      rgba(37, 14, 14, 0.95) 56%,
      rgba(24, 12, 12, 0.98) 100%
    ),
    #170f0f;
  box-shadow:
    0 -10px 20px rgba(255, 110, 110, 0.18),
    0 0 0 1px rgba(255, 104, 104, 0.2) inset;
  padding: 1rem;
  animation: ${riseIn} 220ms ease-out;
`;

const Banner = styled.div`
  font-weight: 800;
  letter-spacing: 0.02em;
  font-size: 1.02rem;
  color: #ffd9d9;
  margin-bottom: 0.65rem;
`;

const Body = styled.div`
  display: grid;
  gap: 0.65rem;
  color: #f3e6e6;
`;

const Intro = styled.p`
  margin: 0;
  line-height: 1.38;
`;

const ConsequenceList = styled.ul`
  margin: 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.3rem;
  color: #f7d3d3;
`;

const Prompt = styled.label`
  margin-top: 0.2rem;
  display: block;
  font-weight: 700;
  color: #ffe9e9;
`;

const ConfirmInput = styled.input`
  width: 100%;
  margin-top: 0.45rem;
  padding: 0.65rem 0.7rem;
  border-radius: 8px;
  border: 1px solid #6e3b3b;
  background: #120f0f;
  color: #fff;
  font-size: 0.98rem;

  &:focus {
    outline: none;
    border-color: #ff7f7f;
    box-shadow: 0 0 0 2px rgba(255, 127, 127, 0.25);
  }
`;

const ActionRow = styled.div`
  margin-top: 0.2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
`;

const ActionBtn = styled.button`
  border-radius: 8px;
  border: 1px solid #3f3f3f;
  background: #202020;
  color: #e8e8e8;
  padding: 0.5rem 0.8rem;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #2a2a2a;
    border-color: #585858;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const DestroyBtn = styled(ActionBtn)`
  border-color: #8a2e2e;
  background: #3b1111;
  color: #ffd5d5;

  &:hover:not(:disabled) {
    background: #4a1616;
    border-color: #bf4949;
  }
`;

export default function DestroyBoxSection({
  busy,
  shortId,
  confirmText,
  onConfirmTextChange,
  isConfirmValid,
  onCancel,
  onConfirm,
}) {
  const canDestroy = !!isConfirmValid && !busy && typeof onConfirm === 'function';

  return (
    <ConfirmWrap>
      <Banner>WRECKING BALL CONFIRMATION</Banner>

      <Body>
        <Intro>
          You are about to destroy box <strong>#{shortId}</strong>. This is
          permanent and cannot be undone.
        </Intro>

        <ConsequenceList>
          <li>The box itself will be deleted.</li>
          <li>Direct items in this box will be orphaned.</li>
          <li>Direct child boxes will be released to floor level.</li>
        </ConsequenceList>

        <Prompt>
          Type exactly <code>DESTROY</code> to unlock the destructive action.
          <ConfirmInput
            value={confirmText}
            onChange={(e) => onConfirmTextChange?.(e.target.value)}
            disabled={busy}
            placeholder="DESTROY"
            autoComplete="off"
            spellCheck={false}
          />
        </Prompt>

        <ActionRow>
          <ActionBtn type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </ActionBtn>
          <DestroyBtn
            type="button"
            onClick={onConfirm}
            disabled={!canDestroy}
            aria-disabled={!canDestroy}
            title={
              canDestroy ? 'Destroy this box now' : 'Type DESTROY to enable'
            }
          >
            {busy ? 'Destroying...' : 'Destroy Box'}
          </DestroyBtn>
        </ActionRow>
      </Body>
    </ConfirmWrap>
  );
}
