const ALL_ITEMS_RETURN_KEY = 'all-items:return-snapshot';
const RETURN_SNAPSHOT_MAX_AGE_MS = 30 * 60 * 1000;

function getCurrentRoute() {
  if (typeof window === 'undefined') return '';
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function rememberAllItemsReturn(snapshot = {}) {
  if (typeof window === 'undefined') return;
  const returnTo = String(snapshot.returnTo || getCurrentRoute()).trim();
  const scrollY = Number(snapshot.scrollY);

  try {
    window.sessionStorage.setItem(
      ALL_ITEMS_RETURN_KEY,
      JSON.stringify({
        returnTo,
        scrollY: Number.isFinite(scrollY) && scrollY >= 0 ? scrollY : 0,
        itemId: String(snapshot.itemId || '').trim(),
        savedAt: Date.now(),
      }),
    );
  } catch {
    // Return restoration is best-effort when storage is unavailable.
  }
}

export function consumeAllItemsReturn(currentRoute = getCurrentRoute()) {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(ALL_ITEMS_RETURN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const savedAt = Number(parsed?.savedAt);
    const returnTo = String(parsed?.returnTo || '').trim();
    const isFresh = Number.isFinite(savedAt)
      && Date.now() - savedAt <= RETURN_SNAPSHOT_MAX_AGE_MS;
    const isMatchingRoute = returnTo === String(currentRoute || '').trim();

    if (!isFresh || !isMatchingRoute) {
      if (!isFresh) window.sessionStorage.removeItem(ALL_ITEMS_RETURN_KEY);
      return null;
    }

    return {
      returnTo,
      scrollY: Math.max(0, Number(parsed?.scrollY) || 0),
      itemId: String(parsed?.itemId || '').trim(),
    };
  } catch {
    return null;
  }
}

export function clearAllItemsReturn() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(ALL_ITEMS_RETURN_KEY);
  } catch {
    // Storage cleanup is best-effort.
  }
}
