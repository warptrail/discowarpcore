import { panelStyles, controlStyles } from '../../styles/primitives';
import React, { useState } from 'react';
import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
} from '../../styles/tokens';
import IntakeQuickAddPanel from './IntakeQuickAddPanel';
import IntakeMoveExistingTab from './IntakeMoveExistingTab';
import IntakeOrphanedItemsTab from './IntakeOrphanedItemsTab';

const Panel = styled.section`
  border: 1px solid var(--dw-border);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
  padding: 0.68rem;
  display: grid;
  gap: 0.58rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;

  ${panelStyles}
  border-left: 3px solid var(--dw-amber);
`;

const TabBar = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.42rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

const TabButton = styled.button`
  min-height: 44px;
  border-radius: var(--dw-radius-sm);
  border: 1px solid
    ${({ $active, $tone }) => {
      if ($active) return 'rgba(147, 220, 194, 0.86)';
      if ($tone === 'orphaned') return 'rgba(104, 183, 135, 0.55)';
      if ($tone === 'move') return 'rgba(205, 170, 102, 0.58)';
      return 'rgba(102, 147, 220, 0.58)';
    }};
  background: ${({ $active, $tone }) => {
    if ($active) return 'var(--dw-surface-raised)';
    if ($tone === 'orphaned') return 'var(--dw-surface-raised)';
    if ($tone === 'move') return 'var(--dw-surface-raised)';
    return 'var(--dw-surface-raised)';
  }};
  color: ${({ $active }) => ($active ? '#eefff7' : '#dfecff')};
  font-size: 0.79rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  text-transform: none;
  cursor: pointer;

  &:hover {
    filter: brightness(1.06);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }

  ${controlStyles}
  border-left-color: ${({ $active, $selected, $recommended }) => ($active || $selected || $recommended) ? 'var(--dw-amber)' : 'var(--dw-border)'};
  border-left-width: 3px;

  color: ${({ $tone, $primary, $secondary }) => $tone === 'danger' ? 'var(--dw-coral)' : ($tone === 'primary' || $primary) ? 'var(--dw-cyan)' : $secondary ? 'var(--dw-violet)' : 'var(--dw-text)'};
`;

const Hint = styled.div`
  color: #adc2dd;
  font-size: 0.76rem;
  border: 1px dashed var(--dw-border);
  border-radius: var(--dw-radius-sm);
  padding: 0.5rem 0.56rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

const TAB_NEW = 'new-item';
const TAB_ORPHANED = 'orphaned-items';
const TAB_MOVE_EXISTING = 'move-existing';

export default function IntakeItemPanel({
  currentBox,
  orphanedRefreshKey = 0,
  onItemCreated,
  onItemMoved,
}) {
  const [activeTab, setActiveTab] = useState(TAB_NEW);

  return (
    <Panel>
      <TabBar>
        <TabButton
          type="button"
          $active={activeTab === TAB_NEW}
          onClick={() => setActiveTab(TAB_NEW)}
        >
          New Item
        </TabButton>

        <TabButton
          type="button"
          $tone="orphaned"
          $active={activeTab === TAB_ORPHANED}
          onClick={() => setActiveTab(TAB_ORPHANED)}
        >
          Items Adrift
        </TabButton>

        <TabButton
          type="button"
          $tone="move"
          $active={activeTab === TAB_MOVE_EXISTING}
          onClick={() => setActiveTab(TAB_MOVE_EXISTING)}
        >
          Move Existing
        </TabButton>
      </TabBar>

      {!currentBox?._id ? (
        <Hint>Select or create a box first. Intake actions are disabled until a current box is set.</Hint>
      ) : null}

      {activeTab === TAB_NEW ? (
        <IntakeQuickAddPanel
          currentBox={currentBox}
          onItemCreated={onItemCreated}
        />
      ) : null}

      {activeTab === TAB_ORPHANED ? (
        <IntakeOrphanedItemsTab
          currentBox={currentBox}
          refreshKey={orphanedRefreshKey}
          onItemMoved={onItemMoved}
        />
      ) : null}

      {activeTab === TAB_MOVE_EXISTING ? (
        <IntakeMoveExistingTab
          currentBox={currentBox}
          onItemMoved={onItemMoved}
        />
      ) : null}
    </Panel>
  );
}
