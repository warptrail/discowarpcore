import * as S from './Declutter.styles';
import { DECISION_OPTIONS, getSessionCounts } from './declutterUtils';

export default function DeclutterCounts({ session, items }) {
  const counts = getSessionCounts(session, items);

  return (
    <S.CountGrid>
      <S.CountCell>
        <S.CountValue $tone="pending">{counts.total}</S.CountValue>
        <S.CountLabel>Total</S.CountLabel>
      </S.CountCell>
      {DECISION_OPTIONS.map((option) => (
        <S.CountCell key={option.value}>
          <S.CountValue $tone={option.tone}>
            {counts[option.value] || 0}
          </S.CountValue>
          <S.CountLabel>{option.shortLabel}</S.CountLabel>
        </S.CountCell>
      ))}
    </S.CountGrid>
  );
}
