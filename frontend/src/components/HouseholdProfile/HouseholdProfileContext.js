import { createContext, useContext } from 'react';

export const HouseholdProfileContext = createContext({
  profileId: '', profile: null, persistenceAvailable: true, selectProfile: () => {}, getProfileId: () => '',
});

export function useHouseholdProfile() {
  return useContext(HouseholdProfileContext);
}
