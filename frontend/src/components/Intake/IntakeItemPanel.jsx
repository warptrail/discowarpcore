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
  border: 1px solid rgba(89, 121, 198, 0.4);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(14, 22, 34, 0.92) 0%, rgba(11, 17, 28, 0.95) 100%);
  padding: 0.68rem;
  display: grid;
  gap: 0.58rem;
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
  border-radius: 10px;
  border: 1px solid
    ${({ $active, $tone }) => {
      if ($active) return 'rgba(147, 220, 194, 0.86)';
      if ($tone === 'orphaned') return 'rgba(104, 183, 135, 0.55)';
      if ($tone === 'move') return 'rgba(205, 170, 102, 0.58)';
      return 'rgba(102, 147, 220, 0.58)';
    }};
  background: ${({ $active, $tone }) => {
    if ($active) return 'linear-gradient(180deg, rgba(19, 53, 44, 0.98) 0%, rgba(15, 39, 32, 0.96) 100%)';
    if ($tone === 'orphaned') return 'linear-gradient(180deg, rgba(15, 47, 34, 0.95) 0%, rgba(12, 35, 27, 0.95) 100%)';
    if ($tone === 'move') return 'linear-gradient(180deg, rgba(63, 44, 18, 0.95) 0%, rgba(48, 33, 14, 0.95) 100%)';
    return 'linear-gradient(180deg, rgba(14, 33, 58, 0.95) 0%, rgba(12, 25, 46, 0.95) 100%)';
  }};
  color: ${({ $active }) => ($active ? '#eefff7' : '#dfecff')};
  font-size: 0.79rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover {
    filter: brightness(1.06);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: ${MOBILE_CONTROL_MIN_HEIGHT};
    font-size: ${MOBILE_FONT_SM};
  }
`;

const Hint = styled.div`
  color: #adc2dd;
  font-size: 0.76rem;
  border: 1px dashed rgba(122, 157, 210, 0.42);
  border-radius: 9px;
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
          Orphaned
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
