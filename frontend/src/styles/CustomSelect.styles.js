import styled from 'styled-components';

const palette = {
  text: '#e6edf3',
  textDim: 'rgba(230, 237, 243, 0.68)',
  panel: '#101821',
  root: '#7FD7FF',
  teal: '#4CC6C1',
};

export const SelectWrap = styled.div`
  position: relative;
  min-width: 0;
  z-index: ${({ $disabled, $open }) => ($disabled ? 0 : $open ? 30 : 2)};
`;

export const SelectButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  width: 100%;
  min-height: 34px;
  min-width: 0;
  border: 1px solid rgba(108, 156, 188, 0.5);
  border-radius: ${({ $variant }) => ($variant === 'prism' ? '3px' : '9px')};
  padding: 0.46rem 0.62rem;
  color: ${palette.text};
  background: ${({ $variant }) => (
    $variant === 'prism'
      ? 'rgba(7, 13, 19, 0.98)'
      : 'linear-gradient(180deg, rgba(6, 12, 19, 0.98), rgba(8, 15, 23, 0.98))'
  )};
  font: inherit;
  font-size: 0.86rem;
  text-align: left;
  outline: none;
  cursor: pointer;
  transition: border-color 130ms ease, box-shadow 130ms ease, background 130ms ease;

  ${({ $ownerStyle }) => $ownerStyle && `
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-weight: 700;
    letter-spacing: 0.075em;
    text-transform: uppercase;
  `}

  &:hover,
  &[aria-expanded='true'],
  &:focus-visible {
    border-color: ${({ $tone = palette.root }) => `${$tone}d0`};
    box-shadow:
      0 0 0 2px ${({ $tone = palette.root }) => `${$tone}2f`},
      0 0 14px ${({ $tone = palette.root }) => `${$tone}30`};
    background: ${({ $variant }) => ($variant === 'prism' ? '#101a22' : '#162330')};
  }

  &:disabled {
    opacity: 0.52;
    cursor: not-allowed;
  }
`;

export const SelectValue = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const SelectChevron = styled.span`
  flex: 0 0 0.48rem;
  width: 0.48rem;
  height: 0.48rem;
  color: ${palette.textDim};
  border-right: 1px solid currentColor;
  border-bottom: 1px solid currentColor;
  font-size: 0;
  line-height: 1;
  transform: rotate(45deg) translate(-0.08rem, -0.08rem);
  transform-origin: center;
`;

export const SelectMenu = styled.div`
  position: ${({ $variant }) => ($variant === 'prism' ? 'static' : 'absolute')};
  top: calc(100% + 0.34rem);
  left: 0;
  right: 0;
  display: grid;
  gap: 0.18rem;
  max-height: min(280px, 42vh);
  overflow-y: auto;
  margin-top: ${({ $variant }) => ($variant === 'prism' ? '0.28rem' : '0')};
  padding: 0.34rem;
  border: 1px solid rgba(76, 198, 193, 0.58);
  border-radius: ${({ $variant }) => ($variant === 'prism' ? '3px' : '11px')};
  background: ${({ $variant }) => (
    $variant === 'prism'
      ? 'rgba(7, 13, 19, 0.995)'
      : 'linear-gradient(180deg, rgba(9, 16, 24, 0.99), rgba(8, 14, 20, 0.99))'
  )};
  box-shadow:
    0 18px 30px rgba(2, 9, 16, 0.7),
    0 0 0 1px rgba(76, 198, 193, 0.14) inset;
`;

export const SelectOption = styled.button`
  width: 100%;
  min-height: 38px;
  border: 1px solid
    ${({ $active, $selected, $accent }) =>
      $active || $selected
        ? ($accent ? `${$accent}b8` : 'rgba(76, 198, 193, 0.72)')
        : ($accent ? `${$accent}66` : 'rgba(104, 154, 186, 0.32)')};
  border-radius: ${({ $variant }) => ($variant === 'prism' ? '2px' : '8px')};
  padding: 0.42rem 0.52rem;
  color: ${({ $selected, $accent }) => ($selected || $accent ? ($accent || '#d9fffa') : palette.text)};
  background: ${({ $active, $selected, $variant }) => {
    if ($variant === 'prism') {
      return $active || $selected ? 'rgba(32, 73, 76, 0.72)' : 'rgba(11, 21, 30, 0.96)';
    }
    return $active || $selected
      ? 'linear-gradient(180deg, rgba(18, 58, 62, 0.82), rgba(10, 36, 42, 0.92))'
      : 'linear-gradient(180deg, rgba(15, 30, 45, 0.94), rgba(9, 18, 29, 0.96))';
  }};
  font: inherit;
  font-size: 0.82rem;
  text-align: left;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease;

  ${({ $ownerStyle }) => $ownerStyle && `
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-weight: 700;
    letter-spacing: 0.075em;
    text-transform: uppercase;
  `}

  &:hover {
    border-color: ${({ $accent }) => ($accent ? `${$accent}c7` : 'rgba(127, 215, 255, 0.78)')};
  }
`;
