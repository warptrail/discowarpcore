import { useContext, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getOperationsItemPeekNavigation } from '../../util/operationsItemNavigation';
import styled, { keyframes } from 'styled-components';
import { INVENTORY_QUICK_ANSWER_EVENT } from '../../constants/inventoryFinderEvents';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';
import { controlStyles } from '../../styles/primitives';
import { ToastContext } from '../Toast';

const settle = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const Banner = styled.section`
  display: grid; grid-template-columns: minmax(0, 1fr) auto;
  align-items: center; gap: 0.35rem; min-width: 0; width: 100%; height: 100%;
`;
const Main = styled.div`
  display: grid; grid-template-columns: auto minmax(0, 1fr);
  align-items: center; gap: 0.6rem; min-width: 0;
  animation: ${settle} 220ms ease-out;
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;
const Details = styled.div`
  display: grid; gap: 0.1rem; min-width: 0;
`;
const BoxName = styled(Link)`
  color: var(--box-secondary, var(--dw-text-secondary)); text-decoration: none;
  font-size: 0.78rem; line-height: 1.3;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
`;
const Identity = styled(Link)`
  color: var(--dw-text); text-decoration: none; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: 0.82rem; font-weight: 600;
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
`;
const Box = styled(Link)`
  flex-shrink: 0; text-decoration: none; color: var(--box-primary, var(--dw-cyan));
  font: 800 clamp(1.4rem, 4vw, 1.65rem)/1.1 var(--dw-font-data);
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
`;
const Unboxed = styled.span`font-size: 0.75rem; color: var(--dw-amber); flex-shrink: 0;`;
const Path = styled.div`
  color: var(--box-location, var(--dw-text-secondary)); font-size: 0.75rem; line-height: 1.5;
  white-space: nowrap; overflow-x: auto; min-width: 0;
  scrollbar-width: none; &::-webkit-scrollbar { display: none; }
  &:focus-visible { outline: 2px solid var(--dw-cyan); outline-offset: -2px; }
`;
const Cycle = styled.button`
  ${controlStyles}
  min-height: 44px; padding: 0 0.25rem; border: 0; background: transparent;
  font-size: 0.75rem; color: var(--dw-text-secondary);
`;
const Message = styled.p`
  margin: 0; color: var(--dw-text-secondary); font-size: 0.78rem;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
const EMPTY = { query: '', answers: [], loading: false, error: '' };

const MESSAGE_ID = 'operations-search-answer';
const SETTLE_MS = 650;

// Publish into the shared console channel; the Header owns placement and Toast
// owns the fixed console slot and dismissal. Primary toasts always take precedence.
export default function InventoryQuickAnswer({ enabled }) {
  const { setConsoleMessage } = useContext(ToastContext);
  const [state, setState] = useState(EMPTY);
  const [selection, setSelection] = useState({ query: '', id: '' });
  const latestQuery = useRef('');
  useEffect(() => {
    if (!enabled) return;
    let timer;
    const receive = (event) => {
      const next = event.detail || EMPTY;
      clearTimeout(timer);
      if (next.query !== latestQuery.current) {
        setState((current) => ({ ...current, pending: true, searchActive: !!next.query }));
      }
      latestQuery.current = next.query;
      timer = setTimeout(() => setState(next.query ? { ...next, searchActive: true } : EMPTY), next.query ? SETTLE_MS : 220);
    };
    window.addEventListener(INVENTORY_QUICK_ANSWER_EVENT, receive);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(INVENTORY_QUICK_ANSWER_EVENT, receive);
      setConsoleMessage((current) => current?.id === MESSAGE_ID ? null : current);
    };
  }, [enabled, setConsoleMessage]);
  useEffect(() => {
    if (!enabled || (!state.query && !state.pending)) {
      setConsoleMessage((current) => current?.id === MESSAGE_ID ? null : current);
      return;
    }
    const index = selection.query === state.query ? Math.max(0, state.answers.findIndex((entry) => entry.id === selection.id)) : 0;
    const answer = !state.loading && !state.error ? state.answers[index] : null;
    setConsoleMessage({
      active: state.searchActive,
      updating: !!state.pending,
      themeStyle: answer?.boxId ? getBoxThemeCssVars(getBoxTheme(answer.boxId)) : null,
      id: MESSAGE_ID,
      content: <QuickAnswerContent state={state} selection={selection} onSelect={setSelection} />,
    });
  }, [enabled, state, selection, setConsoleMessage]);
  return null;
}

function QuickAnswerContent({ state, selection, onSelect }) {
  const route = useLocation();
  const index = selection.query === state.query ? Math.max(0, state.answers.findIndex((entry) => entry.id === selection.id)) : 0;
  const answer = state.answers[index];
  const choose = (nextIndex) => onSelect({ query: state.query, id: state.answers[nextIndex].id });
  const theme = answer?.boxId ? getBoxThemeCssVars(getBoxTheme(answer.boxId)) : undefined;
  const location = answer?.path.length ? answer.path.join(' › ') : 'Location not recorded';
  const notice = state.loading ? `Looking for “${state.query}”…` : state.error ?
    `Search unavailable: ${state.error}` : !answer ? `No item matched “${state.query}”. Try part of its name or clear filters.` : '';
  return (
    <Banner aria-label="Where your item is" style={theme}>
      <div role="status" aria-live="polite" aria-atomic="true" style={{ minWidth: 0 }}>
        {notice ? <Message title={notice}>{notice}</Message> : <>
          <Main key={answer.id}>
            {answer.unboxed ? <Unboxed>Unboxed</Unboxed> : answer.boxId ?
              <Box to={`/operations?peek=${encodeURIComponent(answer.boxId)}`} aria-label={`Open box ${answer.boxId}`}>#{answer.boxId}</Box> :
              <Unboxed>Box ID unknown</Unboxed>}
            <Details>
              <Identity {...getOperationsItemPeekNavigation({ search: route.search, state: route.state, boxId: answer.unboxed ? 'adrift' : answer.boxId, itemId: answer.id })} title={answer.name}>
                {answer.nameMatch ? '' : 'Possible: '}{answer.name}
              </Identity>
              {answer.boxId ? <BoxName to={`/operations?peek=${encodeURIComponent(answer.boxId)}`} title={answer.boxLabel || 'Box name not recorded'}>
                {answer.boxLabel || 'Box name not recorded'}
              </BoxName> : <Message>{answer.unboxed ? 'Items Adrift' : 'Box name not recorded'}</Message>}
              <Path aria-label="Item location" title={location} tabIndex={0}>{location}</Path>
            </Details>
          </Main>
        </>}
      </div>
      {!notice && state.answers.length > 1 && <Cycle aria-label="Next matching item"
        title="Next matching item" onClick={() => choose((index + 1) % state.answers.length)}>
        {index + 1}/{state.answers.length} ›
      </Cycle>}
    </Banner>
  );
}
