import React from 'react';
import * as S from './OperationsQuickPeek.styles';

export default function QuickPeekBoxHeader({
  box,
  imageUrl,
  position,
  total,
  expanded,
  canSelectPrevious,
  canSelectNext,
  onPrevious,
  onNext,
  onToggleExpanded,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
}) {
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

      <S.CapNavigation $expanded={expanded}>
        <S.CapIconButton
          type="button"
          aria-label="Previous box"
          disabled={!canSelectPrevious}
          onClick={onPrevious}
        >
          ‹
        </S.CapIconButton>

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

        <S.CapIconButton
          type="button"
          aria-label="Next box"
          disabled={!canSelectNext}
          onClick={onNext}
        >
          ›
        </S.CapIconButton>
      </S.CapNavigation>
    </S.DeckCap>
  );
}
