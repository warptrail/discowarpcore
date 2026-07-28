import * as S from './Declutter.styles';
import {
  getItemBoxLabel,
  getItemCategoryLabel,
  getItemLocationLabel,
  getItemName,
  getItemPreviewImageUrl,
  getSessionItemItem,
  getVotePresentationMeta,
} from './declutterUtils';

function PlayerVote({ icon, name, vote }) {
  const meta = getVotePresentationMeta(vote);
  return (
    <S.PlayerVote $tone={meta.tone}>
      <span aria-hidden="true">{icon}</span>
      <div><strong>{name}</strong><small>{meta.label}</small></div>
    </S.PlayerVote>
  );
}

export default function DeclutterCandidateLane({
  title,
  candidates = [],
  emptyText,
  actionLabel = '',
  busyCandidateId = '',
  onAction,
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
        return (
          <S.QueueItem key={candidateId}>
            <S.ThumbFrame>
              {imageUrl ? <S.ThumbImage src={imageUrl} alt="" loading="lazy" /> : 'No Image'}
            </S.ThumbFrame>
            <div>
              <S.ItemName>{getItemName(item)}</S.ItemName>
              <S.ItemMeta>
                <span>
                  {getItemBoxLabel(item)}
                  {getItemLocationLabel(item) ? ` • ${getItemLocationLabel(item)}` : ''}
                </span>
                <span>{getItemCategoryLabel(item)}</span>
              </S.ItemMeta>
              {candidate.notes ? <S.SmallText>{candidate.notes}</S.SmallText> : null}
            </div>
            <S.VoteComparison>
              <PlayerVote icon="🐟" name="Discofish" vote={candidate?.votes?.discofish} />
              <PlayerVote icon="🦊" name="Laserfox" vote={candidate?.votes?.laserfox} />
            </S.VoteComparison>
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
