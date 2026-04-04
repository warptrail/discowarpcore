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
  onPreviewImage,
}) {
  const resolvedItem = item && typeof item === 'object' ? item : null;
  const [pendingAction, setPendingAction] = useState('');

  const description = String(resolvedItem?.description || '').trim();
  const notes = String(resolvedItem?.notes || '').trim();
  const categoryLabel = String(resolvedItem?.categoryLabel || '').trim();
  const tags = Array.isArray(resolvedItem?.tags) ? resolvedItem.tags.filter(Boolean) : [];
  const locationLabel = String(resolvedItem?.locationLabel || '').trim();
  const boxGroupLabel = String(
    resolvedItem?.boxGroupLabel || resolvedItem?.groupLabel || ''
  ).trim();
  const keepPriority = normalizeKeepPriority(resolvedItem?.keepPriority);
  const keepPriorityLabel = formatKeepPriorityLabel(
    resolvedItem?.keepPriorityLabel || keepPriority,
  );
  const keepPriorityToneValue = keepPriorityTone(keepPriority);
  const hasPrimaryDetails = Boolean(description || notes);
  const hasMetadata = Boolean(
    categoryLabel || keepPriorityLabel || tags.length || locationLabel || boxGroupLabel
  );
  const hasSiblings = Array.isArray(resolvedItem?.siblingItems) && resolvedItem.siblingItems.length > 0;
  const hasContext = Boolean(hasMetadata || hasSiblings || resolvedItem?.boxHref);
  const isConsumable = Boolean(resolvedItem?.isConsumable);
  const maintenanceActionType = isConsumable ? 'consumed' : 'maintained';
  const maintenanceActionLabel = isConsumable ? 'Consumed' : 'Maintained';
  const imageUrl = String(resolvedItem?.imageUrl || '').trim();
  const previewImageUrl = String(resolvedItem?.previewImageUrl || imageUrl).trim();
  const hasImage = Boolean(previewImageUrl);
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

          <S.ExpandedItemBody>
            <S.ExpandedMediaColumn>
              {hasImage ? (
                <S.ExpandedMediaButton
                  type="button"
                  onClick={() =>
                    onPreviewImage?.({ src: previewImageUrl, name: resolvedItem.name })
                  }
                  aria-label={`Preview image for ${resolvedItem.name}`}
                >
                  <S.ExpandedMediaFrame>
                    <S.ExpandedMediaImage
                      src={previewImageUrl}
                      alt={`${resolvedItem.name} preview`}
                    />
                  </S.ExpandedMediaFrame>
                </S.ExpandedMediaButton>
              ) : (
                <S.ExpandedMediaFrame>
                  <S.ExpandedMediaPlaceholder>No image on file</S.ExpandedMediaPlaceholder>
                </S.ExpandedMediaFrame>
              )}
            </S.ExpandedMediaColumn>

            <S.ExpandedTextColumn>
              {description ? (
                <S.ExpandedDetailBlock>
                  <S.ExpandedDetailLabel>Description</S.ExpandedDetailLabel>
                  <S.ExpandedDetailText>{description}</S.ExpandedDetailText>
                </S.ExpandedDetailBlock>
              ) : null}

              {notes ? (
                <S.ExpandedNotesBlock>
                  <S.ExpandedDetailLabel>Notes</S.ExpandedDetailLabel>
                  <S.ExpandedNotesText>{notes}</S.ExpandedNotesText>
                </S.ExpandedNotesBlock>
              ) : (
                <S.ExpandedNotesBlock>
                  <S.ExpandedDetailLabel>Notes</S.ExpandedDetailLabel>
                  <S.ExpandedNotesEmpty>No notes recorded for this item.</S.ExpandedNotesEmpty>
                </S.ExpandedNotesBlock>
              )}
            </S.ExpandedTextColumn>
          </S.ExpandedItemBody>
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
            <S.ExpandedMetaList>
              {categoryLabel ? (
                <S.ExpandedMetaRow>
                  <S.ExpandedMetaLabel>Category</S.ExpandedMetaLabel>
                  <S.ExpandedMetaValue>{categoryLabel}</S.ExpandedMetaValue>
                </S.ExpandedMetaRow>
              ) : null}

              {keepPriorityLabel ? (
                <S.ExpandedMetaRow>
                  <S.ExpandedMetaLabel>Keep Priority</S.ExpandedMetaLabel>
                  <S.ExpandedMetaValue $tone={keepPriorityToneValue}>
                    {keepPriorityLabel}
                  </S.ExpandedMetaValue>
                </S.ExpandedMetaRow>
              ) : null}

              {locationLabel ? (
                <S.ExpandedMetaRow>
                  <S.ExpandedMetaLabel>Location</S.ExpandedMetaLabel>
                  <S.ExpandedMetaValue>{locationLabel}</S.ExpandedMetaValue>
                </S.ExpandedMetaRow>
              ) : null}

              <S.ExpandedMetaRow>
                <S.ExpandedMetaLabel>Box Group</S.ExpandedMetaLabel>
                <S.ExpandedMetaValue>{boxGroupLabel || '—'}</S.ExpandedMetaValue>
              </S.ExpandedMetaRow>

              {tags.length ? (
                <S.ExpandedMetaRow $fullWidth>
                  <S.ExpandedMetaLabel>Tags</S.ExpandedMetaLabel>
                  <S.ExpandedMetaValue>{tags.join(' • ')}</S.ExpandedMetaValue>
                </S.ExpandedMetaRow>
              ) : null}
            </S.ExpandedMetaList>
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
