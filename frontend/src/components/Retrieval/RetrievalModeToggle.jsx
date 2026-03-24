import * as S from './Retrieval.styles';

export default function RetrievalModeToggle({ mode = 'items', onChange }) {
  return (
    <S.ModeToggleRow>
      <S.ModeToggleGroup role="tablist" aria-label="Retrieval mode">
        <S.ModeToggleButton
          type="button"
          role="tab"
          aria-selected={mode === 'items'}
          $active={mode === 'items'}
          onClick={() => onChange?.('items')}
        >
          Items
        </S.ModeToggleButton>
        <S.ModeToggleButton
          type="button"
          role="tab"
          aria-selected={mode === 'boxes'}
          $active={mode === 'boxes'}
          onClick={() => onChange?.('boxes')}
        >
          Boxes
        </S.ModeToggleButton>
      </S.ModeToggleGroup>
    </S.ModeToggleRow>
  );
}
