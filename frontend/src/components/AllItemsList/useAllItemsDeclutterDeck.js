import { useCallback, useContext, useMemo, useState } from 'react';

import useDeclutterNomination, { PROFILE_REQUIRED } from '../../hooks/useDeclutterNomination';
import { ToastContext } from '../Toast';

function normalizeItemIds(itemIds = []) {
  return Array.from(new Set((Array.isArray(itemIds) ? itemIds : [])
    .map((itemId) => String(itemId || '').trim())
    .filter(Boolean)));
}

export default function useAllItemsDeclutterDeck({ enabled = false, selectedItemIds = [], onAdded }) {
  const { showToast, hideToast } = useContext(ToastContext) || {};
  const nominate = useDeclutterNomination({ showToast, hideToast });
  const selectedIds = useMemo(() => normalizeItemIds(selectedItemIds), [selectedItemIds]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const addSelectedToDeck = useCallback(async () => {
    if (!selectedIds.length) return;
    try {
      setAdding(true);
      setError('');
      const results = await nominate(selectedIds);
      const reopened = results.filter((result) => result.reopened).length;
      const added = results.filter((result) => result.created).length;
      showToast?.({
        variant: 'success',
        title: 'Declutter Deck updated',
        message: `${added} added${reopened ? `, ${reopened} reopened` : ''}.`,
        timeoutMs: 3600,
      });
      onAdded?.();
    } catch (err) {
      if (err?.code === PROFILE_REQUIRED) return;
      const message = err?.message || 'Could not add selected items to the Declutter Deck.';
      setError(message);
      showToast?.({ variant: 'danger', title: 'Declutter add failed', message, timeoutMs: 5200 });
    } finally {
      setAdding(false);
    }
  }, [onAdded, selectedIds, showToast, nominate]);

  return { enabled, selectedCount: selectedIds.length, adding, error, addSelectedToDeck };
}
