import * as S from './Declutter.styles';
import DeclutterActionOptions from './DeclutterActionOptions';
import { getItemName, getSessionItemItem } from './declutterUtils';

const ROUTE_LABELS = {
  discard: 'Trash',
  donate: 'Donate',
  sell: 'Sell',
  gift: 'Gift',
  needs_routing: 'Needs routing',
};

const COMPLETION_DISPOSITIONS = {
  discard: 'trashed',
  donate: 'donated',
  sell: 'sold',
  gift: 'gifted',
};

function itemLocation(item) {
  const box = item?.box;
  if (box) {
    const boxLabel = [box.box_id ? `#${box.box_id}` : '', box.label || 'Box']
      .filter(Boolean)
      .join(' ');
    return box.locationName ? `${boxLabel} • ${box.locationName}` : boxLabel;
  }
  return item?.location || 'No box assigned';
}

function ActionRow({ candidate, player, stagingBoxes, busy, onAction }) {
  const item = getSessionItemItem(candidate);
  const currentRoute = candidate.stagingRoute || 'needs_routing';
  const itemName = getItemName(item);
  const disposition = COMPLETION_DISPOSITIONS[currentRoute];

  return (
    <S.ActionTableRow>
      <S.ActionItemCell>
        {item?.id ? (
          <S.ItemNameLink to={`/items/${encodeURIComponent(item.id)}`}>
            {itemName}
          </S.ItemNameLink>
        ) : <S.ItemName>{itemName}</S.ItemName>}
        <small>{item?.isIntendedGift ? 'Gift intent retained' : 'Active inventory'}</small>
      </S.ActionItemCell>

      <S.ActionPlanCell>
        <S.ActionRouteChip $tone={currentRoute === 'discard' ? 'toss' : currentRoute}>
          {ROUTE_LABELS[currentRoute] || currentRoute}
        </S.ActionRouteChip>
      </S.ActionPlanCell>

      <S.ActionLocationCell>{itemLocation(item)}</S.ActionLocationCell>

      <S.ActionPrimaryCell>
        <S.ActionCompleteButton
          type="button"
          disabled={busy || !disposition}
          onClick={() => onAction(candidate, 'complete', { disposition })}
        >
          {busy ? 'Working…' : 'Mark destroyed'}
        </S.ActionCompleteButton>
        <DeclutterActionOptions
          candidate={candidate}
          itemName={itemName}
          currentRoute={currentRoute}
          player={player}
          stagingBoxes={stagingBoxes}
          busy={busy}
          onAction={onAction}
        />
      </S.ActionPrimaryCell>
    </S.ActionTableRow>
  );
}

export default function DeclutterActionsPanel({
  candidates = [],
  player,
  stagingBoxes = [],
  busyCandidateId = '',
  onAction,
}) {
  if (!candidates.length) {
    return <S.StatusPanel>No items are currently marked for destruction.</S.StatusPanel>;
  }

  return (
    <S.ActionConsole>
      <S.ActionConsoleHeading>
        <div>
          <S.Eyebrow>Exit todo list</S.Eyebrow>
          <h2>Marked for Destruction</h2>
          <S.SmallText>Agreed exits stay active inventory until you confirm they are actually gone.</S.SmallText>
        </div>
        <strong>{candidates.length}</strong>
      </S.ActionConsoleHeading>
      <S.ActionTable>
        {candidates.map((candidate) => (
          <ActionRow
            key={candidate.id}
            candidate={candidate}
            player={player}
            stagingBoxes={stagingBoxes}
            busy={busyCandidateId === candidate.id}
            onAction={onAction}
          />
        ))}
      </S.ActionTable>
    </S.ActionConsole>
  );
}
