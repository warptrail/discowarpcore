import { useCallback, useMemo, useState } from 'react';
import * as S from './Retrieval.styles';
import SiblingItemsChips from './SiblingItemsChips';
import {
  formatKeepPriorityLabel,
  keepPriorityTone,
  normalizeKeepPriority,
} from '../../util/keepPriority';

export default function RetrievalExpandedPanel({
  item,
  panelId,
  onLifecycleAction,
}) {
  const resolvedItem = item && typeof item === 'object' ? item : null;
  const [pendingAction, setPendingAction] = useState('');

  const description = String(resolvedItem?.description || '').trim();
  const notes = String(resolvedItem?.notes || '').trim();
  const categoryLabel = String(resolvedItem?.categoryLabel || '').trim();
  const tags = Array.isArray(resolvedItem?.tags) ? resolvedItem.tags.filter(Boolean) : [];
  const pathLine = String(resolvedItem?.locationPath || '').trim();
  const locationLabel = String(resolvedItem?.locationLabel || '').trim();
  const keepPriority = normalizeKeepPriority(resolvedItem?.keepPriority);
  const keepPriorityLabel = formatKeepPriorityLabel(
    resolvedItem?.keepPriorityLabel || keepPriority,
  );
  const keepPriorityToneValue = keepPriorityTone(keepPriority);
  const hasPrimaryDetails = Boolean(description || notes || pathLine);
  const hasMetadata = Boolean(categoryLabel || keepPriorityLabel || tags.length || locationLabel);
  const hasSiblings = Array.isArray(resolvedItem?.siblingItems) && resolvedItem.siblingItems.length > 0;
  const hasContext = Boolean(hasMetadata || hasSiblings || resolvedItem?.boxHref);
  const isConsumable = Boolean(resolvedItem?.isConsumable);
  const maintenanceActionType = isConsumable ? 'consumed' : 'maintained';
  const maintenanceActionLabel = isConsumable ? 'Consumed' : 'Maintained';
  const editHref = useMemo(() => {
    const href = String(resolvedItem?.itemHref || '').trim();
    if (!href) return '';
    return `${href}${href.includes('?') ? '&' : '?'}mode=edit`;
  }, [resolvedItem?.itemHref]);
  const canRunActions = typeof onLifecycleAction === 'function' && Boolean(resolvedItem?.id);
  const actionBusy = Boolean(pendingAction);

  const runAction = useCallback(
    async (action) => {
      if (!canRunActions || !action || actionBusy) return;
      try {
        setPendingAction(action);
        await onLifecycleAction(resolvedItem, action);
      } catch {
        // errors are handled by the action callback (toast/message)
      } finally {
        setPendingAction('');
      }
    },
    [actionBusy, canRunActions, onLifecycleAction, resolvedItem],
  );

  if (!resolvedItem) return null;

  return (
    <S.ExpandedPanel
      id={panelId}
      role="region"
      aria-label={`Retrieval details for ${resolvedItem.name}`}
      $hasPrimaryPanel={hasPrimaryDetails}
    >
      {hasPrimaryDetails ? (
        <S.ExpandedItemPanel>
          <S.ExpandedPanelTitle>Item details</S.ExpandedPanelTitle>

          {description ? (
            <S.ExpandedDetailBlock>
              <S.ExpandedDetailLabel>Description</S.ExpandedDetailLabel>
              <S.ExpandedDetailText>{description}</S.ExpandedDetailText>
            </S.ExpandedDetailBlock>
          ) : null}

          {notes ? (
            <S.ExpandedDetailBlock>
              <S.ExpandedDetailLabel>Notes</S.ExpandedDetailLabel>
              <S.ExpandedDetailText>{notes}</S.ExpandedDetailText>
            </S.ExpandedDetailBlock>
          ) : null}

          {pathLine ? (
            <S.ExpandedDetailBlock>
              <S.ExpandedDetailLabel>Path</S.ExpandedDetailLabel>
              <S.ExpandedPathText>{pathLine}</S.ExpandedPathText>
            </S.ExpandedDetailBlock>
          ) : null}
        </S.ExpandedItemPanel>
      ) : null}

      {hasContext ? (
        <S.ExpandedBoxPanel>
          <S.ExpandedPanelTitle>Related context</S.ExpandedPanelTitle>

          <S.ExpandedActionRow role="group" aria-label={`Quick actions for ${resolvedItem.name}`}>
            <S.ExpandedActionButton
              type="button"
              onClick={() => runAction('used')}
              disabled={!canRunActions || actionBusy}
              $tone="used"
            >
              {pendingAction === 'used' ? 'Saving…' : 'Used'}
            </S.ExpandedActionButton>
            <S.ExpandedActionButton
              type="button"
              onClick={() => runAction('checked')}
              disabled={!canRunActions || actionBusy}
              $tone="checked"
            >
              {pendingAction === 'checked' ? 'Saving…' : 'Checked'}
            </S.ExpandedActionButton>
            <S.ExpandedActionButton
              type="button"
              onClick={() => runAction(maintenanceActionType)}
              disabled={!canRunActions || actionBusy}
              $tone={maintenanceActionType}
            >
              {pendingAction === maintenanceActionType ? 'Saving…' : maintenanceActionLabel}
            </S.ExpandedActionButton>
            {editHref ? (
              <S.ExpandedActionLink to={editHref}>Edit</S.ExpandedActionLink>
            ) : null}
          </S.ExpandedActionRow>

          {hasMetadata ? (
            <S.ExpandedMetadataGrid>
              {categoryLabel ? (
                <S.ExpandedMetaCard>
                  <S.ExpandedDetailLabel>Category</S.ExpandedDetailLabel>
                  <S.CategoryValue>{categoryLabel}</S.CategoryValue>
                </S.ExpandedMetaCard>
              ) : null}

              {keepPriorityLabel ? (
                <S.ExpandedMetaCard>
                  <S.ExpandedDetailLabel>Keep Priority</S.ExpandedDetailLabel>
                  <S.KeepPriorityChip $tone={keepPriorityToneValue}>
                    {keepPriorityLabel}
                  </S.KeepPriorityChip>
                </S.ExpandedMetaCard>
              ) : null}

              {locationLabel ? (
                <S.ExpandedMetaCard>
                  <S.ExpandedDetailLabel>Location</S.ExpandedDetailLabel>
                  <S.ExpandedContextValue>{locationLabel}</S.ExpandedContextValue>
                </S.ExpandedMetaCard>
              ) : null}

              {tags.length ? (
                <S.ExpandedMetaCard $fullWidth>
                  <S.ExpandedDetailLabel>Tags</S.ExpandedDetailLabel>
                  <S.TagRow>
                    {tags.map((tag) => (
                      <S.ItemTagChip key={`${resolvedItem.id}-${tag}`}>{tag}</S.ItemTagChip>
                    ))}
                  </S.TagRow>
                </S.ExpandedMetaCard>
              ) : null}
            </S.ExpandedMetadataGrid>
          ) : null}

          {hasSiblings ? (
            <SiblingItemsChips siblingItems={resolvedItem.siblingItems} limit={8} />
          ) : (
            <S.SiblingSection>
              <S.SiblingLabel>Other items in this box:</S.SiblingLabel>
              <S.ExpandedMuted>No other tracked items in this box.</S.ExpandedMuted>
            </S.SiblingSection>
          )}

          {resolvedItem.boxHref ? (
            <S.ExpandedBoxLink to={resolvedItem.boxHref}>Open box page</S.ExpandedBoxLink>
          ) : (
            <S.ExpandedMuted>Box page unavailable for this item.</S.ExpandedMuted>
          )}
        </S.ExpandedBoxPanel>
      ) : null}
    </S.ExpandedPanel>
  );
}
