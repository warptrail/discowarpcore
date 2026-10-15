import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { FINDER_ITEM_PARAM, FINDER_FOCUS_HISTORY, getFinderCloseNavigation, getFinderItemNavigation } from '../../util/finderItemNavigation';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';
import useDialogFocus from '../../hooks/useDialogFocus';
import useFinderFocusPosition from './useFinderFocusPosition';
import FinderItemDetails from './FinderItemDetails';
import FinderItemControls from './FinderItemControls';
import FinderMatchFrame from './FinderMatchFrame';
import * as S from './FinderItemFocus.styles';

export default function FinderItemFocus({ answers, query, loading, onSelect }) {
  const route = useLocation();
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  const bodyRef = useRef(null);
  const position = useFinderFocusPosition(answers.length);
  const [view, setView] = useState('location');
  const itemId = new URLSearchParams(route.search).get(FINDER_ITEM_PARAM);
  const index = answers.findIndex(({ id }) => id === itemId);
  const answer = answers[index];
  const close = () => {
    if (answer) onSelect(index);
    if (route.state?.[FINDER_FOCUS_HISTORY]) navigate(-1);
    else {
      const destination = getFinderCloseNavigation(route.search, route.state);
      navigate(destination.to, { replace: true, state: destination.state });
    }
  };
  const step = (direction) => {
    if (!answer || answers.length < 2) return;
    const nextIndex = (index + direction + answers.length) % answers.length;
    const next = answers[nextIndex];
    onSelect(nextIndex);
    const destination = getFinderItemNavigation({ search: route.search, state: route.state, itemId: next.id });
    navigate(destination.to, { replace: true, state: destination.state });
  };
  // The portal remains interactive; everything behind it is both dimmed and inert.
  // Restore inert before useDialogFocus restores focus to the finder link.
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return undefined;
    const previous = root.inert;
    root.inert = true;
    return () => { root.inert = previous; };
  }, []);
  useDialogFocus(dialogRef, close, !!position);
  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }); }, [itemId, view]);

  return createPortal(<>
    <S.Scrim aria-hidden="true" onClick={close} />
    {position ? <S.Panel ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="finder-focus-title" tabIndex={-1}
      style={{ ...position, ...(answer ? getBoxThemeCssVars(getBoxTheme(answer.boxId)) : {}) }}>
      <FinderMatchFrame expanded index={index} total={answers.length} onStep={step} onClose={close}>
        <S.Body ref={bodyRef} id="finder-item-information" $notes={view === 'notes'}>
          {answer ? <FinderItemDetails answer={answer} query={query} view={view} /> : <>
            <S.ItemTitle id="finder-focus-title">{loading ? 'Loading item…' : 'Item unavailable'}</S.ItemTitle>
            <S.RecordedNote role="status">{loading ? 'Loading search results…' : 'This item is not in the current search results. Close this view to search again.'}</S.RecordedNote>
          </>}
        </S.Body>
      </FinderMatchFrame>
      <FinderItemControls answer={answer} view={view} onViewChange={setView} search={route.search} routeState={route.state} />
    </S.Panel> : null}
  </>, document.body);
}
