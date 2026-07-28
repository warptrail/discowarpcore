import * as S from './AllItemsList.styles';

export default function AllItemsDeclutterDeckControls({ selectedCount = 0, adding = false, error = '', onAdd }) {
  return (
    <S.SelectionDeclutterPanel>
      <S.SelectionDeclutterHeader>
        <S.SelectionDeclutterTitle>Declutter Deck</S.SelectionDeclutterTitle>
        <S.SelectionDeclutterText>
          Nominate {selectedCount} selected item{selectedCount === 1 ? '' : 's'} for the shared household deck.
        </S.SelectionDeclutterText>
      </S.SelectionDeclutterHeader>
      <S.SelectionControlCluster>
        <S.ToolbarButton type="button" $tone="primary" disabled={!selectedCount || adding} onClick={() => onAdd?.()}>
          {adding ? 'Adding...' : 'Add to Declutter Deck'}
        </S.ToolbarButton>
      </S.SelectionControlCluster>
      {error ? <S.SelectionDeclutterError role="alert">{error}</S.SelectionDeclutterError> : null}
    </S.SelectionDeclutterPanel>
  );
}
