import { useMissingItem } from '../MissingItems/MissingItemsContext';
import { LOCATION_TIERS } from './answerPlacement';
import { getSearchTerms } from '../../util/searchHighlight';
import SearchHighlight from '../SearchHighlight';
import * as S from './FinderItemFocus.styles';

export default function FinderItemPlacement({ answer, query, compact = false,
  renderAttribute = (_key, value) => value }) {
  const { placement, boxTrail = [] } = answer;
  const item = useMissingItem(answer.item);
  const terms = getSearchTerms(query);
  const highlight = (value) => <SearchHighlight text={String(value)} terms={terms} />;
  const structured = LOCATION_TIERS.some(({ key }) => placement?.tiers[key]);

  return <S.Placement aria-label="Where to find this item">
    <h3>{renderAttribute(answer.unboxed ? 'location' : 'box-location', item?.missing?.quantity > 0 ? 'Recorded home' : answer.unboxed ? 'Item location' : 'Box location')}</h3>
    {structured || !compact ? <S.Tiers aria-label="Four-tier location">
      {LOCATION_TIERS.map(({ key, label }) => <div key={key}><dt>{label}</dt>
        <dd data-missing={!placement?.tiers[key] ? 'true' : undefined}>
          {renderAttribute(answer.unboxed ? 'location' : 'box-location', placement?.tiers[key] ? highlight(placement.tiers[key]) : 'Not recorded')}
        </dd>
      </div>)}
    </S.Tiers> : !placement?.legacyLabel ? <S.RecordedNote>
      {renderAttribute(answer.unboxed ? 'location' : 'box-location', answer.unboxed ? 'No item location recorded.' : 'No box location recorded.')}
    </S.RecordedNote> : null}
    {placement?.legacyLabel ? <S.RecordedNote>
      Recorded location: {highlight(placement.legacyLabel)}{!compact ? ' · Four-tier details not recorded.' : ' (flat record)'}
    </S.RecordedNote> : null}
    {boxTrail.length > 1 ? <S.RecordedNote>Box path: {highlight(boxTrail.map(({ id, label }) => `#${id} ${label}`.trim()).join(' › '))}</S.RecordedNote> : null}
    {answer.unboxed ? <S.RecordedNote>This item is not currently assigned to a box.</S.RecordedNote> : null}
  </S.Placement>;
}
