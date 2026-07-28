export const INVENTORY_FINDER_STATE_EVENT =
  'disco-warp-core:inventory-finder-state';
export const INVENTORY_FINDER_OPEN_EVENT =
  'disco-warp-core:inventory-finder-open';
export const INVENTORY_FINDER_CLOSE_EVENT =
  'disco-warp-core:inventory-finder-close';
export const INVENTORY_FINDER_COMMIT_EVENT =
  'disco-warp-core:inventory-finder-commit';

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

// The retrieval rescue is the household-wide, item-first finder. Keep this
// separate from the Operations inventory grid's local finder controls.
export const RETRIEVAL_RESCUE_OPEN_EVENT =
  'disco-warp-core:retrieval-rescue-open';
export const RETRIEVAL_FINDER_STATE_EVENT =
  'disco-warp-core:retrieval-finder-state';
export const RETRIEVAL_FINDER_OPEN_EVENT =
  'disco-warp-core:retrieval-finder-open';
export const RETRIEVAL_FINDER_CLOSE_EVENT =
  'disco-warp-core:retrieval-finder-close';
