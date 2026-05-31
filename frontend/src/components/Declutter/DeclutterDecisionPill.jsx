import * as S from './Declutter.styles';
import { getDecisionMeta } from './declutterUtils';

export default function DeclutterDecisionPill({ decision }) {
  const meta = getDecisionMeta(decision);
  return (
    <S.DecisionPill $tone={meta.tone}>
      {meta.shortLabel}
    </S.DecisionPill>
  );
}
