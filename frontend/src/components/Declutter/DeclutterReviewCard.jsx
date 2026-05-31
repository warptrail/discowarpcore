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

const REVIEW_DECISIONS = DECISION_OPTIONS.filter(
  (option) => option.value !== 'pending'
);

export default function DeclutterReviewCard({
  sessionItem,
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

  return (
    <S.ReviewShell>
      <S.UtilityRow>
        <S.ProgressText>{progressText}</S.ProgressText>
        <S.ModeGroup>
          <S.Button type="button" $tone="default" disabled={!canUndo} onClick={() => onUndo?.()}>
            Undo Last Decision
          </S.Button>
          <S.Button type="button" $tone="warning" onClick={() => onSkip?.()}>
            Skip
          </S.Button>
        </S.ModeGroup>
      </S.UtilityRow>

      <S.ReviewCard>
        <S.ReviewImageFrame>
          {previewImageUrl ? (
            <S.ReviewImage src={previewImageUrl} alt={itemName} />
          ) : (
            'No Image'
          )}
        </S.ReviewImageFrame>

        <S.ReviewBody>
          <S.ReviewTitleRow>
            <S.ReviewTitle>{itemName}</S.ReviewTitle>
            <DeclutterDecisionPill decision={sessionItem.decision} />
          </S.ReviewTitleRow>

          <S.FactGrid>
            <S.Fact>
              <S.FactLabel>Category</S.FactLabel>
              <S.FactValue>{getItemCategoryLabel(item)}</S.FactValue>
            </S.Fact>
            <S.Fact>
              <S.FactLabel>Keep Priority</S.FactLabel>
              <S.FactValue>{getItemKeepPriorityLabel(item) || 'Unspecified'}</S.FactValue>
            </S.Fact>
            <S.Fact>
              <S.FactLabel>Owner</S.FactLabel>
              <S.FactValue>{getItemOwnerLabel(item) || 'Unassigned'}</S.FactValue>
            </S.Fact>
            <S.Fact>
              <S.FactLabel>Physical Context</S.FactLabel>
              <S.FactValue>
                {getItemBoxLabel(item)}
                {getItemLocationLabel(item) ? ` / ${getItemLocationLabel(item)}` : ''}
              </S.FactValue>
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

          <S.NotesBlock>
            <S.FieldLabel>Review Notes</S.FieldLabel>
            <S.Textarea
              value={notesDraft}
              onChange={(event) => onNotesDraftChange?.(event.target.value)}
              placeholder="Optional notes for this decision"
            />
          </S.NotesBlock>

          <S.DecisionGrid>
            {REVIEW_DECISIONS.map((option) => (
              <S.DecisionButton
                key={option.value}
                type="button"
                $tone={option.tone}
                disabled={Boolean(savingDecision)}
                onClick={() => onDecision?.(option.value)}
              >
                {savingDecision === option.value ? 'Saving...' : option.label}
              </S.DecisionButton>
            ))}
          </S.DecisionGrid>
        </S.ReviewBody>
      </S.ReviewCard>
    </S.ReviewShell>
  );
}
