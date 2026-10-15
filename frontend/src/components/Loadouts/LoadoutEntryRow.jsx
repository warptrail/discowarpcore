import { useMissingItem } from '../MissingItems/MissingItemsContext';
import MissingStatus from '../MissingItems/MissingStatus';
import { Link } from 'react-router-dom';
import { getBoxTheme, getBoxThemeCssVars } from '../../util/inventoryColorTheme';
import * as S from './Loadouts.styles';

export default function LoadoutEntryRow({ entry, editing, busy, onGather, onReturn, onLink, onUnlink, onRemove }) {
  const item = useMissingItem(entry.item);
  const title = item?.name || entry.label;
  const placementStyle = item?.boxNumber ? getBoxThemeCssVars(getBoxTheme(item.boxNumber)) : undefined;

  return (
    <S.Entry>
      <div>
        <S.EntryName>
          {item && !item.unavailable ? <Link to={`/items/${item.id}`}>{title}</Link> : title}
        </S.EntryName>
        <MissingStatus item={item} home />
        {item ? <>
          {item.name !== entry.label && <S.Status>For: {entry.label}</S.Status>}
          {item.unavailable
            ? <S.Placement><S.Status $warning>Inventory item unavailable. Relink or keep as a reminder.</S.Status></S.Placement>
            : <S.Placement style={placementStyle}>
                {item.boxNumber ? <>
                  <span>{item?.missing?.quantity > 0 ? 'Recorded home' : 'Source box'}</span>
                  <Link to={`/boxes/${encodeURIComponent(item.boxNumber)}`}>#{item.placementLabel || item.boxNumber}</Link>
                  <span>{item.boxName}</span>
                </> : <span>Source: Items Adrift · no box</span>}
                <span>· {item.locationLabel || 'Location not recorded'}</span>
              </S.Placement>}
        </> : <S.Placement><S.Status>Not linked to inventory yet</S.Status></S.Placement>}
        {editing && <S.RowActions>
          <S.Button type="button" $quiet disabled={busy} onClick={onLink}>{item ? 'Relink' : 'Link inventory'}</S.Button>
          {entry.itemId && <S.Button type="button" $quiet disabled={busy} onClick={onUnlink}>Unlink</S.Button>}
          <S.Button type="button" $quiet $danger disabled={busy} onClick={onRemove} aria-label={`Remove ${title} from loadout`}>Remove</S.Button>
        </S.RowActions>}
      </div>
      <S.ItemChecks>
        <S.CheckTarget>
          <input type="checkbox" checked={entry.gathered} disabled={busy} aria-label={`Gather ${title}`} onChange={onGather} />
          <span>Gathered</span>
        </S.CheckTarget>
        <S.CheckTarget>
          <input type="checkbox" checked={entry.returned} disabled={busy || !entry.gathered} aria-label={`Put away ${title}`} onChange={onReturn} />
          <span>Put away</span>
        </S.CheckTarget>
      </S.ItemChecks>
    </S.Entry>
  );
}
