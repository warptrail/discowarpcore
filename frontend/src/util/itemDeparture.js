const PENDING_DEPARTURE_STATES = new Set([
  'marked_for_destruction',
  'needs_routing',
  'needs_staging',
  'staged_for_donation',
  'staged_for_sale',
  'awaiting_gift',
]);

const ROUTE_BY_EXIT_STATE = {
  marked_for_destruction: 'discard',
  staged_for_donation: 'donate',
  staged_for_sale: 'sell',
  awaiting_gift: 'gift',
};

export function getItemDepartureState(item) {
  return String(item?.declutterExitState || '').trim().toLowerCase();
}

export function getItemDepartureRoute(item) {
  const candidateRoute = String(item?.declutterCandidate?.stagingRoute || '')
    .trim()
    .toLowerCase();
  if (['discard', 'donate', 'sell', 'gift'].includes(candidateRoute)) {
    return candidateRoute;
  }
  return ROUTE_BY_EXIT_STATE[getItemDepartureState(item)] || '';
}

export function isItemPendingDeparture(item) {
  const state = getItemDepartureState(item);
  if (String(item?.item_status || '').trim().toLowerCase() === 'gone') return false;
  if (state === 'completed') return false;
  if (PENDING_DEPARTURE_STATES.has(state)) return true;
  return item?.declutterCandidate?.deckState === 'action'
    || item?.declutterReadiness === 'ready_to_declutter';
}

export function formatDepartureRoute(route) {
  return {
    discard: 'Trash',
    donate: 'Donate',
    sell: 'Sell',
    gift: 'Gift',
  }[route] || 'Route pending';
}
