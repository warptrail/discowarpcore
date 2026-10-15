import styled from 'styled-components';
import { consoleControlStyles, consoleFieldStyles, consoleTabStyles } from './IntakeConsole.styles';

export const Section = styled.section`
  display: grid;
  gap: 12px;
  min-width: 0;
`;

export const Switches = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-width: 0;
`;

export const Switch = styled.button`
  ${consoleTabStyles}
  min-width: 0;
`;

export const DetailPanel = styled.div`
  display: grid;
  gap: 6px;
  min-width: 0;
`;

export const FieldLabel = styled.label`
  color: var(--dw-text-muted);
  font: 400 0.75rem/1.3 var(--dw-font-ui);
`;

export const TextArea = styled.textarea`
  ${consoleFieldStyles}
  min-height: 88px;
  max-height: 240px;
  resize: vertical;
  overflow-y: auto;
`;

export const FinerButton = styled.button`
  ${consoleControlStyles}
  justify-content: start;
  padding-inline: 0;
  font-size: 0.75rem;
  > svg { color: var(--dw-violet); }
  > span:last-child { margin-left: auto; }
  &[aria-expanded='true'] { color: var(--dw-violet); }
`;

export const FinerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  min-width: 0;
`;

export const FinerField = styled.div`
  display: grid;
  gap: 6px;
  min-width: 0;
`;

export const Select = styled.select`
  ${consoleFieldStyles}
  min-width: 0;
`;
