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
  { value: 'nameAsc', label: 'Name A–Z' },
  { value: 'nameDesc', label: 'Name Z–A' },
  { value: 'categoryAsc', label: 'Category A–Z' },
  { value: 'valueDesc', label: 'Value high–low' },
];

export default function useBoxWorkspaceSearch({ shortId, items }) {
  const [mode, setMode] = useState('closed');
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState('treeOrder');
  const openScrollYRef = useRef(0);
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
      filtered.sort((a, b) => compareItemsByMode(a, b, sortMode));
    }
    return filtered;
  }, [items, normalizedQuery, sortMode]);

  const expand = useCallback(() => {
    openScrollYRef.current = window.scrollY;
    setMode('expanded');
  }, []);
  const minimize = useCallback(() => setMode((current) =>
    current === 'closed' ? current : 'minimized'
  ), []);
  const toggle = useCallback(() => {
    setMode((current) => {
      if (current === 'expanded') return 'minimized';
      openScrollYRef.current = window.scrollY;
      return 'expanded';
    });
  }, []);
  const clear = useCallback(() => {
    setQuery('');
    setSortMode('treeOrder');
    setMode('closed');
  }, []);

  useEffect(() => {
    setMode('closed');
    setQuery('');
    setSortMode('treeOrder');
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
        matchCount: visibleItems.length,
        shortId: String(shortId || ''),
      },
    }));
  }, [mode, query, shortId, sortMode, visibleItems.length]);

  useEffect(() => {
    if (mode !== 'expanded') return undefined;
    const onScroll = () => {
      if (Math.abs(window.scrollY - openScrollYRef.current) > 24) minimize();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [minimize, mode]);

  return {
    mode,
    query,
    setQuery,
    sortMode,
    setSortMode,
    visibleItems,
    matchCount: visibleItems.length,
    normalizedQuery,
    expand,
    minimize,
    toggle,
    clear,
  };
}
