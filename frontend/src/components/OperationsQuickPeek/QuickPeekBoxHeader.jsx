import React, { useEffect, useRef } from 'react';
import * as S from './OperationsQuickPeek.styles';
import QuickPeekHeaderControls from './QuickPeekHeaderControls';
import QuickPeekHeaderLocation from './QuickPeekHeaderLocation';

export default function QuickPeekBoxHeader({
  box,
  locations,
  imageUrl,
  description,
  itemActionPanel,
  itemPosition,
  itemTotal,
  expanded,
  docked = false,
  canSelectPrevious,
  canSelectNext,
  onPrevious,
  onNext,
  onClose,
  itemFocused = false,
  onReturnToItems,
  onToggleExpanded,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onGestureStartCapture,
  onGestureClickCapture,
  searchOpen,
  searchQuery,
  onSearchChange,
  onSearchClose,
  onSearchScroll,
}) {
  const searchInputRef = useRef(null);
  const searchScrollGestureRef = useRef(null);
  const boxId = String(box?.address || box?.box_id || '').trim();
  const isAdrift = box?.systemType === 'orphaned';
  const label = String(box?.label || box?.name || 'Untitled box').trim();

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus({ preventScroll: true });
  }, [searchOpen]);

  const handleSearchPointerDown = (event) => {
    event.stopPropagation();
    if (event.pointerType !== 'touch') return;
    searchScrollGestureRef.current = {
      pointerId: event.pointerId,
      lastY: event.clientY,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleSearchPointerMove = (event) => {
    event.stopPropagation();
    const gesture = searchScrollGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    const deltaY = gesture.lastY - event.clientY;
    if (Math.abs(deltaY) < 1) return;
    event.preventDefault();
    gesture.lastY = event.clientY;
    onSearchScroll?.(deltaY);
  };

  const finishSearchPointerGesture = (event) => {
    event.stopPropagation();
    if (searchScrollGestureRef.current?.pointerId === event.pointerId) {
      searchScrollGestureRef.current = null;
    }
  };

  const handleSearchWheel = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onSearchScroll?.(event.deltaY);
  };

  return (
    <S.DeckCap
      $expanded={expanded}
      onPointerDown={onPointerDown}
      onPointerDownCapture={onGestureStartCapture}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClickCapture={onGestureClickCapture}
    >
      <S.CapCloseButton
        type="button"
        aria-label={docked ? 'Close box inspector' : 'Close box quick peek'}
        title="Close panel"
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onPointerCancel={(event) => event.stopPropagation()}
        onClick={(event) => { event.stopPropagation(); onClose?.(); }}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
      </S.CapCloseButton>
      {imageUrl ? (
        <S.DeckCapArtwork
          aria-hidden="true"
          style={{ backgroundImage: `url(${JSON.stringify(imageUrl)})` }}
        />
      ) : null}

      {searchOpen ? (
        <S.QuickPeekSearchDock
          role="search"
          aria-label={isAdrift ? 'Search Items Adrift' : `Search direct items in box ${boxId}`}
          onPointerDown={handleSearchPointerDown}
          onPointerMove={handleSearchPointerMove}
          onPointerUp={finishSearchPointerGesture}
          onPointerCancel={finishSearchPointerGesture}
          onWheel={handleSearchWheel}
        >
          <S.QuickPeekSearchGlyph aria-hidden="true">⌕</S.QuickPeekSearchGlyph>
          <S.QuickPeekSearchInput
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange?.(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Escape') return;
              event.preventDefault();
              onSearchClose?.();
            }}
            placeholder={isAdrift ? 'Find in Items Adrift' : `Find in #${boxId}`}
            aria-label={isAdrift ? 'Find an unboxed item' : `Find an item in box ${boxId}`}
          />
          <S.QuickPeekSearchClose
            type="button"
            aria-label="Close Quick Peek item search"
            onClick={onSearchClose}
          >
            ×
          </S.QuickPeekSearchClose>
        </S.QuickPeekSearchDock>
      ) : null}

      <S.CapIdentityStack data-quick-peek-header-drag-surface>
        {itemFocused && onReturnToItems ? (
          <S.CapReturnToItemsButton
            type="button"
            aria-label={isAdrift ? 'Return to unboxed item list from header' : 'Return to box item list from header'}
            title={isAdrift ? 'Back to unboxed items' : 'Back to box items'}
            data-quick-peek-return-to-items
            onClick={(event) => { event.stopPropagation(); onReturnToItems(); }}
          />
        ) : null}
        <S.CapNavigation>
          <S.CapIconButton
            type="button"
            aria-label="Previous box"
            disabled={!canSelectPrevious}
            onClick={onPrevious}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
          </S.CapIconButton>

          <S.BoxIdentity>
            <S.BoxTitleLine>
              <S.BoxId>{isAdrift ? '◇' : `#${boxId}`}</S.BoxId>
              <S.BoxName title={label}>{label}</S.BoxName>
              {itemFocused && itemTotal > 0 ? <S.PositionReadout role="status" aria-label={`Item ${itemPosition} of ${itemTotal}`}
                title={`Item ${itemPosition} of ${itemTotal}`}>
                {itemPosition} / {itemTotal}
              </S.PositionReadout> : null}
            </S.BoxTitleLine>
          </S.BoxIdentity>

          <S.CapIconButton
            type="button"
            aria-label="Next box"
            disabled={!canSelectNext}
            onClick={onNext}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
          </S.CapIconButton>
        </S.CapNavigation>
        <QuickPeekHeaderLocation box={box} locations={locations} />
        {!itemFocused && description ? <S.CapDescriptionRow>
          <S.CapDescription title={description}>{description}</S.CapDescription>
        </S.CapDescriptionRow> : null}
      </S.CapIdentityStack>
      {itemFocused ? <QuickPeekHeaderControls itemControls={itemActionPanel}
        itemFocused={itemFocused} isAdrift={isAdrift} expanded={expanded} docked={docked}
        onReturnToItems={onReturnToItems} onToggleExpanded={onToggleExpanded}
        onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} /> : null}
    </S.DeckCap>
  );
}
