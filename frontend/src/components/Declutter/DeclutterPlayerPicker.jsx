import { DECLUTTER_PLAYERS } from '../../api/declutterDeck';
import { useHouseholdProfile } from '../HouseholdProfile/HouseholdProfileContext';
import * as S from './Declutter.styles';

export default function DeclutterPlayerPicker({ pendingCounts = {} }) {
  const { profileId: activePlayer, selectProfile: selectPlayer } = useHouseholdProfile();

  return (
    <S.PlayerPicker aria-label="Select player">
      <S.PlayerChoices>
        {DECLUTTER_PLAYERS.map((player) => (
          <S.PlayerButton
            key={player.id}
            type="button"
            $active={activePlayer === player.id}
            $player={player.id}
            onClick={() => selectPlayer(player.id)}
            aria-pressed={activePlayer === player.id}
            title={player.label}
          >
            <S.PlayerIcon aria-hidden="true">{player.icon}</S.PlayerIcon>
            <S.PlayerIdentity>
              <S.PlayerName>{player.label}</S.PlayerName>
            </S.PlayerIdentity>
            {Number(pendingCounts?.[player.id] || 0) > 0 ? (
              <S.PlayerNotification
                $player={player.id}
                aria-label={`${pendingCounts[player.id]} items waiting for ${player.label} to decide`}
              >
                {pendingCounts[player.id] > 99 ? '99+' : pendingCounts[player.id]}
              </S.PlayerNotification>
            ) : null}
            <S.OnlineDot $player={player.id} aria-hidden="true" />
          </S.PlayerButton>
        ))}
      </S.PlayerChoices>
    </S.PlayerPicker>
  );
}
