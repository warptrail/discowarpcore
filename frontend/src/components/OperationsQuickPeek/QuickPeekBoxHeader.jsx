import React from 'react';
import * as S from './OperationsQuickPeek.styles';

export default function QuickPeekBoxHeader({
  box,
  position,
  total,
  expanded,
  canSelectPrevious,
  canSelectNext,
  onPrevious,
  onNext,
  onToggleExpanded,
  onClose,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
}) {
  const boxId = String(box?.box_id || '').trim();
  const label = String(box?.label || box?.name || 'Untitled box').trim();
  const location = String(box?.location || '').trim();

  return (
    <S.DeckCap
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <S.DetentButton
        type="button"
        aria-label={expanded ? 'Collapse box quick peek' : 'Expand box quick peek'}
        aria-expanded={expanded}
        onClick={onToggleExpanded}
      >
        <S.DetentHandle aria-hidden="true" />
      </S.DetentButton>

      <S.CapNavigation>
        <S.CapIconButton
          type="button"
          aria-label="Previous box"
          disabled={!canSelectPrevious}
          onClick={onPrevious}
        >
          ‹
        </S.CapIconButton>

        <S.BoxIdentity>
          <S.BoxId>#{boxId}</S.BoxId>
          <S.BoxName>{label}</S.BoxName>
          <S.BoxContextLine>
            {location || 'Location not recorded'}
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

      <S.CloseButton
        type="button"
        aria-label="Close box quick peek"
        onClick={onClose}
      >
        ×
      </S.CloseButton>
    </S.DeckCap>
  );
}
