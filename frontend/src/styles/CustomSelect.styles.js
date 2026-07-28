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
  border-radius: 9px;
  padding: 0.46rem 0.62rem;
  color: ${palette.text};
  background: linear-gradient(180deg, rgba(6, 12, 19, 0.98), rgba(8, 15, 23, 0.98));
  font: inherit;
  font-size: 0.86rem;
  text-align: left;
  outline: none;
  cursor: pointer;
  transition: border-color 130ms ease, box-shadow 130ms ease, background 130ms ease;

  &:hover,
  &[aria-expanded='true'],
  &:focus-visible {
    border-color: ${({ $tone = palette.root }) => `${$tone}d0`};
    box-shadow:
      0 0 0 2px ${({ $tone = palette.root }) => `${$tone}2f`},
      0 0 14px ${({ $tone = palette.root }) => `${$tone}30`};
    background: #162330;
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
  flex: 0 0 auto;
  color: ${palette.textDim};
  font-size: 1rem;
  line-height: 0.7;
  transform: translateY(-0.08rem);
`;

export const SelectMenu = styled.div`
  position: absolute;
  top: calc(100% + 0.34rem);
  left: 0;
  right: 0;
  display: grid;
  gap: 0.18rem;
  max-height: min(280px, 42vh);
  overflow-y: auto;
  padding: 0.34rem;
  border: 1px solid rgba(76, 198, 193, 0.58);
  border-radius: 11px;
  background: linear-gradient(180deg, rgba(9, 16, 24, 0.99), rgba(8, 14, 20, 0.99));
  box-shadow:
    0 18px 30px rgba(2, 9, 16, 0.7),
    0 0 0 1px rgba(76, 198, 193, 0.14) inset;
`;

export const SelectOption = styled.button`
  width: 100%;
  min-height: 38px;
  border: 1px solid
    ${({ $active, $selected }) =>
      $active || $selected ? 'rgba(76, 198, 193, 0.72)' : 'rgba(104, 154, 186, 0.32)'};
  border-radius: 8px;
  padding: 0.42rem 0.52rem;
  color: ${({ $selected }) => ($selected ? '#d9fffa' : palette.text)};
  background: ${({ $active, $selected }) =>
    $active || $selected
      ? 'linear-gradient(180deg, rgba(18, 58, 62, 0.82), rgba(10, 36, 42, 0.92))'
      : 'linear-gradient(180deg, rgba(15, 30, 45, 0.94), rgba(9, 18, 29, 0.96))'};
  font: inherit;
  font-size: 0.82rem;
  text-align: left;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease;

  &:hover {
    border-color: rgba(127, 215, 255, 0.78);
  }
`;
