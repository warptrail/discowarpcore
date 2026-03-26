import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import {
  DEFAULT_RETRIEVAL_LIMIT,
  fetchRetrievalItemsPage,
} from '../../api/retrieval';
import { API_BASE } from '../../api/API_BASE';
import { markItemGone, restoreItemToActive } from '../../api/itemLifecycle';
import * as S from './Retrieval.styles';
import RetrievalSearchBar from './RetrievalSearchBar';
import RetrievalFilterBar from './RetrievalFilterBar';
import ActiveFilterChips from './ActiveFilterChips';
import RetrievalResultsList from './RetrievalResultsList';
import RetrievalImageLightbox from './RetrievalImageLightbox';
import RetrievalModeToggle from './RetrievalModeToggle';
import RetrievalBoxCentricView from './RetrievalBoxCentricView';
import { ToastContext } from '../Toast';
import {
  buildActiveFilterChips,
  normalizeRetrievalFilterOptions,
  normalizeRetrievalItemsPage,
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
const SCROLL_RESTORE_MAX_FRAMES = 240;

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
    const hasMatch = itemTagKeys.some((tagKey) => tags.includes(tagKey));
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
  return {
    searchValue: String(source.searchValue || ''),
    selectedGroup: String(source.selectedGroup || ''),
    selectedLocation: String(source.selectedLocation || ''),
    selectedBoxId: String(source.selectedBoxId || ''),
  };
}

function sanitizeMode(rawMode) {
  return rawMode === 'boxes' ? 'boxes' : 'items';
}

function readPersistedRetrievalState({ key, navigationType }) {
  if (typeof window === 'undefined') return null;
  if (!key || key === 'default') return null;
  if (navigationType !== 'POP') return null;

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

function writePersistedRetrievalState({ key, snapshot }) {
  if (typeof window === 'undefined') return;
  if (!key || !snapshot) return;

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
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const initialSnapshotRef = useRef();
  if (initialSnapshotRef.current === undefined) {
    initialSnapshotRef.current = readPersistedRetrievalState({
      key: location.key,
      navigationType,
    });
  }
  const initialSnapshot = initialSnapshotRef.current || null;
  const initialItemState =
    initialSnapshot?.items && typeof initialSnapshot.items === 'object'
      ? initialSnapshot.items
      : null;

  const [retrievalMode, setRetrievalMode] = useState(() =>
    sanitizeMode(initialSnapshot?.mode),
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
  const [activeFilters, setActiveFilters] = useState(() =>
    sanitizeFilters(initialItemState?.activeFilters),
  );
  const [filterOptions, setFilterOptions] = useState(EMPTY_FILTER_OPTIONS);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('');
  const [selectedKeepPriority, setSelectedKeepPriority] = useState('');
  const [expandedIds, setExpandedIds] = useState(
    () => new Set(sanitizeExpandedIds(initialItemState?.expandedIds)),
  );
  const [boxModeState, setBoxModeState] = useState(() =>
    sanitizeBoxModeState(initialSnapshot?.boxes),
  );
  const [lightboxImage, setLightboxImage] = useState(null);
  const isItemsMode = retrievalMode === 'items';

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

  const queryState = useMemo(
    () => ({
      q: debouncedSearchValue,
      categories: activeFilters.categories,
      tags: activeFilters.tags,
      locations: activeFilters.locations,
      owners: activeFilters.owners,
      keepPriorities: activeFilters.keepPriorities,
    }),
    [debouncedSearchValue, activeFilters],
  );

  const queryKey = useMemo(() => JSON.stringify(queryState), [queryState]);

  useEffect(() => {
    queryKeyRef.current = queryKey;
  }, [queryKey]);

  useEffect(() => {
    queryStateRef.current = queryState;
  }, [queryState]);

  useEffect(() => {
    latestSnapshotRef.current = {
      mode: sanitizeMode(retrievalMode),
      items: {
        searchValue: String(searchValue || ''),
        activeFilters: sanitizeFilters(activeFilters),
        expandedIds: Array.from(expandedIds),
      },
      boxes: sanitizeBoxModeState(boxModeState),
      scrollY: typeof window === 'undefined' ? 0 : window.scrollY,
      savedAt: Date.now(),
    };
  }, [activeFilters, boxModeState, expandedIds, retrievalMode, searchValue]);

  useEffect(() => {
    const persist = () => {
      const baseSnapshot =
        latestSnapshotRef.current && typeof latestSnapshotRef.current === 'object'
          ? latestSnapshotRef.current
          : {};
      const snapshot = {
        ...baseSnapshot,
        scrollY: typeof window === 'undefined' ? 0 : window.scrollY,
        savedAt: Date.now(),
      };
      latestSnapshotRef.current = snapshot;

      writePersistedRetrievalState({
        key: location.key,
        snapshot,
      });
    };

    const onPageHide = () => {
      persist();
    };

    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      persist();
    };
  }, [location.key]);

  useEffect(() => {
    const targetScrollY = pendingScrollRestoreRef.current;
    if (!Number.isFinite(targetScrollY)) return;

    if (isItemsMode && loading) return;

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
  }, [isItemsMode, loading, retrievalMode, items.length]);

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
    if (!isItemsMode) return;
    const validIds = new Set(items.map((item) => item.id));

    setExpandedIds((current) => {
      const next = new Set();
      for (const id of current) {
        if (validIds.has(id)) next.add(id);
      }

      if (next.size === current.size) return current;
      return next;
    });
  }, [isItemsMode, items]);

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
        setExpandedIds(new Set());
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

  const handleAddCategory = useCallback(() => {
    addFilter('categories', selectedCategory);
    setSelectedCategory('');
  }, [addFilter, selectedCategory]);

  const handleAddTag = useCallback(() => {
    addFilter('tags', selectedTag);
    setSelectedTag('');
  }, [addFilter, selectedTag]);

  const handleAddLocation = useCallback(() => {
    addFilter('locations', selectedLocation);
    setSelectedLocation('');
  }, [addFilter, selectedLocation]);

  const handleAddOwner = useCallback(() => {
    addFilter('owners', selectedOwner);
    setSelectedOwner('');
  }, [addFilter, selectedOwner]);

  const handleAddKeepPriority = useCallback(() => {
    addFilter('keepPriorities', selectedKeepPriority);
    setSelectedKeepPriority('');
  }, [addFilter, selectedKeepPriority]);

  const toggleExpanded = useCallback((itemId) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

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
                  setExpandedIds((current) => {
                    const next = new Set(current);
                    next.delete(itemId);
                    return next;
                  });
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
                          navigate(itemHref);
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
                navigate(itemHref);
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
    [hideToast, items, navigate, parseApiError, showToast],
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

  if (!isItemsMode) {
    return (
      <RetrievalBoxCentricView
        mode={retrievalMode}
        onModeChange={setRetrievalMode}
        persistedState={boxModeState}
        onStateSnapshotChange={setBoxModeState}
      />
    );
  }

  return (
    <S.PageShell>
      <S.ControlsPanel>
        <S.HeadingRow>
          <S.HeadingGroup>
            <S.TitleRow>
              <S.TitlePip aria-hidden="true" />
              <S.Title>Retrieval Mode</S.Title>
            </S.TitleRow>
            <S.Subtitle>
              Fast, read-only lookup for answering “where is this item?”
            </S.Subtitle>
          </S.HeadingGroup>
          <S.CountPill>{total}</S.CountPill>
        </S.HeadingRow>

        <RetrievalModeToggle mode={retrievalMode} onChange={setRetrievalMode} />

        <RetrievalSearchBar value={searchValue} onChange={setSearchValue} />

        <RetrievalFilterBar
          categoryOptions={filterOptions.categories}
          tagOptions={filterOptions.tags}
          locationOptions={filterOptions.locations}
          ownerOptions={filterOptions.owners}
          keepPriorityOptions={filterOptions.keepPriorities}
          selectedCategory={selectedCategory}
          selectedTag={selectedTag}
          selectedLocation={selectedLocation}
          selectedOwner={selectedOwner}
          selectedKeepPriority={selectedKeepPriority}
          onCategoryChange={setSelectedCategory}
          onTagChange={setSelectedTag}
          onLocationChange={setSelectedLocation}
          onOwnerChange={setSelectedOwner}
          onKeepPriorityChange={setSelectedKeepPriority}
          onAddCategory={handleAddCategory}
          onAddTag={handleAddTag}
          onAddLocation={handleAddLocation}
          onAddOwner={handleAddOwner}
          onAddKeepPriority={handleAddKeepPriority}
        />

        <ActiveFilterChips
          chips={activeChips}
          onRemove={removeFilter}
          onClearAll={clearAllFilters}
        />
      </S.ControlsPanel>

      {error ? <S.ErrorState role="alert">{error}</S.ErrorState> : null}

      <S.ResultsPanel>
        <S.ResultsHeader>
          <S.ResultsCount>
            {items.length} shown / {total} matches
          </S.ResultsCount>
        </S.ResultsHeader>

        <RetrievalResultsList
          items={items}
          expandedIds={expandedIds}
          onToggleRow={toggleExpanded}
          onPreviewImage={handlePreviewImage}
          onLifecycleAction={handleLifecycleAction}
          loading={loading}
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
