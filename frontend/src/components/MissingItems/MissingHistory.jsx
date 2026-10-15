import { useMissingItems } from './MissingItemsContext';
import { formatPrimaryOwner } from '../../util/itemOwners';
import * as S from './MissingItems.styles';
export default function MissingHistory({ item }) {
  const { states } = useMissingItems();
  const cached = states[String(item?._id || item?.id)];
  const record = cached?.missingHistory && (cached.missing?.revision || 0) > (item?.missing?.revision || 0) ? cached : item;
  const history = record?.missingHistory || [];
  if (!history.length) return null;
  return <S.Lane as="details"><summary>Missing and recovery history ({history.length})</summary>
    <S.List>{[...history].reverse().map((entry, index) => <S.Row key={`${entry.revision}-${index}`}>
      <div><strong>{({ report: 'Reported missing', correction: 'Report corrected', found: 'Recovered and put away', departed: 'Report closed: departed' })[entry.action]}</strong>
        <p>{entry.before} → {entry.after} missing · {formatPrimaryOwner(entry.profile) || 'Profile not recorded'} · {new Date(entry.at).toLocaleString()}</p>
        <p>Recorded placement: {entry.placement?.placementLabel || entry.placement?.boxNumber ? `#${entry.placement.placementLabel || entry.placement.boxNumber}` : 'Items Adrift'} {entry.placement?.boxName || ''}</p>
        {entry.note && <p>{entry.note}</p>}
      </div>
    </S.Row>)}</S.List>
  </S.Lane>;
}
