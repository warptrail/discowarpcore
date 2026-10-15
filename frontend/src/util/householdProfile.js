import { ITEM_OWNERS } from './itemOwners.js';

// Reuse the existing device selection so Declutter and the app shell agree.
export const HOUSEHOLD_PROFILE_STORAGE_KEY = 'disco-warp-core:declutter-player';
export const HOUSEHOLD_PROFILE_CHANGE_EVENT = 'declutter:player-change';

export function normalizeHouseholdProfile(value) {
  return ITEM_OWNERS.some((profile) => profile.id === value) ? value : '';
}

export function readHouseholdProfile(storage) {
  try {
    const target = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
    return normalizeHouseholdProfile(target?.getItem(HOUSEHOLD_PROFILE_STORAGE_KEY));
  } catch {
    return '';
  }
}

export function writeHouseholdProfile(value, storage) {
  const profileId = normalizeHouseholdProfile(value);
  try {
    const target = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
    if (!target) return false;
    if (profileId) target.setItem(HOUSEHOLD_PROFILE_STORAGE_KEY, profileId);
    else target.removeItem(HOUSEHOLD_PROFILE_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
