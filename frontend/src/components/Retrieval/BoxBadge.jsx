import * as S from './Retrieval.styles';
import { getBoxColorTones } from './boxColors';

export default function BoxBadge({ boxNumber, boxName, compact = false }) {
  const safeNumber = String(boxNumber || '').trim();
  const safeName = String(boxName || '').trim();

  const idLabel = safeNumber ? `#${safeNumber}` : '#—';
  const nameLabel = safeName || 'Unnamed Box';
  const titleLabel = `Box ${safeNumber || '—'} · ${nameLabel}`;
  const tones = getBoxColorTones(safeNumber || 0);

  return (
    <S.BoxBadge
      $compact={compact}
      title={titleLabel}
      $boxColorRgb={tones.baseRgb}
    >
      <S.BoxIdCell>
        <S.BoxId $compact={compact} $boxNeonRgb={tones.neonRgb}>
          {idLabel}
        </S.BoxId>
      </S.BoxIdCell>
      <S.BoxName $compact={compact} $boxMutedRgb={tones.mutedRgb}>
        {nameLabel}
      </S.BoxName>
    </S.BoxBadge>
  );
}
