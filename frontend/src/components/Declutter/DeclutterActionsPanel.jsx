import { Link } from 'react-router-dom';
import * as S from './Declutter.styles';
import * as A from './DeclutterActionsPanel.styles';
import DeclutterExitControls from './DeclutterExitControls';
import { getDeclutterItemTheme } from './declutterItemTheme';
import { getItemName, getSessionItemItem } from './declutterUtils';

const ROUTE_LABELS = {
  discard: 'Trash',
  donate: 'Donate',
  sell: 'Sell',
  gift: 'Gift',
  needs_routing: 'Needs routing',
};

function ActionRow({ candidate, player, stagingBoxes, busy, onAction }) {
  const item = getSessionItemItem(candidate);
  const currentRoute = candidate.stagingRoute || 'needs_routing';
  const itemName = getItemName(item);

  return (
    <A.Card style={getDeclutterItemTheme(item)} data-declutter-exit-card>
      <A.Identity>
        <div>
          {item?.id ? (
            <Link to={`/items/${encodeURIComponent(item.id)}`}>
              {itemName}
            </Link>
          ) : <strong>{itemName}</strong>}
          <small>{item?.isIntendedGift ? 'Gift intent retained' : 'Active inventory'}</small>
        </div>
        <A.RouteBadge $route={currentRoute}>
          {ROUTE_LABELS[currentRoute] || currentRoute}
        </A.RouteBadge>
      </A.Identity>

      <DeclutterExitControls
        candidate={candidate}
        itemName={itemName}
        item={item}
        currentRoute={currentRoute}
        player={player}
        stagingBoxes={stagingBoxes}
        busy={busy}
        onAction={onAction}
      />
    </A.Card>
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
    return <S.StatusPanel>No items are currently approved to leave.</S.StatusPanel>;
  }

  return (
    <A.Console>
      <A.Header>
        <div>
          <S.Eyebrow>Exit todo list</S.Eyebrow>
          <h2>Approved to Leave</h2>
          <p>Agreed exits stay active inventory until you confirm they are actually gone.</p>
        </div>
        <span>{candidates.length} item{candidates.length===1 ? '' : 's'}</span>
      </A.Header>
      <A.Grid>
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
      </A.Grid>
    </A.Console>
  );
}
