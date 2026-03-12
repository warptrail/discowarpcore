import React from 'react';
import styled from 'styled-components';
import MoveItemToOtherBox from './MoveItemToOtherBox';

const BarContainer = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #1e1e1e;
  border: 1px solid #333;
  border-radius: 0.5rem;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Button = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.9rem;
`;

const FeedbackRow = styled.div`
  margin-top: 1rem;
  font-size: 0.95rem;
  color: #b0ffc8;
`;

const FeedbackActionButton = styled.button`
  background: none;
  border: none;
  text-decoration: underline;
  color: inherit;
  cursor: pointer;
  margin-left: 0.5rem;
  font-size: inherit;
`;

export default function ItemLifecycleActionsBar({
  moveResult,
  itemId,
  navigate,
  handleUndo,
  handleOrphan,
  handleDestroy,
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
            <Button onClick={handleDestroy}>Destroy</Button>
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
