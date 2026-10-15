import { useCallback } from 'react';
import { nominateDeclutterCandidates } from '../api/declutterDeck';
import { ITEM_OWNERS } from '../util/itemOwners';
import { useHouseholdProfile } from '../components/HouseholdProfile/HouseholdProfileContext';

export const PROFILE_REQUIRED = 'HOUSEHOLD_PROFILE_REQUIRED';

export default function useDeclutterNomination({ showToast, hideToast } = {}) {
  const { getProfileId, selectProfile } = useHouseholdProfile();
  return useCallback(async (itemIds) => {
    const profileId = getProfileId();
    if (!profileId) {
      showToast?.({
        id: 'declutter-profile-required', title: "Who's adding to the deck?", sticky: true,
        message: 'Choose your profile, then add again. Your choice is saved on this device.',
        actions: ITEM_OWNERS.map((profile) => ({
          id: profile.id, label: profile.label,
          onClick: () => { selectProfile(profile.id); hideToast?.('declutter-profile-required'); },
        })),
      });
      const error = new Error('Choose a household profile before adding to the Declutter Deck.');
      error.code = PROFILE_REQUIRED;
      throw error;
    }
    // Capture one identity for the complete batch, even if the profile changes mid-request.
    return nominateDeclutterCandidates(itemIds, { nominatedBy: profileId });
  }, [getProfileId, selectProfile, showToast, hideToast]);
}
