import React, { useContext, useEffect, useState } from 'react';
import { editItem } from '../../api/editItem';
import useItemTimestampActions from '../../hooks/useItemTimestampActions';
import { ToastContext } from '../Toast';
import * as S from './OperationsQuickPeek.styles';

export default function QuickPeekItemActionPanel({
  item,
  position,
  total,
  onBack,
  onItemUpdated,
  declutterPending = false,
  inDeclutterDeck = false,
  onToggleDeclutterDeck,
  onOpenFullItem,
  notePanel = null,
  includePosition = true,
  includeDeck = true,
  body = false,
}) {
  const itemId = String(item?._id || item?.id || '');
  const name = String(item?.name || item?.label || 'Untitled item').trim();
  const isConsumable = Boolean(item?.isConsumable);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [consumablePending, setConsumablePending] = useState(false);
  const { showToast, hideToast } = useContext(ToastContext) || {};
  const { actions: timestampActions } = useItemTimestampActions({
    item,
    showToast,
    hideToast,
    onSaved: onItemUpdated,
  });

  useEffect(() => {
    if (!actionMenuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setActionMenuOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [actionMenuOpen]);

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
      <S.ItemHeaderActionPanel $body={body} aria-label={`Actions for ${name}`}>
        <S.ItemActionsToggle
          type="button"
          $active={actionMenuOpen}
          $tone="actions"
          aria-expanded={actionMenuOpen}
          aria-haspopup="true"
          aria-label={actionMenuOpen ? `Close actions for ${name}` : `Open actions for ${name}`}
          title="Item actions"
          onClick={() => setActionMenuOpen((current) => !current)}
        >
          <S.ActionMenuIcon
            aria-hidden="true"
            viewBox="0 0 20 20"
            focusable="false"
          >
            <path d="M4 5h12" />
            <path d="M4 10h12" />
            <path d="M4 15h12" />
            <circle cx="8" cy="5" r="1.35" />
            <circle cx="13" cy="10" r="1.35" />
            <circle cx="7" cy="15" r="1.35" />
          </S.ActionMenuIcon>
        </S.ItemActionsToggle>
        {includePosition ? (
          <S.ItemCarouselActionButton
            type="button"
            $tone="position"
            aria-label="Back to direct items"
            title="Back to direct items"
            onClick={onBack}
          >{position}/{total}</S.ItemCarouselActionButton>
        ) : null}
        {onOpenFullItem ? (
          <S.ItemHeaderOpenFullButton
            type="button"
            aria-label={`Open full item: ${name}`}
            title="Open full item"
            onClick={onOpenFullItem}
          >
            <S.OpenFullBoxIcon
              aria-hidden="true"
              viewBox="0 0 20 20"
              focusable="false"
            >
              <path d="M6 14 14 6" />
              <path d="M8 6h6v6" />
            </S.OpenFullBoxIcon>
          </S.ItemHeaderOpenFullButton>
        ) : null}
        {includeDeck ? (
          <S.ItemCarouselActionButton
            type="button"
            $active={inDeclutterDeck}
            $tone="declutter"
            aria-label={inDeclutterDeck ? `Remove ${name} from Declutter Deck` : `Add ${name} to Declutter Deck`}
            aria-pressed={inDeclutterDeck}
            title={inDeclutterDeck ? 'Remove from Declutter Deck' : 'Add to Declutter Deck'}
            disabled={declutterPending || !itemId || item?.item_status === 'gone'}
            onClick={onToggleDeclutterDeck}
          >Deck</S.ItemCarouselActionButton>
        ) : null}
        {actionMenuOpen ? (
          <S.ItemActionPopover role="group" aria-label={`Actions for ${name}`}>
            {timestampActions.map((action) => (
              <S.ItemCarouselActionButton
                key={action.id}
                type="button"
                $tone={action.tone}
                aria-label={action.label}
                title={action.label}
                disabled={action.disabled}
                onClick={() => {
                  setActionMenuOpen(false);
                  action.onClick();
                }}
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
              onClick={() => {
                setActionMenuOpen(false);
                toggleConsumable();
              }}
            >{isConsumable ? 'Con. ●' : 'Con. ○'}</S.ItemCarouselActionButton>
          </S.ItemActionPopover>
        ) : null}
        {notePanel}
      </S.ItemHeaderActionPanel>
    </>
  );
}
