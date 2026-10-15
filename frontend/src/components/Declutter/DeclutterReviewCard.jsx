import CompactTagRow from '../Tags/CompactTagRow';
import { useState } from 'react';

import * as S from './Declutter.styles';
import * as R from './DeclutterReviewCard.styles';
import DeclutterGlyph from './DeclutterGlyph';
import DeclutterReviewPhoto from './DeclutterReviewPhoto';
import DeclutterReviewDecisions from './DeclutterReviewDecisions';
import DeclutterDecisionPill from './DeclutterDecisionPill';
import { formatPrimaryOwner } from '../../util/itemOwners';
import { getDeclutterItemTheme } from './declutterItemTheme';
import {
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
  const theme = getDeclutterItemTheme(item);
  const partner = player === 'discofish'
    ? { name: 'Laserfox', icon: '🦊' }
    : { name: 'Discofish', icon: '🐟' };

  const commitDecision = (decision) => {
    if (commitDirection || savingDecision) return;
    setCommitDirection(decision);
    Promise.resolve(onDecision?.(decision)).finally(() => setCommitDirection(''));
  };

  return (
    <R.Shell style={theme} data-declutter-review data-declutter-candidate={sessionItem.id || sessionItem._id}>
      {canUndo || onSkip ? (
        <R.Utility>
          <S.ProgressText>{progressText}</S.ProgressText>
          <S.ModeGroup>
            {canUndo ? (
              <R.QuietButton type="button" onClick={() => onUndo?.()}>
                Undo Last Decision
              </R.QuietButton>
            ) : null}
            {onSkip ? (
              <R.QuietButton type="button" onClick={() => onSkip?.()}>
                Skip <DeclutterGlyph name="skip" />
              </R.QuietButton>
            ) : null}
          </S.ModeGroup>
        </R.Utility>
      ) : null}

      {sessionItem.partnerHasVoted ? (
        <R.Partner role="status">
          <S.PartnerWaitingIcon aria-hidden="true">{partner.icon}</S.PartnerWaitingIcon>
          <div>
            <strong>{partner.name} has reviewed this item</strong>
            <span>Your decisions stay private until you choose.</span>
          </div>
          <S.PrivacyBadge aria-label="Partner decision is hidden"><DeclutterGlyph name="lock" /></S.PrivacyBadge>
        </R.Partner>
      ) : null}

      <R.Card
        $commitDirection={commitDirection}
      >
        <R.Identity>
          <div>
            <R.Title>{itemName}</R.Title>
            {getItemCategoryLabel(item) ? <R.Facts>{getItemCategoryLabel(item)}</R.Facts> : null}
            {sessionItem.nominatedBy ? (
              <R.Attribution>Added by {formatPrimaryOwner(sessionItem.nominatedBy)}</R.Attribution>
            ) : null}
          </div>
          <DeclutterDecisionPill decision={sessionItem.decision} />
        </R.Identity>

        <R.Context>
          <DeclutterReviewPhoto src={previewImageUrl} name={itemName} />
          <R.Placement>
            <R.BoxIdentity>
              <strong>{item.box?.box_id ? `#${item.box.box_id}` : item.box ? 'Assigned box' : 'Items Adrift'}</strong>
              <span>{item.box?.label || getItemBoxLabel(item)}</span>
            </R.BoxIdentity>
            <R.Location><small>Location</small><span>{getItemLocationLabel(item) || 'No location recorded'}</span></R.Location>
          </R.Placement>
        </R.Context>

        <R.Details>
          <R.Metadata>
            <div><dt>Owner</dt><dd>{getItemOwnerLabel(item) || 'Shared / unassigned'}</dd></div>
            <div><dt>Keep Priority</dt><dd>{getItemKeepPriorityLabel(item) || 'Unspecified'}</dd></div>
          </R.Metadata>

          {tags.length ? (
            <R.Tags aria-label="Item tags">
              <CompactTagRow returnKey={`declutter:${sessionItem.id || sessionItem._id || item._id}`} tags={tags} name={itemName} />
            </R.Tags>
          ) : null}

          {item.notes || item.description ? (
            <R.Description>{item.notes || item.description}</R.Description>
          ) : null}
        </R.Details>

        <DeclutterReviewDecisions commitDirection={commitDirection} savingDecision={savingDecision} onDecision={commitDecision} />

        <R.Note>
          <summary>Add a private note</summary>
          <S.NotesBlock>
            <S.FieldLabel>Review note</S.FieldLabel>
            <S.Textarea
              value={notesDraft}
              onChange={(event) => onNotesDraftChange?.(event.target.value)}
              placeholder="Optional context for your decision"
            />
          </S.NotesBlock>
        </R.Note>
      </R.Card>
    </R.Shell>
  );
}
