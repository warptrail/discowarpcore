import React from 'react';
import styled from 'styled-components';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
} from '../../styles/tokens';
import IntakeItemPanel from './IntakeItemPanel';
import IntakeMoveItemPanel from './IntakeMoveItemPanel';

const Section = styled.section`
  display: grid;
  gap: 0.6rem;
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.52rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

const ActionButton = styled.button`
  min-height: 66px;
  border-radius: 12px;
  border: 1px solid
    ${({ $active, $tone }) => {
      if ($active) return 'rgba(138, 232, 196, 0.9)';
      if ($tone === 'new') return 'rgba(80, 151, 219, 0.72)';
      if ($tone === 'move') return 'rgba(223, 180, 96, 0.72)';
      if ($tone === 'photo') return 'rgba(113, 191, 130, 0.72)';
      if ($tone === 'danger') return 'rgba(214, 112, 112, 0.8)';
      return 'rgba(116, 172, 212, 0.56)';
    }};
  background: ${({ $active, $tone }) => {
    if ($active) return 'linear-gradient(180deg, rgba(23, 62, 53, 0.98) 0%, rgba(17, 46, 39, 0.96) 100%)';
    if ($tone === 'new') return 'linear-gradient(180deg, rgba(18, 41, 72, 0.96) 0%, rgba(13, 31, 55, 0.95) 100%)';
    if ($tone === 'move') return 'linear-gradient(180deg, rgba(75, 50, 20, 0.95) 0%, rgba(58, 37, 14, 0.94) 100%)';
    if ($tone === 'photo') return 'linear-gradient(180deg, rgba(20, 56, 41, 0.95) 0%, rgba(14, 43, 31, 0.95) 100%)';
    if ($tone === 'danger') return 'linear-gradient(180deg, rgba(92, 30, 30, 0.96) 0%, rgba(70, 22, 22, 0.96) 100%)';
    return 'linear-gradient(180deg, rgba(16, 33, 54, 0.95) 0%, rgba(12, 26, 45, 0.95) 100%)';
  }};
  color: ${({ $active }) => ($active ? '#f2fff8' : '#e5f0ff')};
  font-size: 0.96rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: ${({ $active }) =>
    $active ? '0 0 0 2px rgba(138, 232, 196, 0.16)' : 'none'};

  &:hover:not(:disabled) {
    filter: brightness(1.07);
  }

  &:disabled {
    opacity: 0.56;
    cursor: not-allowed;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-height: calc(${MOBILE_CONTROL_MIN_HEIGHT} + 16px);
    font-size: ${MOBILE_FONT_SM};
  }
`;

const Hint = styled.div`
  border-radius: 10px;
  border: 1px dashed rgba(140, 172, 207, 0.55);
  background: rgba(12, 21, 32, 0.88);
  padding: 0.56rem 0.62rem;
  color: #b7cbe0;
  font-size: 0.78rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: ${MOBILE_FONT_XS};
  }
`;

function toggleAction(nextAction, activeAction, onChangeAction) {
  if (activeAction === nextAction) {
    onChangeAction?.('');
    return;
  }
  onChangeAction?.(nextAction);
}

export default function IntakeRapidActions({
  currentBox,
  boxes,
  recentItems,
  orphanedRefreshKey = 0,
  activeAction,
  moveSeedItemId,
  onChangeAction,
  onItemCreated,
  onItemMoved,
}) {
  const hasCurrentBox = !!currentBox?._id;

  return (
    <Section>
      <ActionGrid>
        <ActionButton
          type="button"
          $active={activeAction === 'add-item'}
          onClick={() => toggleAction('add-item', activeAction, onChangeAction)}
        >
          Add Item
        </ActionButton>

        <ActionButton
          type="button"
          $tone="move"
          $active={activeAction === 'move-item'}
          onClick={() => toggleAction('move-item', activeAction, onChangeAction)}
          disabled={!hasCurrentBox}
        >
          Move Item
        </ActionButton>
      </ActionGrid>

      {!hasCurrentBox ? (
        <Hint>Select a current box above to unlock add and move actions.</Hint>
      ) : null}

      {activeAction === 'add-item' ? (
        <IntakeItemPanel
          currentBox={currentBox}
          orphanedRefreshKey={orphanedRefreshKey}
          onItemCreated={onItemCreated}
          onItemMoved={onItemMoved}
        />
      ) : null}

      {activeAction === 'move-item' ? (
        <IntakeMoveItemPanel
          currentBox={currentBox}
          boxes={boxes}
          recentItems={recentItems}
          seedItemId={moveSeedItemId}
          onItemMoved={onItemMoved}
        />
      ) : null}
    </Section>
  );
}
