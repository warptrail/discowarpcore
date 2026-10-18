import styled from 'styled-components';

export const Picker = styled.div`
  min-width: 0;
  padding: 0 10px 4px;
  background: var(--dw-surface-raised);
  color: var(--dw-text);
  border-bottom: 1px solid var(--dw-border);

  @media (pointer: coarse) {
    button, a { min-height: 44px; }
    button { min-width: 44px; }
  }

  :is(button, a):focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: -2px;
  }
`;

export const Commands = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
`;

export const Toggle = styled.button`
  min-height: 32px;
  padding: 4px 6px;
  border: 0;
  background: transparent;
  color: var(--dw-text);
  font: 400 .74rem/1.3 var(--dw-font-ui);
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex; align-items: center; justify-content: center; gap: 4px; min-width: 32px;
  svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.5; }
  &:hover { background: rgba(var(--branch-rgb), .08); }
`;

export const Manage = styled.a`
  display: flex;
  align-items: center;
  min-height: 32px;
  min-width: 0;
  color: var(--box-primary);
  font-size: .72rem;
  line-height: 1.3;
`;

export const SingleSpace = styled.span`
  font-size: .78rem;
`;

export const Levels = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  max-height: 166px;
  &[hidden] { display: none; }
  overflow-y: auto;
  overscroll-behavior: contain;
  border-inline: 1px solid var(--dw-border);
  border-block: 1px solid var(--dw-border);
  border-radius: 5px;
  background: var(--dw-surface);
`;

export const Level = styled.button`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto 12px;
  align-items: center;
  gap: 7px;
  min-width: 0;
  min-height: 32px;
  padding: 3px 7px;
  border: 0;
  border-bottom: 1px solid var(--dw-border);
  background: transparent;
  color: var(--dw-text);
  text-align: left;
  cursor: pointer;
  &:last-child { border-bottom: 0; }
  &:hover { background: rgba(var(--branch-rgb), .08); }
  &[aria-pressed='true'] {
    background: rgba(var(--branch-rgb), .14);
    box-shadow: inset 2px 0 var(--branch-color);
  }
`;

export const LevelName = styled.span`
  font: 400 .76rem/1.3 var(--dw-font-ui);
  overflow-wrap: anywhere;
`;

export const Address = styled.span`
  font: 400 .75rem/1.3 var(--dw-font-data);
  color: var(--box-primary);
  white-space: nowrap;
`;

export const Selection = styled.span`
  color: var(--branch-color);
  font-size: .85rem;
`;

export const Count = styled.span`
  font-size: .72rem;
  white-space: nowrap;
  color: var(--dw-text);
`;
