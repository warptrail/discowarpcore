import { useEffect, useState } from 'react';

import * as S from './Declutter.styles';
import { getItemName, getSessionItemItem, getVotePresentationMeta } from './declutterUtils';

function formatCountdown(deadline, now) {
  const remaining = Math.max(0, new Date(deadline).getTime() - now);
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function DeclutterCoolingOffLane({
  candidates = [],
  busyCandidateId = '',
  onChangeVote,
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <S.WorkflowGrid>
      {candidates.length ? candidates.map((candidate) => {
        const item = getSessionItemItem(candidate);
        const fish = getVotePresentationMeta(candidate?.votes?.discofish);
        const fox = getVotePresentationMeta(candidate?.votes?.laserfox);
        return (
          <S.WorkflowCard key={candidate.id}>
            <S.WorkflowCardTop>
              <div>
                <S.Eyebrow>Cooling off</S.Eyebrow>
                <S.ItemName>{getItemName(item)}</S.ItemName>
              </div>
              <S.Countdown>{formatCountdown(candidate.confirmationExpiresAt, now)}</S.Countdown>
            </S.WorkflowCardTop>
            <S.WorkflowVotes>
              <span>🐟 {fish.label}</span>
              <span>🦊 {fox.label}</span>
              <strong>Route: {candidate.stagingRoute || 'Keep'}</strong>
            </S.WorkflowVotes>
            <S.SmallText>
              Still active inventory. Nothing moves until this timer expires.
            </S.SmallText>
            <S.Button
              type="button"
              $tone="warning"
              disabled={busyCandidateId === candidate.id}
              onClick={() => onChangeVote?.(candidate)}
            >
              Change my decision
            </S.Button>
          </S.WorkflowCard>
        );
      }) : <S.StatusPanel>No decisions are cooling off.</S.StatusPanel>}
    </S.WorkflowGrid>
  );
}
