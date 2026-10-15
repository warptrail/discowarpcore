import styled from 'styled-components';
import { consoleTabStyles } from './IntakeConsole.styles';
import CaptureGlyph from './CaptureGlyph';

const Rail = styled.nav`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: stretch;
  gap: 0;
  min-width: 0;
  padding: 0 12px;
`;

const RailButton = styled.button`
  ${consoleTabStyles}
  width: 100%;
  @media (max-width: 360px) { font-size: .72rem; }
`;

const WORKSPACE_TABS = [
  { id: 'new', label: 'New item', icon: 'new' },
  { id: 'box', label: 'Current box', icon: 'item' },
  { id: 'organize', label: 'Organize', icon: 'organize' },
  { id: 'edit', label: 'Edit box', icon: 'edit' },
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
          <CaptureGlyph kind={tab.icon} /><span>{tab.label}</span>
        </RailButton>
      ))}
    </Rail>
  );
}
