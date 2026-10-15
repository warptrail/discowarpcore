import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FINDER_ITEM_PARAM } from '../../util/finderItemNavigation';
import { INVENTORY_QUICK_ANSWER_EVENT } from '../../constants/inventoryFinderEvents';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';
import { ToastContext } from '../Toast';
import QuickAnswerCarousel from './QuickAnswerCarousel';
import FinderItemFocus from './FinderItemFocus';
import { Notice } from './QuickAnswerCarousel.styles';
import { getFinderCarouselIndex } from './finderSelection';
const EMPTY = { query: '', answers: [], loading: false, error: '' };

const MESSAGE_ID = 'operations-search-answer';
const SETTLE_MS = 650;

// Publish into the shared console channel; the Header owns placement and Toast
// owns the fixed console slot and dismissal. Primary toasts always take precedence.
export default function InventoryQuickAnswer({ enabled }) {
  const route = useLocation();
  const { setConsoleMessage } = useContext(ToastContext);
  const [state, setState] = useState(EMPTY);
  const [selection, setSelection] = useState({ query: '', id: '' });
  const params = new URLSearchParams(route.search);
  const focusedId = params.get(FINDER_ITEM_PARAM);
  const focusOpen = params.has(FINDER_ITEM_PARAM);
  const index = getFinderCarouselIndex(state.answers, state.query, selection, focusedId);
  const choose = useCallback((nextIndex) => {
    const answer = state.answers[nextIndex];
    if (answer) setSelection({ query: state.query, id: answer.id });
  }, [state.answers, state.query]);
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
    const answer = !state.loading && !state.error ? state.answers[index] : null;
    setConsoleMessage({
      active: state.searchActive,
      updating: !!state.pending,
      themeStyle: answer?.boxId ? getBoxThemeCssVars(getBoxTheme(answer.boxId)) : null,
      id: MESSAGE_ID,
      height: 108,
      presentation: 'finder-shelf',
      summary: state.pending || state.loading ? 'Searching…' : state.error ? 'Search unavailable' : `${state.answers.length} matching ${state.answers.length === 1 ? 'item' : 'items'}`,
      matchingBoxCount: state.pending || state.loading || state.error ? null : state.matchingBoxCount,
      content: <QuickAnswerContent state={state} index={index} focusOpen={focusOpen} onSelect={choose} />,
    });
  }, [enabled, state, index, focusOpen, choose, setConsoleMessage]);
  return enabled && focusOpen
    ? <FinderItemFocus answers={state.answers} onSelect={choose} query={state.query || params.get('q') || ''} loading={(!!params.get('q') && !state.query) || state.loading || state.pending} /> : null;
}

function QuickAnswerContent({ state, index, focusOpen, onSelect }) {
  const answer = state.answers[index];
  const notice = state.loading ? `Looking for “${state.query}”…` : state.error ?
    `Search unavailable: ${state.error}` : !answer ? `No item matched “${state.query}”. Try part of its name or clear filters.` : '';
  return notice ? <Notice role="status" title={notice}>{notice}</Notice>
    : <QuickAnswerCarousel key={state.query} query={state.query} answers={state.answers} index={index} focusOpen={focusOpen}
      onSelect={(nextIndex) => { if (!focusOpen) onSelect(nextIndex); }} />;
}
