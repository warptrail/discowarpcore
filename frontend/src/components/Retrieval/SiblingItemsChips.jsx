import * as S from './Retrieval.styles';

export default function SiblingItemsChips({ siblingItems = [], limit = 8 }) {
  const safeItems = Array.isArray(siblingItems)
    ? siblingItems.filter((item) => String(item || '').trim())
    : [];

  if (!safeItems.length) return null;

  const visibleItems = safeItems.slice(0, limit);
  const overflow = Math.max(safeItems.length - visibleItems.length, 0);

  return (
    <S.SiblingSection>
      <S.SiblingLabel>Other items in this box:</S.SiblingLabel>
      <S.SiblingChipRow>
        {visibleItems.map((name, index) => (
          <S.SiblingChip key={`${name}-${index}`}>{name}</S.SiblingChip>
        ))}
        {overflow > 0 ? <S.SiblingOverflow>+{overflow} more</S.SiblingOverflow> : null}
      </S.SiblingChipRow>
    </S.SiblingSection>
  );
}
