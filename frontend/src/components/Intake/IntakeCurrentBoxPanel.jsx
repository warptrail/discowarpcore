import { quietSectionStyles } from './IntakeConsole.styles';
import React from 'react';
import styled from 'styled-components';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';

import IntakeBoxSelectorPanel from './IntakeBoxSelectorPanel';
import IntakeDestinationActions from './IntakeDestinationActions';
import IntakeDestinationPhotoDisclosure from './IntakeDestinationPhotoDisclosure';
import IntakeDestinationSummary from './IntakeDestinationSummary';

const Panel = styled.section`
  ${quietSectionStyles}
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 8px 0;
`;

const EmptyState = styled.div`
  display: grid;
  gap: 0.3rem;
  padding: 0.15rem 0 0.3rem;
`;

const EmptyEyebrow = styled.span`
  color: var(--dw-text-muted);
  font: 400 .75rem/1.3 var(--dw-font-ui);
`;

const EmptyTitle = styled.h2`
  margin: 0;
  color: var(--dw-text);
  font: 600 1.3rem/1.2 var(--dw-font-ui);
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
  createOpen = false,
  onSelectBox,
  onToggleSelector,
  onCreateBox,
  onAddItem,
  onEditBox,
  onCurrentBoxPhotoUpdated,
}) {
  const hasCurrentBox = Boolean(selectedBox?._id);

  return (
    <Panel aria-label="Current intake destination" style={getBoxThemeCssVars(getBoxTheme(selectedBox?.box_id ?? selectedBox?.shortId))}>
      {createOpen ? (
        <IntakeDestinationActions
          box={selectedBox}
          chooseOpen={false}
          createOpen
          onChangeDestination={onToggleSelector}
          onCreateBox={onCreateBox}
        />
      ) : hasCurrentBox ? (
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
            chooseOpen={selectorOpen}
          />
          <IntakeDestinationPhotoDisclosure
            box={selectedBox}
            onBoxPhotoUpdated={onCurrentBoxPhotoUpdated}
          />
        </>
      ) : (
        <>
          <EmptyState>
            <EmptyEyebrow>Box destination</EmptyEyebrow>
            <EmptyTitle>Select a box</EmptyTitle>
          </EmptyState>
          <IntakeDestinationActions
            onChangeDestination={onToggleSelector}
            onCreateBox={onCreateBox}
            chooseOpen={selectorOpen}
          />
        </>
      )}

      {selectorOpen ? (
        <SelectorRegion>
          <IntakeBoxSelectorPanel
            boxes={boxes}
            selectedBoxId={selectedBoxId}
            title="Current selection"
            onSelectBox={onSelectBox}
            showClose={false}
            showFacets={false}
            showResultCountInToast
          />
        </SelectorRegion>
      ) : null}
    </Panel>
  );
}
