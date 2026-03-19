import * as S from './Retrieval.styles';

export default function ActiveFilterChips({ chips = [], onRemove, onClearAll }) {
  const safeChips = Array.isArray(chips) ? chips : [];
  if (!safeChips.length) return null;

  return (
    <S.ActiveChipsWrap>
      {safeChips.map((chip) => (
        <S.ActiveChip key={`${chip.type}-${chip.key}`}>
          <S.ActiveChipLabel>{chip.label}</S.ActiveChipLabel>
          <S.ActiveChipRemove
            type="button"
            aria-label={`Remove ${chip.label}`}
            onClick={() => onRemove(chip.type, chip.key)}
          >
            ×
          </S.ActiveChipRemove>
        </S.ActiveChip>
      ))}

      <S.ClearFiltersButton type="button" onClick={onClearAll}>
        Clear all
      </S.ClearFiltersButton>
    </S.ActiveChipsWrap>
  );
}
