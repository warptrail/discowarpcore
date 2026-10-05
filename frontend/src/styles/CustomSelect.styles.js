import styled from 'styled-components';
import { controlStyles, panelStyles } from './primitives';

export const SelectWrap = styled.div`
  position: relative;
  min-width: 0;
  z-index: ${({ $disabled, $open }) => ($disabled ? 0 : $open ? 30 : 2)};
`;

export const SelectButton = styled.button`
  ${controlStyles}
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  width: 100%;
  min-width: 0;
  padding: 0.5rem 0.65rem;
  text-align: left;
  font-size: 0.875rem;

  &[aria-expanded='true'] { border-color: var(--dw-cyan); }
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
  color: var(--dw-text-secondary);
  border-right: 1px solid currentColor;
  border-bottom: 1px solid currentColor;
  font-size: 0;
  line-height: 1;
  transform: rotate(45deg) translate(-0.08rem, -0.08rem);
  transform-origin: center;
`;

export const SelectMenu = styled.div`
  ${panelStyles}
  position: ${({ $variant }) => ($variant === 'prism' ? 'static' : 'absolute')};
  top: calc(100% + 0.35rem);
  left: 0;
  right: 0;
  display: grid;
  gap: 0.2rem;
  max-height: min(280px, 42vh);
  overflow-y: auto;
  overscroll-behavior: contain;
  margin-top: ${({ $variant }) => ($variant === 'prism' ? '0.3rem' : '0')};
  padding: 0.3rem;
  border-color: var(--dw-border);
  box-shadow: var(--dw-shadow);
`;

export const SelectOption = styled.button`
  ${controlStyles}
  width: 100%;
  min-width: 0;
  padding: 0.5rem 0.65rem;
  border-color: transparent;
  border-left: 3px solid ${({ $active, $selected }) => ($active || $selected ? 'var(--dw-amber)' : 'transparent')};
  background: ${({ $active, $selected }) => ($active || $selected ? 'var(--dw-surface-raised)' : 'var(--dw-surface)')};
  color: var(--dw-text);
  text-align: left;
  font-size: 0.875rem;
  overflow-wrap: anywhere;

  &:hover:not(:disabled) { border-color: var(--dw-cyan); }
`;
