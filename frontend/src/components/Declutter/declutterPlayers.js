import { DECLUTTER_PLAYERS } from '../../api/declutterDeck';

const PLAYER_STORAGE_KEY = 'disco-warp-core:declutter-player';

export function getStoredDeclutterPlayer() {
  if (typeof window === 'undefined') return DECLUTTER_PLAYERS[0].id;
  const stored = window.localStorage.getItem(PLAYER_STORAGE_KEY);
  return DECLUTTER_PLAYERS.some((player) => player.id === stored)
    ? stored
    : DECLUTTER_PLAYERS[0].id;
}

export function storeDeclutterPlayer(playerId) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(PLAYER_STORAGE_KEY, playerId);
  }
}
