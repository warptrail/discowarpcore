import { controlStyles, inputStyles } from '../styles/primitives';
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
  border: 1px solid rgba(240, 138, 123, 0.42);
  border-radius: var(--dw-radius);
  background: var(--dw-surface);
  padding: 1rem;
  animation: ${riseIn} 220ms ease-out;
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

const Banner = styled.div`
  font-weight: 700;
  letter-spacing: 0.01em;
  font-size: 1.02rem;
  color: var(--dw-coral);
  margin-bottom: 0.65rem;
`;

const Body = styled.div`
  display: grid;
  gap: 0.65rem;
  color: var(--dw-text);
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
  color: var(--dw-text-secondary);
`;

const Prompt = styled.label`
  margin-top: 0.2rem;
  display: block;
  font-weight: 700;
  color: var(--dw-text);
`;

const ConfirmInput = styled.input`
  ${inputStyles}
  width: 100%;
  margin-top: 0.45rem;
  padding: 0.65rem 0.7rem;
  border-radius: var(--dw-radius);
  border: 1px solid rgba(240, 138, 123, 0.42);
  background: var(--dw-background);
  color: var(--dw-text);
  font-size: 0.98rem;

  &:focus {
    outline: 2px solid var(--dw-cyan);
    outline-offset: 2px;
    border-color: var(--dw-coral);
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
  ${controlStyles}
  border-radius: var(--dw-radius);
  border: 1px solid rgba(230, 237, 243, 0.16);
  background: var(--dw-surface-raised);
  color: var(--dw-text);
  padding: 0.5rem 0.8rem;
  min-height: 44px;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--dw-surface-raised);
    border-color: var(--dw-cyan);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
`;

const DestroyBtn = styled(ActionBtn)`
  border-color: rgba(240, 138, 123, 0.42);
  background: rgba(240, 138, 123, 0.12);
  color: var(--dw-coral);

  &:hover:not(:disabled) {
    background: rgba(240, 138, 123, 0.18);
    border-color: var(--dw-coral);
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
