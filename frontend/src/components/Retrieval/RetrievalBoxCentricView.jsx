import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchBoxTreeByShortId } from '../../api/boxes';
import {
  DEFAULT_RETRIEVAL_LIMIT,
  fetchRetrievalBoxesPage,
} from '../../api/retrieval';
import { compareNumericBoxIds, normalizeBoxId } from '../../util/boxLocator';
import { getItemMicroThumbnailUrl } from '../../util/itemImage';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';
import * as S from './Retrieval.styles';
import { getBoxTheme } from '../../util/inventoryColorTheme';
import {
  normalizeRetrievalBoxesPage,
  normalizeRetrievalFilterOptions,
  normalizeRetrievalSortOptions,
} from './retrievalModel';
import RetrievalSearchForm from './RetrievalSearchForm';
import { BOX_RECORD_UPDATED_EVENT } from '../../constants/inventoryFinderEvents';

const DEFAULT_BOX_SORT_OPTIONS = [
  { key: 'location', label: 'Location (A → Z)' },
  { key: 'location_desc', label: 'Location (Z → A)' },
  { key: 'box', label: 'Box ID (Low → High)' },
  { key: 'box_desc', label: 'Box ID (High → Low)' },
  { key: 'name', label: 'Box Name (A → Z)' },
  { key: 'name_desc', label: 'Box Name (Z → A)' },
  { key: 'tag', label: 'Item Tag (A → Z)' },
  { key: 'tag_desc', label: 'Item Tag (Z → A)' },
];

const EMPTY_FILTER_OPTIONS = {
  categories: [],
  tags: [],
  groups: [],
  locations: [],
  owners: [],
  keepPriorities: [],
  categoryLabelByKey: new Map(),
  tagLabelByKey: new Map(),
  groupLabelByKey: new Map(),
  locationLabelByKey: new Map(),
  ownerLabelByKey: new Map(),
  keepPriorityLabelByKey: new Map(),
};

function compareLabel(a, b) {
  return String(a || '').localeCompare(String(b || ''), undefined, {
    sensitivity: 'base',
  });
}

function normalizeTagSelection(value) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.map((entry) => String(entry || '').trim().toLowerCase()).filter(Boolean))];
}

function normalizeTagOperator(value) {
  return String(value || '').trim().toLowerCase() === 'and' ? 'and' : 'or';
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

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const media = window.matchMedia(query);
    const handleChange = () => setMatches(media.matches);
    handleChange();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, [query]);

  return matches;
}

function formatCount(count, singular, plural) {
  const safeCount = Number.isFinite(Number(count)) ? Number(count) : 0;
  return `${safeCount} ${safeCount === 1 ? singular : plural}`;
}

function BoxInspectContent({
  selectedBoxId,
  boxDetailsLoading,
  boxDetailsError,
  directItems,
  selectedBoxHref,
  onItemNavigate,
  retrievalReturnTo,
}) {
  return (
    <>
      <S.BoxInspectHeader>
        <S.BoxInspectSectionTitle>
          Direct items · {boxDetailsLoading ? '…' : directItems.length}
        </S.BoxInspectSectionTitle>
        {selectedBoxHref ? (
          <S.BoxInspectHeaderLink to={selectedBoxHref}>
            Box page <span aria-hidden="true">↗</span>
          </S.BoxInspectHeaderLink>
        ) : null}
      </S.BoxInspectHeader>

      {boxDetailsLoading ? (
        <S.ExpandedMuted>Loading box contents…</S.ExpandedMuted>
      ) : boxDetailsError ? (
        <S.ExpandedMuted>{boxDetailsError}</S.ExpandedMuted>
      ) : directItems.length ? (
        <S.BoxInspectList>
          {directItems.map((item) => {
            const itemId = String(item?._id || item?.id || '').trim();
            if (!itemId) return null;

            const quantity = Number(item?.quantity);
            const thumbnailUrl = getItemMicroThumbnailUrl(item);
            const quantityLabel = Number.isFinite(quantity) ? `×${quantity}` : '';

            return (
              <S.BoxInspectRow key={`box-item-${itemId}`}>
                <S.BoxInspectItemThumb $empty={!thumbnailUrl} aria-hidden="true">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt=""
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : <span>·</span>}
                </S.BoxInspectItemThumb>
                <S.BoxInspectRowLink
                  to={`/items/${itemId}`}
                  state={{
                    retrievalReturn: {
                      kind: 'boxes-item',
                      boxId: selectedBoxId,
                      returnTo: retrievalReturnTo,
                    },
                  }}
                  onClick={() => onItemNavigate?.({
                    boxId: selectedBoxId,
                    itemId,
                  })}
                >
                  {String(item?.name || 'Unnamed item').trim()}
                </S.BoxInspectRowLink>
                {quantityLabel ? (
                  <S.BoxInspectRowMeta>{quantityLabel}</S.BoxInspectRowMeta>
                ) : null}
              </S.BoxInspectRow>
            );
          })}
        </S.BoxInspectList>
      ) : (
        <S.ExpandedMuted>No direct items in this box.</S.ExpandedMuted>
      )}
    </>
  );
}

export default function RetrievalBoxCentricView({
  mode = 'boxes',
  onModeChange,
  persistedState,
  onStateSnapshotChange,
  onAnalyticsChange,
  onRestoreReadyChange,
  onItemNavigate,
  retrievalReturnTo = '/retrieval',
  setActiveRetrievalItem,
  finderMinimized = false,
  onFinderDetachedChange,
}) {
  const initialPersistedState = persistedState && typeof persistedState === 'object'
    ? persistedState
    : null;
  const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT})`);
  const [boxes, setBoxes] = useState([]);
  const [total, setTotal] = useState(0);
  const initialPageLimitRef = useRef(Math.min(
    250,
    Math.max(
      DEFAULT_RETRIEVAL_LIMIT,
      Number(initialPersistedState?.loadedCount) || DEFAULT_RETRIEVAL_LIMIT,
    ),
  ));
  const [limit, setLimit] = useState(initialPageLimitRef.current);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [searchValue, setSearchValue] = useState(() =>
    String(initialPersistedState?.searchValue || ''),
  );
  const [boxIdPrefix, setBoxIdPrefix] = useState(() =>
    normalizeBoxId(initialPersistedState?.boxIdPrefix).slice(0, 3),
  );
  const [selectedGroup, setSelectedGroup] = useState(() =>
    String(initialPersistedState?.selectedGroup || ''),
  );
  const [selectedLocation, setSelectedLocation] = useState(() =>
    String(initialPersistedState?.selectedLocation || ''),
  );
  const [selectedTags, setSelectedTags] = useState(() =>
    normalizeTagSelection(initialPersistedState?.selectedTags || initialPersistedState?.selectedTag),
  );
  const [tagOperator, setTagOperator] = useState(() =>
    normalizeTagOperator(initialPersistedState?.tagOperator),
  );
  const [sortOptions, setSortOptions] = useState(DEFAULT_BOX_SORT_OPTIONS);
  const [selectedSort, setSelectedSort] = useState(() =>
    String(initialPersistedState?.selectedSort || 'location'),
  );
  const [filterOptions, setFilterOptions] = useState(EMPTY_FILTER_OPTIONS);
  const [selectedBoxId, setSelectedBoxId] = useState(() =>
    normalizeBoxId(initialPersistedState?.selectedBoxId) || '',
  );
  const [selectedBoxDetails, setSelectedBoxDetails] = useState(null);
  const [boxDetailsLoading, setBoxDetailsLoading] = useState(false);
  const [boxDetailsError, setBoxDetailsError] = useState('');
  const [boxRecordsRevision, setBoxRecordsRevision] = useState(0);

  const debouncedSearchValue = useDebouncedValue(searchValue, 220);
  const debouncedBoxIdPrefix = useDebouncedValue(boxIdPrefix, 120);
  const loadMoreControllerRef = useRef(null);
  const queryKeyRef = useRef('');

  const queryState = useMemo(
    () => ({
      q: debouncedSearchValue,
      boxIdPrefix: debouncedBoxIdPrefix,
      groups: selectedGroup ? [selectedGroup] : [],
      locations: selectedLocation ? [selectedLocation] : [],
      tags: selectedTags,
      tagOperator,
      sort: selectedSort,
    }),
    [
      debouncedBoxIdPrefix,
      debouncedSearchValue,
      selectedGroup,
      selectedLocation,
      selectedSort,
      selectedTags,
      tagOperator,
    ],
  );

  const queryKey = useMemo(
    () => JSON.stringify({ queryState, boxRecordsRevision }),
    [boxRecordsRevision, queryState],
  );

  useEffect(() => {
    const handleBoxUpdated = (event) => {
      const previousShortId = normalizeBoxId(event?.detail?.previousShortId);
      const nextShortId = normalizeBoxId(event?.detail?.box?.box_id);
      if (previousShortId && nextShortId) {
        setSelectedBoxId((current) =>
          normalizeBoxId(current) === previousShortId ? nextShortId : current
        );
      }
      setBoxRecordsRevision((current) => current + 1);
    };
    window.addEventListener(BOX_RECORD_UPDATED_EVENT, handleBoxUpdated);
    return () => window.removeEventListener(BOX_RECORD_UPDATED_EVENT, handleBoxUpdated);
  }, []);

  useEffect(() => {
    onStateSnapshotChange?.({
      searchValue,
      boxIdPrefix,
      selectedGroup,
      selectedLocation,
      selectedTags,
      tagOperator,
      selectedSort,
      selectedBoxId,
      loadedCount: Math.max(boxes.length, initialPageLimitRef.current),
    });
  }, [
    boxes.length,
    boxIdPrefix,
    onStateSnapshotChange,
    searchValue,
    selectedBoxId,
    selectedGroup,
    selectedLocation,
    selectedSort,
    selectedTags,
    tagOperator,
  ]);

  useEffect(() => {
    if (typeof setActiveRetrievalItem !== 'function') return undefined;
    if (finderMinimized) {
      setActiveRetrievalItem(null);
      return undefined;
    }

    setActiveRetrievalItem(null);

    return undefined;
  }, [
    finderMinimized,
    setActiveRetrievalItem,
  ]);

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
    if (!selectedGroup) return;

    const hasOption = filterOptions.groups.some(
      (option) => String(option?.key || '') === String(selectedGroup),
    );

    if (!hasOption) {
      setSelectedGroup('');
    }
  }, [filterOptions.groups, selectedGroup]);

  useEffect(() => {
    if (!selectedLocation) return;

    const hasOption = filterOptions.locations.some(
      (option) => String(option?.key || '') === String(selectedLocation),
    );

    if (!hasOption) {
      setSelectedLocation('');
    }
  }, [filterOptions.locations, selectedLocation]);

  useEffect(() => {
    if (!selectedTags.length || !filterOptions.tags.length) return;
    const validKeys = new Set(filterOptions.tags.map((option) => String(option?.key || '')));
    setSelectedTags((current) => {
      const next = current.filter((key) => validKeys.has(key));
      return next.length === current.length ? current : next;
    });
  }, [filterOptions.tags, selectedTags.length]);

  const addSelectedTag = useCallback((rawKey) => {
    const key = String(rawKey || '').trim().toLowerCase();
    if (!key) return;
    setSelectedTags((current) => (current.includes(key) ? current : [...current, key]));
  }, []);

  const removeSelectedTag = useCallback((rawKey) => {
    const key = String(rawKey || '').trim().toLowerCase();
    if (!key) return;
    setSelectedTags((current) => current.filter((entry) => entry !== key));
  }, []);

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
      setBoxes([]);
      setTotal(0);
      setOffset(0);
      setHasMore(false);
      setSelectedBoxDetails(null);
      setBoxDetailsError('');
      setBoxDetailsLoading(false);
      onAnalyticsChange?.(null);

      try {
        const payload = await fetchRetrievalBoxesPage(
          {
            ...queryState,
            limit: initialPageLimitRef.current,
            offset: 0,
          },
          { signal: controller.signal },
        );

        if (controller.signal.aborted || queryKeyRef.current !== currentQueryKey) return;

        setBoxes(normalizeRetrievalBoxesPage(payload?.boxes));
        setTotal(Number(payload?.total) || 0);
        setLimit(Number(payload?.limit) || initialPageLimitRef.current);
        setOffset(Number(payload?.offset) || 0);
        setHasMore(Boolean(payload?.hasMore));
        setFilterOptions(normalizeRetrievalFilterOptions(payload?.filters));
        const nextSortOptions = normalizeRetrievalSortOptions(payload?.sortOptions);
        if (nextSortOptions.length) setSortOptions(nextSortOptions);
        setSelectedSort(String(payload?.sort || 'location'));
        onAnalyticsChange?.(payload?.analytics || null);
      } catch (loadError) {
        if (loadError?.name === 'AbortError') return;
        if (queryKeyRef.current !== currentQueryKey) return;
        setError(loadError?.message || 'Failed to load retrieval boxes');
        setBoxes([]);
        setTotal(0);
        setHasMore(false);
        onAnalyticsChange?.(null);
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
  }, [onAnalyticsChange, queryKey, queryState]);

  useEffect(() => {
    if (loading) return;

    const validIds = new Set(
      boxes
        .map((box) => normalizeBoxId(box?.boxId))
        .filter(Boolean),
    );

    if (!validIds.size) {
      setSelectedBoxId('');
      setSelectedBoxDetails(null);
      setBoxDetailsError('');
      setBoxDetailsLoading(false);
      return;
    }

    setSelectedBoxId((current) => {
      const normalizedCurrent = normalizeBoxId(current);
      if (normalizedCurrent && validIds.has(normalizedCurrent)) {
        return normalizedCurrent;
      }

      if (isMobile) {
        return '';
      }

      return normalizeBoxId(boxes[0]?.boxId);
    });
  }, [boxes, isMobile, loading]);

  const handleSelectBox = useCallback(
    (rawBoxId) => {
      const normalized = normalizeBoxId(rawBoxId);
      if (!normalized) return;

      setSelectedBoxId((current) => {
        const currentNormalized = normalizeBoxId(current);
        if (isMobile && currentNormalized === normalized) {
          return '';
        }

        return normalized;
      });
    },
    [isMobile],
  );

  const selectedBoxSummary = useMemo(() => {
    const normalizedSelected = normalizeBoxId(selectedBoxId);
    if (!normalizedSelected) return null;

    return (
      boxes.find(
        (box) => normalizeBoxId(box?.boxId) === normalizedSelected,
      ) || null
    );
  }, [boxes, selectedBoxId]);

  useEffect(() => {
    const normalizedBoxId = normalizeBoxId(selectedBoxId);
    if (!normalizedBoxId) {
      setSelectedBoxDetails(null);
      setBoxDetailsError('');
      setBoxDetailsLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    const loadDetails = async () => {
      setBoxDetailsLoading(true);
      setBoxDetailsError('');

      try {
        const detail = await fetchBoxTreeByShortId(normalizedBoxId, {
          signal: controller.signal,
        });

        if (!active || controller.signal.aborted) return;
        setSelectedBoxDetails(detail || null);
      } catch (loadError) {
        if (!active || controller.signal.aborted) return;
        setSelectedBoxDetails(null);
        setBoxDetailsError(loadError?.message || 'Failed to load box details');
      } finally {
        if (active && !controller.signal.aborted) {
          setBoxDetailsLoading(false);
        }
      }
    };

    loadDetails();

    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedBoxId]);

  const groupedBoxes = useMemo(() => {
    if (!String(selectedSort || '').startsWith('location')) {
      const sortLabel = sortOptions.find((option) => option.key === selectedSort)?.label;
      return [{ location: sortLabel || 'Sorted boxes', boxes }];
    }

    const byLocation = new Map();

    for (const box of boxes) {
      const locationLabel = String(box?.locationLabel || 'Unknown Location').trim();
      if (!byLocation.has(locationLabel)) byLocation.set(locationLabel, []);
      byLocation.get(locationLabel).push(box);
    }

    return Array.from(byLocation.entries())
      .map(([location, locationBoxes]) => ({
        location,
        boxes: [...locationBoxes].sort((a, b) => {
          const byId = compareNumericBoxIds(a?.boxId, b?.boxId);
          if (byId !== 0) return byId;
          return compareLabel(a?.boxLabel, b?.boxLabel);
        }),
      }))
      .sort((a, b) => compareLabel(a.location, b.location));
  }, [boxes, selectedSort, sortOptions]);

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
      const payload = await fetchRetrievalBoxesPage(
        {
          ...queryState,
          limit,
          offset: nextOffset,
        },
        { signal: controller.signal },
      );

      if (controller.signal.aborted || queryKeyRef.current !== currentQueryKey) return;

      const nextBoxes = normalizeRetrievalBoxesPage(payload?.boxes);

      setBoxes((current) => {
        const merged = [...current];
        const existingIds = new Set(current.map((box) => normalizeBoxId(box.boxId)));

        for (const box of nextBoxes) {
          const key = normalizeBoxId(box?.boxId);
          if (!key || existingIds.has(key)) continue;
          existingIds.add(key);
          merged.push(box);
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
      setError(loadError?.message || 'Failed to load more boxes');
    } finally {
      if (loadMoreControllerRef.current === controller) {
        loadMoreControllerRef.current = null;
      }
      if (!controller.signal.aborted && queryKeyRef.current === currentQueryKey) {
        setLoadingMore(false);
      }
    }
  }, [hasMore, limit, loading, loadingMore, offset, queryState]);

  const selectedTree = selectedBoxDetails?.tree || null;
  const directItems = Array.isArray(selectedTree?.items) ? selectedTree.items : [];
  const selectedBoxHref = selectedBoxSummary?.boxHref || (selectedBoxId ? `/boxes/${selectedBoxId}` : '');
  const hasSelection = Boolean(selectedBoxId);
  const restoreReady = !loading && (
    !hasSelection || (
      Boolean(selectedBoxSummary) &&
      !boxDetailsLoading &&
      (Boolean(selectedBoxDetails) || Boolean(boxDetailsError))
    )
  );

  useEffect(() => {
    onRestoreReadyChange?.(restoreReady);
  }, [onRestoreReadyChange, restoreReady]);

  return (
    <S.PageShell>
      <RetrievalSearchForm
        mode={mode}
        onModeChange={onModeChange}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchLabel="Find Boxes"
        searchPlaceholder="Search box name, group, location, or item tag"
        boxIdPrefix={boxIdPrefix}
        onBoxIdPrefixChange={setBoxIdPrefix}
        filterOptions={filterOptions}
        selectedBoxGroup={selectedGroup}
        selectedBoxLocation={selectedLocation}
        selectedBoxTags={selectedTags}
        onBoxGroupChange={setSelectedGroup}
        onBoxLocationChange={setSelectedLocation}
        onBoxTagAdd={addSelectedTag}
        onBoxTagRemove={removeSelectedTag}
        tagOperator={tagOperator}
        onTagOperatorChange={setTagOperator}
        sortOptions={sortOptions}
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
        finderMinimized={finderMinimized}
        onFinderDetachedChange={onFinderDetachedChange}
      />

      {error ? <S.ErrorState role="alert">{error}</S.ErrorState> : null}

      <S.ResultsPanel>
        <S.ResultsHeader>
          <S.ResultsCount>
            {boxes.length} shown / {total} boxes
          </S.ResultsCount>
        </S.ResultsHeader>

        {loading ? (
          <S.LoadingState>Loading box retrieval results…</S.LoadingState>
        ) : !boxes.length ? (
          <S.EmptyState>No boxes match the current search/filter.</S.EmptyState>
        ) : (
          <S.BoxCentricLayout>
            <S.BoxMapPanel>
              {groupedBoxes.map((group) => (
                <S.BoxGroup key={group.location}>
                  <S.BoxGroupLabel>{group.location}</S.BoxGroupLabel>
                  <S.BoxList>
                    {group.boxes.map((box) => {
                      const normalizedId = normalizeBoxId(box?.boxId);
                      const isActive = normalizedId === normalizeBoxId(selectedBoxId);
                      const inlinePanelId = `retrieval-box-inline-${normalizedId || box.id}`;
                      const rowTones = getBoxTheme(box?.boxId);
                      return (
                        <S.BoxListItem key={box.id}>
                          <S.BoxListRow
                            type="button"
                            onClick={() => handleSelectBox(normalizedId)}
                            $active={isActive}
                            $boxColorRgb={rowTones.baseRgb}
                            $boxMutedRgb={rowTones.mutedRgb}
                            aria-expanded={isMobile ? isActive : undefined}
                            aria-controls={isMobile ? inlinePanelId : undefined}
                          >
                            <S.BoxRowMain>
                              <S.BoxRowId $boxNeonRgb={rowTones.neonRgb}>
                                #{box.boxId || '—'}
                              </S.BoxRowId>
                              <S.BoxRowLabel $boxMutedRgb={rowTones.mutedRgb}>
                                {box.boxLabel}
                              </S.BoxRowLabel>
                            </S.BoxRowMain>
                            <S.BoxRowContext>
                              <S.BoxRowLocation $boxNeonRgb={rowTones.neonRgb}>
                                <span>Location</span>
                                <strong>{box.locationLabel || 'Unknown'}</strong>
                              </S.BoxRowLocation>
                            {box.groupLabel ? (
                              <S.BoxRowGroup
                                title={box.groupLabel}
                                $boxMutedRgb={rowTones.mutedRgb}
                              >
                                Group: {box.groupLabel}
                              </S.BoxRowGroup>
                            ) : null}
                            </S.BoxRowContext>
                            {box.tags.length ? (
                              <S.BoxRowTags
                                title={box.tags.map((tag) => `#${tag}`).join(' ')}
                                $boxNeonRgb={rowTones.neonRgb}
                              >
                                {box.tags.map((tag) => `#${tag}`).join(' ')}
                              </S.BoxRowTags>
                            ) : null}
                            <S.BoxRowMeta>
                              <S.BoxMetaPill $boxMutedRgb={rowTones.mutedRgb}>
                                {formatCount(box.directItemCount, 'item', 'items')}
                              </S.BoxMetaPill>
                              <S.BoxMetaPill $boxMutedRgb={rowTones.mutedRgb}>
                                {formatCount(box.childBoxCount, 'child box', 'child boxes')}
                              </S.BoxMetaPill>
                            </S.BoxRowMeta>
                          </S.BoxListRow>

                          {isMobile && isActive ? (
                            <S.MobileInlineInspectPanel id={inlinePanelId}>
                              <BoxInspectContent
                                selectedBoxId={selectedBoxId}
                                boxDetailsLoading={boxDetailsLoading}
                                boxDetailsError={boxDetailsError}
                                directItems={directItems}
                                selectedBoxHref={selectedBoxHref}
                                onItemNavigate={onItemNavigate}
                                retrievalReturnTo={retrievalReturnTo}
                              />
                            </S.MobileInlineInspectPanel>
                          ) : null}
                        </S.BoxListItem>
                      );
                    })}
                  </S.BoxList>
                </S.BoxGroup>
              ))}
            </S.BoxMapPanel>

            {!isMobile ? (
              <S.BoxInspectPanel>
                {!hasSelection ? (
                  <S.ExpandedMuted>Select a box to inspect its contents.</S.ExpandedMuted>
                ) : (
                  <BoxInspectContent
                    selectedBoxId={selectedBoxId}
                    boxDetailsLoading={boxDetailsLoading}
                    boxDetailsError={boxDetailsError}
                    directItems={directItems}
                    selectedBoxHref={selectedBoxHref}
                    onItemNavigate={onItemNavigate}
                    retrievalReturnTo={retrievalReturnTo}
                  />
                )}
              </S.BoxInspectPanel>
            ) : null}
          </S.BoxCentricLayout>
        )}

        {!loading && boxes.length ? (
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
              <S.ResultsEndState>All matching boxes loaded.</S.ResultsEndState>
            )}
          </S.ResultsFooter>
        ) : null}
      </S.ResultsPanel>
    </S.PageShell>
  );
}
