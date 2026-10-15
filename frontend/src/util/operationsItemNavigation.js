import { PEEK_HISTORY_STATE, QUICK_PEEK_ITEM_HISTORY_STATE } from '../components/OperationsQuickPeek/OperationsQuickPeek.history';
import { FINDER_ITEM_PARAM, FINDER_FOCUS_HISTORY } from './finderItemNavigation';

// Enter the owning box and item in one history step, preserving the search.
export function getOperationsItemPeekNavigation({ search = '', state = null, boxId, itemId }) {
  const params = new URLSearchParams(search);
  params.delete(FINDER_ITEM_PARAM);
  params.set('peek', String(boxId || 'adrift'));
  if (itemId != null) params.set('item', String(itemId));
  else params.delete('item');
  const nextState = { ...state, [PEEK_HISTORY_STATE]: true, [QUICK_PEEK_ITEM_HISTORY_STATE]: false };
  delete nextState[FINDER_FOCUS_HISTORY];
  return {
    to: `/operations?${params}`,
    state: nextState,
  };
}
