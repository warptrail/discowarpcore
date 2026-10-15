import styled from 'styled-components';
import Toast from '../Toast/Toast';
import OperationsConsoleIdleTicker from './OperationsConsoleIdleTicker';
import OperationsConsoleIcon from './OperationsConsoleIcon';

const Row = styled.div`
  display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start;
  gap: .35rem; min-width: 0; min-height: 32px;
  border-top: 1px solid var(--dw-border-soft);
`;
const Message = styled.div`min-width: 0;`;
const Status = styled.div`
  display: flex; gap: .4rem; align-items: center; min-height: 32px; min-width: 0;
  color: var(--dw-text-muted); font: 400 .75rem/1.3 var(--dw-font-ui);
`;
const Ticker = styled.div`
  display: flex; flex-wrap: wrap; column-gap: .6rem; min-width: 0;
  span { white-space: nowrap; }
`;
const BoxCount = styled.span`
  color: var(--dw-text-secondary);
  &::before { content: '·'; margin-right: .6rem; color: var(--dw-text-muted); }
`;
const ActionsMount = styled.div`min-width: 0; &:empty { display: none; }`;

// The Header owns this persistent surface. Existing Toast actions and lifecycle
// are passed through unchanged; finder controls portal into the small side dock.
export default function OperationsConsoleLog({ toast, consoleMessage, onClose }) {
  const dismissible = toast && toast.dismissible !== false && toast.id !== 'item-page-actions' &&
    !String(toast.id || '').startsWith('edit-item-actions:') && !String(toast.id || '').startsWith('edit-item-field:');
  return <Row aria-label="Operations console log">
    <Message>
      {toast ? <Toast {...toast} headerMounted open onClose={dismissible ? onClose : undefined} presentation={!toast.presentation || toast.presentation === 'default' ? 'console-log' : toast.presentation} />
        : consoleMessage?.active ? <Status role="status" aria-live="polite">
          <OperationsConsoleIcon />
          <Ticker>
            <span>{consoleMessage.summary}</span>
            {consoleMessage?.active && Number.isFinite(consoleMessage.matchingBoxCount)
              ? <BoxCount>{consoleMessage.matchingBoxCount} matching {consoleMessage.matchingBoxCount === 1 ? 'box' : 'boxes'}</BoxCount> : null}
          </Ticker>
        </Status> : <OperationsConsoleIdleTicker />}
    </Message>
    <ActionsMount id="operations-finder-actions-mount" />
  </Row>;
}
