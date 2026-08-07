import { useEffect, useState } from 'react';

import { DECLUTTER_PLAYERS } from '../../api/declutterDeck';
import {
  DECLUTTER_PLAYER_CHANGE_EVENT,
  getStoredDeclutterPlayer,
  storeDeclutterPlayer,
} from './declutterPlayers';
import * as S from './Declutter.styles';

export default function DeclutterPlayerPicker({ value, pendingCounts = {}, onChange }) {
  const [activePlayer, setActivePlayer] = useState(value || getStoredDeclutterPlayer());

  useEffect(() => {
    if (value) setActivePlayer(value);
  }, [value]);

  useEffect(() => {
    const syncPlayer = (event) => {
      if (event.detail?.playerId) setActivePlayer(event.detail.playerId);
    };
    window.addEventListener(DECLUTTER_PLAYER_CHANGE_EVENT, syncPlayer);
    return () => window.removeEventListener(DECLUTTER_PLAYER_CHANGE_EVENT, syncPlayer);
  }, []);

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
