import { controlStyles } from '../../styles/primitives';
import styled from 'styled-components';

const Rail = styled.nav`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: center;
  gap: 0.16rem;
  min-width: 0;
  padding: 0.12rem 0;
  border-bottom: 1px solid var(--dw-border);
  background: var(--dw-surface);
  box-shadow: none;
`;

const RailButton = styled.button`
  min-width: 0;
  min-height: 42px;
  border: 0;
  border-bottom: 2px solid ${({ $active }) => ($active ? '#70dcf2' : 'transparent')};
  background: ${({ $active }) => ($active ? 'rgba(53, 117, 163, 0.14)' : 'transparent')};
  color: ${({ $active }) =>
    $active ? '#c2f3ff' : '#8ca5b9'};
  cursor: pointer;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.025em;
  padding: 0.35rem 0.3rem;
  text-align: center;
  white-space: nowrap;

  &:hover { color: #a9e9f8; background: var(--dw-surface-raised); }
  &:focus-visible { outline: 2px solid #70dcf2; outline-offset: -2px; }

  ${controlStyles}
  border-left-color: ${({ $active, $selected, $recommended }) => ($active || $selected || $recommended) ? 'var(--dw-amber)' : 'var(--dw-border)'};
  border-left-width: 3px;

  padding: 0.4rem 0.2rem;
  font-size: 0.75rem;
  white-space: normal;
`;

const WORKSPACE_TABS = [
  { id: 'new', label: 'New item' },
  { id: 'box', label: 'Current box' },
  { id: 'organize', label: 'Organize' },
  { id: 'edit', label: 'Edit box' },
];

export default function IntakeWorkspaceTabs({ activeView, onChange }) {
  return (
    <Rail aria-label="Intake workspace">
      {WORKSPACE_TABS.map((tab) => (
        <RailButton
          key={tab.id}
          id={`intake-workspace-tab-${tab.id}`}
          type="button"
          $active={activeView === tab.id}
          aria-current={activeView === tab.id ? 'page' : undefined}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </RailButton>
      ))}
    </Rail>
  );
}
