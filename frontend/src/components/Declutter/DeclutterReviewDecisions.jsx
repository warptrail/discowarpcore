import { DECISION_OPTIONS } from './declutterUtils';
import DeclutterGlyph from './DeclutterGlyph';
import * as S from './Declutter.styles';
import * as R from './DeclutterReviewCard.styles';

const PRIMARY = DECISION_OPTIONS.filter(({ value }) => ['keep', 'toss'].includes(value));
const SECONDARY = DECISION_OPTIONS.filter(({ value }) => !['pending', 'keep', 'toss'].includes(value));

export default function DeclutterReviewDecisions({ commitDirection, savingDecision, onDecision }) {
  const choice = (option, primary = false) => <R.Decision key={option.value} type="button"
    $tone={option.tone} $primary={primary} disabled={Boolean(savingDecision || commitDirection)}
    onClick={() => onDecision(option.value)}>
    <DeclutterGlyph name={option.value} />
    {commitDirection === option.value ? 'Saving...' : option.label}
  </R.Decision>;

  return <R.Decisions>
    <R.Prompt>What should happen to this?</R.Prompt>
    <S.PrimaryDecisionGrid>{PRIMARY.map((option) => choice(option, true))}</S.PrimaryDecisionGrid>
    <R.Secondary>{SECONDARY.map((option) => choice(option))}</R.Secondary>
  </R.Decisions>;
}
