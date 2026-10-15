import styled from 'styled-components';
import { consoleControlStyles } from './IntakeConsole.styles';

export const Wrap = styled.div`
  display: grid;
  gap: 16px;
  min-width: 0;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 0 2rem;
  @media (max-width: 700px) {
    input, textarea, select {
      font-size: 16px !important;
    }
  }
  @media (min-width: 1100px) {
    max-width: none;
    margin: 0;
    grid-template-columns: minmax(0, 1fr) 320px;
    align-items: start;
  }
`;
export const Workspace = styled.main`
  display: grid;
  gap: 12px;
  min-width: 0;
  width: 100%;
  position: relative;
  background: var(--dw-surface);
  border-bottom: 1px solid var(--dw-border);
  border-radius: 2px 12px 2px 2px;
`;
export const WorkspacePanel = styled.section`
  display: grid;
  gap: 12px;
  min-width: 0;
  width: 100%;
  padding: 4px 12px 12px;
  @media (min-width: 760px) {
    padding-inline: 20px;
  }
`;
export const StateText = styled.div`
  color: ${({ $error }) => $error ? 'var(--dw-coral)' : 'var(--dw-text-secondary)'};
  padding: 0 12px 12px;
  font-size: .8rem;
  line-height: 1.4;
`;
export const RouteNoneSelectButton = styled.button`
  ${consoleControlStyles}
  min-width: 172px;
  justify-content: space-between;
  border-bottom: 1px solid var(--dw-border);
  svg {
    color: var(--dw-cyan);
  }
`;
