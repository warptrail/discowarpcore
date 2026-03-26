import { useCallback, useMemo, useState } from 'react';
import { API_BASE } from '../api/API_BASE';
import { markItemGone } from '../api/itemLifecycle';

async function parseErrorMessage(response, fallback) {
  const raw = await response.text().catch(() => '');
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    return parsed?.message || parsed?.error || fallback;
  } catch {
    return raw;
  }
}

export default function useItemTimestampActions({
  item,
  onSaved,
  showToast,
  hideToast,
}) {
  const [pendingAction, setPendingAction] = useState('');
  const [consumedConfirmOpen, setConsumedConfirmOpen] = useState(false);

  const itemId = String(item?._id || '').trim();
  const itemName = String(item?.name || '').trim() || 'Item';
  const isConsumable = Boolean(item?.isConsumable);

  const syncUpdatedItem = useCallback(
    async (updated, meta = {}) => {
      if (typeof onSaved !== 'function') return;
      await onSaved(updated, meta);
    },
    [onSaved]
  );

  const appendNowToHistory = useCallback(
    async ({ action, field, successTitle, successMessage }) => {
      if (!itemId || pendingAction) return false;

      const existing = Array.isArray(item?.[field]) ? item[field] : [];
      const nowIso = new Date().toISOString();
      const payload = {
        [field]: [...existing, nowIso],
      };

      try {
        setPendingAction(action);
        const response = await fetch(`${API_BASE}/api/items/${encodeURIComponent(itemId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const message = await parseErrorMessage(
            response,
            'Failed to update item lifecycle.'
          );
          throw new Error(message);
        }

        const json = await response.json().catch(() => ({}));
        const updated = json?.data ?? json;

        await syncUpdatedItem(updated, { action, field, at: nowIso });

        showToast?.({
          variant: 'success',
          title: successTitle,
          message: successMessage || 'Timestamp saved.',
          timeoutMs: 2600,
        });

        return true;
      } catch (err) {
        showToast?.({
          variant: 'danger',
          title: 'Lifecycle update failed',
          message: err?.message || 'Could not save timestamp.',
          timeoutMs: 4200,
        });
        return false;
      } finally {
        setPendingAction('');
      }
    },
    [item, itemId, pendingAction, showToast, syncUpdatedItem]
  );

  const handleMarkUsed = useCallback(
    async (event) => {
      event?.stopPropagation?.();
      await appendNowToHistory({
        action: 'used',
        field: 'usageHistory',
        successTitle: 'Used now',
        successMessage: `Marked "${itemName}" used just now.`,
      });
    },
    [appendNowToHistory, itemName]
  );

  const handleMarkChecked = useCallback(
    async (event) => {
      event?.stopPropagation?.();
      await appendNowToHistory({
        action: 'checked',
        field: 'checkHistory',
        successTitle: 'Checked now',
        successMessage: `Marked "${itemName}" checked just now.`,
      });
    },
    [appendNowToHistory, itemName]
  );

  const handleMarkMaintained = useCallback(
    async (event) => {
      event?.stopPropagation?.();
      await appendNowToHistory({
        action: 'maintained',
        field: 'maintenanceHistory',
        successTitle: 'Maintained now',
        successMessage: `Updated maintenance timestamp for "${itemName}".`,
      });
    },
    [appendNowToHistory, itemName]
  );

  const handleMarkConsumed = useCallback(
    (event) => {
      event?.stopPropagation?.();
      if (!itemId || pendingAction) return;

      if (consumedConfirmOpen) {
        hideToast?.();
        setConsumedConfirmOpen(false);
        return;
      }

      setConsumedConfirmOpen(true);
      showToast?.({
        variant: 'warning',
        sticky: true,
        title: 'Mark this consumable as consumed?',
        message: 'Are you sure you want to mark this item as consumed?',
        actions: [
          {
            id: `confirm-consumed-${itemId}`,
            label: 'Yes',
            kind: 'danger',
            onClick: async () => {
              try {
                setPendingAction('consumed');
                const updated = await markItemGone(itemId, {
                  disposition: 'consumed',
                });
                setConsumedConfirmOpen(false);
                await syncUpdatedItem(updated, { action: 'consumed' });
                showToast?.({
                  variant: 'warning',
                  title: 'Item marked consumed',
                  message: `Marked consumable timestamp for "${itemName}". To unconsume this item, open the edit pane and click Reclaim Item.`,
                  timeoutMs: 5600,
                });
              } catch (err) {
                setConsumedConfirmOpen(false);
                showToast?.({
                  variant: 'danger',
                  title: 'Consume action failed',
                  message: err?.message || 'Could not mark this item as consumed.',
                  timeoutMs: 4200,
                });
              } finally {
                setPendingAction('');
              }
            },
          },
          {
            id: `cancel-consumed-${itemId}`,
            label: 'No',
            onClick: () => {
              hideToast?.();
              setConsumedConfirmOpen(false);
            },
          },
        ],
        onClose: () => {
          hideToast?.();
          setConsumedConfirmOpen(false);
        },
      });
    },
    [
      consumedConfirmOpen,
      hideToast,
      itemId,
      itemName,
      pendingAction,
      showToast,
      syncUpdatedItem,
    ]
  );

  const actions = useMemo(() => {
    const canRun = Boolean(itemId) && !pendingAction;
    const resolved = [
      {
        id: 'used',
        label: pendingAction === 'used' ? 'Saving…' : 'Used',
        tone: 'used',
        disabled: !canRun,
        onClick: handleMarkUsed,
      },
      {
        id: 'checked',
        label: pendingAction === 'checked' ? 'Saving…' : 'Checked',
        tone: 'checked',
        disabled: !canRun,
        onClick: handleMarkChecked,
      },
    ];

    if (isConsumable) {
      resolved.push({
        id: 'consumed',
        label: pendingAction === 'consumed' ? 'Saving…' : 'Consumed',
        tone: 'consumed',
        disabled: !canRun,
        onClick: handleMarkConsumed,
      });
    } else {
      resolved.push({
        id: 'maintained',
        label: pendingAction === 'maintained' ? 'Saving…' : 'Maintained',
        tone: 'maintained',
        disabled: !canRun,
        onClick: handleMarkMaintained,
      });
    }

    return resolved;
  }, [
    handleMarkChecked,
    handleMarkConsumed,
    handleMarkMaintained,
    handleMarkUsed,
    isConsumable,
    itemId,
    pendingAction,
  ]);

  return {
    actions,
    pendingAction,
  };
}
