import { controlStyles } from '../../styles/primitives';
import styled from 'styled-components';

export const Menu = styled.section`
  display: grid;
  gap: 10px;
`;
export const MenuIntro = styled.p`
  margin: 0 2px 2px;
  color: var(--dw-text-secondary);
  font-size: 0.78rem;
`;
export const ActionList = styled.div`
  display: grid;
  gap: 6px;
`;
export const ActionRow = styled.button`
  ${controlStyles}
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) 20px;
  align-items: center;
  gap: 9px;
  width: 100%;
  min-height: 52px;
  padding: 7px 9px;
  border: 1px solid ${({ $danger }) => ($danger ? 'rgba(240, 138, 123, .32)' : 'rgba(230, 237, 243, .14)')};
  border-radius: var(--dw-radius);
  color: var(--dw-text);
  text-align: left;
  background: ${({ $danger }) => ($danger ? 'rgba(240, 138, 123, .08)' : 'var(--dw-surface-raised)')};
  cursor: pointer;
  transition: 160ms ease;

  &:hover, &:focus-visible {
    border-color: ${({ $danger }) => ($danger ? 'var(--dw-coral)' : 'var(--dw-cyan)')};
    background: ${({ $danger }) => ($danger ? 'rgba(240, 138, 123, .12)' : 'var(--dw-surface-raised)')};
    outline: 2px solid ${({ $danger }) => ($danger ? 'var(--dw-coral)' : 'var(--dw-cyan)')};
    outline-offset: 2px;
  }
  &:disabled { opacity: .58; cursor: wait; }
`;
export const ActionIcon = styled.span`
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--dw-radius);
  color: var(--dw-cyan);
  background: var(--dw-surface);
  font: 700 0.92rem/1 var(--dw-font-ui);
`;
export const ActionCopy = styled.span` display: grid; gap: 2px; min-width: 0; `;
export const ActionTitle = styled.span` font-weight: 760; font-size: .84rem; `;
export const ActionDescription = styled.span`
  overflow: hidden;
  color: var(--dw-text-muted);
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
export const ActionChevron = styled.span` color: var(--dw-text-muted); font-size: 1.35rem; `;
