import { useCallback, useContext } from 'react';
import useItemDeclutterDeck from '../../hooks/useItemDeclutterDeck';
import { ToastContext } from '../Toast';
import { useHouseholdProfile } from '../HouseholdProfile/HouseholdProfileContext';
import { ITEM_OWNERS } from '../../util/itemOwners';
import * as S from './RetrievalItemPanel.styles';

export default function RetrievalDeclutterButton({ item, detailResource, onItemUpdated }) {
  const { showToast, hideToast } = useContext(ToastContext) || {};
  const { getProfileId, selectProfile } = useHouseholdProfile();
  const record = detailResource?.data || item;
  const itemId = String(record?._id || item?.id || '');
  const onStateChange = useCallback(inDeck => onItemUpdated?.({
    _id: itemId, declutterReadiness: inDeck ? 'in_deck' : 'not_considered',
  }), [itemId, onItemUpdated]);
  const { inDeclutterDeck, declutterPending, toggleDeclutterDeck } = useItemDeclutterDeck({
    item: { ...record, _id: itemId }, showToast, hideToast, onStateChange,
  });
  const toggle = () => {
    if (!getProfileId()) {
      showToast?.({ id: 'declutter-profile-required', sticky: true,
        title: "Who's updating the deck?", message: 'Choose your profile, then try again.',
        actions: ITEM_OWNERS.map(profile => ({ id: profile.id, label: profile.label,
          onClick: () => { selectProfile(profile.id); hideToast?.('declutter-profile-required'); } })),
      });
      return;
    }
    void toggleDeclutterDeck();
  };
  return <S.Button type="button" data-declutter-command aria-pressed={inDeclutterDeck}
    aria-busy={declutterPending}
    aria-label={inDeclutterDeck ? 'Remove from Declutter Deck' : 'Add to Declutter Deck'}
    disabled={declutterPending || detailResource?.status !== 'ready' || !itemId || record?.item_status === 'gone'}
    onClick={toggle}>
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 8h12v13H4zM7 5h12v13M10 2h12v13" />
      <path d={inDeclutterDeck ? 'm7 14 2 2 4-4' : 'M7 14h6M10 11v6'} /></svg>
    {declutterPending ? 'Saving…' : inDeclutterDeck ? 'In Declutter Deck' : 'Add to Declutter Deck'}
  </S.Button>;
}
