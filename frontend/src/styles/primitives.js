import styled, { css } from 'styled-components';

// Layout-neutral foundations: components own width, placement and content.
export const controlStyles = css`
  appearance: none;
  min-height: var(--dw-control-height, 40px);
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm, 4px);
  padding: 0.5rem 0.75rem;
  background: var(--dw-surface-raised);
  color: var(--dw-text);
  font-family: var(--dw-font-ui);
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: 0;
  text-transform: none;
  cursor: pointer;
  transition: background 160ms ease, border-color 160ms ease;
  &:hover:not(:disabled) { border-color: var(--dw-cyan); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 3px; }
  &:disabled { opacity: 0.48; cursor: not-allowed; }
  @media (pointer: coarse) { min-height: 44px; }
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;

export const inputStyles = css`
  min-height: var(--dw-control-height, 40px);
  min-width: 0;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm, 4px);
  padding: 0.6rem 0.75rem;
  background: var(--dw-background);
  color: var(--dw-text);
  font-family: var(--dw-font-ui);
  font-size: 0.9rem;
  line-height: 1.4;
  letter-spacing: 0;
  &::placeholder { color: var(--dw-text-muted); opacity: 1; }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &[aria-invalid='true'] { border-color: var(--dw-coral); }
`;

export const panelStyles = css`
  min-width: 0;
  color: var(--dw-text);
  background: var(--dw-surface);
  border: 1px solid var(--dw-border-soft);
  border-radius: var(--dw-radius, 8px);
`;

export const Control = styled.button`
  ${controlStyles}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  flex: 0 0 auto;
  ${({ $primary }) => $primary && css`
    color: var(--dw-background);
    background: var(--dw-cyan);
    border-color: var(--dw-cyan);
    &:hover:not(:disabled) { background: var(--dw-teal); }
  `}
`;

export const Panel = styled.section`${panelStyles}`;
export const Field = styled.input`${inputStyles}`;
export const TextArea = styled.textarea`${inputStyles} resize: vertical;`;
export const StateMessage = styled.div`
  ${panelStyles}
  margin-block: 1rem;
  padding: clamp(1rem, 4vw, 2rem);
  border-inline-start: 3px solid var(--dw-amber);
  line-height: 1.6;
  h2 { margin: 0 0 0.5rem; font-size: 1.15rem; }
  p { margin: 0 0 1rem; color: var(--dw-text-secondary); }
`;
