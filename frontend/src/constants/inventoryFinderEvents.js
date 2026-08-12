export const INVENTORY_FINDER_STATE_EVENT =
  'disco-warp-core:inventory-finder-state';
export const INVENTORY_FINDER_OPEN_EVENT =
  'disco-warp-core:inventory-finder-open';
export const INVENTORY_FINDER_CLOSE_EVENT =
  'disco-warp-core:inventory-finder-close';
export const INVENTORY_FINDER_COMMIT_EVENT =
  'disco-warp-core:inventory-finder-commit';

export const OPERATIONS_QUICK_PEEK_SEARCH_TOGGLE_EVENT =
  'disco-warp-core:operations-quick-peek-search-toggle';
export const OPERATIONS_QUICK_PEEK_SEARCH_STATE_EVENT =
  'disco-warp-core:operations-quick-peek-search-state';
export const OPERATIONS_QUICK_PEEK_CLOSE_EVENT =
  'disco-warp-core:operations-quick-peek-close';

export const BOX_FINDER_STATE_EVENT =
  'disco-warp-core:box-finder-state';
export const BOX_FINDER_OPEN_EVENT =
  'disco-warp-core:box-finder-open';
export const BOX_FINDER_CLOSE_EVENT =
  'disco-warp-core:box-finder-close';

// Box routes use the header console for persistent location context instead
// of the household-wide retrieval prompt.
export const BOX_CONTEXT_STATE_EVENT =
  'disco-warp-core:box-context-state';
export const BOX_CONTEXT_TOGGLE_EVENT =
  'disco-warp-core:box-context-toggle';
export const BOX_RECORD_UPDATED_EVENT =
  'disco-warp-core:box-record-updated';

// The retrieval rescue is the household-wide, item-first finder. Keep this
// separate from the Operations inventory grid's local finder controls.
export const RETRIEVAL_RESCUE_OPEN_EVENT =
  'disco-warp-core:retrieval-rescue-open';
export const RETRIEVAL_RESCUE_TOGGLE_EVENT =
  'disco-warp-core:retrieval-rescue-toggle';
export const RETRIEVAL_FINDER_STATE_EVENT =
  'disco-warp-core:retrieval-finder-state';
export const RETRIEVAL_FINDER_OPEN_EVENT =
  'disco-warp-core:retrieval-finder-open';
export const RETRIEVAL_FINDER_CLOSE_EVENT =
  'disco-warp-core:retrieval-finder-close';
export const RETRIEVAL_FINDER_TOGGLE_EVENT =
  'disco-warp-core:retrieval-finder-toggle';

export const ALL_ITEMS_FILTERS_STATE_EVENT =
  'disco-warp-core:all-items-filters-state';
export const ALL_ITEMS_FILTERS_TOGGLE_EVENT =
  'disco-warp-core:all-items-filters-toggle';
export const ALL_ITEMS_INSIGHTS_STATE_EVENT =
  'disco-warp-core:all-items-insights-state';
export const ALL_ITEMS_INSIGHTS_OPEN_EVENT =
  'disco-warp-core:all-items-insights-open';
export const ALL_ITEMS_DETAIL_OPEN_EVENT =
  'disco-warp-core:all-items-detail-open';
