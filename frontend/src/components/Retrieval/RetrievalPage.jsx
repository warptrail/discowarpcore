import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  DEFAULT_RETRIEVAL_LIMIT,
  fetchRetrievalItemsPage,
} from '../../api/retrieval';
import { API_BASE } from '../../api/API_BASE';
import { markItemGone, restoreItemToActive } from '../../api/itemLifecycle';
import * as S from './Retrieval.styles';
import RetrievalResultsList from './RetrievalResultsList';
import RetrievalImageLightbox from './RetrievalImageLightbox';
import RetrievalBoxCentricView from './RetrievalBoxCentricView';
import RetrievalSearchForm from './RetrievalSearchForm';
import useRetrievalItemDetails from './useRetrievalItemDetails';
import { ToastContext } from '../Toast';
import {
  RETRIEVAL_FINDER_CLOSE_EVENT,
  RETRIEVAL_FINDER_OPEN_EVENT,
  RETRIEVAL_FINDER_STATE_EVENT,
} from '../../constants/inventoryFinderEvents';
import {
  buildActiveFilterChips,
  normalizeRetrievalFacetKey,
  normalizeRetrievalFilterOptions,
  normalizeRetrievalItemsPage,
  normalizeRetrievalSortOptions,
} from './retrievalModel';

const EMPTY_FILTERS = {
  categories: [],
  tags: [],
  locations: [],
  owners: [],
  keepPriorities: [],
};

const EMPTY_FILTER_OPTIONS = {
  categories: [],
  tags: [],
  locations: [],
  owners: [],
  keepPriorities: [],
  categoryLabelByKey: new Map(),
  tagLabelByKey: new Map(),
  locationLabelByKey: new Map(),
  ownerLabelByKey: new Map(),
  keepPriorityLabelByKey: new Map(),
};

const RETRIEVAL_STATE_STORAGE_PREFIX = 'retrieval:state:';
const RETRIEVAL_HISTORY_STATE_KEY = '__discoWarpRetrievalState';
const retrievalStateByNavigationEntry = new Map();
const SCROLL_RESTORE_MAX_FRAMES = 240;
const DEFAULT_ITEM_SORT = 'location';
const DEFAULT_SORT_OPTIONS = [
  { key: 'location', label: 'Location (A → Z)' },
  { key: 'location_desc', label: 'Location (Z → A)' },
  { key: 'name', label: 'Item Name (A → Z)' },
  { key: 'name_desc', label: 'Item Name (Z → A)' },
  { key: 'box', label: 'Box ID (Low → High)' },
  { key: 'box_desc', label: 'Box ID (High → Low)' },
  { key: 'category', label: 'Category (A → Z)' },
  { key: 'category_desc', label: 'Category (Z → A)' },
  { key: 'tag', label: 'Tag (A → Z)' },
  { key: 'tag_desc', label: 'Tag (Z → A)' },
  { key: 'owner', label: 'Primary Owner (A → Z)' },
  { key: 'owner_desc', label: 'Primary Owner (Z → A)' },
  { key: 'keepPriority', label: 'Keep Priority (Low → Essential)' },
  { key: 'keepPriority_desc', label: 'Keep Priority (Essential → Low)' },
];

function toKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function buildItemSearchText(item) {
  const tags = Array.isArray(item?.tags) ? item.tags.join(' ') : '';
  return toKey(
    [
      item?.name,
      item?.description,
      item?.notes,
      item?.categoryLabel,
      tags,
      item?.boxName,
      item?.boxNumber,
      item?.boxGroupLabel,
      item?.groupLabel,
      item?.locationLabel,
      item?.locationPath,
      item?.primaryOwnerName,
      item?.keepPriorityLabel,
      item?.isConsumable ? 'consumable' : '',
    ]
      .filter(Boolean)
      .join(' '),
  );
}

function itemMatchesQuery(item, queryState) {
  const source = item && typeof item === 'object' ? item : null;
  if (!source) return false;

  const normalizedQuery = toKey(queryState?.q || '');
  if (normalizedQuery) {
    const searchText = buildItemSearchText(source);
    if (!searchText.includes(normalizedQuery)) {
      return false;
    }
  }

  const categories = Array.isArray(queryState?.categories) ? queryState.categories : [];
  if (categories.length && !categories.includes(toKey(source?.categoryKey))) {
    return false;
  }

  const locations = Array.isArray(queryState?.locations) ? queryState.locations : [];
  if (locations.length && !locations.includes(toKey(source?.locationLabel))) {
    return false;
  }

  const owners = Array.isArray(queryState?.owners) ? queryState.owners : [];
  if (owners.length && !owners.includes(toKey(source?.primaryOwnerName))) {
    return false;
  }

  const keepPriorities = Array.isArray(queryState?.keepPriorities)
    ? queryState.keepPriorities
    : [];
  if (keepPriorities.length && !keepPriorities.includes(toKey(source?.keepPriority))) {
    return false;
  }

  const tags = Array.isArray(queryState?.tags) ? queryState.tags : [];
  if (tags.length) {
    const itemTagKeys = Array.isArray(source?.tags)
      ? source.tags.map((tag) => toKey(tag))
      : [];
    const hasMatch = queryState?.tagOperator === 'and'
      ? tags.every((tagKey) => itemTagKeys.includes(tagKey))
      : tags.some((tagKey) => itemTagKeys.includes(tagKey));
    if (!hasMatch) return false;
  }

  return true;
}

function formatLifecycleTimestamp(isoValue) {
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return String(isoValue || '');

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function sameValues(a, b) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function pruneFilters(current, options) {
  const categoryKeys = new Set(options.categories.map((option) => option.key));
  const tagKeys = new Set(options.tags.map((option) => option.key));
  const locationKeys = new Set(options.locations.map((option) => option.key));
  const ownerKeys = new Set(options.owners.map((option) => option.key));
  const keepPriorityKeys = new Set(options.keepPriorities.map((option) => option.key));

  const nextCategories = current.categories.filter((value) => categoryKeys.has(value));
  const nextTags = current.tags.filter((value) => tagKeys.has(value));
  const nextLocations = current.locations.filter((value) => locationKeys.has(value));
  const nextOwners = current.owners.filter((value) => ownerKeys.has(value));
  const nextKeepPriorities = current.keepPriorities.filter((value) =>
    keepPriorityKeys.has(value),
  );

  if (
    sameValues(nextCategories, current.categories) &&
    sameValues(nextTags, current.tags) &&
    sameValues(nextLocations, current.locations) &&
    sameValues(nextOwners, current.owners) &&
    sameValues(nextKeepPriorities, current.keepPriorities)
  ) {
    return current;
  }

  return {
    categories: nextCategories,
    tags: nextTags,
    locations: nextLocations,
    owners: nextOwners,
    keepPriorities: nextKeepPriorities,
  };
}

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, delayMs]);

  return debounced;
}

function sanitizeFilterValues(values) {
  return Array.isArray(values)
    ? values
        .map((value) => toKey(value))
        .filter(Boolean)
    : [];
}

function sanitizeFilters(rawFilters) {
  const source = rawFilters && typeof rawFilters === 'object' ? rawFilters : EMPTY_FILTERS;

  return {
    categories: sanitizeFilterValues(source.categories),
    tags: sanitizeFilterValues(source.tags),
    locations: sanitizeFilterValues(source.locations),
    owners: sanitizeFilterValues(source.owners),
    keepPriorities: sanitizeFilterValues(source.keepPriorities),
  };
}

function sanitizeExpandedIds(rawIds) {
  const values = Array.isArray(rawIds) ? rawIds : [];
  return values
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}

function sanitizeBoxModeState(rawState) {
  const source = rawState && typeof rawState === 'object' ? rawState : {};
  const legacySelectedTag = String(source.selectedTag || '').trim();
  const loadedCount = Number(source.loadedCount);
  return {
    searchValue: String(source.searchValue || ''),
    boxIdPrefix: String(source.boxIdPrefix || '').replace(/\D/g, '').slice(0, 3),
    selectedGroup: String(source.selectedGroup || ''),
    selectedLocation: String(source.selectedLocation || ''),
    selectedTags: sanitizeFilterValues(
      source.selectedTags || (legacySelectedTag ? [legacySelectedTag] : []),
    ),
    tagOperator: sanitizeTagOperator(source.tagOperator),
    selectedSort: String(source.selectedSort || 'location'),
    selectedBoxId: String(source.selectedBoxId || ''),
    loadedCount: Number.isFinite(loadedCount)
      ? Math.max(DEFAULT_RETRIEVAL_LIMIT, Math.floor(loadedCount))
      : DEFAULT_RETRIEVAL_LIMIT,
  };
}

function sanitizeMode(rawMode) {
  return rawMode === 'boxes' ? 'boxes' : 'items';
}

function sanitizePresentation(rawPresentation) {
  return rawPresentation === 'ascii' ? 'ascii' : 'cards';
}

function sanitizeTagOperator(rawOperator) {
  return rawOperator === 'and' ? 'and' : 'or';
}

function sanitizeSort(rawSort, options = DEFAULT_SORT_OPTIONS) {
  const value = String(rawSort || '').trim();
  if (!value) return DEFAULT_ITEM_SORT;
  const keys = new Set(
    (Array.isArray(options) ? options : [])
      .map((option) => String(option?.key || '').trim())
      .filter(Boolean),
  );
  return keys.has(value) ? value : DEFAULT_ITEM_SORT;
}

function sameSortOptions(a, b) {
  const left = Array.isArray(a) ? a : [];
  const right = Array.isArray(b) ? b : [];
  if (left.length !== right.length) return false;
  return left.every((option, index) => {
    const other = right[index];
    return option?.key === other?.key && option?.label === other?.label;
  });
}

function getRetrievalNavigationEntryKey({ key, pathname }) {
  return `${String(key || 'default')}:${String(pathname || '/retrieval')}`;
}

function readPersistedRetrievalState({ key, pathname }) {
  if (typeof window === 'undefined') return null;

  const memorySnapshot = retrievalStateByNavigationEntry.get(
    getRetrievalNavigationEntryKey({ key, pathname }),
  );
  if (memorySnapshot && typeof memorySnapshot === 'object') {
    return memorySnapshot;
  }

  const historySnapshot = window.history.state?.[RETRIEVAL_HISTORY_STATE_KEY];
  if (historySnapshot && typeof historySnapshot === 'object') {
    return historySnapshot;
  }

  if (!key || key === 'default') return null;

  try {
    const raw = window.sessionStorage.getItem(`${RETRIEVAL_STATE_STORAGE_PREFIX}${key}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCurrentHistoryRetrievalState(snapshot) {
  if (typeof window === 'undefined' || !snapshot) return;

  try {
    const currentState =
      window.history.state && typeof window.history.state === 'object'
        ? window.history.state
        : {};
    window.history.replaceState(
      {
        ...currentState,
        [RETRIEVAL_HISTORY_STATE_KEY]: snapshot,
      },
      '',
    );
  } catch {
    // best-effort persistence only
  }
}

function writePersistedRetrievalState({ key, pathname, snapshot }) {
  if (typeof window === 'undefined') return;
  if (!key || !snapshot) return;

  retrievalStateByNavigationEntry.set(
    getRetrievalNavigationEntryKey({ key, pathname }),
    snapshot,
  );

  try {
    window.sessionStorage.setItem(
      `${RETRIEVAL_STATE_STORAGE_PREFIX}${key}`,
      JSON.stringify(snapshot),
    );
  } catch {
    // best-effort persistence only
  }
}

export default function RetrievalPage() {
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const hideToast = toastCtx?.hideToast;
  const setActiveRetrievalItem = toastCtx?.setActiveRetrievalItem;
  const navigate = useNavigate();
  const location = useLocation();
  const retrievalReturnTo = `${location.pathname}${location.search}${location.hash}`;
  const getRetrievalItemNavigationState = useCallback(
    (itemId) => ({
      retrievalReturn: {
        kind: 'retrieval-item',
        returnTo: retrievalReturnTo,
        itemId: String(itemId || '').trim(),
      },
    }),
    [retrievalReturnTo],
  );
  const { tag: routeTagParam } = useParams();
  const routeTagKey = normalizeRetrievalFacetKey(routeTagParam);
  const hasTagScope = Boolean(routeTagKey);
  const initialSnapshotRef = useRef();
  if (initialSnapshotRef.current === undefined) {
    initialSnapshotRef.current = readPersistedRetrievalState({
      key: location.key,
      pathname: location.pathname,
    });
  }
  const initialSnapshot = initialSnapshotRef.current || null;
  const initialItemState =
    initialSnapshot?.items && typeof initialSnapshot.items === 'object'
      ? initialSnapshot.items
      : null;

  const [retrievalMode, setRetrievalMode] = useState(() =>
    hasTagScope ? 'items' : sanitizeMode(initialSnapshot?.mode),
  );
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(DEFAULT_RETRIEVAL_LIMIT);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [searchValue, setSearchValue] = useState(() =>
    String(initialItemState?.searchValue || ''),
  );
  const [activeFilters, setActiveFilters] = useState(() => {
    const restoredFilters = sanitizeFilters(initialItemState?.activeFilters);
    return hasTagScope ? { ...restoredFilters, tags: [] } : restoredFilters;
  });
  const [filterOptions, setFilterOptions] = useState(EMPTY_FILTER_OPTIONS);
  const [sortOptions, setSortOptions] = useState(DEFAULT_SORT_OPTIONS);
  const [selectedSort, setSelectedSort] = useState(() =>
    sanitizeSort(initialItemState?.selectedSort, DEFAULT_SORT_OPTIONS),
  );
  const [resultsPresentation, setResultsPresentation] = useState(() =>
    sanitizePresentation(initialItemState?.presentation),
  );
  const [tagOperator, setTagOperator] = useState(() =>
    sanitizeTagOperator(initialItemState?.tagOperator),
  );
  const [finderMinimized, setFinderMinimized] = useState(true);
  const [finderDetached, setFinderDetached] = useState(false);
  const [activeExpandedId, setActiveExpandedId] = useState(
    () => sanitizeExpandedIds(initialItemState?.expandedIds)[0] || '',
  );
  const [activeSectionKey, setActiveSectionKey] = useState('overview');
  const [boxModeState, setBoxModeState] = useState(() =>
    sanitizeBoxModeState(initialSnapshot?.boxes),
  );
  const [boxRestoreReady, setBoxRestoreReady] = useState(false);
  const [boxAnalytics, setBoxAnalytics] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const isItemsMode = hasTagScope || retrievalMode === 'items';
  const {
    detailResource,
    merge: mergeItemDetails,
    remove: removeItemDetails,
  } = useRetrievalItemDetails(activeExpandedId);

  const debouncedSearchValue = useDebouncedValue(searchValue, 220);
  const loadMoreControllerRef = useRef(null);
  const queryKeyRef = useRef('');
  const queryStateRef = useRef(null);
  const hasLoadedItemsRef = useRef(false);
  const pendingScrollRestoreRef = useRef(
    Number.isFinite(Number(initialSnapshot?.scrollY))
      ? Number(initialSnapshot.scrollY)
      : null,
  );
  const latestSnapshotRef = useRef(null);
  const boxItemNavigationPendingRef = useRef(false);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(RETRIEVAL_FINDER_STATE_EVENT, {
        detail: {
          minimized: finderMinimized,
          detached: finderDetached,
          retrievalMode,
          boxAnalytics: retrievalMode === 'boxes' ? boxAnalytics : null,
        },
      }),
    );
  }, [boxAnalytics, finderDetached, finderMinimized, retrievalMode]);

  useEffect(() => {
    const handleOpenFinder = () => {
      if (finderDetached) setFinderMinimized(false);
    };
    const handleCloseFinder = () => setFinderMinimized(true);

    window.addEventListener(RETRIEVAL_FINDER_OPEN_EVENT, handleOpenFinder);
    window.addEventListener(RETRIEVAL_FINDER_CLOSE_EVENT, handleCloseFinder);
    return () => {
      window.removeEventListener(RETRIEVAL_FINDER_OPEN_EVENT, handleOpenFinder);
      window.removeEventListener(RETRIEVAL_FINDER_CLOSE_EVENT, handleCloseFinder);
    };
  }, [finderDetached]);

  const handleFinderDetachedChange = useCallback((detached) => {
    setFinderDetached(detached);
    if (!detached) setFinderMinimized(true);
  }, []);

  const queryState = useMemo(
    () => ({
      q: debouncedSearchValue,
      categories: activeFilters.categories,
      tags: hasTagScope ? [routeTagKey] : activeFilters.tags,
      tagOperator,
      locations: activeFilters.locations,
      owners: activeFilters.owners,
      keepPriorities: activeFilters.keepPriorities,
      sort: selectedSort,
    }),
    [debouncedSearchValue, activeFilters, hasTagScope, routeTagKey, selectedSort, tagOperator],
  );

  const tagScope = useMemo(() => {
    if (!hasTagScope) return null;
    const canonicalLabel = filterOptions.tagLabelByKey.get(routeTagKey);
    return {
      kind: 'tag',
      key: routeTagKey,
      label: canonicalLabel || String(routeTagParam || routeTagKey).trim() || routeTagKey,
    };
  }, [filterOptions.tagLabelByKey, hasTagScope, routeTagKey, routeTagParam]);

  const queryKey = useMemo(() => JSON.stringify(queryState), [queryState]);

  useEffect(() => {
    queryKeyRef.current = queryKey;
  }, [queryKey]);

  useEffect(() => {
    queryStateRef.current = queryState;
  }, [queryState]);

  useEffect(() => {
    const snapshot = {
      mode: sanitizeMode(retrievalMode),
      items: {
        searchValue: String(searchValue || ''),
        activeFilters: sanitizeFilters(activeFilters),
        expandedIds: activeExpandedId ? [activeExpandedId] : [],
        selectedSort: sanitizeSort(selectedSort),
        presentation: sanitizePresentation(resultsPresentation),
        tagOperator: sanitizeTagOperator(tagOperator),
      },
      boxes: sanitizeBoxModeState(boxModeState),
      scrollY: typeof window === 'undefined' ? 0 : window.scrollY,
      savedAt: Date.now(),
    };
    latestSnapshotRef.current = snapshot;
    writePersistedRetrievalState({
      key: location.key,
      pathname: location.pathname,
      snapshot,
    });
    writeCurrentHistoryRetrievalState(snapshot);
  }, [
    activeExpandedId,
    activeFilters,
    boxModeState,
    location.key,
    location.pathname,
    retrievalMode,
    resultsPresentation,
    searchValue,
    selectedSort,
    tagOperator,
  ]);

  useEffect(() => {
    const persist = ({ includeHistory = false, scrollY } = {}) => {
      const baseSnapshot =
        latestSnapshotRef.current && typeof latestSnapshotRef.current === 'object'
          ? latestSnapshotRef.current
          : {};
      const resolvedScrollY = Number.isFinite(Number(scrollY))
        ? Number(scrollY)
        : typeof window === 'undefined'
          ? 0
          : window.scrollY;
      const snapshot = {
        ...baseSnapshot,
        scrollY: resolvedScrollY,
        savedAt: Date.now(),
      };
      latestSnapshotRef.current = snapshot;

      writePersistedRetrievalState({
        key: location.key,
        pathname: location.pathname,
        snapshot,
      });
      if (includeHistory) writeCurrentHistoryRetrievalState(snapshot);
    };

    const onPageHide = () => {
      if (boxItemNavigationPendingRef.current) {
        persist({
          includeHistory: true,
          scrollY: latestSnapshotRef.current?.scrollY,
        });
        return;
      }
      persist({ includeHistory: true });
    };

    let scrollFrame = 0;
    const onScroll = () => {
      if (boxItemNavigationPendingRef.current) return;
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        persist({ includeHistory: true });
      });
    };

    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('scroll', onScroll);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      persist({ scrollY: latestSnapshotRef.current?.scrollY });
    };
  }, [location.key, location.pathname]);

  useEffect(() => {
    const targetScrollY = pendingScrollRestoreRef.current;
    if (!Number.isFinite(targetScrollY)) return;

    if (isItemsMode && loading) return;
    if (!isItemsMode && !boxRestoreReady) return;
    if (isItemsMode && activeExpandedId) {
      const hasRestoredActiveItem = items.some((item) => item.id === activeExpandedId);
      if (!hasRestoredActiveItem) return;
    }

    let frame = 0;
    let cancelled = false;

    const restore = () => {
      if (cancelled) return;

      window.scrollTo(0, targetScrollY);
      const maxScrollY = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const reachableTarget = Math.min(targetScrollY, maxScrollY);
      const reached = Math.abs(window.scrollY - reachableTarget) <= 2;

      if (reached || frame >= SCROLL_RESTORE_MAX_FRAMES) {
        pendingScrollRestoreRef.current = null;
        return;
      }

      frame += 1;
      window.requestAnimationFrame(restore);
    };

    const startFrame = window.requestAnimationFrame(restore);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(startFrame);
    };
  }, [activeExpandedId, boxRestoreReady, isItemsMode, items, loading, retrievalMode]);

  useEffect(
    () => () => {
      if (loadMoreControllerRef.current) {
        loadMoreControllerRef.current.abort();
      }
    },
    [],
  );

  useEffect(() => {
    setActiveFilters((current) => pruneFilters(current, filterOptions));
  }, [filterOptions]);

  useEffect(() => {
    if (!isItemsMode || loading) return;
    const validIds = new Set(items.map((item) => item.id));

    setActiveExpandedId((current) => (current && validIds.has(current) ? current : ''));
  }, [isItemsMode, items, loading]);

  useEffect(() => {
    if (!isItemsMode) return;
    const controller = new AbortController();
    const currentQueryKey = queryKey;

    if (loadMoreControllerRef.current) {
      loadMoreControllerRef.current.abort();
      loadMoreControllerRef.current = null;
    }

    const loadFirstPage = async () => {
      setLoading(true);
      setLoadingMore(false);
      setError('');
      setItems([]);
      setTotal(0);
      setOffset(0);
      setHasMore(false);
      if (hasLoadedItemsRef.current) {
        setActiveExpandedId('');
      }
      setLightboxImage(null);

      try {
        const payload = await fetchRetrievalItemsPage(
          {
            ...queryState,
            limit: DEFAULT_RETRIEVAL_LIMIT,
            offset: 0,
          },
          { signal: controller.signal },
        );

        if (controller.signal.aborted || queryKeyRef.current !== currentQueryKey) return;

        setItems(normalizeRetrievalItemsPage(payload?.items));
        setTotal(Number(payload?.total) || 0);
        setLimit(Number(payload?.limit) || DEFAULT_RETRIEVAL_LIMIT);
        setOffset(Number(payload?.offset) || 0);
        setHasMore(Boolean(payload?.hasMore));
        setFilterOptions(normalizeRetrievalFilterOptions(payload?.filters));
        const nextSortOptions = normalizeRetrievalSortOptions(payload?.sortOptions);
        if (nextSortOptions.length) {
          setSortOptions((current) =>
            sameSortOptions(current, nextSortOptions) ? current : nextSortOptions,
          );
        }
        setSelectedSort((current) => sanitizeSort(payload?.sort || current, nextSortOptions));
      } catch (loadError) {
        if (loadError?.name === 'AbortError') return;
        if (queryKeyRef.current !== currentQueryKey) return;
        setError(loadError?.message || 'Failed to load retrieval results');
        setItems([]);
        setTotal(0);
        setHasMore(false);
      } finally {
        if (!controller.signal.aborted && queryKeyRef.current === currentQueryKey) {
          hasLoadedItemsRef.current = true;
          setLoading(false);
        }
      }
    };

    loadFirstPage();

    return () => {
      controller.abort();
    };
  }, [isItemsMode, queryKey, queryState]);

  const activeChips = useMemo(
    () => buildActiveFilterChips(activeFilters, filterOptions),
    [activeFilters, filterOptions],
  );

  const addFilter = useCallback((type, rawKey) => {
    const key = toKey(rawKey);
    if (!key || !type) return;

    setActiveFilters((current) => {
      const currentValues = Array.isArray(current[type]) ? current[type] : [];
      if (currentValues.includes(key)) return current;

      return {
        ...current,
        [type]: [...currentValues, key],
      };
    });
  }, []);

  const removeFilter = useCallback((type, rawKey) => {
    const key = toKey(rawKey);
    if (!type || !key) return;

    setActiveFilters((current) => {
      const currentValues = Array.isArray(current[type]) ? current[type] : [];
      const nextValues = currentValues.filter((value) => value !== key);
      if (nextValues.length === currentValues.length) return current;

      return {
        ...current,
        [type]: nextValues,
      };
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters(EMPTY_FILTERS);
  }, []);

  const handleCategoryFilterChange = useCallback(
    (value) => {
      addFilter('categories', value);
    },
    [addFilter],
  );

  const handleTagFilterChange = useCallback(
    (value) => {
      addFilter('tags', value);
    },
    [addFilter],
  );

  const handleLocationFilterChange = useCallback(
    (value) => {
      addFilter('locations', value);
    },
    [addFilter],
  );

  const handleOwnerFilterChange = useCallback(
    (value) => {
      addFilter('owners', value);
    },
    [addFilter],
  );

  const handleKeepPriorityFilterChange = useCallback(
    (value) => {
      addFilter('keepPriorities', value);
    },
    [addFilter],
  );


  const toggleExpanded = useCallback((itemId) => {
    const resolvedId = String(itemId || '').trim();
    if (!resolvedId) return;
    if (activeExpandedId !== resolvedId) setActiveSectionKey('overview');
    setActiveExpandedId((current) => (current === resolvedId ? '' : resolvedId));
  }, [activeExpandedId]);

  const handleConsoleSearchChange = useCallback((nextValue) => {
    setSearchValue(String(nextValue || ''));
  }, []);

  useEffect(() => {
    if (typeof setActiveRetrievalItem !== 'function') return;
    if (!isItemsMode) {
      return;
    }

    const activeId = String(activeExpandedId || '').trim();
    const activeItem = activeId ? items.find((entry) => entry.id === activeId) : null;

    if (!activeItem) {
      setActiveRetrievalItem(null);
      return;
    }

    setActiveRetrievalItem({
      mode: 'active',
      id: activeItem.id,
      name: String(activeItem?.name || '').trim(),
      itemHref: String(activeItem?.itemHref || `/items/${activeItem.id}`).trim(),
      boxNumber: String(activeItem?.boxNumber || '').trim(),
      boxName: String(activeItem?.boxName || '').trim(),
      boxHref: String(activeItem?.boxHref || '').trim(),
      locationLabel: String(activeItem?.locationLabel || '').trim(),
      previewImageUrl: String(activeItem?.previewImageUrl || activeItem?.imageUrl || '').trim(),
      sectionKey: activeSectionKey,
      itemState: getRetrievalItemNavigationState(activeItem.id),
      onCollapse: () => {
        setActiveSectionKey('overview');
        setActiveExpandedId((current) => (current === activeItem.id ? '' : current));
      },
    });
  }, [
    activeExpandedId,
    activeSectionKey,
    isItemsMode,
    items,
    getRetrievalItemNavigationState,
    setActiveRetrievalItem,
  ]);

  useEffect(
    () => () => {
      if (typeof setActiveRetrievalItem === 'function') {
        setActiveRetrievalItem(null);
      }
    },
    [setActiveRetrievalItem],
  );

  const parseApiError = useCallback(async (response, fallbackMessage) => {
    const raw = await response.text().catch(() => '');
    if (!raw) return fallbackMessage;

    try {
      const parsed = JSON.parse(raw);
      return parsed?.message || parsed?.error || fallbackMessage;
    } catch {
      return raw;
    }
  }, []);

  const handleLifecycleAction = useCallback(
    async (rawItem, action) => {
      const itemId = String(rawItem?.id || '').trim();
      if (!itemId || !action) return;

      const currentItem =
        items.find((entry) => entry.id === itemId) || rawItem;
      const itemName = String(currentItem?.name || 'item').trim();
      const itemHref = String(currentItem?.itemHref || `/items/${itemId}`).trim();

      if (action === 'consumed') {
        hideToast?.();

        showToast?.({
          variant: 'warning',
          sticky: true,
          title: `Mark "${itemName}" as consumed?`,
          message:
            'This will mark the item gone (consumed) and remove it from active Retrieval results.',
          actions: [
            {
              id: `retrieval-consume-confirm-${itemId}`,
              label: 'Confirm Consumed',
              kind: 'danger',
              onClick: async () => {
                try {
                  const updated = await markItemGone(itemId, {
                    disposition: 'consumed',
                  });

                  const mergedUpdated = normalizeRetrievalItemsPage([
                    {
                      ...currentItem,
                      ...(updated && typeof updated === 'object' ? updated : {}),
                    },
                  ])[0] || currentItem;

                  setItems((current) =>
                    current.filter((entry) => entry.id !== itemId),
                  );
                  removeItemDetails(itemId);
                  setActiveExpandedId((current) => (current === itemId ? '' : current));
                  setTotal((current) => Math.max(0, current - 1));

                  showToast?.({
                    variant: 'warning',
                    sticky: true,
                    title: `Marked "${itemName}" as consumed`,
                    message: 'Removed from active retrieval inventory.',
                    actions: [
                      {
                        id: `retrieval-consume-undo-${itemId}`,
                        label: 'Undo',
                        kind: 'primary',
                        onClick: async () => {
                          try {
                            const restored = await restoreItemToActive(itemId);
                            const restoredItem = normalizeRetrievalItemsPage([
                              {
                                ...mergedUpdated,
                                ...(restored && typeof restored === 'object' ? restored : {}),
                              },
                            ])[0] || mergedUpdated;
                            mergeItemDetails(itemId, {
                              ...(restored && typeof restored === 'object' ? restored : {}),
                              item_status: 'active',
                            });

                            const shouldShow = itemMatchesQuery(
                              restoredItem,
                              queryStateRef.current,
                            );
                            if (shouldShow) {
                              setItems((current) => {
                                if (current.some((entry) => entry.id === itemId)) {
                                  return current;
                                }
                                return [restoredItem, ...current];
                              });
                              setTotal((current) => current + 1);
                            }

                            showToast?.({
                              variant: 'success',
                              title: `Restored "${itemName}"`,
                              message: shouldShow
                                ? 'Item returned to active Retrieval results.'
                                : 'Item restored to active inventory.',
                              timeoutMs: 2200,
                            });
                          } catch (undoError) {
                            showToast?.({
                              variant: 'danger',
                              title: 'Undo failed',
                              message:
                                undoError?.message ||
                                'Could not restore the consumed item.',
                              timeoutMs: 3600,
                            });
                          }
                        },
                      },
                      {
                        id: `retrieval-consume-open-${itemId}`,
                        label: 'Open Item',
                        onClick: () => {
                          hideToast?.();
                          navigate(itemHref, {
                            state: getRetrievalItemNavigationState(itemId),
                          });
                        },
                      },
                    ],
                    onClose: () => hideToast?.(),
                  });
                } catch (consumeError) {
                  showToast?.({
                    variant: 'danger',
                    title: 'Consume action failed',
                    message:
                      consumeError?.message || 'Could not mark this item as consumed.',
                    timeoutMs: 3600,
                  });
                }
              },
            },
            {
              id: `retrieval-consume-cancel-${itemId}`,
              label: 'Cancel',
              onClick: () => hideToast?.(),
            },
          ],
          onClose: () => hideToast?.(),
        });

        return;
      }

      const fieldByAction = {
        used: 'usageHistory',
        checked: 'checkHistory',
        maintained: 'maintenanceHistory',
      };
      const successTitleByAction = {
        used: 'Used now',
        checked: 'Checked now',
        maintained: 'Maintained now',
      };
      const actionLabelByAction = {
        used: 'used',
        checked: 'checked',
        maintained: 'maintained',
      };

      const targetField = fieldByAction[action];
      if (!targetField) return;

      const currentHistory = Array.isArray(currentItem?.[targetField])
        ? currentItem[targetField]
        : [];
      const nowIso = new Date().toISOString();
      const payload = {
        [targetField]: [...currentHistory, nowIso],
      };

      try {
        const response = await fetch(
          `${API_BASE}/api/items/${encodeURIComponent(itemId)}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          const message = await parseApiError(
            response,
            'Failed to update item lifecycle.',
          );
          throw new Error(message);
        }

        const json = await response.json().catch(() => ({}));
        const updated = json?.data ?? json;
        mergeItemDetails(itemId, {
          ...(updated && typeof updated === 'object' ? updated : {}),
          [targetField]: [...currentHistory, nowIso],
        });
        const normalizedUpdated = normalizeRetrievalItemsPage([
          {
            ...currentItem,
            ...(updated && typeof updated === 'object' ? updated : {}),
          },
        ])[0];

        setItems((current) =>
          current.map((entry) => {
            if (entry.id !== itemId) return entry;
            if (normalizedUpdated) return normalizedUpdated;
            return {
              ...entry,
              [targetField]: [...currentHistory, nowIso],
            };
          }),
        );

        const savedAtLabel = formatLifecycleTimestamp(nowIso);
        const actionLabel = actionLabelByAction[action] || 'updated';
        showToast?.({
          variant: 'success',
          sticky: true,
          title: `${successTitleByAction[action] || 'Saved'} · ${itemName}`,
          message: `Saved at ${savedAtLabel}.`,
          actions: [
            {
              id: `retrieval-${action}-undo-${itemId}`,
              label: 'Undo',
              kind: 'primary',
              onClick: async () => {
                try {
                  const undoResponse = await fetch(
                    `${API_BASE}/api/items/${encodeURIComponent(itemId)}`,
                    {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ [targetField]: currentHistory }),
                    },
                  );

                  if (!undoResponse.ok) {
                    const undoMessage = await parseApiError(
                      undoResponse,
                      'Failed to undo lifecycle update.',
                    );
                    throw new Error(undoMessage);
                  }

                  const undoJson = await undoResponse.json().catch(() => ({}));
                  const undoUpdated = undoJson?.data ?? undoJson;
                  mergeItemDetails(itemId, {
                    ...(undoUpdated && typeof undoUpdated === 'object'
                      ? undoUpdated
                      : {}),
                    [targetField]: currentHistory,
                  });
                  const normalizedUndo = normalizeRetrievalItemsPage([
                    {
                      ...currentItem,
                      ...(undoUpdated && typeof undoUpdated === 'object'
                        ? undoUpdated
                        : {}),
                    },
                  ])[0];

                  setItems((current) =>
                    current.map((entry) => {
                      if (entry.id !== itemId) return entry;
                      if (normalizedUndo) return normalizedUndo;
                      return {
                        ...entry,
                        [targetField]: currentHistory,
                      };
                    }),
                  );

                  showToast?.({
                    variant: 'success',
                    title: `Undid ${actionLabel} · ${itemName}`,
                    message: 'Lifecycle timestamp removed.',
                    timeoutMs: 2200,
                  });
                } catch (undoError) {
                  showToast?.({
                    variant: 'danger',
                    title: 'Undo failed',
                    message:
                      undoError?.message || 'Could not undo lifecycle update.',
                    timeoutMs: 3600,
                  });
                }
              },
            },
            {
              id: `retrieval-${action}-open-${itemId}`,
              label: 'Open Item',
              onClick: () => {
                hideToast?.();
                navigate(itemHref, {
                  state: getRetrievalItemNavigationState(itemId),
                });
              },
            },
          ],
          onClose: () => hideToast?.(),
        });
      } catch (err) {
        showToast?.({
          variant: 'danger',
          title: 'Lifecycle update failed',
          message: err?.message || 'Could not save timestamp.',
          timeoutMs: 3600,
        });
        throw err;
      }
    },
    [
      hideToast,
      items,
      mergeItemDetails,
      navigate,
      parseApiError,
      removeItemDetails,
      showToast,
      getRetrievalItemNavigationState,
    ],
  );

  const handleLoadMore = useCallback(async () => {
    if (!isItemsMode || loading || loadingMore || !hasMore) return;

    const currentQueryKey = queryKeyRef.current;
    const nextOffset = offset + limit;

    if (loadMoreControllerRef.current) {
      loadMoreControllerRef.current.abort();
    }

    const controller = new AbortController();
    loadMoreControllerRef.current = controller;
    setLoadingMore(true);
    setError('');

    try {
      const payload = await fetchRetrievalItemsPage(
        {
          ...queryState,
          limit,
          offset: nextOffset,
        },
        { signal: controller.signal },
      );

      if (controller.signal.aborted || queryKeyRef.current !== currentQueryKey) return;

      const nextItems = normalizeRetrievalItemsPage(payload?.items);

      setItems((current) => {
        const merged = [...current];
        const existingIds = new Set(current.map((item) => item.id));

        for (const item of nextItems) {
          if (existingIds.has(item.id)) continue;
          existingIds.add(item.id);
          merged.push(item);
        }

        return merged;
      });

      setTotal(Number(payload?.total) || 0);
      setLimit(Number(payload?.limit) || limit);
      setOffset(Number(payload?.offset) || nextOffset);
      setHasMore(Boolean(payload?.hasMore));
      const nextSortOptions = normalizeRetrievalSortOptions(payload?.sortOptions);
      if (nextSortOptions.length) {
        setSortOptions((current) =>
          sameSortOptions(current, nextSortOptions) ? current : nextSortOptions,
        );
      }
      setSelectedSort((current) => sanitizeSort(payload?.sort || current, nextSortOptions));
    } catch (loadError) {
      if (loadError?.name === 'AbortError') return;
      if (queryKeyRef.current !== currentQueryKey) return;
      setError(loadError?.message || 'Failed to load more retrieval results');
    } finally {
      if (loadMoreControllerRef.current === controller) {
        loadMoreControllerRef.current = null;
      }
      if (!controller.signal.aborted && queryKeyRef.current === currentQueryKey) {
        setLoadingMore(false);
      }
    }
  }, [hasMore, isItemsMode, limit, loading, loadingMore, offset, queryState]);

  const handlePreviewImage = useCallback((payload) => {
    const src = String(payload?.src || '').trim();
    if (!src) return;

    setLightboxImage({
      src,
      name: String(payload?.name || '').trim(),
    });
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightboxImage(null);
  }, []);

  const handleBoxItemNavigate = useCallback(({ boxId } = {}) => {
    boxItemNavigationPendingRef.current = true;
    const baseSnapshot =
      latestSnapshotRef.current && typeof latestSnapshotRef.current === 'object'
        ? latestSnapshotRef.current
        : {};
    const snapshot = {
      ...baseSnapshot,
      mode: 'boxes',
      boxes: sanitizeBoxModeState({
        ...boxModeState,
        selectedBoxId: boxId || boxModeState.selectedBoxId,
      }),
      scrollY: typeof window === 'undefined' ? 0 : window.scrollY,
      savedAt: Date.now(),
    };

    latestSnapshotRef.current = snapshot;
    writePersistedRetrievalState({
      key: location.key,
      pathname: location.pathname,
      snapshot,
    });
    writeCurrentHistoryRetrievalState(snapshot);
  }, [boxModeState, location.key, location.pathname]);

  if (!isItemsMode) {
    return (
      <RetrievalBoxCentricView
        mode={retrievalMode}
        onModeChange={setRetrievalMode}
        persistedState={boxModeState}
        onStateSnapshotChange={setBoxModeState}
        onAnalyticsChange={setBoxAnalytics}
        onRestoreReadyChange={setBoxRestoreReady}
        onItemNavigate={handleBoxItemNavigate}
        retrievalReturnTo={`${location.pathname}${location.search}${location.hash}`}
        setActiveRetrievalItem={setActiveRetrievalItem}
        finderMinimized={finderMinimized}
        onFinderDetachedChange={handleFinderDetachedChange}
      />
    );
  }

  return (
    <S.PageShell>
      <RetrievalSearchForm
        mode={retrievalMode}
        onModeChange={setRetrievalMode}
        scope={tagScope}
        searchValue={searchValue}
        onSearchChange={handleConsoleSearchChange}
        searchLabel={tagScope ? 'Search This Tag' : 'Find Items'}
        searchPlaceholder={tagScope ? `Search within ${tagScope.label}` : undefined}
        filterOptions={filterOptions}
        activeChips={activeChips}
        onCategoryChange={handleCategoryFilterChange}
        onTagChange={handleTagFilterChange}
        onTagRemove={(key) => removeFilter('tags', key)}
        onLocationChange={handleLocationFilterChange}
        onOwnerChange={handleOwnerFilterChange}
        onKeepPriorityChange={handleKeepPriorityFilterChange}
        onRemoveChip={removeFilter}
        onClearAll={clearAllFilters}
        tagOperator={tagOperator}
        onTagOperatorChange={setTagOperator}
        sortOptions={sortOptions}
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
        finderMinimized={finderMinimized}
        onFinderDetachedChange={handleFinderDetachedChange}
      />

      {error ? <S.ErrorState role="alert">{error}</S.ErrorState> : null}

      <S.ResultsPanel>
        <S.ResultsHeader>
          <S.ResultsHeaderTop>
            <S.ResultsCount>
              {items.length} shown / {total} {tagScope ? 'tagged items' : 'matches'}
            </S.ResultsCount>
            <S.ExplorerViewTrigger
              type="button"
              aria-pressed={resultsPresentation === 'ascii'}
              $active={resultsPresentation === 'ascii'}
              onClick={() => setResultsPresentation((current) => (
                current === 'ascii' ? 'cards' : 'ascii'
              ))}
            >
              <span>VIEW</span>
              <strong>{resultsPresentation === 'ascii' ? 'ASCII' : 'CARDS'}</strong>
            </S.ExplorerViewTrigger>
          </S.ResultsHeaderTop>
        </S.ResultsHeader>

        <RetrievalResultsList
          items={items}
          activeExpandedId={activeExpandedId}
          activeDetailResource={detailResource}
          activeSectionKey={activeSectionKey}
          onToggleRow={toggleExpanded}
          onSectionChange={setActiveSectionKey}
          onPreviewImage={handlePreviewImage}
          onLifecycleAction={handleLifecycleAction}
          getItemNavigationState={getRetrievalItemNavigationState}
          loading={loading}
          presentation={resultsPresentation}
        />

        {!loading && items.length ? (
          <S.ResultsFooter>
            {hasMore ? (
              <S.LoadMoreButton
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </S.LoadMoreButton>
            ) : (
              <S.ResultsEndState>All matching items loaded.</S.ResultsEndState>
            )}
          </S.ResultsFooter>
        ) : null}
      </S.ResultsPanel>

      <RetrievalImageLightbox
        isOpen={Boolean(lightboxImage?.src)}
        imageSrc={lightboxImage?.src || ''}
        itemName={lightboxImage?.name || ''}
        onClose={handleCloseLightbox}
      />
    </S.PageShell>
  );
}
