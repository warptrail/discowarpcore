export const PEEK_HISTORY_STATE = 'operationsQuickPeekEntry';
export const QUICK_PEEK_ITEM_HISTORY_STATE =
  'operationsQuickPeekItemEntry';

export function getQuickPeekDismissState(state = {}) {
  const nextState = { ...(state || {}) };
  delete nextState[PEEK_HISTORY_STATE];
  delete nextState[QUICK_PEEK_ITEM_HISTORY_STATE];
  return nextState;
}
