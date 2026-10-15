import { css } from 'styled-components';
import { controlStyles, inputStyles, panelStyles } from '../../styles/primitives';

// Intake's presentation primitives are local to this workflow. Inventory state,
// field validation, destinations and mutation handlers remain with their owners.
export const consoleGlyphStyles = css`
  svg {
    width: 20px;
    height: 20px;
    flex: 0 0 auto;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;
export const consoleControlStyles = css`
  ${controlStyles}
  ${consoleGlyphStyles}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  min-width: 44px;
  padding: 8px 12px;
  border: 0;
  border-radius: 2px;
  background: transparent;
  color: var(--dw-text-secondary);
  font-weight: 500;
  &:hover:not(:disabled) {
    color: var(--dw-cyan);
    background: rgba(113, 210, 255, .06);
  }
  &:focus-visible {
    outline-offset: -2px;
  }
`;
export const consoleFieldStyles = css`
  ${inputStyles}
  width: 100%;
  min-height: 44px;
  border: 0;
  border-bottom: 1px solid var(--dw-border);
  border-radius: 0;
  background: var(--dw-background);
  font-weight: 400;
  &:focus, &:focus-visible {
    outline: none;
    border-color: var(--dw-cyan);
    box-shadow: inset 0 -1px 0 var(--dw-cyan);
  }
  &:disabled {
    cursor: not-allowed;
  }
`;
export const insetStageStyles = css`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 0 14px;
  background: var(--dw-background);
  border-bottom: 1px solid var(--dw-border);
  border-radius: 2px 12px 0 0;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, .25);
  &:focus-within {
    border-color: var(--dw-cyan);
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, .25), 0 1px 0 var(--dw-cyan);
  }
`;
export const consoleTabStyles = css`
  ${consoleControlStyles}
  position: relative;
  flex-direction: column;
  gap: 4px;
  padding: 6px 2px;
  min-height: 56px;
  min-width: 0;
  border-radius: 0;
  border-bottom: 1px solid var(--dw-border);
  font-size: .75rem;
  &[aria-expanded='true'], &[aria-current='page'] {
    color: var(--dw-cyan);
    border-color: var(--dw-cyan);
    box-shadow: inset 0 -1px 0 var(--dw-cyan);
  }
  &[data-filled='true']::after {
    content: '';
    position: absolute;
    right: 10px;
    top: 8px;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--dw-teal);
  }
`;
export const primaryCommandStyles = css`
  ${consoleControlStyles}
  padding-inline: 16px 12px;
  border-radius: 2px 12px 2px 2px;
  color: var(--dw-background);
  background: var(--dw-cyan);
  &:hover:not(:disabled) {
    background: var(--dw-teal);
    color: var(--dw-background);
  }
  &:focus-visible {
    outline-offset: 2px;
    box-shadow: inset 0 0 0 2px var(--dw-background);
  }
  &:disabled {
    background: var(--dw-surface-raised);
    color: var(--dw-text-secondary);
    opacity: .7;
  }
`;
export const quietSectionStyles = css`
  ${panelStyles}
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
`;
export const hiddenLabelStyles = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
