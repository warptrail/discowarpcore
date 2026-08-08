const STORAGE_KEY = 'disco-warp-core:operations-return-position';

export const OPERATIONS_SCROLL_RESTORE_STATE = 'operationsScrollRestore';

function isOperationsPath(pathname) {
  return /^\/(?:operations\/?|)$/.test(String(pathname || ''));
}

export function saveOperationsReturnPosition({
  pathname = '/operations',
  search = '',
  hash = '',
  scrollY = 0,
} = {}) {
  if (typeof window === 'undefined' || !isOperationsPath(pathname)) return;

  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        pathname,
        search,
        hash,
        scrollY: Math.max(0, Number(scrollY) || 0),
        savedAt: Date.now(),
      }),
    );
  } catch {
    // Returning to Operations still works without position persistence.
  }
}

export function readOperationsReturnPosition() {
  if (typeof window === 'undefined') return null;

  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (!parsed || !isOperationsPath(parsed.pathname)) return null;
    const scrollY = Number(parsed.scrollY);
    if (!Number.isFinite(scrollY) || scrollY < 0) return null;
    return {
      pathname: parsed.pathname || '/operations',
      search: String(parsed.search || ''),
      hash: String(parsed.hash || ''),
      scrollY,
      savedAt: Number(parsed.savedAt) || Date.now(),
    };
  } catch {
    return null;
  }
}

export function getOperationsReturnNavigation() {
  const saved = readOperationsReturnPosition();
  if (!saved) return null;

  return {
    to: {
      pathname: saved.pathname,
      search: saved.search,
      // Quick Peek hashes are navigation anchors. Replaying one would perform
      // a second browser jump after the exact saved pixel position is restored.
      hash: '',
    },
    state: {
      [OPERATIONS_SCROLL_RESTORE_STATE]: {
        scrollY: saved.scrollY,
        savedAt: saved.savedAt,
      },
    },
  };
}
