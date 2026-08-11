import * as S from './Declutter.styles';

const HISTORY_PATH = '/declutter/history';

const DECISIONS = [
  { key: 'active', label: 'Voting', icon: '▣', tone: 'pending' },
  { key: 'discussion', label: 'Discussion', icon: '?', tone: 'unsure' },
  { key: 'kept', filter: 'kept', label: 'Confirmed Keep', icon: '🛡', tone: 'keep' },
  { key: 'releaseApproved', filter: 'release_approved', label: 'Approved to leave', icon: '➤', tone: 'toss' },
  { key: 'physicallyCompleted', filter: 'physically_completed', label: 'Destroyed', icon: '✓', tone: 'keep' },
];

function percent(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / total) * 100);
}

const PARTNER_METRICS = [
  { label: 'Reviewed', discofish: 'discofishReviewed', laserfox: 'laserfoxReviewed' },
  { label: 'Keep votes', discofish: 'discofishKeepVotes', laserfox: 'laserfoxKeepVotes' },
  { label: 'Release votes', discofish: 'discofishReleaseVotes', laserfox: 'laserfoxReleaseVotes' },
  { label: 'Unsure votes', discofish: 'discofishUnsureVotes', laserfox: 'laserfoxUnsureVotes' },
];

function LedgerList({ candidates, emptyText, toss = false }) {
  return candidates.length ? candidates.slice(0, 8).map((candidate) => {
    const item = candidate?.item || null;
    const itemId = String(item?.id || candidate?.itemId || '').trim();
    const name = item?.name || 'Unnamed item';
    const box = item?.box;
    const place = toss
      ? 'Virtual non-existent · Don\'t have'
      : [box?.box_id ? `#${box.box_id}` : '', box?.label || 'Box'].filter(Boolean).join(' ') || 'No box assigned';
    return (
      <S.HistoryLedgerItem key={candidate.id}>
        {itemId ? <S.HistoryLedgerLink to={`/items/${encodeURIComponent(itemId)}`}>{name}</S.HistoryLedgerLink> : <strong>{name}</strong>}
        <small>{place}</small>
      </S.HistoryLedgerItem>
    );
  }) : <S.StatusPanel>{emptyText}</S.StatusPanel>;
}

export default function DeclutterProgressPanel({ metrics = {}, counts = {}, resolvedCandidates = [] }) {
  const total = Number(metrics.total || 0);
  const resolved = Number(metrics.resolved || 0);
  const keptCandidates = resolvedCandidates.filter((candidate) => candidate?.resolution === 'kept');
  const tossedCandidates = resolvedCandidates.filter((candidate) => (
    ['release_approved', 'ready_to_declutter', 'ready_to_donate', 'ready_to_sell'].includes(candidate?.resolution)
  ));
  return (
    <S.ProgressDashboard>
      <S.ProgressHeader>
        <div>
          <span>Deck progress</span>
          <small>{total} tracked · {resolved} resolved</small>
        </div>
        <S.ProgressLedgerLink to={HISTORY_PATH}>Open ledger <span aria-hidden="true">→</span></S.ProgressLedgerLink>
      </S.ProgressHeader>
      <S.ProgressStatGrid>
        <S.ProgressStatLink to={HISTORY_PATH} $tone="pending"><span>Total</span><strong>{total}</strong></S.ProgressStatLink>
        <S.ProgressStatLink to={`${HISTORY_PATH}?filter=resolved`} $tone="keep"><span>Resolved</span><strong>{resolved}</strong></S.ProgressStatLink>
        <S.ProgressStatLink to={`${HISTORY_PATH}?filter=active`} $tone="sell"><span>Pending</span><strong>{Number(counts.active || 0)}</strong></S.ProgressStatLink>
        <S.ProgressStatLink to={`${HISTORY_PATH}?filter=discussion`} $tone="toss"><span>Discuss</span><strong>{Number(counts.discussion || 0)}</strong></S.ProgressStatLink>
        <S.ProgressStatLink to={`${HISTORY_PATH}?filter=action`} $tone="toss"><span>Actions</span><strong>{Number(counts.action || 0)}</strong></S.ProgressStatLink>
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
              <S.SummaryLink to={`${HISTORY_PATH}?filter=${decision.filter || decision.key}`} key={decision.key}>
                <S.SummaryLabel $tone={decision.tone}>
                  <span aria-hidden="true">{decision.icon}</span>
                  {decision.label}
                </S.SummaryLabel>
                <S.SummaryTrack>
                  <S.SummaryFill $tone={decision.tone} $percent={share} />
                </S.SummaryTrack>
                <strong>{value}</strong>
                <small>{share}%</small>
              </S.SummaryLink>
            );
          })}
        </S.DecisionSummary>
      </S.DashboardPanel>

      <S.DashboardPanel>
        <S.PanelHeading>
          <span>Historical ledger</span>
          <small>Recent outcomes</small>
        </S.PanelHeading>
        <S.ProgressLedger>
          <S.ProgressLedgerColumn $tone="keep">
            <h3>Keep · {keptCandidates.length}</h3>
            <LedgerList candidates={keptCandidates} emptyText="No confirmed keeps yet." />
          </S.ProgressLedgerColumn>
          <S.ProgressLedgerColumn $tone="toss">
            <h3>Toss · {tossedCandidates.length}</h3>
            <LedgerList candidates={tossedCandidates} toss emptyText="No confirmed tosses yet." />
          </S.ProgressLedgerColumn>
        </S.ProgressLedger>
      </S.DashboardPanel>

      <S.DashboardPanel>
        <S.PanelHeading>
          <span>Partner progress</span>
          <small>Decision history</small>
        </S.PanelHeading>
        <S.PartnerStatsTable>
          <thead>
            <tr>
              <th scope="col">Stat</th>
              <S.PartnerStatsPlayerHeading scope="col" $player="discofish">Discofish</S.PartnerStatsPlayerHeading>
              <S.PartnerStatsPlayerHeading scope="col" $player="laserfox">Laserfox</S.PartnerStatsPlayerHeading>
            </tr>
          </thead>
          <tbody>
            {PARTNER_METRICS.map((metric) => (
              <tr key={metric.label}>
                <th scope="row">{metric.label}</th>
                <S.PartnerStatsValue $player="discofish">{Number(metrics[metric.discofish] || 0)}</S.PartnerStatsValue>
                <S.PartnerStatsValue $player="laserfox">{Number(metrics[metric.laserfox] || 0)}</S.PartnerStatsValue>
              </tr>
            ))}
          </tbody>
        </S.PartnerStatsTable>
      </S.DashboardPanel>

    </S.ProgressDashboard>
  );
}
