import { createElement, useCallback, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContext } from '../components/Toast';
import { getItemHomeHref } from '../api/itemDetails';
import { fetchRandomItem } from '../api/randomItem';
import RandomItemToastContent from '../components/Toast/RandomItemToastContent';

const RANDOM_REVEAL_DELAY_MS = 700;
const ORPHANED_LABEL = 'Orphaned inventory';
const SCANNING_MESSAGES = [
  'Scanning inventory matrix...',
  'Routing through cargo manifest...',
  'Selecting random household artifact...',
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickScanningMessage() {
  const index = Math.floor(Math.random() * SCANNING_MESSAGES.length);
  return SCANNING_MESSAGES[index];
}

function getItemName(item) {
  return String(item?.name || '').trim() || 'Unnamed item';
}

function getItemLocationLabel(item) {
  const explicitLabel = String(item?.locationLabel || '').trim();
  if (explicitLabel) return explicitLabel;
  const boxLabel = String(item?.box?.label || '').trim();
  if (boxLabel) return boxLabel;
  return ORPHANED_LABEL;
}

function getItemBoxIdLabel(item) {
  const boxId = String(item?.box?.box_id || '').trim();
  if (boxId) return `#${boxId}`;
  return 'Orphaned';
}

function getItemThumbUrl(item) {
  return String(item?.image?.thumbUrl || '').trim();
}

export default function useRandomItemFlow() {
  const navigate = useNavigate();
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const hideToast = toastCtx?.hideToast;
  const latestRunRef = useRef(0);

  const runRandomItem = useCallback(async () => {
    const runId = Date.now() + Math.random();
    latestRunRef.current = runId;

    showToast?.({
      variant: 'info',
      title: 'Random Item',
      message: pickScanningMessage(),
      sticky: true,
    });

    try {
      const [item] = await Promise.all([
        fetchRandomItem(),
        sleep(RANDOM_REVEAL_DELAY_MS),
      ]);

      if (latestRunRef.current !== runId) return;

      const itemId = item?._id;
      if (!itemId) {
        showToast?.({
          variant: 'warning',
          title: 'Random Item',
          message: 'No active items available for random selection',
          sticky: true,
          actions: [
            {
              id: `retry-random-item-${Date.now()}`,
              label: 'Retry',
              onClick: () => {
                runRandomItem();
              },
            },
          ],
        });
        return;
      }

      const itemName = getItemName(item);
      const locationLabel = getItemLocationLabel(item);
      const boxIdLabel = getItemBoxIdLabel(item);
      const thumbUrl = getItemThumbUrl(item);

      showToast?.({
        variant: 'success',
        title: `Selected: ${itemName}`,
        message: `Located in: ${locationLabel}`,
        content: createElement(RandomItemToastContent, {
          boxIdLabel,
          thumbUrl,
        }),
        sticky: true,
        actions: [
          {
            id: `open-random-item-${itemId}`,
            label: 'Open Item',
            kind: 'primary',
            onClick: () => {
              hideToast?.();
              navigate(getItemHomeHref(itemId));
            },
          },
          {
            id: `random-again-${Date.now()}`,
            label: 'Another Random Item',
            onClick: () => {
              runRandomItem();
            },
          },
        ],
      });
    } catch (error) {
      if (latestRunRef.current !== runId) return;

      const noActiveItems =
        error?.status === 404 || String(error?.code || '') === 'NO_ACTIVE_ITEMS';

      showToast?.({
        variant: noActiveItems ? 'warning' : 'danger',
        title: 'Random Item',
        message: noActiveItems
          ? 'No active items available for random selection'
          : error?.message || 'Failed to select a random item',
        sticky: true,
        actions: [
          {
            id: `retry-random-item-${Date.now()}`,
            label: 'Retry',
            onClick: () => {
              runRandomItem();
            },
          },
        ],
      });
    }
  }, [hideToast, navigate, showToast]);

  return {
    runRandomItem,
  };
}
