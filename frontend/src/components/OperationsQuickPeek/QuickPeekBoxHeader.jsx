import React, { useEffect, useRef } from 'react';
import * as S from './OperationsQuickPeek.styles';

export default function QuickPeekBoxHeader({
  box,
  imageUrl,
  description,
  hasNotes = false,
  noteReaderOpen = false,
  noteButtonRef,
  onOpenNotes,
  itemActionPanel,
  position,
  total,
  expanded,
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
  searchOpen,
  searchQuery,
  onSearchChange,
  onSearchClose,
  onSearchScroll,
}) {
  const searchInputRef = useRef(null);
  const searchScrollGestureRef = useRef(null);
  const boxId = String(box?.box_id || '').trim();
  const label = String(box?.label || box?.name || 'Untitled box').trim();
  const location = String(box?.location || '').trim();
  const handleGrabberPointerDown = (event) => {
    event.stopPropagation();
    onPointerDown?.(event);
  };
  const handleGrabberPointerUp = (event) => {
    event.stopPropagation();
    onPointerUp?.(event);
  };
  const handleGrabberPointerCancel = (event) => {
    event.stopPropagation();
    onPointerCancel?.(event);
  };

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

  const handleCloseEdgeClick = (event) => {
    event.stopPropagation();
    if (itemFocused) {
      onReturnToItems?.();
      return;
    }
    if (expanded) {
      onToggleExpanded?.();
      return;
    }
    onClose?.();
  };

  const closeEdgeLabel = itemFocused
    ? 'Return to box item list'
    : expanded
      ? 'Collapse box quick peek to short view'
      : 'Close box quick peek from navigation edge';

  return (
    <S.DeckCap
      $expanded={expanded}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {imageUrl ? (
        <S.DeckCapArtwork
          aria-hidden="true"
          style={{ backgroundImage: `url(${JSON.stringify(imageUrl)})` }}
        />
      ) : null}

      {searchOpen ? (
        <S.QuickPeekSearchDock
          role="search"
          aria-label={`Search direct items in box ${boxId}`}
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
            placeholder={`Find in #${boxId}`}
            aria-label={`Find an item in box ${boxId}`}
          />
          <S.QuickPeekSearchClose
            type="button"
            aria-label="Close Quick Peek item search"
            onClick={onSearchClose}
          >
            ×
          </S.QuickPeekSearchClose>
        </S.QuickPeekSearchDock>
      ) : (
        <S.DetentButton
          type="button"
          data-quick-peek-drag-handle
          aria-label={expanded ? 'Collapse box quick peek' : 'Expand box quick peek'}
          aria-expanded={expanded}
          onClick={onToggleExpanded}
          onPointerDown={handleGrabberPointerDown}
          onPointerUp={handleGrabberPointerUp}
          onPointerCancel={handleGrabberPointerCancel}
        >
          <S.DetentHandle aria-hidden="true" />
        </S.DetentButton>
      )}

      <S.CapNavigation $expanded={expanded}>
        <S.CapIconButton
          type="button"
          aria-label="Previous box"
          disabled={!canSelectPrevious}
          onClick={onPrevious}
        >
          ‹
        </S.CapIconButton>

        <S.CapIdentityStack>
          <S.BoxIdentity $expanded={expanded} aria-hidden={!expanded}>
            <S.BoxTitleLine>
              <S.BoxId>#{boxId}</S.BoxId>
              <S.BoxName>{label}</S.BoxName>
            </S.BoxTitleLine>
            <S.BoxContextLine>
              <S.BoxLocation>{location || 'Location not recorded'}</S.BoxLocation>
              <S.PositionReadout>
                {position} / {total}
              </S.PositionReadout>
            </S.BoxContextLine>
          </S.BoxIdentity>
          {itemFocused && itemActionPanel ? (
            itemActionPanel
          ) : description || hasNotes ? (
            <S.CapDescriptionRow>
              {description ? (
                <S.CapDescription title={description}>{description}</S.CapDescription>
              ) : null}
              {hasNotes ? (
                <S.CapNoteButton
                  ref={noteButtonRef}
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={noteReaderOpen}
                  aria-label="Open box notes"
                  title="Box notes"
                  onClick={onOpenNotes}
                >N</S.CapNoteButton>
              ) : null}
            </S.CapDescriptionRow>
          ) : null}
        </S.CapIdentityStack>

        <S.CapIconButton
          type="button"
          aria-label="Next box"
          disabled={!canSelectNext}
          onClick={onNext}
        >
          ›
        </S.CapIconButton>
      </S.CapNavigation>

      <S.CollapseEdgeButton
        type="button"
        $itemFocused={itemFocused}
        aria-label={closeEdgeLabel}
        data-quick-peek-close-edge
        onClick={handleCloseEdgeClick}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onPointerCancel={(event) => event.stopPropagation()}
      >
        <S.CollapseEdgeHandle aria-hidden="true" />
      </S.CollapseEdgeButton>
    </S.DeckCap>
  );
}
