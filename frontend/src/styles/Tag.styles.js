// frontend/src/styles/Tag.styles.js
import styled, { css } from 'styled-components';

const base = css`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  line-height: 1;
  user-select: none;
  white-space: nowrap;
  text-decoration: none;
  transition: transform 120ms ease, background 150ms ease,
    border-color 150ms ease, color 150ms ease;
`;

// Layout for a row of tags (replaces local TagRow everywhere)
export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

// The tag “chip” itself. Variants + sizes + selected/disabled handled via props.
export const Tag = styled.span`
  ${base};
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};

  /* Size */
  ${({ $size = 'sm' }) =>
    $size === 'xs'
      ? css`
          font-size: 0.7rem;
          padding: 0.15rem 0.5rem;
        `
      : $size === 'md'
      ? css`
          font-size: 0.85rem;
          padding: 0.3rem 0.7rem;
        `
      : css``}

  /* Variants */
  ${({ $variant = 'subtle', $selected }) => {
    switch ($variant) {
      case 'filled':
        return css`
          color: #0a0a0a;
          background: ${$selected ? '#9BE564' : '#4CC6C1'};
          border: 1px solid ${$selected ? '#76c83b' : '#3aa9a4'};
          &:hover {
            transform: translateY(-1px);
          }
        `;
      case 'outline':
        return css`
          color: ${$selected ? '#9BE564' : '#cfcfcf'};
          background: transparent;
          border: 1px solid ${$selected ? '#9BE564' : '#555'};
          &:hover {
            border-color: #888;
            transform: translateY(-1px);
          }
        `;
      default: // subtle
        return css`
          color: #dcdcdc;
          background: #2a2a2a;
          border: 1px solid #4a4a4a;
          &:hover {
            background: #333;
            transform: translateY(-1px);
          }
        `;
    }
  }}
`;

// Optional small count badge to compose inside <Tag>
export const TagCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.2em;
  height: 1.2em;
  padding: 0 0.35em;
  border-radius: 999px;
  font-size: 0.72em;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
`;
