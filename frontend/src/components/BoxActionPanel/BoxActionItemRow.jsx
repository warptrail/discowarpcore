import React from 'react';
import {
  ActionButton,
  ItemActions,
  ItemCard,
  ItemMain,
  ItemMetaRow,
  ItemName,
  ItemSummary,
  ItemTitleRow,
  MetaPill,
} from './BoxActionPanel.styles';

const MAX_NOTE_PREVIEW = 100;
const MAX_TAGS = 3;

const getNotePreview = (rawNotes) => {
  const normalized = String(rawNotes || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return '';
  if (normalized.length <= MAX_NOTE_PREVIEW) return normalized;
  return `${normalized.slice(0, MAX_NOTE_PREVIEW)}...`;
};

export default function BoxActionItemRow({
  item,
  isMoving,
  isEditing,
  hasEditingFocus,
  isFocusedRow,
  isSelectingMoveTarget,
  zipProp,
  flashProp,
  isEntering,
  isPreEnter,
  onEdit,
  onMove,
  onOrphan,
}) {
  const tags = Array.isArray(item?.tags) ? item.tags.filter(Boolean) : [];
  const visibleTags = tags.slice(0, MAX_TAGS);
  const hiddenTagCount = tags.length - visibleTags.length;
  const notePreview = getNotePreview(item?.notes);
  const hasQuantity =
    item?.quantity !== null &&
    item?.quantity !== undefined &&
    item?.quantity !== '';

  return (
    <ItemCard
      $zip={zipProp}
      $flash={flashProp}
      $flashDelay={isEntering ? 280 : 0}
      $preEnter={isPreEnter}
      $focusMode={hasEditingFocus}
      $isFocused={isFocusedRow}
    >
      <ItemMain>
        <ItemTitleRow>
          {hasQuantity && <MetaPill>Qty {item.quantity}</MetaPill>}
          <ItemName>{item?.name || '(Unnamed Item)'}</ItemName>
        </ItemTitleRow>

        <ItemMetaRow>
          {visibleTags.map((tag) => (
            <MetaPill key={`${item?._id || item?.id}-${tag}`}>#{tag}</MetaPill>
          ))}
          {hiddenTagCount > 0 && <MetaPill>+{hiddenTagCount} tags</MetaPill>}
        </ItemMetaRow>

        {notePreview && <ItemSummary>{notePreview}</ItemSummary>}
      </ItemMain>

      <ItemActions>
        <ActionButton
          type="button"
          $tone="primary"
          $active={isEditing}
          onClick={onEdit}
          disabled={isMoving}
        >
          {isEditing ? 'Editing' : 'Edit'}
        </ActionButton>

        <ActionButton
          type="button"
          $tone="neutral"
          $active={isSelectingMoveTarget}
          onClick={onMove}
          disabled={isMoving}
        >
          Move
        </ActionButton>

        <ActionButton
          type="button"
          $tone="danger"
          onClick={onOrphan}
          disabled={isMoving}
        >
          Orphan
        </ActionButton>
      </ItemActions>
    </ItemCard>
  );
}
