import * as S from './Declutter.styles';
import {
  getItemCategoryLabel,
  getItemLocationLabel,
  getItemName,
  getItemPreviewImageUrl,
  getSessionItemItem,
  getVotePresentationChoice,
  getVotePresentationMeta,
} from './declutterUtils';

const FINAL_FATE = {
  broken: { choice: '', label: 'Broken', icon: '⚒', tone: 'toss' },
  trashed: { choice: 'toss', label: 'Trashed', icon: '🗑', tone: 'toss' },
  recycled: { choice: '', label: 'Recycled', icon: '♻', tone: 'donate' },
  donated: { choice: 'donate', label: 'Donated', icon: '💙', tone: 'donate' },
  sold: { choice: 'sell', label: 'Sold', icon: '🏷', tone: 'sell' },
  gifted: { choice: 'gift', label: 'Gifted', icon: '🎁', tone: 'gift' },
  consumed: { choice: '', label: 'Consumed', icon: '◉', tone: 'toss' },
  lost: { choice: '', label: 'Lost', icon: '?', tone: 'unsure' },
  stolen: { choice: '', label: 'Stolen', icon: '⚠', tone: 'toss' },
};

function PlayerVote({ icon, name, vote, winner = false, winnerLabel = 'Route', compact = false }) {
  const meta = getVotePresentationMeta(vote);
  return (
    <S.PlayerVote $tone={meta.tone} $winner={winner} $compact={compact} title={`${name}: ${meta.label}`}>
      <span aria-hidden="true">{icon}</span>
      <div><strong>{name}</strong><small>{meta.label}</small></div>
      {winner ? <S.RouteWinnerFlag>{winnerLabel}</S.RouteWinnerFlag> : null}
    </S.PlayerVote>
  );
}

function getFinalFate(item) {
  const disposition = String(item?.disposition || '').trim().toLowerCase();
  return FINAL_FATE[disposition] || null;
}

function formatDepartureTimestamp(value) {
  if (!value) return '';
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
}

function voteWinsRoute(vote, stagingRoute) {
  const winningChoice = stagingRoute === 'discard' ? 'toss' : stagingRoute;
  return ['toss', 'donate', 'sell', 'gift'].includes(winningChoice)
    && getVotePresentationChoice(vote) === winningChoice;
}

export default function DeclutterCandidateLane({
  title,
  candidates = [],
  emptyText,
  actionLabel = '',
  busyCandidateId = '',
  onAction,
  renderActions,
  compact = false,
}) {
  return (
    <S.QueueGrid>
      <S.ModeBar>
        <S.ProgressText>{title}</S.ProgressText>
        <S.ProgressText>{candidates.length} item{candidates.length === 1 ? '' : 's'}</S.ProgressText>
      </S.ModeBar>
      {candidates.length ? candidates.map((candidate) => {
        const item = getSessionItemItem(candidate);
        const imageUrl = getItemPreviewImageUrl(item);
        const candidateId = String(candidate?.id || '');
        const itemIsGone = String(item?.item_status || '').trim().toLowerCase() === 'gone'
          || item?.declutterExitState === 'completed';
        const finalFate = itemIsGone ? getFinalFate(item) : null;
        const departureTimestamp = formatDepartureTimestamp(
          candidate?.actionCompletedAt || item?.disposition_at || item?.dispositionAt
        );
        const winningChoice = finalFate?.choice
          || (candidate?.stagingRoute === 'discard' ? 'toss' : candidate?.stagingRoute);
        const box = item?.box && typeof item.box === 'object' ? item.box : null;
        const boxShortId = String(box?.box_id || '').trim();
        const boxLabel = String(box?.label || '').trim();
        const locationLabel = getItemLocationLabel(item);
        const customActions = renderActions?.(candidate) || null;
        return (
          <S.QueueItem key={candidateId} $compact={compact}>
            <S.ThumbFrame $compact={compact}>
              {imageUrl ? <S.ThumbImage src={imageUrl} alt="" loading="lazy" /> : 'No Image'}
            </S.ThumbFrame>
            <div>
              {item?.id ? (
                <S.ItemNameLink to={`/items/${encodeURIComponent(item.id)}`}>
                  {getItemName(item)}
                </S.ItemNameLink>
              ) : <S.ItemName>{getItemName(item)}</S.ItemName>}
              <S.CandidateMetaGrid $compact={compact}>
                <S.CandidateMetaGroup>
                  <S.CandidateMetaLabel>Box</S.CandidateMetaLabel>
                  {itemIsGone ? (
                    <S.CandidateMetaValue $tone="gone">No longer have</S.CandidateMetaValue>
                  ) : box && boxShortId ? (
                    <S.CandidateBoxLink to={`/boxes/${encodeURIComponent(boxShortId)}`}>
                      <S.CandidateBoxId>#{boxShortId}</S.CandidateBoxId>
                      <span>{boxLabel || 'Box'}</span>
                    </S.CandidateBoxLink>
                  ) : (
                    <S.CandidateMetaValue>No box assigned</S.CandidateMetaValue>
                  )}
                </S.CandidateMetaGroup>
                <S.CandidateMetaGroup>
                  <S.CandidateMetaLabel>Location</S.CandidateMetaLabel>
                  <S.CandidateMetaValue $tone="location">
                    {itemIsGone ? 'Outside inventory' : locationLabel || 'Not set'}
                  </S.CandidateMetaValue>
                </S.CandidateMetaGroup>
                <S.CandidateMetaGroup>
                  <S.CandidateMetaLabel>Category</S.CandidateMetaLabel>
                  <S.CandidateMetaValue>{getItemCategoryLabel(item) || 'Uncategorized'}</S.CandidateMetaValue>
                </S.CandidateMetaGroup>
                {itemIsGone ? (
                  <S.CandidateMetaGroup>
                    <S.CandidateMetaLabel>Left house</S.CandidateMetaLabel>
                    <S.CandidateMetaValue
                      $tone="gone"
                      title={candidate?.actionCompletedAt || item?.disposition_at || item?.dispositionAt || undefined}
                    >
                      {departureTimestamp || 'Time not recorded'}
                    </S.CandidateMetaValue>
                  </S.CandidateMetaGroup>
                ) : null}
              </S.CandidateMetaGrid>
              {!compact && candidate.notes ? <S.SmallText>{candidate.notes}</S.SmallText> : null}
            </div>
            <S.VoteComparison $compact={compact}>
              {finalFate ? (
                <S.FinalFate $tone={finalFate.tone} $compact={compact}>
                  <span aria-hidden="true">{finalFate.icon}</span>
                  <div><small>Actual fate</small><strong>{finalFate.label}</strong></div>
                </S.FinalFate>
              ) : null}
              <PlayerVote
                icon="🐟"
                name="Discofish"
                vote={candidate?.votes?.discofish}
                winner={voteWinsRoute(candidate?.votes?.discofish, winningChoice)}
                winnerLabel={finalFate ? 'Fate' : 'Route'}
                compact={compact}
              />
              <PlayerVote
                icon="🦊"
                name="Laserfox"
                vote={candidate?.votes?.laserfox}
                winner={voteWinsRoute(candidate?.votes?.laserfox, winningChoice)}
                winnerLabel={finalFate ? 'Fate' : 'Route'}
                compact={compact}
              />
            </S.VoteComparison>
            {customActions ? <S.CandidateWorkflow>{customActions}</S.CandidateWorkflow> : null}
            {actionLabel ? (
              <S.QueueActions>
                <S.Button
                  type="button"
                  $tone="warning"
                  disabled={busyCandidateId === candidateId}
                  onClick={() => onAction?.(candidate)}
                >
                  {busyCandidateId === candidateId ? 'Working...' : actionLabel}
                </S.Button>
              </S.QueueActions>
            ) : null}
          </S.QueueItem>
        );
      }) : <S.StatusPanel>{emptyText}</S.StatusPanel>}
    </S.QueueGrid>
  );
}
