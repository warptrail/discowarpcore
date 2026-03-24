import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchBoxTreeByShortId } from '../../api/boxes';
import {
  DEFAULT_RETRIEVAL_LIMIT,
  fetchRetrievalBoxesPage,
} from '../../api/retrieval';
import { compareNumericBoxIds, normalizeBoxId } from '../../util/boxLocator';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';
import * as S from './Retrieval.styles';
import FilterCombobox from './FilterCombobox';
import RetrievalModeToggle from './RetrievalModeToggle';
import RetrievalSearchBar from './RetrievalSearchBar';
import {
  normalizeRetrievalBoxesPage,
  normalizeRetrievalFilterOptions,
} from './retrievalModel';

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

function compareLabel(a, b) {
  return String(a || '').localeCompare(String(b || ''), undefined, {
    sensitivity: 'base',
  });
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

function buildBoxPath(details, selectedSummary) {
  const ancestors = Array.isArray(details?.ancestors) ? details.ancestors : [];
  const segments = ancestors
    .map((ancestor) => String(ancestor?.label || '').trim())
    .filter(Boolean);

  const current = String(
    details?.tree?.label || selectedSummary?.boxLabel || '',
  ).trim();

  if (current) segments.push(current);
  return segments.join(' > ');
}

function formatCount(count, singular, plural) {
  const safeCount = Number.isFinite(Number(count)) ? Number(count) : 0;
  return `${safeCount} ${safeCount === 1 ? singular : plural}`;
}

function BoxInspectContent({
  selectedBoxId,
  selectedLabel,
  selectedLocationLabel,
  selectedPath,
  boxDetailsLoading,
  boxDetailsError,
  directItems,
  childBoxes,
  selectedBoxHref,
}) {
  return (
    <>
      <S.BoxInspectHeader>
        <S.BoxInspectTitle>
          <S.BoxInspectTitleLink to={selectedBoxHref}>
            #{selectedBoxId} · {selectedLabel}
          </S.BoxInspectTitleLink>
        </S.BoxInspectTitle>
        <S.BoxInspectSubtitle>{selectedLocationLabel}</S.BoxInspectSubtitle>
        {selectedPath ? <S.BoxInspectPath>{selectedPath}</S.BoxInspectPath> : null}
      </S.BoxInspectHeader>

      <S.BoxInspectSection>
        <S.BoxInspectSectionTitle>
          Direct Items ({boxDetailsLoading ? '…' : directItems.length})
        </S.BoxInspectSectionTitle>

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
              const quantityLabel = Number.isFinite(quantity)
                ? `Qty ${quantity}`
                : '';

              return (
                <S.BoxInspectRow key={`box-item-${itemId}`}>
                  <S.BoxInspectRowLink to={`/items/${itemId}`}>
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
      </S.BoxInspectSection>

      <S.BoxInspectSection>
        <S.BoxInspectSectionTitle>
          Child Boxes ({boxDetailsLoading ? '…' : childBoxes.length})
        </S.BoxInspectSectionTitle>

        {boxDetailsLoading ? (
          <S.ExpandedMuted>Loading child boxes…</S.ExpandedMuted>
        ) : boxDetailsError ? null : childBoxes.length ? (
          <S.BoxInspectList>
            {childBoxes.map((child) => {
              const childBoxId = normalizeBoxId(child?.box_id);
              if (!childBoxId) return null;

              return (
                <S.BoxInspectRow key={`child-box-${childBoxId}`}>
                  <S.BoxInspectRowLink to={`/boxes/${childBoxId}`}>
                    #{childBoxId} · {String(child?.label || 'Untitled Box').trim()}
                  </S.BoxInspectRowLink>
                  <S.BoxInspectRowMeta>
                    {formatCount(
                      Array.isArray(child?.items) ? child.items.length : 0,
                      'direct item',
                      'direct items',
                    )}
                  </S.BoxInspectRowMeta>
                </S.BoxInspectRow>
              );
            })}
          </S.BoxInspectList>
        ) : (
          <S.ExpandedMuted>No direct child boxes.</S.ExpandedMuted>
        )}
      </S.BoxInspectSection>

      {selectedBoxHref ? (
        <S.ExpandedBoxLink to={selectedBoxHref}>Open box page</S.ExpandedBoxLink>
      ) : null}
    </>
  );
}

export default function RetrievalBoxCentricView({
  mode = 'boxes',
  onModeChange,
  persistedState,
  onStateSnapshotChange,
}) {
  const initialPersistedState = persistedState && typeof persistedState === 'object'
    ? persistedState
    : null;
  const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT})`);
  const [boxes, setBoxes] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(DEFAULT_RETRIEVAL_LIMIT);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [searchValue, setSearchValue] = useState(() =>
    String(initialPersistedState?.searchValue || ''),
  );
  const [selectedLocation, setSelectedLocation] = useState(() =>
    String(initialPersistedState?.selectedLocation || ''),
  );
  const [filterOptions, setFilterOptions] = useState(EMPTY_FILTER_OPTIONS);
  const [selectedBoxId, setSelectedBoxId] = useState(() =>
    normalizeBoxId(initialPersistedState?.selectedBoxId) || '',
  );
  const [selectedBoxDetails, setSelectedBoxDetails] = useState(null);
  const [boxDetailsLoading, setBoxDetailsLoading] = useState(false);
  const [boxDetailsError, setBoxDetailsError] = useState('');

  const debouncedSearchValue = useDebouncedValue(searchValue, 220);
  const loadMoreControllerRef = useRef(null);
  const queryKeyRef = useRef('');

  const queryState = useMemo(
    () => ({
      q: debouncedSearchValue,
      locations: selectedLocation ? [selectedLocation] : [],
    }),
    [debouncedSearchValue, selectedLocation],
  );

  const queryKey = useMemo(() => JSON.stringify(queryState), [queryState]);

  useEffect(() => {
    onStateSnapshotChange?.({
      searchValue,
      selectedLocation,
      selectedBoxId,
    });
  }, [onStateSnapshotChange, searchValue, selectedLocation, selectedBoxId]);

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
    if (!selectedLocation) return;

    const hasOption = filterOptions.locations.some(
      (option) => String(option?.key || '') === String(selectedLocation),
    );

    if (!hasOption) {
      setSelectedLocation('');
    }
  }, [filterOptions.locations, selectedLocation]);

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

      try {
        const payload = await fetchRetrievalBoxesPage(
          {
            ...queryState,
            limit: DEFAULT_RETRIEVAL_LIMIT,
            offset: 0,
          },
          { signal: controller.signal },
        );

        if (controller.signal.aborted || queryKeyRef.current !== currentQueryKey) return;

        setBoxes(normalizeRetrievalBoxesPage(payload?.boxes));
        setTotal(Number(payload?.total) || 0);
        setLimit(Number(payload?.limit) || DEFAULT_RETRIEVAL_LIMIT);
        setOffset(Number(payload?.offset) || 0);
        setHasMore(Boolean(payload?.hasMore));
        setFilterOptions(normalizeRetrievalFilterOptions(payload?.filters));
      } catch (loadError) {
        if (loadError?.name === 'AbortError') return;
        if (queryKeyRef.current !== currentQueryKey) return;
        setError(loadError?.message || 'Failed to load retrieval boxes');
        setBoxes([]);
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

  useEffect(() => {
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
  }, [boxes, isMobile]);

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
  }, [boxes]);

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
  const selectedLocationLabel = String(
    selectedTree?.location || selectedBoxSummary?.locationLabel || 'Unknown Location',
  ).trim();
  const selectedLabel = String(
    selectedTree?.label || selectedBoxSummary?.boxLabel || 'Selected Box',
  ).trim();
  const selectedPath = buildBoxPath(selectedBoxDetails, selectedBoxSummary);
  const directItems = Array.isArray(selectedTree?.items) ? selectedTree.items : [];
  const childBoxes = Array.isArray(selectedTree?.childBoxes) ? selectedTree.childBoxes : [];
  const selectedBoxHref = selectedBoxSummary?.boxHref || (selectedBoxId ? `/boxes/${selectedBoxId}` : '');
  const hasSelection = Boolean(selectedBoxId);

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
              Box-first retrieval for answering “what’s in this box?” and “where are these boxes?”
            </S.Subtitle>
          </S.HeadingGroup>
          <S.CountPill>{total}</S.CountPill>
        </S.HeadingRow>

        <RetrievalModeToggle mode={mode} onChange={onModeChange} />

        <RetrievalSearchBar
          id="retrieval-box-search"
          value={searchValue}
          onChange={setSearchValue}
          label="Find Boxes"
          placeholder="Search by box ID prefix, box label, or location"
          hint="Use ID prefix (e.g. 1, 10, 107) for fast lookup, or search label/location text."
        />

        <S.BoxFilterGrid>
          <S.FilterControl>
            <S.FilterLabel>Location</S.FilterLabel>
            <S.FilterRow>
              <FilterCombobox
                id="retrieval-box-location"
                name="retrieval_box_location"
                ariaLabel="Box location filter options"
                placeholder="Filter by location..."
                options={filterOptions.locations}
                selectedKey={selectedLocation}
                onSelectedKeyChange={setSelectedLocation}
                emptyMessage="No locations match"
              />
              <S.AddFilterButton
                type="button"
                onClick={() => setSelectedLocation('')}
                disabled={!selectedLocation}
              >
                Clear
              </S.AddFilterButton>
            </S.FilterRow>
          </S.FilterControl>
        </S.BoxFilterGrid>
      </S.ControlsPanel>

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
                      return (
                        <S.BoxListItem key={box.id}>
                          <S.BoxListRow
                            type="button"
                            onClick={() => handleSelectBox(normalizedId)}
                            $active={isActive}
                            aria-expanded={isMobile ? isActive : undefined}
                            aria-controls={isMobile ? inlinePanelId : undefined}
                          >
                            <S.BoxRowMain>
                              <S.BoxRowId>#{box.boxId || '—'}</S.BoxRowId>
                              <S.BoxRowLabel>{box.boxLabel}</S.BoxRowLabel>
                            </S.BoxRowMain>
                            <S.BoxRowMeta>
                              <S.BoxMetaPill>
                                {formatCount(box.directItemCount, 'item', 'items')}
                              </S.BoxMetaPill>
                              <S.BoxMetaPill>
                                {formatCount(box.childBoxCount, 'child box', 'child boxes')}
                              </S.BoxMetaPill>
                            </S.BoxRowMeta>
                          </S.BoxListRow>

                          {isMobile && isActive ? (
                            <S.MobileInlineInspectPanel id={inlinePanelId}>
                              <BoxInspectContent
                                selectedBoxId={selectedBoxId}
                                selectedLabel={selectedLabel}
                                selectedLocationLabel={selectedLocationLabel}
                                selectedPath={selectedPath}
                                boxDetailsLoading={boxDetailsLoading}
                                boxDetailsError={boxDetailsError}
                                directItems={directItems}
                                childBoxes={childBoxes}
                                selectedBoxHref={selectedBoxHref}
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
                    selectedLabel={selectedLabel}
                    selectedLocationLabel={selectedLocationLabel}
                    selectedPath={selectedPath}
                    boxDetailsLoading={boxDetailsLoading}
                    boxDetailsError={boxDetailsError}
                    directItems={directItems}
                    childBoxes={childBoxes}
                    selectedBoxHref={selectedBoxHref}
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
