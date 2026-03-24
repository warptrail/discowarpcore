import * as S from './Retrieval.styles';
import { getBoxColor, hexToRgbString } from './boxColors';

export default function BoxBadge({ boxNumber, boxName, compact = false }) {
  const safeNumber = String(boxNumber || '').trim();
  const safeName = String(boxName || '').trim();

  const idLabel = safeNumber ? `#${safeNumber}` : '#—';
  const nameLabel = safeName || 'Unnamed Box';
  const titleLabel = `Box ${safeNumber || '—'} · ${nameLabel}`;
  const boxColor = getBoxColor(safeNumber || 0);
  const boxColorRgb = hexToRgbString(boxColor);

  return (
    <S.BoxBadge
      $compact={compact}
      title={titleLabel}
      style={{
        '--box-color': boxColor,
        '--box-color-rgb': boxColorRgb,
      }}
    >
      <S.BoxIdCell>
        <S.BoxId $compact={compact}>{idLabel}</S.BoxId>
      </S.BoxIdCell>
      <S.BoxName $compact={compact}>{nameLabel}</S.BoxName>
    </S.BoxBadge>
  );
}
