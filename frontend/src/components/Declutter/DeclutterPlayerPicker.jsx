import { useEffect, useState } from 'react';

import { DECLUTTER_PLAYERS } from '../../api/declutterDeck';
import { getStoredDeclutterPlayer, storeDeclutterPlayer } from './declutterPlayers';
import * as S from './Declutter.styles';

export default function DeclutterPlayerPicker({ value, metrics = {}, onChange }) {
  const [activePlayer, setActivePlayer] = useState(value || getStoredDeclutterPlayer());

  useEffect(() => {
    if (value) setActivePlayer(value);
  }, [value]);

  const selectPlayer = (playerId) => {
    setActivePlayer(playerId);
    storeDeclutterPlayer(playerId);
    onChange?.(playerId);
  };

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
              <S.PlayerStat>
                {Number(metrics?.[`${player.id}Reviewed`] || 0)} reviewed
              </S.PlayerStat>
            </S.PlayerIdentity>
            <S.OnlineDot $player={player.id} aria-hidden="true" />
          </S.PlayerButton>
        ))}
      </S.PlayerChoices>
    </S.PlayerPicker>
  );
}
