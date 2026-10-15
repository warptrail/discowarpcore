import { useEffect, useRef } from 'react';
export const MISSING_INVENTORY_REFRESH_EVENT = 'missing-items:refresh';

// Background refreshes keep mounted workspaces and their scroll position intact.
// Defer source-data replacement while a user is editing; status badges still sync.
export default function useMissingInventoryRefresh(refresh) {
  const latest = useRef(refresh);
  useEffect(() => { latest.current = refresh; }, [refresh]);
  useEffect(() => {
    const update = () => {
      if (document.visibilityState !== 'visible' || document.querySelector('[role="dialog"]') ||
          document.activeElement?.matches('input, textarea, [contenteditable="true"]')) return;
      Promise.resolve(latest.current?.()).catch(() => {});
    };
    window.addEventListener(MISSING_INVENTORY_REFRESH_EVENT, update);
    return () => window.removeEventListener(MISSING_INVENTORY_REFRESH_EVENT, update);
  }, []);
}
