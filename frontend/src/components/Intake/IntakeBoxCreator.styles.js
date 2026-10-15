import styled from 'styled-components';
import * as Create from '../OperationsQuickBoxCreate/OperationsQuickBoxCreate.styles';
import * as BoxForm from '../BoxForms/BoxEditForm.styles';
import { consoleControlStyles, consoleFieldStyles, primaryCommandStyles } from './IntakeConsole.styles';

// Scope the Intake skin to this wrapper; Operations keeps its existing creator.
export const BoxCreatorWorkspace = styled.div`
  min-width: 0;
  && ${Create.Shell} {
    border: 0;
    border-radius: 0;
    background: transparent;
    padding: 0;
  }
  && ${Create.Title} {
    font-weight: 600;
  }
  && ${Create.Eyebrow}, && ${Create.Label} {
    color: var(--dw-text-muted);
    font-weight: 400;
  }
  && ${Create.Form} {
    gap: 12px;
  }
  && ${Create.Input}, && ${Create.Textarea}, && ${BoxForm.LocationInput} {
    ${consoleFieldStyles}
  }
  && ${Create.Textarea} {
    min-height: 88px;
    max-height: 240px;
    overflow: auto;
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
  && ${Create.Close}, && ${Create.PhotoAction} {
    ${consoleControlStyles}
  }
  && ${Create.PhotoField}, && ${Create.Details}, && ${BoxForm.LocationSubform} {
    border: 0;
    border-radius: 0;
    padding: 8px 0;
    background: transparent;
  }
  && ${Create.Summary} {
    ${consoleControlStyles} justify-content: start;
  }
  && ${Create.Button} {
    ${consoleControlStyles}
  }
  && ${Create.Footer} > ${Create.Button}:last-child {
    ${primaryCommandStyles}
  }
`;
