import { useRef, useState } from 'react';

import * as S from './Declutter.styles';
import { getItemName, getSessionItemItem } from './declutterUtils';

const HOLD_MS = 1200;

function laneTitle(candidate) {
  const state = candidate?.item?.declutterExitState;
  if (state === 'marked_for_destruction') return 'Trash Run';
  if (state === 'staged_for_donation') return 'Donation Staging';
  if (state === 'staged_for_sale') return 'Sale Staging';
  if (state === 'needs_staging') return 'Needs Staging';
  return 'Needs Routing';
}

function ActionCard({ candidate, player, stagingBoxes, busy, onAction }) {
  const item = getSessionItemItem(candidate);
  const [route, setRoute] = useState(candidate.stagingRoute === 'needs_routing' ? 'donate' : candidate.stagingRoute);
  const [boxId, setBoxId] = useState('');
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef(null);
  const isTrash = item?.declutterExitState === 'marked_for_destruction';
  const compatibleBoxes = stagingBoxes.filter((box) =>
    box.declutterPurpose === (route === 'sell' ? 'sale_staging' : 'donation_staging')
  );

  const cancelHold = () => {
    window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setHolding(false);
  };
  const startHold = () => {
    setHolding(true);
    holdTimer.current = window.setTimeout(() => {
      setHolding(false);
      onAction(candidate, 'complete', { disposition: 'trashed' });
    }, HOLD_MS);
  };

  return (
    <S.WorkflowCard>
      <S.WorkflowCardTop>
        <div><S.Eyebrow>{laneTitle(candidate)}</S.Eyebrow><S.ItemName>{getItemName(item)}</S.ItemName></div>
        <S.DecisionPill $tone={isTrash ? 'toss' : route}>{candidate.stagingRoute}</S.DecisionPill>
      </S.WorkflowCardTop>
      {isTrash ? (
        <S.HoldButton
          type="button"
          $holding={holding}
          disabled={busy}
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onPointerCancel={cancelHold}
          onKeyDown={(event) => {
            if ((event.key === ' ' || event.key === 'Enter') && !holding) startHold();
          }}
          onKeyUp={cancelHold}
        >
          Hold to make it glorious: TRASHED
        </S.HoldButton>
      ) : (
        <S.ActionControls>
          <select value={route || 'donate'} onChange={(event) => setRoute(event.target.value)}>
            <option value="donate">Donate</option>
            <option value="sell">Sell</option>
            <option value="discard">Trash</option>
          </select>
          {route !== 'discard' ? (
            <select value={boxId} onChange={(event) => setBoxId(event.target.value)}>
              <option value="">Use default staging box</option>
              {compatibleBoxes.map((box) => (
                <option key={box.id} value={box.id}>{box.box_id} {box.label}</option>
              ))}
            </select>
          ) : null}
          <S.Button
            type="button"
            disabled={busy || (candidate.stagingRoute === 'needs_routing' && player !== 'laserfox')}
            onClick={() => onAction(candidate, 'reroute', { route, boxId })}
          >
            Apply route
          </S.Button>
          {['donate', 'sell'].includes(candidate.stagingRoute) ? (
            <S.Button
              type="button"
              $tone="success"
              disabled={busy}
              onClick={() => onAction(candidate, 'complete', {
                disposition: candidate.stagingRoute === 'donate' ? 'donated' : 'sold',
              })}
            >
              Mark physically {candidate.stagingRoute === 'donate' ? 'donated' : 'sold'}
            </S.Button>
          ) : null}
        </S.ActionControls>
      )}
      <S.QueueActions>
        <S.Button type="button" disabled={busy} onClick={() => onAction(candidate, 'restore')}>Restore as Keep</S.Button>
        <S.Button type="button" disabled={busy} onClick={() => onAction(candidate, 'reopen')}>Fresh vote round</S.Button>
      </S.QueueActions>
    </S.WorkflowCard>
  );
}

export default function DeclutterActionsPanel({
  candidates = [],
  player,
  stagingBoxes = [],
  busyCandidateId = '',
  onAction,
}) {
  const lanes = ['Trash Run', 'Donation Staging', 'Sale Staging', 'Needs Staging', 'Needs Routing'];
  return (
    <S.WorkflowGrid>
      {lanes.map((title) => {
        const entries = candidates.filter((candidate) => laneTitle(candidate) === title);
        if (!entries.length) return null;
        return (
          <section key={title}>
            <S.WorkflowLaneTitle>{title} <span>{entries.length}</span></S.WorkflowLaneTitle>
            {entries.map((candidate) => (
              <ActionCard
                key={candidate.id}
                candidate={candidate}
                player={player}
                stagingBoxes={stagingBoxes}
                busy={busyCandidateId === candidate.id}
                onAction={onAction}
              />
            ))}
          </section>
        );
      })}
      {!candidates.length ? <S.StatusPanel>No physical exit actions are waiting.</S.StatusPanel> : null}
    </S.WorkflowGrid>
  );
}
