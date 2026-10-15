import { HOUSEHOLD_PROFILE_CHANGE_EVENT, readHouseholdProfile, writeHouseholdProfile } from '../../util/householdProfile';

export const DECLUTTER_PLAYER_CHANGE_EVENT = HOUSEHOLD_PROFILE_CHANGE_EVENT;
export const DECLUTTER_PENDING_COUNTS_EVENT = 'declutter:pending-counts';

export function getStoredDeclutterPlayer() {
  return readHouseholdProfile();
}

export function storeDeclutterPlayer(playerId) {
  if (typeof window !== 'undefined') {
    writeHouseholdProfile(playerId);
    window.dispatchEvent(new CustomEvent(DECLUTTER_PLAYER_CHANGE_EVENT, {
      detail: { playerId },
    }));
  }
}

export function publishDeclutterPendingCounts(pendingCounts) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DECLUTTER_PENDING_COUNTS_EVENT, {
    detail: { pendingCounts },
  }));
}
