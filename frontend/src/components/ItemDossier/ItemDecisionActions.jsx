import React from 'react';
import * as S from './ItemDossier.styles';

export default function ItemDecisionActions({
  inDeclutterDeck,
  declutterPending,
  onDeclutter,
  onMove,
  onEdit,
}) {
  const declutterTitle = declutterPending
    ? inDeclutterDeck
      ? 'Removing…'
      : 'Adding…'
    : inDeclutterDeck
      ? 'Remove from deck'
      : 'Declutter this item';

  return (
    <S.DecisionGroup aria-label="Item decisions">
      <S.DeclutterButton
        type="button"
        $active={inDeclutterDeck}
        disabled={declutterPending}
        aria-pressed={inDeclutterDeck}
        onClick={onDeclutter}
      >
        <S.DeclutterCopy>
          <S.DeclutterTitle>{declutterTitle}</S.DeclutterTitle>
          <S.DeclutterHint>
            {inDeclutterDeck
              ? 'This item is waiting in your shared deck'
              : 'Add it to your shared deck'}
          </S.DeclutterHint>
        </S.DeclutterCopy>
        <S.DeclutterGlyph aria-hidden="true">
          {inDeclutterDeck ? 'SET' : 'ADD'}
        </S.DeclutterGlyph>
      </S.DeclutterButton>

      <S.SecondaryActions>
        <S.SecondaryButton type="button" $tone="move" onClick={onMove}>
          Move
        </S.SecondaryButton>
        <S.SecondaryButton type="button" $tone="edit" onClick={onEdit}>
          Edit
        </S.SecondaryButton>
      </S.SecondaryActions>
    </S.DecisionGroup>
  );
}

