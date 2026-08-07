import { useCallback, useEffect, useRef, useState } from 'react';
import {
  nominateDeclutterCandidates,
  removeDeclutterCandidateByItem,
} from '../api/declutterDeck';

export default function useItemDeclutterDeck({
  item,
  showToast,
  hideToast,
  onStateChange,
  successTimeoutMs = 0,
  onSuccessTimeout,
}) {
  const itemId = item?._id ? String(item._id) : '';
  const itemName = item?.name || 'item';
  const [declutterPending, setDeclutterPending] = useState(false);
  const successTimerRef = useRef(0);
  const [inDeclutterDeck, setInDeclutterDeck] = useState(
    item?.declutterReadiness === 'in_deck'
  );

  useEffect(() => {
    setInDeclutterDeck(item?.declutterReadiness === 'in_deck');
  }, [itemId, item?.declutterReadiness]);

  const runDeclutterChange = useCallback(async (nextInDeck) => {
    if (!itemId) return null;

    if (!nextInDeck) {
      await removeDeclutterCandidateByItem(itemId);
      setInDeclutterDeck(false);
      onStateChange?.(false);
      return null;
    }

    const [result] = await nominateDeclutterCandidates([itemId]);
    setInDeclutterDeck(true);
    onStateChange?.(true);
    return result || null;
  }, [itemId, onStateChange]);

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
    if (!itemId || declutterPending) return;
    const nextInDeck = !inDeclutterDeck;

    try {
      setDeclutterPending(true);
      const result = await runDeclutterChange(nextInDeck);
      showDeclutterSuccess(nextInDeck, result);
    } catch (error) {
      showToast?.({
        variant: 'danger',
        title: nextInDeck ? 'Declutter add failed' : 'Declutter removal failed',
        message: error?.message || 'Could not update the item.',
        timeoutMs: 5200,
      });
    } finally {
      setDeclutterPending(false);
    }
  }, [declutterPending, inDeclutterDeck, itemId, runDeclutterChange, showDeclutterSuccess, showToast]);

  return {
    declutterPending,
    inDeclutterDeck,
    toggleDeclutterDeck,
  };
}
