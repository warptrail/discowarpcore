import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_RETRIEVAL_LIMIT,
  fetchRetrievalItemsPage,
} from '../../api/retrieval';
import * as S from './Retrieval.styles';
import RetrievalSearchBar from './RetrievalSearchBar';
import RetrievalFilterBar from './RetrievalFilterBar';
import ActiveFilterChips from './ActiveFilterChips';
import RetrievalResultsList from './RetrievalResultsList';
import RetrievalImageLightbox from './RetrievalImageLightbox';
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
};

const EMPTY_FILTER_OPTIONS = {
  categories: [],
  tags: [],
  locations: [],
  owners: [],
  categoryLabelByKey: new Map(),
  tagLabelByKey: new Map(),
  locationLabelByKey: new Map(),
  ownerLabelByKey: new Map(),
};

function toKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
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

  const nextCategories = current.categories.filter((value) => categoryKeys.has(value));
  const nextTags = current.tags.filter((value) => tagKeys.has(value));
  const nextLocations = current.locations.filter((value) => locationKeys.has(value));
  const nextOwners = current.owners.filter((value) => ownerKeys.has(value));

  if (
    sameValues(nextCategories, current.categories) &&
    sameValues(nextTags, current.tags) &&
    sameValues(nextLocations, current.locations) &&
    sameValues(nextOwners, current.owners)
  ) {
    return current;
  }

  return {
    categories: nextCategories,
    tags: nextTags,
    locations: nextLocations,
    owners: nextOwners,
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

export default function RetrievalPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(DEFAULT_RETRIEVAL_LIMIT);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
  const [filterOptions, setFilterOptions] = useState(EMPTY_FILTER_OPTIONS);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('');
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [lightboxImage, setLightboxImage] = useState(null);

  const debouncedSearchValue = useDebouncedValue(searchValue, 220);
  const loadMoreControllerRef = useRef(null);
  const queryKeyRef = useRef('');

  const queryState = useMemo(
    () => ({
      q: debouncedSearchValue,
      categories: activeFilters.categories,
      tags: activeFilters.tags,
      locations: activeFilters.locations,
      owners: activeFilters.owners,
    }),
    [debouncedSearchValue, activeFilters],
  );

  const queryKey = useMemo(() => JSON.stringify(queryState), [queryState]);

  useEffect(() => {
    queryKeyRef.current = queryKey;
  }, [queryKey]);

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
    const validIds = new Set(items.map((item) => item.id));

    setExpandedIds((current) => {
      const next = new Set();
      for (const id of current) {
        if (validIds.has(id)) next.add(id);
      }

      if (next.size === current.size) return current;
      return next;
    });
  }, [items]);

  useEffect(() => {
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
      setExpandedIds(new Set());
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
          setLoading(false);
        }
      }
    };

    loadFirstPage();

    return () => {
      controller.abort();
    };
  }, [queryKey, queryState]);

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

  const handleLoadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;

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
  }, [hasMore, limit, loading, loadingMore, offset, queryState]);

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

        <RetrievalSearchBar value={searchValue} onChange={setSearchValue} />

        <RetrievalFilterBar
          categoryOptions={filterOptions.categories}
          tagOptions={filterOptions.tags}
          locationOptions={filterOptions.locations}
          ownerOptions={filterOptions.owners}
          selectedCategory={selectedCategory}
          selectedTag={selectedTag}
          selectedLocation={selectedLocation}
          selectedOwner={selectedOwner}
          onCategoryChange={setSelectedCategory}
          onTagChange={setSelectedTag}
          onLocationChange={setSelectedLocation}
          onOwnerChange={setSelectedOwner}
          onAddCategory={handleAddCategory}
          onAddTag={handleAddTag}
          onAddLocation={handleAddLocation}
          onAddOwner={handleAddOwner}
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
