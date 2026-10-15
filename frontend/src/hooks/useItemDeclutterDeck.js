import { useCallback, useEffect, useRef, useState } from 'react';
import {
  removeDeclutterCandidateByItem,
} from '../api/declutterDeck';
import { useHouseholdProfile } from '../components/HouseholdProfile/HouseholdProfileContext';
import useDeclutterNomination, { PROFILE_REQUIRED } from './useDeclutterNomination';

export default function useItemDeclutterDeck({
  item,
  showToast,
  hideToast,
  onStateChange,
  successTimeoutMs = 0,
  onSuccessTimeout,
}) {
  const { getProfileId } = useHouseholdProfile();
  const nominate = useDeclutterNomination({ showToast, hideToast });
  const itemId = item?._id ? String(item._id) : '';
  const itemName = item?.name || 'item';
  const isGone = String(item?.item_status || '').trim().toLowerCase() === 'gone';
  const [declutterPending, setDeclutterPending] = useState(false);
  const successTimerRef = useRef(0);
  const [inDeclutterDeck, setInDeclutterDeck] = useState(
    item?.declutterReadiness === 'in_deck'
  );

  useEffect(() => {
    setInDeclutterDeck(!isGone && item?.declutterReadiness === 'in_deck');
  }, [isGone, itemId, item?.declutterReadiness]);

  const runDeclutterChange = useCallback(async (nextInDeck) => {
    if (!itemId) return null;
    if (!getProfileId()) throw Object.assign(new Error('Choose a household profile to use Declutter.'), {code:PROFILE_REQUIRED});
    if (nextInDeck && isGone) {
      throw new Error('This item is gone away forever and cannot be added to the Declutter Deck.');
    }

    if (!nextInDeck) {
      await removeDeclutterCandidateByItem(itemId);
      setInDeclutterDeck(false);
      onStateChange?.(false);
      return null;
    }

    const [result] = await nominate([itemId]);
    setInDeclutterDeck(true);
    onStateChange?.(true);
    return result || null;
  }, [isGone, itemId, onStateChange, nominate, getProfileId]);

  const showDeclutterSuccess = useCallback((nextInDeck, result) => {
    const undoTarget = !nextInDeck;
    const resolvedSuccessTimeout = Math.max(0, Number(successTimeoutMs) || 0);
    const advancesAfterSuccess =
      resolvedSuccessTimeout > 0 && typeof onSuccessTimeout === 'function';

    showToast?.({
      variant: 'success',
      sticky: !advancesAfterSuccess,
      timeoutMs: advancesAfterSuccess ? resolvedSuccessTimeout : undefined,
      dismissible: !advancesAfterSuccess,
      title: nextInDeck ? 'Declutter Deck updated' : 'Removed from Declutter Deck',
      message: nextInDeck
        ? result?.reopened
          ? `Reopened "${itemName}" for a new round.`
          : `Added "${itemName}" to the shared deck.`
        : `Removed "${itemName}" from the shared deck.`,
      actions: [
        {
          id: `undo-item-page-declutter-${itemId}-${nextInDeck ? 'add' : 'remove'}`,
          label: 'Undo',
          onClick: async () => {
            if (advancesAfterSuccess) {
              window.clearTimeout(successTimerRef.current);
              successTimerRef.current = 0;
            }
            hideToast?.();
            try {
              setDeclutterPending(true);
              await runDeclutterChange(undoTarget);
              if (advancesAfterSuccess) {
                onSuccessTimeout?.(undoTarget, null);
                return;
              }
              showToast?.({
                variant: 'success',
                title: 'Declutter change undone',
                message: undoTarget
                  ? `Returned "${itemName}" to the shared deck.`
                  : `Removed "${itemName}" from the shared deck.`,
                timeoutMs: 3200,
              });
            } catch (error) {
              if (error?.code === PROFILE_REQUIRED) return;
              showToast?.({
                variant: 'danger',
                title: 'Undo failed',
                message: error?.message || 'Could not restore the previous deck state.',
                timeoutMs: 4200,
              });
            } finally {
              setDeclutterPending(false);
            }
          },
        },
      ],
    });

    if (advancesAfterSuccess) {
      window.clearTimeout(successTimerRef.current);
      successTimerRef.current = window.setTimeout(() => {
        successTimerRef.current = 0;
        onSuccessTimeout(nextInDeck, result);
      }, resolvedSuccessTimeout);
    }
  }, [
    hideToast,
    itemId,
    itemName,
    onSuccessTimeout,
    runDeclutterChange,
    showToast,
    successTimeoutMs,
  ]);

  const toggleDeclutterDeck = useCallback(async () => {
    if (!itemId || declutterPending || isGone) return;
    const nextInDeck = !inDeclutterDeck;

    try {
      setDeclutterPending(true);
      const result = await runDeclutterChange(nextInDeck);
      showDeclutterSuccess(nextInDeck, result);
    } catch (error) {
      if (error?.code === PROFILE_REQUIRED) return;
      showToast?.({
        variant: 'danger',
        title: nextInDeck ? 'Declutter add failed' : 'Declutter removal failed',
        message: error?.message || 'Could not update the item.',
        timeoutMs: 5200,
      });
    } finally {
      setDeclutterPending(false);
    }
  }, [declutterPending, inDeclutterDeck, isGone, itemId, runDeclutterChange, showDeclutterSuccess, showToast]);

  return {
    declutterPending,
    inDeclutterDeck,
    toggleDeclutterDeck,
  };
}
