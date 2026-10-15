import { DECLUTTER_PLAYERS } from '../../api/declutterDeck';
import * as S from './Declutter.styles';
import * as C from './DeclutterConsole.styles';

export default function DeclutterQueueOverview({ candidates, decisionCounts, waitingCount, open, onOpen }) {
  return <C.Queue>
    <S.QueueProgressTop>
      <span>Your queue</span>
      <S.QueueProgressButton type="button" aria-haspopup="dialog" aria-expanded={open} onClick={onOpen}>
        {waitingCount} waiting <span aria-hidden="true">↗</span>
      </S.QueueProgressButton>
    </S.QueueProgressTop>
    <S.QueueScoreboard aria-label="Declutter decisions by player">
      {DECLUTTER_PLAYERS.map((player) => <S.QueuePlayerRow key={player.id}>
        <C.PlayerHeading>
          <C.PlayerName $player={player.id}>{player.label}</C.PlayerName>
          <C.PlayerCount>{decisionCounts[player.id]} / {candidates.length}</C.PlayerCount>
        </C.PlayerHeading>
        <S.QueueSegments $columns={Math.min(20,Math.max(1,candidates.length))}
          role="meter" aria-label={`${player.label} active decisions complete`}
          aria-valuenow={decisionCounts[player.id]} aria-valuemin={0} aria-valuemax={Math.max(1,candidates.length)}
          aria-valuetext={`${decisionCounts[player.id]} of ${candidates.length} active decisions complete`}>
          {candidates.map((candidate,index) => <S.QueueSegment key={`${player.id}-${candidate.id}`}
            $player={player.id} $decided={index < decisionCounts[player.id]} aria-hidden="true" />)}
        </S.QueueSegments>
      </S.QueuePlayerRow>)}
    </S.QueueScoreboard>
  </C.Queue>;
}
