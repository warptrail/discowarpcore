import * as S from './Retrieval.styles';

export default function BoxBadge({ boxNumber, boxName, compact = false }) {
  const safeNumber = String(boxNumber || '').trim();
  const safeName = String(boxName || '').trim();

  const idLabel = safeNumber ? `BOX ${safeNumber}` : 'BOX —';
  const nameLabel = safeName || 'Unnamed Box';
  const titleLabel = `${idLabel} · ${nameLabel}`;

  return (
    <S.BoxBadge $compact={compact} title={titleLabel}>
      <S.BoxId>{idLabel}</S.BoxId>
      <S.BoxName>{nameLabel}</S.BoxName>
    </S.BoxBadge>
  );
}
