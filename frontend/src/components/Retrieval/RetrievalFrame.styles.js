import { css } from 'styled-components';

// Static registration marks, confined to the frame and hidden from interaction.
export const frameCorners = css`
  &::before {
    content: ''; position: absolute; inset: 11px; pointer-events: none; z-index: 3;
    opacity: .55;
    background:
      linear-gradient(var(--box-primary), var(--box-primary)) left top / 11px 1px no-repeat,
      linear-gradient(var(--box-primary), var(--box-primary)) left top / 1px 11px no-repeat,
      linear-gradient(var(--box-primary), var(--box-primary)) right top / 11px 1px no-repeat,
      linear-gradient(var(--box-primary), var(--box-primary)) right top / 1px 11px no-repeat,
      linear-gradient(var(--box-primary), var(--box-primary)) left bottom / 11px 1px no-repeat,
      linear-gradient(var(--box-primary), var(--box-primary)) left bottom / 1px 11px no-repeat,
      linear-gradient(var(--box-primary), var(--box-primary)) right bottom / 11px 1px no-repeat,
      linear-gradient(var(--box-primary), var(--box-primary)) right bottom / 1px 11px no-repeat;
  }
`;
