import { useState } from 'react';

import * as S from './Declutter.styles';
import DeclutterDecisionPill from './DeclutterDecisionPill';
import {
  DECISION_OPTIONS,
  getItemBoxLabel,
  getItemCategoryLabel,
  getItemKeepPriorityLabel,
  getItemLocationLabel,
  getItemName,
  getItemOwnerLabel,
  getItemPreviewImageUrl,
  getItemTags,
  getSessionItemItem,
} from './declutterUtils';

const REVIEW_DECISIONS = DECISION_OPTIONS.filter((option) => option.value !== 'pending');
const PRIMARY_DECISIONS = REVIEW_DECISIONS.filter((option) => ['keep', 'toss'].includes(option.value));
const SECONDARY_DECISIONS = REVIEW_DECISIONS.filter((option) => !['keep', 'toss'].includes(option.value));
const DECISION_ICONS = {
  keep: '🛡',
  toss: '🗑',
  donate: '🎁',
  sell: '🏷',
  unsure: '?',
};

export default function DeclutterReviewCard({
  sessionItem,
  player = 'discofish',
  progressText = '',
  notesDraft = '',
  savingDecision = '',
  canUndo = false,
  onNotesDraftChange,
  onDecision,
  onSkip,
  onUndo,
}) {
  const item = getSessionItemItem(sessionItem);
  const [commitDirection, setCommitDirection] = useState('');

  if (!item) {
    return (
      <S.ReviewShell>
        <S.StatusPanel>There are no pending candidate items in this review queue.</S.StatusPanel>
      </S.ReviewShell>
    );
  }

  const itemName = getItemName(item);
  const previewImageUrl = getItemPreviewImageUrl(item);
  const tags = getItemTags(item);
  const partner = player === 'discofish'
    ? { name: 'Laserfox', icon: '🦊' }
    : { name: 'Discofish', icon: '🐟' };

  const commitDecision = (decision) => {
    if (commitDirection || savingDecision) return;
    setCommitDirection(decision);
    Promise.resolve(onDecision?.(decision)).finally(() => setCommitDirection(''));
  };

  return (
    <S.ReviewShell>
      {canUndo || onSkip ? (
        <S.UtilityRow>
          <S.ProgressText>{progressText}</S.ProgressText>
          <S.ModeGroup>
            {canUndo ? (
              <S.Button type="button" $tone="default" onClick={() => onUndo?.()}>
                Undo Last Decision
              </S.Button>
            ) : null}
            {onSkip ? (
              <S.Button type="button" $tone="warning" onClick={() => onSkip?.()}>
                Skip
              </S.Button>
            ) : null}
          </S.ModeGroup>
        </S.UtilityRow>
      ) : null}

      {sessionItem.partnerHasVoted ? (
        <S.PartnerWaiting role="status">
          <S.PartnerWaitingIcon aria-hidden="true">{partner.icon}</S.PartnerWaitingIcon>
          <div>
            <strong>{partner.name} has reviewed this item</strong>
            <span>Your decisions stay private until you choose.</span>
          </div>
          <S.PrivacyBadge aria-label="Partner decision is hidden">▣</S.PrivacyBadge>
        </S.PartnerWaiting>
      ) : null}

      <S.ReviewCard
        $commitDirection={commitDirection}
      >
        <S.ReviewImageFrame>
          {previewImageUrl ? (
            <S.ReviewImage src={previewImageUrl} alt={itemName} />
          ) : (
            'No Image'
          )}
        </S.ReviewImageFrame>

        <S.ReviewBody>
          <S.ReviewTitleRow>
            <div>
              <S.ReviewTitle>{itemName}</S.ReviewTitle>
              <S.ItemLocationLine>
                {getItemBoxLabel(item)}
                {getItemLocationLabel(item) ? ` • ${getItemLocationLabel(item)}` : ''}
                {getItemCategoryLabel(item) ? ` • ${getItemCategoryLabel(item)}` : ''}
              </S.ItemLocationLine>
            </div>
            <DeclutterDecisionPill decision={sessionItem.decision} />
          </S.ReviewTitleRow>

          <S.FactGrid>
            <S.Fact>
              <S.FactLabel>Owner</S.FactLabel>
              <S.FactValue>{getItemOwnerLabel(item) || 'Shared / unassigned'}</S.FactValue>
            </S.Fact>
            <S.Fact>
              <S.FactLabel>Keep Priority</S.FactLabel>
              <S.FactValue>{getItemKeepPriorityLabel(item) || 'Unspecified'}</S.FactValue>
            </S.Fact>
          </S.FactGrid>

          {tags.length ? (
            <S.TagRow>
              {tags.map((tag) => (
                <S.TagChip key={tag}>{tag}</S.TagChip>
              ))}
            </S.TagRow>
          ) : null}

          {item.notes || item.description ? (
            <S.SmallText>{item.notes || item.description}</S.SmallText>
          ) : null}

          <S.DecisionPrompt>What should happen to this?</S.DecisionPrompt>
          <S.PrimaryDecisionGrid>
            {PRIMARY_DECISIONS.map((option) => (
              <S.DecisionButton
                key={option.value}
                type="button"
                $tone={option.tone}
                $primary
                disabled={Boolean(savingDecision || commitDirection)}
                onClick={() => commitDecision(option.value)}
              >
                <span aria-hidden="true">{DECISION_ICONS[option.value]}</span>
                {commitDirection === option.value ? 'Saving...' : option.label}
              </S.DecisionButton>
            ))}
          </S.PrimaryDecisionGrid>
          <S.SecondaryDecisionGrid>
            {SECONDARY_DECISIONS.map((option) => (
              <S.DecisionButton
                key={option.value}
                type="button"
                $tone={option.tone}
                disabled={Boolean(savingDecision || commitDirection)}
                onClick={() => commitDecision(option.value)}
              >
                <span aria-hidden="true">{DECISION_ICONS[option.value]}</span>
                {commitDirection === option.value ? 'Saving...' : option.label}
              </S.DecisionButton>
            ))}
          </S.SecondaryDecisionGrid>

          <S.NoteDisclosure>
            <summary>Add a private note</summary>
            <S.NotesBlock>
              <S.FieldLabel>Review note</S.FieldLabel>
              <S.Textarea
                value={notesDraft}
                onChange={(event) => onNotesDraftChange?.(event.target.value)}
                placeholder="Optional context for your decision"
              />
            </S.NotesBlock>
          </S.NoteDisclosure>
        </S.ReviewBody>
      </S.ReviewCard>
    </S.ReviewShell>
  );
}
