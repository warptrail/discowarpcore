import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ITEM_OWNERS } from '../../util/itemOwners';
import {
  HOUSEHOLD_PROFILE_CHANGE_EVENT, HOUSEHOLD_PROFILE_STORAGE_KEY,
  normalizeHouseholdProfile, readHouseholdProfile, writeHouseholdProfile,
} from '../../util/householdProfile';
import { HouseholdProfileContext } from './HouseholdProfileContext';

export default function HouseholdProfileProvider({ children }) {
  const [profileId, setProfileId] = useState(readHouseholdProfile);
  const profileRef = useRef(profileId);
  const updateProfile = useCallback((next) => { profileRef.current = next; setProfileId(next); }, []);
  const getProfileId = useCallback(() => profileRef.current, []);
  const [persistenceAvailable, setPersistenceAvailable] = useState(true);
  const selectProfile = useCallback((value) => {
    const next = normalizeHouseholdProfile(value);
    updateProfile(next);
    setPersistenceAvailable(writeHouseholdProfile(next));
    window.dispatchEvent(new CustomEvent(HOUSEHOLD_PROFILE_CHANGE_EVENT, { detail: { playerId: next } }));
  }, [updateProfile]);

  useEffect(() => {
    const syncSelection = (event) => updateProfile(normalizeHouseholdProfile(event.detail?.playerId));
    const syncStorage = (event) => {
      if (event.key !== HOUSEHOLD_PROFILE_STORAGE_KEY && event.key !== null) return;
      const next = readHouseholdProfile();
      updateProfile(next);
      window.dispatchEvent(new CustomEvent(HOUSEHOLD_PROFILE_CHANGE_EVENT, { detail: { playerId: next } }));
    };
    window.addEventListener(HOUSEHOLD_PROFILE_CHANGE_EVENT, syncSelection);
    window.addEventListener('storage', syncStorage);
    return () => {
      window.removeEventListener(HOUSEHOLD_PROFILE_CHANGE_EVENT, syncSelection);
      window.removeEventListener('storage', syncStorage);
    };
  }, [updateProfile]);

  const value = useMemo(() => ({
    profileId, profile: ITEM_OWNERS.find((entry) => entry.id === profileId) || null,
    persistenceAvailable, selectProfile, getProfileId,
  }), [profileId, persistenceAvailable, selectProfile, getProfileId]);
  return <HouseholdProfileContext.Provider value={value}>{children}</HouseholdProfileContext.Provider>;
}
