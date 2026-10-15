import QuickPeekItemSettings from './QuickPeekItemSettings';
import React, { useContext, useEffect, useId, useRef, useState } from 'react';
import QuickPeekPlacementActions from './QuickPeekPlacementActions';
import { editItem } from '../../api/editItem';
import useItemTimestampActions from '../../hooks/useItemTimestampActions';
import { ToastContext } from '../Toast';
import * as S from './OperationsQuickPeek.styles';
import * as Controls from './QuickPeekItemControls.styles';
import useQuickPeekPopoverBounds from './useQuickPeekPopoverBounds';

const activityControls = {
  used: { label: 'Use', path: 'm8 5 11 7-11 7V5Z' },
  checked: { label: 'Check', path: 'm5 12 4 4L19 6' },
  maintained: { label: 'Maint.', path: 'M14 5a5 5 0 0 0-6 6L3 16l5 5 5-5a5 5 0 0 0 6-6l-4 3-4-4 3-4Z' },
  consumed: { label: 'Consume', path: 'M12 3s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12Z' },
};

export default function QuickPeekItemActionPanel({
  item,
  box,
  onMoved,
  onEdit,
  editing = false,
  onItemUpdated,
  declutterPending = false,
  inDeclutterDeck = false,
  onToggleDeclutterDeck,
  onOpenFullItem,
  notesOpen = false,
  onOpenNotes,
  includeDeck = true,
  embedded = false,
}) {
  const itemId = String(item?._id || item?.id || '');
  const name = String(item?.name || item?.label || 'Untitled item').trim();
  const isConsumable = Boolean(item?.isConsumable);
  const actionPanelRef = useRef(null);
  const actionButtonRef = useRef(null);
  const placementButtonRef = useRef(null);
  const placementId = useId();
  const [menu, setMenu] = useState('');
  const actionMenuOpen = menu === 'actions';
  const placementOpen = menu === 'placement';
  const popoverBounds = useQuickPeekPopoverBounds(actionPanelRef, actionMenuOpen, false, true);
  const placementBounds = useQuickPeekPopoverBounds(actionPanelRef, placementOpen, true);
  const [consumablePending, setConsumablePending] = useState(false);
  const { showToast, hideToast } = useContext(ToastContext) || {};
  const { actions: timestampActions } = useItemTimestampActions({
    item,
    showToast,
    hideToast,
    onSaved: onItemUpdated,
  });

  useEffect(() => {
    if (!menu) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setMenu('');
      (placementOpen ? placementButtonRef : actionButtonRef).current?.focus({ preventScroll: true });
    };
    const handleOutsidePointerDown = (event) => {
      if (actionPanelRef.current?.contains(event.target)) return;
      setMenu('');
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('pointerdown', handleOutsidePointerDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('pointerdown', handleOutsidePointerDown, true);
    };
  }, [menu, placementOpen]);

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
      <Controls.Toolbar
        $embedded={embedded}
        ref={actionPanelRef}
        role="group"
        aria-label={`Actions for ${name}`}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onPointerCancel={(event) => event.stopPropagation()}
      >
        <Controls.Button
          ref={actionButtonRef}
          type="button"
          aria-expanded={actionMenuOpen}
          aria-haspopup="true"
          aria-label={actionMenuOpen ? `Close actions for ${name}` : `Open actions for ${name}`}
          title="Item actions"
          onClick={() => setMenu(actionMenuOpen ? '' : 'actions')}
        >
          <svg
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
          </svg>
        </Controls.Button>
        {onEdit ? (
          <Controls.Button type="button" aria-label="Quick edit item basics" aria-pressed={editing} onClick={onEdit}>Edit</Controls.Button>
        ) : null}
        {onOpenNotes ? (
          <Controls.Button data-control="notes" type="button" aria-label={`Open notes for ${name}`} title="Item notes"
            aria-expanded={notesOpen} onClick={() => { setMenu(''); onOpenNotes(); }}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M6 3h9l3 3v15H6V3Zm9 0v4h3M9 11h6M9 15h6" />
            </svg>
          </Controls.Button>
        ) : null}
        {box ? (
          <Controls.Button
            ref={placementButtonRef}
            type="button"
            data-control="placement"
            aria-label={`Change placement for ${name}`}
            title="Move to a box or no box"
            aria-expanded={placementOpen}
            aria-controls={placementId}
            disabled={!itemId || item?.item_status === 'gone'}
            onClick={() => setMenu(placementOpen ? '' : 'placement')}
          ><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m3 6 6-3 6 3-6 3-6-3ZM3 6v8l6 3V9M15 6v3M14 16h8m-3-3 3 3-3 3" /></svg></Controls.Button>
        ) : null}
        {includeDeck ? (
          <Controls.Button
            type="button"
            data-control="deck"
            aria-label={inDeclutterDeck ? `Remove ${name} from Declutter Deck` : `Add ${name} to Declutter Deck`}
            aria-pressed={inDeclutterDeck}
            aria-busy={declutterPending}
            title={declutterPending ? 'Updating Declutter Deck…' : inDeclutterDeck ? 'Remove from Declutter Deck' : 'Add to Declutter Deck'}
            disabled={declutterPending || !itemId || item?.item_status === 'gone'}
            onClick={onToggleDeclutterDeck}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M4 8h12v13H4zM7 5h12v13M10 2h12v13" />
              {inDeclutterDeck ? <path d="m7 14 2 2 4-4" /> : <path d="M7 14h6M10 11v6" />}
            </svg>
          </Controls.Button>
        ) : null}
        {onOpenFullItem ? (
          <Controls.FullItemButton
            $embedded={embedded}
            type="button"
            aria-label={`Open full item: ${name}`}
            title="Open full item"
            onClick={onOpenFullItem}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M14 3h7v7M21 3 11 13M10 5H4v16h16v-6" /></svg>
          </Controls.FullItemButton>
        ) : null}
        {actionMenuOpen ? (
          <S.ItemActionPopover role="group" aria-label={`Quick updates for ${name}`} data-quick-peek-scroll-region style={popoverBounds}>
            {embedded && onOpenFullItem ? <Controls.CompactFullItemButton type="button"
              aria-label={`Open full item: ${name}`} onClick={() => { setMenu(''); onOpenFullItem(); }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7M21 3 11 13M10 5H4v16h16v-6" /></svg>
              Open item page
            </Controls.CompactFullItemButton> : null}
            <QuickPeekItemSettings item={item} isConsumable={isConsumable}
              consumablePending={consumablePending} onItemUpdated={onItemUpdated}
              onToggleConsumable={toggleConsumable} />
            <Controls.ActivityRail role="group" aria-label="Activity actions" data-item-activity>
            {timestampActions.map((action) => (
              <Controls.Button
                key={action.id}
                type="button"
                aria-label={action.label}
                title={action.label}
                disabled={action.disabled}
                onClick={() => {
                  setMenu('');
                  action.onClick();
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={activityControls[action.id].path} /></svg>
                {action.label === 'Saving…' ? action.label : activityControls[action.id].label}
              </Controls.Button>
            ))}
            </Controls.ActivityRail>
          </S.ItemActionPopover>
        ) : null}
        {placementOpen ? <Controls.PlacementPopover id={placementId} role="group" aria-label={`Placement for ${name}`} data-quick-peek-scroll-region style={placementBounds}>
          <QuickPeekPlacementActions item={item} box={box} pickerOnly onMoved={() => { setMenu(''); onMoved?.(); }}
            pickerControl={<Controls.Button type="button" aria-label="Close placement controls" onClick={() => { setMenu(''); placementButtonRef.current?.focus({ preventScroll: true }); }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </Controls.Button>} />
        </Controls.PlacementPopover> : null}
      </Controls.Toolbar>
    </>
  );
}
