import { getItemHomeHref } from '../../api/itemDetails';
import { getOperationsItemPeekNavigation } from '../../util/operationsItemNavigation';
import * as S from './FinderItemFocus.styles';

const views = [
  { id: 'location', label: 'Show item location', path: 'M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12Z', circle: true },
  { id: 'details', label: 'Show item details', path: 'M8 3H5v18h14V3h-3M9 3h6v4H9zM8 11h8M8 15h8M8 18h5' },
  { id: 'tags', label: 'Show item tags', path: 'M3 3h8l10 10-8 8L3 11ZM7 7h.01' },
  { id: 'notes', label: 'Show item notes', path: 'M14 2H5v20h14V7ZM14 2v5h5M8 11h8M8 15h8M8 18h5' },
];

export default function FinderItemControls({ answer, view, onViewChange, search, routeState }) {
  const boxNavigation = answer ? getOperationsItemPeekNavigation({ search, state: routeState, boxId: answer.unboxed ? 'adrift' : answer.boxId }) : null;
  return <S.Footer role="group" aria-label="Item finder controls">
    <S.ViewControls role="group" aria-label="Item information">
      {views.map(({ id, label, path, circle }) => <S.IconButton key={id} type="button" aria-label={label} title={label}
        aria-pressed={view === id} aria-controls="finder-item-information" disabled={!answer} onClick={() => onViewChange(id)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={path} />{circle ? <circle cx="12" cy="9" r="2.5" /> : null}</svg>
      </S.IconButton>)}
    </S.ViewControls>
    {answer ? <>
      <S.ActionLink {...boxNavigation} aria-label={answer.unboxed ? 'Open Items Adrift' : `Open box #${answer.boxId}`} title={answer.unboxed ? 'Open Items Adrift' : `Open box #${answer.boxId}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 9 5v10l-9 5-9-5V7Zm-9 5 9 5 9-5M12 12v10" /></svg>
      </S.ActionLink>
      <S.ActionLink to={getItemHomeHref(answer.id)} aria-label={`Open item page for ${answer.name}`} title="Open full item page">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7M21 3l-10 10M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" /></svg>
      </S.ActionLink>
    </> : null}
  </S.Footer>;
}
