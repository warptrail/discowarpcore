import React, { useContext, useState } from 'react';
import { editItem } from '../../api/editItem';
import useItemDeclutterDeck from '../../hooks/useItemDeclutterDeck';
import useItemTimestampActions from '../../hooks/useItemTimestampActions';
import { ToastContext } from '../Toast';
import QuickPeekItemNoteModal from './QuickPeekItemNoteModal';
import * as S from './OperationsQuickPeek.styles';

export default function QuickPeekItemActionPanel({
  item,
  position,
  total,
  onBack,
  onDeclutterStateChange,
  onItemUpdated,
}) {
  const itemId = String(item?._id || item?.id || '');
  const name = String(item?.name || item?.label || 'Untitled item').trim();
  const itemNotes = String(item?.notes || '').trim();
  const isConsumable = Boolean(item?.isConsumable);
  const [itemNoteReaderOpen, setItemNoteReaderOpen] = useState(false);
  const [consumablePending, setConsumablePending] = useState(false);
  const { showToast, hideToast } = useContext(ToastContext) || {};
  const { declutterPending, inDeclutterDeck, toggleDeclutterDeck } = useItemDeclutterDeck({
    item,
    showToast,
    hideToast,
    onStateChange: onDeclutterStateChange,
  });
  const { actions: timestampActions } = useItemTimestampActions({
    item,
    showToast,
    hideToast,
    onSaved: onItemUpdated,
  });

  const toggleConsumable = async () => {
    if (!itemId || consumablePending) return;
    try {
      setConsumablePending(true);
      const updated = await editItem(itemId, { isConsumable: !isConsumable });
      onItemUpdated?.(updated);
      showToast?.({
        variant: 'success',
        title: !isConsumable ? 'Consumable enabled' : 'Consumable disabled',
        message: !isConsumable
          ? `"${name}" can now be marked consumed.`
          : `"${name}" is no longer a consumable.`,
        timeoutMs: 2600,
      });
    } catch (error) {
      showToast?.({
        variant: 'danger',
        title: 'Could not update consumable setting',
        message: error?.message || 'Please try again.',
        timeoutMs: 4200,
      });
    } finally {
      setConsumablePending(false);
    }
  };

  return (
    <>
      <S.ItemHeaderActionPanel aria-label={`Actions for ${name}`}>
        <S.ItemCarouselActionButton
          type="button"
          $tone="position"
          aria-label="Back to direct items"
          title="Back to direct items"
          onClick={onBack}
        >{position}/{total}</S.ItemCarouselActionButton>
        <S.ItemCarouselActionButton
          type="button"
          $active={inDeclutterDeck}
          $tone="declutter"
          aria-label={inDeclutterDeck ? `Remove ${name} from Declutter Deck` : `Add ${name} to Declutter Deck`}
          aria-pressed={inDeclutterDeck}
          title={inDeclutterDeck ? 'Remove from Declutter Deck' : 'Add to Declutter Deck'}
          disabled={declutterPending || !itemId || item?.item_status === 'gone'}
          onClick={toggleDeclutterDeck}
        >Deck</S.ItemCarouselActionButton>
        {timestampActions.map((action) => (
          <S.ItemCarouselActionButton
            key={action.id}
            type="button"
            $tone={action.tone}
            aria-label={action.label}
            title={action.label}
            disabled={action.disabled}
            onClick={action.onClick}
          >{action.id === 'checked' ? 'Check' : action.id === 'maintained' ? 'Maint.' : action.id === 'consumed' ? 'Consume' : 'Use'}</S.ItemCarouselActionButton>
        ))}
        <S.ItemCarouselActionButton
          type="button"
          $active={isConsumable}
          $tone="consumable"
          aria-label={isConsumable ? `Mark ${name} as not consumable` : `Mark ${name} as consumable`}
          aria-pressed={isConsumable}
          title={isConsumable ? 'Consumable: on' : 'Consumable: off'}
          disabled={consumablePending || !itemId}
          onClick={toggleConsumable}
        >{isConsumable ? 'Con. ●' : 'Con. ○'}</S.ItemCarouselActionButton>
        {itemNotes ? (
          <S.ItemCarouselActionButton
            type="button"
            $tone="note"
            aria-label={`Open notes for ${name}`}
            title="Item notes"
            onClick={() => setItemNoteReaderOpen(true)}
          >Notes</S.ItemCarouselActionButton>
        ) : null}
      </S.ItemHeaderActionPanel>
      {itemNoteReaderOpen ? (
        <QuickPeekItemNoteModal
          item={item}
          notes={itemNotes}
          onClose={() => setItemNoteReaderOpen(false)}
        />
      ) : null}
    </>
  );
}
