export const FINDER_ITEM_PARAM = 'findItem';
export const FINDER_FOCUS_HISTORY = 'finderFocusReturn';

export function getFinderItemNavigation({ search = '', state = null, itemId }) {
  const params = new URLSearchParams(search);
  const alreadyOpen = params.has(FINDER_ITEM_PARAM);
  params.delete('peek');
  params.delete('item');
  params.set(FINDER_ITEM_PARAM, String(itemId));
  return {
    to: `/operations?${params}`,
    state: { ...state, [FINDER_FOCUS_HISTORY]: alreadyOpen ? state?.[FINDER_FOCUS_HISTORY] : `/operations${search}` },
  };
}

export function getFinderCloseNavigation(search = '', state = null) {
  const params = new URLSearchParams(search);
  params.delete(FINDER_ITEM_PARAM);
  const nextState = { ...state };
  delete nextState[FINDER_FOCUS_HISTORY];
  return { to: `/operations${params.size ? `?${params}` : ''}`, state: nextState };
}
