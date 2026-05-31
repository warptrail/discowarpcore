import * as S from './Declutter.styles';
import DeclutterDecisionPill from './DeclutterDecisionPill';
import {
  DECISION_FILTER_OPTIONS,
  getItemBoxLabel,
  getItemCategoryLabel,
  getItemId,
  getItemKeepPriorityLabel,
  getItemLocationLabel,
  getItemName,
  getItemOwnerLabel,
  getItemTags,
  getItemThumbnailUrl,
  getSessionItemItem,
  getSessionItemKey,
} from './declutterUtils';

function renderTags(item) {
  const tags = getItemTags(item);
  if (!tags.length) return null;

  return (
    <S.TagRow>
      {tags.slice(0, 6).map((tag) => (
        <S.TagChip key={tag}>{tag}</S.TagChip>
      ))}
      {tags.length > 6 ? <S.TagChip>+{tags.length - 6}</S.TagChip> : null}
    </S.TagRow>
  );
}

export default function DeclutterSessionItemList({
  items = [],
  decisionFilter = 'all',
  removingItemId = '',
  resettingItemId = '',
  onDecisionFilterChange,
  onRemoveItem,
  onResetDecision,
}) {
  return (
    <S.QueueGrid>
      <S.ModeBar>
        <S.ModeGroup>
          <S.Field>
            <S.FieldLabel>Decision Filter</S.FieldLabel>
            <S.Select
              value={decisionFilter}
              onChange={(event) => onDecisionFilterChange?.(event.target.value)}
            >
              {DECISION_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </S.Select>
          </S.Field>
        </S.ModeGroup>
        <S.ProgressText>{items.length} candidate items</S.ProgressText>
      </S.ModeBar>

      {items.length ? (
        items.map((sessionItem) => {
          const item = getSessionItemItem(sessionItem);
          const itemId = String(sessionItem?.itemId || getItemId(item)).trim();
          const name = item ? getItemName(item) : 'Missing inventory item';
          const thumbnailUrl = item ? getItemThumbnailUrl(item) : '';
          const keepPriority = item ? getItemKeepPriorityLabel(item) : '';
          const owner = item ? getItemOwnerLabel(item) : '';
          const location = item ? getItemLocationLabel(item) : '';
          const itemHref = itemId ? `/items/${encodeURIComponent(itemId)}` : '';
          const isPending = String(sessionItem?.decision || '').toLowerCase() === 'pending';
          const isResetting = resettingItemId === itemId;

          return (
            <S.QueueItem key={getSessionItemKey(sessionItem)}>
              <S.ThumbFrame>
                {thumbnailUrl ? (
                  <S.ThumbImage src={thumbnailUrl} alt="" loading="lazy" />
                ) : (
                  'No Image'
                )}
              </S.ThumbFrame>

              <div>
                {itemHref && item ? (
                  <S.ItemNameLink to={itemHref}>{name}</S.ItemNameLink>
                ) : (
                  <S.ItemName>{name}</S.ItemName>
                )}
                <S.ItemMeta>
                  <span>{item ? getItemCategoryLabel(item) : 'Item record unavailable'}</span>
                  {keepPriority ? <span>Keep: {keepPriority}</span> : null}
                  {owner ? <span>Owner: {owner}</span> : null}
                </S.ItemMeta>
                {item ? renderTags(item) : null}
                {sessionItem.notes ? (
                  <S.SmallText>Review notes: {sessionItem.notes}</S.SmallText>
                ) : null}
              </div>

              <S.QueueContext>
                <div>{item ? getItemBoxLabel(item) : 'Physical context unavailable'}</div>
                <div>{location || 'Location unknown'}</div>
              </S.QueueContext>

              <S.QueueActions>
                <DeclutterDecisionPill decision={sessionItem.decision} />
                <S.Button
                  type="button"
                  $tone="warning"
                  disabled={isPending || isResetting}
                  onClick={() => onResetDecision?.(sessionItem)}
                >
                  {isResetting ? 'Resetting...' : 'Reset Decision'}
                </S.Button>
                <S.Button
                  type="button"
                  $tone="danger"
                  disabled={removingItemId === itemId}
                  onClick={() => onRemoveItem?.(sessionItem)}
                >
                  {removingItemId === itemId ? 'Removing...' : 'Remove'}
                </S.Button>
              </S.QueueActions>
            </S.QueueItem>
          );
        })
      ) : (
        <S.StatusPanel>No candidate items match this filter.</S.StatusPanel>
      )}
    </S.QueueGrid>
  );
}
