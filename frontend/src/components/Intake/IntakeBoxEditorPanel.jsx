import { quietSectionStyles, consoleControlStyles, consoleFieldStyles, primaryCommandStyles } from './IntakeConsole.styles';
import * as BoxForm from '../BoxForms/BoxEditForm.styles';
import React from 'react';
import styled from 'styled-components';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';

import EditBoxDetailsForm from '../EditBoxDetailsForm';

const Panel = styled.section`
  ${quietSectionStyles}
  display: grid;
  gap: 12px;
  min-width: 0;
  && ${BoxForm.Card} {
    border: 0;
    padding: 8px 0;
    background: transparent;
    border-radius: 0;
    gap: 16px;
  }
  && ${BoxForm.Input}, && ${BoxForm.Textarea}, && ${BoxForm.Select}, && ${BoxForm.LocationInput}, && ${BoxForm.TagAdder} {
    ${consoleFieldStyles} min-width: 0;
  }
  && ${BoxForm.Textarea} {
    min-height: 88px;
    max-height: 240px;
    overflow: auto;
  }
  && ${BoxForm.Label}, && ${BoxForm.SectionTitle} {
    color: var(--dw-text-muted);
    font-weight: 400;
  }
  && ${BoxForm.LocationLevelField}, && ${BoxForm.LocationSubformTitle} {
    color: var(--dw-text-muted);
    font-weight: 400;
  }
  && ${BoxForm.LocationStructureGrid} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    > :first-child, > :last-child {
      grid-column: auto;
    }
    @media (max-width: 360px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  && ${BoxForm.TagChip} {
    border: 0;
    border-radius: 2px;
    background: var(--dw-surface-raised);
  }
  && ${BoxForm.RemoveX} {
    ${consoleControlStyles} color: var(--dw-coral);
  }
  && ${BoxForm.LocationSection}, && ${BoxForm.LocationSubform}, && ${BoxForm.TagWrap} {
    border: 0;
    border-radius: 0;
    padding: 0;
    background: transparent;
  }
  && ${BoxForm.Ghost}, && ${BoxForm.LocationAction}, && ${BoxForm.LocationClear} {
    ${consoleControlStyles}
  }
  && ${BoxForm.Primary} {
    ${primaryCommandStyles}
  }
  && ${BoxForm.FormActionDock} {
    background: var(--dw-surface);
    border-top: 1px solid var(--dw-border-soft);
    box-shadow: none;
  }
`;

const EmptyState = styled.div`
  display: grid;
  gap: 0.55rem;
  padding: 0.8rem 0;
  border-top: 1px solid var(--dw-border);
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
  ${consoleControlStyles}
  justify-self: start;
  color: var(--dw-cyan);
  font-size: .8rem;
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
    <Panel style={getBoxThemeCssVars(getBoxTheme(box.box_id ?? box.shortId))}>
      <EditBoxDetailsForm
        compact
        flat
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
