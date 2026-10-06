import { PEEK_HISTORY_STATE, QUICK_PEEK_ITEM_HISTORY_STATE } from '../components/OperationsQuickPeek/OperationsQuickPeek.history';

// Enter the owning box and item in one history step, preserving the search.
export function getOperationsItemPeekNavigation({ search = '', state = null, boxId, itemId }) {
  const params = new URLSearchParams(search);
  params.set('peek', String(boxId || 'adrift'));
  params.set('item', String(itemId));
  return {
    to: `/operations?${params}`,
    state: { ...state, [PEEK_HISTORY_STATE]: true, [QUICK_PEEK_ITEM_HISTORY_STATE]: false },
  };
}
