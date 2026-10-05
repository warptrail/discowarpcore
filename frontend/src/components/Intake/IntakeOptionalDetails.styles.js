import { controlStyles, inputStyles } from '../../styles/primitives';
import styled from 'styled-components';
import { APP_VISUAL_THEME } from '../../styles/tokens';
import { TagComposer, TagDraftInput, TagStageButton } from './NewItemComposer.styles';

const uiFont = 'var(--dw-font-ui)';
const tones = {
  description: APP_VISUAL_THEME.violet,
  tags: APP_VISUAL_THEME.cyan,
  notes: APP_VISUAL_THEME.teal,
};

export const Section = styled.section`
  display: grid;
  gap: 0.4rem;
  min-width: 0;
  border-top: 1px solid var(--dw-border);
  padding-top: 0.55rem;
`;

export const Switches = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.38rem;
  width: 100%;
`;

export const Switch = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.38rem;
  min-width: 0;
  min-height: 44px;
  border: 1px solid var(--dw-border);
  border-left: 3px solid ${({ $tone }) => tones[$tone]};
  border-radius: var(--dw-radius-sm);
  padding: 0.32rem 0.4rem;
  background: ${({ $active }) => $active ? 'var(--dw-surface-raised)' : 'var(--dw-surface)'};
  color: ${({ $tone }) => tones[$tone]};
  box-shadow: none;
  cursor: pointer;
  font: 800 clamp(0.59rem, 1.7vw, 0.7rem)/1.1 ${uiFont};
  letter-spacing: 0.01em;
  text-transform: none;

  > span { font-size: 1rem; line-height: 1; }
  &:hover { border-color: ${({ $tone }) => tones[$tone]}; }
  &:focus-visible { outline: 2px solid ${({ $tone }) => tones[$tone]}; outline-offset: 2px; }

  ${controlStyles}
  border-left-color: ${({ $active, $selected, $recommended }) => ($active || $selected || $recommended) ? 'var(--dw-amber)' : 'var(--dw-border)'};
  border-left-width: 3px;

  color: ${({ $tone, $primary, $secondary }) => $tone === 'danger' ? 'var(--dw-coral)' : ($tone === 'primary' || $primary) ? 'var(--dw-cyan)' : $secondary ? 'var(--dw-violet)' : 'var(--dw-text)'};
`;

export const DetailPanel = styled.div`
  display: grid;
  gap: 0.35rem;
  min-width: 0;
  border: 1px solid var(--dw-border);
  border-left: 3px solid ${({ $tone }) => tones[$tone]};
  border-radius: var(--dw-radius-sm);
  padding: 0.48rem;
  background: var(--dw-surface-raised);

  ${TagComposer} {
    border-color: rgba(114, 218, 250, 0.45);
    background: var(--dw-surface);
  }
  ${TagDraftInput} { min-width: 0; font-size: 0.86rem; }
  ${TagStageButton} { color: var(--dw-cyan); }
`;

export const FieldLabel = styled.label`
  color: var(--dw-text-secondary);
  font: 800 0.75rem/1.1 ${uiFont};
  letter-spacing: 0.01em;
  text-transform: none;
`;

export const TextArea = styled.textarea`
  width: 100%;
  min-height: 62px;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  padding: 0.55rem 0.65rem;
  resize: vertical;
  background: var(--dw-surface);
  color: var(--dw-text);
  font: inherit;
  font-size: 0.85rem;

  &:focus { outline: 2px solid var(--dw-violet); outline-offset: 1px; }
  &::placeholder { color: var(--dw-text-muted); }

  ${inputStyles}
  min-height: 88px;
  resize: vertical;
`;

export const FinerButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  border: 0;
  border-top: 1px solid var(--dw-border);
  padding: 0.25rem 0;
  background: transparent;
  color: var(--dw-text-muted);
  cursor: pointer;
  font: 800 0.75rem ${uiFont};
  letter-spacing: 0.01em;
  text-transform: none;

  &:hover { color: var(--dw-text); }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: 2px; }

  ${controlStyles}
  color: var(--dw-violet);
`;

export const FinerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
  min-width: 0;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  padding: 0.5rem;
  background: var(--dw-surface-raised);
`;

export const FinerField = styled.div`
  display: grid;
  gap: 0.35rem;
  min-width: 0;
`;

export const Select = styled.select`
  width: 100%;
  min-width: 0;
  min-height: 44px;
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  padding: 0 0.55rem;
  background: var(--dw-surface);
  color: #e5f3f9;
  font-size: 0.85rem;

  &:focus { outline: 2px solid var(--dw-cyan); outline-offset: 1px; }

  ${inputStyles}
`;
