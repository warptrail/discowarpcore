import { useEffect, useMemo, useRef, useState } from 'react';

import * as S from './Declutter.styles';
import {
  getItemBoxLabel,
  getItemLocationLabel,
  getItemName,
  getItemPreviewImageUrl,
  getSessionItemItem,
  getVotePresentationChoice,
  getVotePresentationMeta,
} from './declutterUtils';

const FINAL_CHOICES = [
  { value: 'keep', label: 'Keep', icon: '🛡', detail: 'Keep it in the household.' },
  { value: 'toss', label: 'Toss', icon: '🗑', detail: 'Mark it for destruction.' },
  { value: 'donate', label: 'Donate', icon: '💙', detail: 'Approve it; choose placement in Actions.' },
  { value: 'sell', label: 'Sell', icon: '🏷', detail: 'Approve it; choose placement in Actions.' },
  { value: 'gift', label: 'Gift', icon: '🎁', detail: 'Keep it active until it is given.' },
];

function inferRecommendation(candidate) {
  if (candidate?.recommendedDiscussionChoice) return candidate.recommendedDiscussionChoice;
  const first = getVotePresentationChoice(candidate?.votes?.discofish);
  const second = getVotePresentationChoice(candidate?.votes?.laserfox);
  if (first === 'unsure' && second === 'unsure') return 'keep';
  if (first === 'unsure') return second;
  if (second === 'unsure') return first;
  if (first === second) return first;
  const pair = new Set([first, second]);
  if (pair.has('toss') && pair.size === 2) {
    return [first, second].find((choice) => !['toss', 'unsure'].includes(choice)) || 'toss';
  }
  return '';
}

function SharedVote({ player, icon, vote }) {
  const meta = getVotePresentationMeta(vote);
  return (
    <S.DiscussionVote $tone={meta.tone}>
      <span aria-hidden="true">{icon}</span>
      <div><small>{player}</small><strong>{meta.label}</strong></div>
    </S.DiscussionVote>
  );
}

export default function DeclutterDiscussionSheet({
  candidate,
  saving = false,
  error = '',
  onClose,
  onResolve,
  onReopen,
}) {
  const recommendation = useMemo(() => inferRecommendation(candidate), [candidate]);
  const [choice, setChoice] = useState(recommendation);
  const [notes, setNotes] = useState('');
  const closeButtonRef = useRef(null);
  const sheetRef = useRef(null);
  const item = getSessionItemItem(candidate);
  const imageUrl = getItemPreviewImageUrl(item);

  useEffect(() => {
    setChoice(recommendation);
    setNotes('');
  }, [candidate?.id, recommendation]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) onClose?.();
      if (event.key !== 'Tab') return;
      const focusable = [...(sheetRef.current?.querySelectorAll(
        'button:not(:disabled), textarea:not(:disabled), a[href]'
      ) || [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, saving]);

  if (!candidate) return null;
  const selected = FINAL_CHOICES.find((entry) => entry.value === choice);
  const recommendationMeta = FINAL_CHOICES.find((entry) => entry.value === recommendation);

  return (
    <S.DiscussionScrim onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose?.();
    }}>
      <S.DiscussionSheet ref={sheetRef} role="dialog" aria-modal="true" aria-labelledby="discussion-sheet-title">
        <S.DiscussionHeader>
          <S.DiscussionClose
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close shared decision"
            disabled={saving}
          >
            ×
          </S.DiscussionClose>
          <div>
            <S.DiscussionKicker>🐟 Discofish + 🦊 Laserfox · both present</S.DiscussionKicker>
            <S.DiscussionTitle id="discussion-sheet-title">{getItemName(item)}</S.DiscussionTitle>
            <S.DiscussionContext>{getItemBoxLabel(item)} · {getItemLocationLabel(item) || 'Location not set'}</S.DiscussionContext>
          </div>
        </S.DiscussionHeader>

        <S.DiscussionBody>
          <S.DiscussionItemRail>
            <S.DiscussionThumb>
              {imageUrl ? <img src={imageUrl} alt="" /> : <span>No image</span>}
            </S.DiscussionThumb>
            <S.DiscussionVotes aria-label="Original individual votes">
              <SharedVote player="Discofish" icon="🐟" vote={candidate?.votes?.discofish} />
              <SharedVote player="Laserfox" icon="🦊" vote={candidate?.votes?.laserfox} />
            </S.DiscussionVotes>
          </S.DiscussionItemRail>

          <S.DiscussionRecommendation $hasRecommendation={Boolean(recommendationMeta)}>
            <small>Suggested outcome</small>
            <strong>
              {recommendationMeta
                ? `${recommendationMeta.icon} ${recommendationMeta.label}`
                : 'No automatic winner'}
            </strong>
            <span>
              {recommendationMeta
                ? 'Based on your original votes. You can overwrite it together below.'
                : 'Your choices genuinely conflict. Make the final household call together.'}
            </span>
          </S.DiscussionRecommendation>

          <S.DiscussionSectionLabel>What is the final call?</S.DiscussionSectionLabel>
          <S.DiscussionChoiceGrid>
            {FINAL_CHOICES.map((entry) => (
              <S.DiscussionChoice
                key={entry.value}
                type="button"
                $tone={entry.value}
                $selected={choice === entry.value}
                aria-pressed={choice === entry.value}
                onClick={() => setChoice(entry.value)}
                disabled={saving}
              >
                <span aria-hidden="true">{entry.icon}</span>
                <div><strong>{entry.label}</strong><small>{entry.detail}</small></div>
              </S.DiscussionChoice>
            ))}
          </S.DiscussionChoiceGrid>

          <S.DiscussionNotes>
            <span>Joint note <small>optional</small></span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={1000}
              placeholder="What changed your minds?"
              disabled={saving}
            />
          </S.DiscussionNotes>

          {error ? (
            <S.DiscussionError role="alert">
              <strong>Final call was not saved</strong>
              <span>{error}</span>
            </S.DiscussionError>
          ) : null}

          <S.DiscussionCommit
            type="button"
            $tone={choice || 'pending'}
            disabled={!choice || saving}
            onClick={() => onResolve?.({ choice, notes })}
          >
            {saving ? 'Saving final call…' : selected ? `Confirm ${selected.label}` : 'Choose a final call'}
          </S.DiscussionCommit>

          <S.DiscussionReopen
            type="button"
            disabled={saving}
            onClick={onReopen}
          >
            Vote separately again
          </S.DiscussionReopen>
        </S.DiscussionBody>
      </S.DiscussionSheet>
    </S.DiscussionScrim>
  );
}
