import styled from 'styled-components';

const Rail = styled.nav`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: center;
  gap: 0.16rem;
  min-width: 0;
  padding: 0.12rem 0;
  border-bottom: 1px solid rgba(var(--box-primary-rgb), 0.3);
`;

const RailButton = styled.button`
  min-width: 0;
  min-height: 42px;
  border: 0;
  border-bottom: 2px solid ${({ $active }) => ($active ? 'var(--box-neon)' : 'transparent')};
  background: transparent;
  color: ${({ $active }) =>
    $active ? 'var(--box-neon)' : 'rgba(var(--box-secondary-rgb), 0.64)'};
  cursor: pointer;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.025em;
  padding: 0.35rem 0.3rem;
  text-align: center;
  white-space: nowrap;

  &:hover { color: rgba(var(--box-neon-rgb), 0.94); }
  &:focus-visible { outline: 2px solid var(--box-neon); outline-offset: -2px; }
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
