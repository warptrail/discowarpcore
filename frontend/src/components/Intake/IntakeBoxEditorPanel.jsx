import React from 'react';
import styled from 'styled-components';

import EditBoxDetailsForm from '../EditBoxDetailsForm';

const Panel = styled.section`
  display: grid;
  gap: 0.5rem;
  min-width: 0;
`;

const EmptyState = styled.div`
  display: grid;
  gap: 0.55rem;
  padding: 0.8rem 0;
  border-top: 1px solid rgba(151, 163, 176, 0.24);
  color: rgba(224, 230, 236, 0.78);
`;

const EmptyTitle = styled.strong`
  color: rgba(241, 244, 247, 0.92);
  font-size: 0.9rem;
`;

const EmptyCopy = styled.p`
  margin: 0;
  color: rgba(189, 200, 211, 0.72);
  font-size: 0.78rem;
  line-height: 1.45;
`;

const ReturnButton = styled.button`
  justify-self: start;
  min-height: 40px;
  border: 1px solid rgba(151, 163, 176, 0.46);
  border-radius: 6px;
  background: rgba(14, 19, 27, 0.72);
  color: rgba(225, 231, 237, 0.9);
  cursor: pointer;
  font-size: 0.68rem;
  font-weight: 780;
  letter-spacing: 0.07em;
  padding: 0 0.75rem;
  text-transform: uppercase;

  &:hover {
    border-color: rgba(197, 205, 214, 0.72);
    background: rgba(50, 59, 70, 0.38);
  }

  &:focus-visible {
    outline: 2px solid rgba(206, 214, 222, 0.9);
    outline-offset: 2px;
  }
`;

export default function IntakeBoxEditorPanel({
  box,
  onBoxUpdated,
  onBoxImageUpdated,
  onExit,
}) {
  if (!box?._id) {
    return (
      <Panel>
        <EmptyState>
          <EmptyTitle>No current box selected</EmptyTitle>
          <EmptyCopy>
            Choose the box under Current box before entering its edit mode.
          </EmptyCopy>
          <ReturnButton type="button" onClick={onExit}>
            Choose current box
          </ReturnButton>
        </EmptyState>
      </Panel>
    );
  }

  return (
    <Panel>
      <EditBoxDetailsForm
        compact
        boxMongoId={box._id}
        initial={box}
        onSaved={onBoxUpdated}
        onImageUpdated={({ image, imagePath }) =>
          onBoxImageUpdated?.({
            boxId: box._id,
            image: image || null,
            imagePath: imagePath || '',
          })
        }
        onCancel={onExit}
      />
    </Panel>
  );
}
