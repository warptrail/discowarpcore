import * as S from './Declutter.styles';

const DECISIONS = [
  { key: 'active', label: 'Voting', icon: '▣', tone: 'pending' },
  { key: 'discussion', label: 'Discussion', icon: '?', tone: 'unsure' },
  { key: 'coolingOff', label: 'Cooling Off', icon: '◷', tone: 'sell' },
  { key: 'kept', label: 'Confirmed Keep', icon: '🛡', tone: 'keep' },
  { key: 'releaseApproved', label: 'Approved to leave', icon: '↗', tone: 'toss' },
  { key: 'physicallyCompleted', label: 'Physically completed', icon: '✓', tone: 'keep' },
];

function percent(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / total) * 100);
}

export default function DeclutterProgressPanel({ metrics = {}, counts = {} }) {
  const total = Number(metrics.total || 0);
  const resolved = Number(metrics.resolved || 0);
  return (
    <S.ProgressDashboard>
      <S.ProgressStatGrid>
        <S.ProgressStat $tone="pending"><span>Total</span><strong>{total}</strong></S.ProgressStat>
        <S.ProgressStat $tone="keep"><span>Resolved</span><strong>{resolved}</strong></S.ProgressStat>
        <S.ProgressStat $tone="sell"><span>Pending</span><strong>{Number(counts.active || 0)}</strong></S.ProgressStat>
        <S.ProgressStat $tone="toss"><span>Discuss</span><strong>{Number(counts.discussion || 0)}</strong></S.ProgressStat>
        <S.ProgressStat $tone="sell"><span>Cooling</span><strong>{Number(counts.coolingOff || 0)}</strong></S.ProgressStat>
        <S.ProgressStat $tone="toss"><span>Actions</span><strong>{Number(counts.action || 0)}</strong></S.ProgressStat>
      </S.ProgressStatGrid>

      <S.DashboardPanel>
        <S.PanelHeading>
          <span>Decision summary</span>
          <small>{resolved} resolved</small>
        </S.PanelHeading>
        <S.DecisionSummary>
          {DECISIONS.map((decision) => {
            const value = Number(
              Object.prototype.hasOwnProperty.call(counts, decision.key)
                ? counts[decision.key]
                : metrics[decision.key] || 0
            );
            const share = percent(value, Math.max(total, 1));
            return (
              <S.SummaryRow key={decision.key}>
                <S.SummaryLabel $tone={decision.tone}>
                  <span aria-hidden="true">{decision.icon}</span>
                  {decision.label}
                </S.SummaryLabel>
                <S.SummaryTrack>
                  <S.SummaryFill $tone={decision.tone} $percent={share} />
                </S.SummaryTrack>
                <strong>{value}</strong>
                <small>{share}%</small>
              </S.SummaryRow>
            );
          })}
        </S.DecisionSummary>
      </S.DashboardPanel>

      <S.DashboardPanel>
        <S.PanelHeading>
          <span>Partner progress</span>
          <small>Shared deck</small>
        </S.PanelHeading>
        <S.PartnerProgressGrid>
          <S.PartnerProgress $player="discofish">
            <span aria-hidden="true">🐟</span>
            <div><strong>Discofish</strong><small>{Number(metrics.discofishReviewed || 0)} reviewed</small></div>
          </S.PartnerProgress>
          <S.PartnerProgress $player="laserfox">
            <span aria-hidden="true">🦊</span>
            <div><strong>Laserfox</strong><small>{Number(metrics.laserfoxReviewed || 0)} reviewed</small></div>
          </S.PartnerProgress>
        </S.PartnerProgressGrid>
      </S.DashboardPanel>

    </S.ProgressDashboard>
  );
}
