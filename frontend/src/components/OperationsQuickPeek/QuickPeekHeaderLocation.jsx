import { useMemo } from 'react';
import { getAnswerPlacement, LOCATION_TIERS } from '../InventoryQuickAnswer/answerPlacement';
import * as S from './OperationsQuickPeek.styles';

const EMPTY_LOCATIONS = [];

export default function QuickPeekHeaderLocation({ box, locations = EMPTY_LOCATIONS }) {
  const registry = useMemo(() => new Map(locations.map((entry) => [String(entry._id), entry])), [locations]);
  const placement = getAnswerPlacement(box, registry);
  if (box?.systemType === 'orphaned') return <S.HeaderLocationNote>No box assigned</S.HeaderLocationNote>;
  // Legacy labels remain intact; never infer four structured tiers from a string.
  if (placement.legacyLabel) return <S.HeaderLocationNote>
    <span>Recorded location</span> {placement.legacyLabel}
  </S.HeaderLocationNote>;
  return <S.HeaderLocationGrid aria-label="Box location" data-quick-peek-location>
    {LOCATION_TIERS.map(({ key, label }) => <S.HeaderLocationTier key={key}>
      <dt>{label}</dt>
      <dd data-recorded={Boolean(placement.tiers[key])}>{placement.tiers[key] || 'Not recorded'}</dd>
    </S.HeaderLocationTier>)}
  </S.HeaderLocationGrid>;
}
