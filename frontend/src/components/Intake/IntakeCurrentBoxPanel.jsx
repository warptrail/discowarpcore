import React from 'react';
import styled from 'styled-components';

import IntakeBoxSelectorPanel from './IntakeBoxSelectorPanel';
import IntakeDestinationActions from './IntakeDestinationActions';
import IntakeDestinationPhotoDisclosure from './IntakeDestinationPhotoDisclosure';
import IntakeDestinationSummary from './IntakeDestinationSummary';

const Panel = styled.section`
  display: grid;
  gap: 0.7rem;
  min-width: 0;
  padding: 0.8rem;
  border: 1px solid rgba(var(--box-primary-rgb), 0.4);
  border-radius: 7px;
  background:
    linear-gradient(122deg, rgba(var(--box-primary-rgb), 0.13), transparent 38%),
    linear-gradient(300deg, rgba(var(--box-secondary-rgb), 0.055), transparent 44%),
    rgba(8, 15, 19, 0.9);
  box-shadow:
    inset 3px 0 0 rgba(var(--box-primary-rgb), 0.5),
    inset 0 1px 0 rgba(var(--box-neon-rgb), 0.06);

  @media (min-width: 760px) {
    padding: 0.9rem 1rem;
  }
`;

const EmptyState = styled.div`
  display: grid;
  gap: 0.2rem;
  padding: 0.1rem 0 0.15rem;
`;

const EmptyTitle = styled.h2`
  margin: 0;
  color: var(--box-neon);
  font-size: 1.02rem;
  font-weight: 760;
`;

const EmptyHint = styled.p`
  max-width: 46ch;
  margin: 0;
  color: rgba(var(--box-secondary-rgb), 0.72);
  font-size: 0.8rem;
  line-height: 1.42;
`;

const SelectorRegion = styled.div`
  min-width: 0;
  padding-top: 0.1rem;
`;

export default function IntakeCurrentBoxPanel({
  boxes = [],
  selectedBox,
  currentBoxInsight,
  selectedBoxId = '',
  selectorOpen = false,
  onSelectBox,
  onToggleSelector,
  onCreateBox,
  onAddItem,
  onEditBox,
  onCurrentBoxPhotoUpdated,
}) {
  const hasCurrentBox = Boolean(selectedBox?._id);

  return (
    <Panel aria-label="Current intake destination">
      {hasCurrentBox ? (
        <>
          <IntakeDestinationSummary
            box={selectedBox}
            currentBoxInsight={currentBoxInsight}
            selectedBoxId={selectedBoxId}
            onSelectBox={onSelectBox}
          />
          <IntakeDestinationActions
            box={selectedBox}
            onAddItem={onAddItem}
            onChangeDestination={onToggleSelector}
            onEditBox={onEditBox}
            onCreateBox={onCreateBox}
          />
          <IntakeDestinationPhotoDisclosure
            box={selectedBox}
            onBoxPhotoUpdated={onCurrentBoxPhotoUpdated}
          />
        </>
      ) : (
        <>
          <EmptyState>
            <EmptyTitle>Select a current box</EmptyTitle>
            <EmptyHint>
              Choose the box once. Every new Intake item will land there until you change it.
            </EmptyHint>
          </EmptyState>
          <IntakeDestinationActions
            onChangeDestination={onToggleSelector}
            onCreateBox={onCreateBox}
          />
        </>
      )}

      {selectorOpen ? (
        <SelectorRegion>
          <IntakeBoxSelectorPanel
            boxes={boxes}
            selectedBoxId={selectedBoxId}
            title={hasCurrentBox ? 'Change current box' : 'Choose a current box'}
            onSelectBox={onSelectBox}
            onClose={onToggleSelector}
            showClose
            showFacets={false}
          />
        </SelectorRegion>
      ) : null}
    </Panel>
  );
}
