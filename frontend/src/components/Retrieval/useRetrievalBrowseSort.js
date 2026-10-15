import { useCallback, useState } from 'react';
import { createRetrievalShuffleSeed, initialBrowseSort, sortAfterFilterChange } from './retrievalBrowseSort';

export default function useRetrievalBrowseSort(filters, defaultSort) {
  const filterKey = JSON.stringify(filters);
  const [state, setState] = useState(() => ({
    filterKey, sort: initialBrowseSort(filters, defaultSort), seed: createRetrievalShuffleSeed(),
  }));
  // Reconcile only when the filter scope changes, before committing a request.
  // Manual sort choices remain available until the next search/filter change.
  const selectedSort = filterKey === state.filterKey ? state.sort
    : sortAfterFilterChange(state.sort, filters, defaultSort);
  if (filterKey !== state.filterKey) setState({ ...state, filterKey, sort: selectedSort });
  const setSelectedSort = useCallback((next) => setState((current) => ({
    ...current, sort: typeof next === 'function' ? next(current.sort) : next,
  })), []);
  const reshuffle = useCallback(() => setState((current) => ({ ...current, sort: 'random', seed: createRetrievalShuffleSeed() })), []);
  return { selectedSort, setSelectedSort, shuffleSeed: state.seed, reshuffle };
}
