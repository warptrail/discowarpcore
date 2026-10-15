import { css } from 'styled-components';

// Adjacent header and body share one contour and one divider.
export const joinedWorkspaceHeader = css`
  border: 1px solid var(--dw-border);
  border-radius: 18px 18px 0 0;
  box-shadow: none;
`;

export const joinedWorkspaceBody = css`
  border: 1px solid var(--dw-border);
  border-top: 0;
  border-radius: 0 0 14px 14px;
  box-shadow: none;
`;

// Flat attribute actions avoid a second rounded frame inside a section.
export const quietFieldAction = css`
  border: 0;
  border-radius: 4px;
  margin: 0;
  box-shadow: none;
  &:hover:not(:disabled) {
    border: 0;
    background: rgba(var(--domain-rgb, var(--box-primary-rgb, 113, 210, 255)), .08);
    outline: none;
  }
  &:focus-visible {
    outline: 2px solid var(--dw-cyan);
    outline-offset: -2px;
  }
`;
