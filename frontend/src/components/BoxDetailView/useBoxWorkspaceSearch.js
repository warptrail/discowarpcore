import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  compareItemsByMode,
  matchesItemQuery,
  normalizeItemQuery,
} from '../../util/itemBrowse';
import {
  BOX_FINDER_CLOSE_EVENT,
  BOX_FINDER_OPEN_EVENT,
  BOX_FINDER_STATE_EVENT,
} from '../../constants/inventoryFinderEvents';

export const BOX_SEARCH_SORT_OPTIONS = [
  { value: 'treeOrder', label: 'Tree order' },
  { value: 'recentlyAdded', label: 'Recently added' },
  { value: 'recentlyUpdated', label: 'Recently updated' },
  { value: 'name', label: 'Name' },
  { value: 'category', label: 'Category' },
  { value: 'valueDesc', label: 'Value high–low' },
];

export default function useBoxWorkspaceSearch({ shortId, items, initialState }) {
  const [mode, setMode] = useState(initialState?.mode || 'closed');
  const [query, setQuery] = useState(initialState?.query || '');
  const [sortMode, setSortMode] = useState(initialState?.sortMode || 'treeOrder');
  const [sortDirection, setSortDirection] = useState(initialState?.sortDirection || 'asc');
  const initialShortIdRef = useRef(shortId);
  const restorePendingRef = useRef(Boolean(initialState));
  const normalizedQuery = normalizeItemQuery(query);

  const visibleItems = useMemo(() => {
    const source = Array.isArray(items) ? items : [];
    const filtered = normalizedQuery
      ? source.filter((item) =>
          matchesItemQuery(item, normalizedQuery, {
            boxLabel: item?.parentBoxLabel,
            boxId: item?.parentBoxId,
            pathLabels: item?.parentBoxLabel ? [item.parentBoxLabel] : [],
          }),
        )
      : [...source];

    if (sortMode !== 'treeOrder') {
      const directionalMode = sortMode === 'name'
        ? `name${sortDirection === 'desc' ? 'Desc' : 'Asc'}`
        : sortMode === 'category'
        ? `category${sortDirection === 'desc' ? 'Desc' : 'Asc'}`
        : sortMode === 'valueDesc' && sortDirection === 'asc'
        ? 'valueAsc'
        : sortMode;
      filtered.sort((a, b) => compareItemsByMode(a, b, directionalMode));
    }
    return filtered;
  }, [items, normalizedQuery, sortDirection, sortMode]);

  const expand = useCallback(() => {
    setMode('expanded');
  }, []);
  const minimize = useCallback(() => setMode((current) =>
    current === 'closed' ? current : 'minimized'
  ), []);
  const toggle = useCallback(() => {
    setMode((current) => {
      if (current === 'expanded') return 'minimized';
      return 'expanded';
    });
  }, []);
  const clear = useCallback(() => {
    setQuery('');
    setSortMode('treeOrder');
    setSortDirection('asc');
  }, []);

  useEffect(() => {
    if (restorePendingRef.current && initialShortIdRef.current === shortId) { restorePendingRef.current = false; return; }
    setMode('closed');
    setQuery('');
    setSortMode('treeOrder');
    setSortDirection('asc');
  }, [shortId]);

  useEffect(() => {
    const onOpen = () => toggle();
    const onClose = () => minimize();
    window.addEventListener(BOX_FINDER_OPEN_EVENT, onOpen);
    window.addEventListener(BOX_FINDER_CLOSE_EVENT, onClose);
    return () => {
      window.removeEventListener(BOX_FINDER_OPEN_EVENT, onOpen);
      window.removeEventListener(BOX_FINDER_CLOSE_EVENT, onClose);
    };
  }, [minimize, toggle]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(BOX_FINDER_STATE_EVENT, {
      detail: {
        mode,
        minimized: mode !== 'expanded',
        query,
        sortMode,
        sortDirection,
        matchCount: visibleItems.length,
        shortId: String(shortId || ''),
      },
    }));
  }, [mode, query, shortId, sortDirection, sortMode, visibleItems.length]);

  return {
    mode,
    query,
    setQuery,
    sortMode,
    setSortMode,
    sortDirection,
    setSortDirection,
    visibleItems,
    matchCount: visibleItems.length,
    normalizedQuery,
    expand,
    minimize,
    toggle,
    clear,
  };
}
