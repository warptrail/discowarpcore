export const PEEK_HISTORY_STATE = 'operationsQuickPeekEntry';
export const QUICK_PEEK_ITEM_HISTORY_STATE =
  'operationsQuickPeekItemEntry';

export function getQuickPeekDismissHistorySteps(state = {}) {
  if (!state?.[PEEK_HISTORY_STATE]) return 0;
  return state?.[QUICK_PEEK_ITEM_HISTORY_STATE] ? 2 : 1;
}
