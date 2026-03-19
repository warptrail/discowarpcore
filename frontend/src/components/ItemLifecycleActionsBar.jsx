import React from 'react';
import styled from 'styled-components';
import MoveItemToOtherBox from './MoveItemToOtherBox';
import {
  MOBILE_BREAKPOINT,
  MOBILE_CONTROL_MIN_HEIGHT,
  MOBILE_FONT_SM,
  MOBILE_FONT_XS,
  MOBILE_PANEL_RADIUS,
} from '../styles/tokens';

const BarContainer = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #1e1e1e;
  border: 1px solid #333;
  border-radius: 0.5rem;
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-top: 0.62rem;
    padding: 0.52rem;
    border-radius: ${MOBILE_PANEL_RADIUS};
  }
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.36rem;
  }
`;

const Button = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.9rem;
  min-height: ${MOBILE_CONTROL_MIN_HEIGHT};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex: 1 1 140px;
    min-height: 36px;
    font-size: ${MOBILE_FONT_SM};
    padding: 0.4rem 0.5rem;
  }
`;

const FeedbackRow = styled.div`
  margin-top: 1rem;
  font-size: 0.95rem;
  color: #b0ffc8;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-top: 0.62rem;
    font-size: ${MOBILE_FONT_SM};
  }
`;

const FeedbackActionButton = styled.button`
  background: none;
  border: none;
  text-decoration: underline;
  color: inherit;
  cursor: pointer;
  margin-left: 0.5rem;
  font-size: inherit;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-left: 0.32rem;
    font-size: ${MOBILE_FONT_XS};
  }
`;

export default function ItemLifecycleActionsBar({
  moveResult,
  itemId,
  navigate,
  handleUndo,
  handleOrphan,
  showMovePanel,
  setShowMovePanel,
  sourceBoxId,
  handleBoxSelected,
}) {
  return (
    <BarContainer>
      {moveResult ? (
        <FeedbackRow>
          ✅ Item moved to <strong>{moveResult.newBoxLabel}</strong> (Box{' '}
          {moveResult.newBoxId}).
          <FeedbackActionButton
            onClick={() => navigate(`/box/${moveResult.newBoxId}`)}
          >
            View
          </FeedbackActionButton>
          <FeedbackActionButton onClick={handleUndo}>Undo</FeedbackActionButton>
        </FeedbackRow>
      ) : (
        <>
          <ButtonRow>
            <Button onClick={() => setShowMovePanel((prev) => !prev)}>
              Move to Another Box
            </Button>
            <Button onClick={handleOrphan}>Orphan</Button>
          </ButtonRow>

          {showMovePanel && (
            <MoveItemToOtherBox
              itemId={itemId}
              currentBoxId={sourceBoxId}
              onBoxSelected={handleBoxSelected}
            />
          )}
        </>
      )}
    </BarContainer>
  );
}
