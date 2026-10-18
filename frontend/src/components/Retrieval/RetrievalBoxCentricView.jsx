import { useSearchParams, useLocation } from 'react-router-dom';
import { normalizeBoxAddress, parseBoxAddress } from '../../util/boxAddress';
import { readShelfSelection, scopeBoxToShelves } from '../../util/shelfSelection';
import { collectPlacedItems } from '../../util/boxAddressViews';
import CabinetShelfPicker from '../BoxForms/CabinetShelfPicker';
import useMissingInventoryRefresh from '../MissingItems/useMissingInventoryRefresh';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchBoxTreeByShortId } from '../../api/boxes';
import {
  DEFAULT_RETRIEVAL_LIMIT,
  fetchRetrievalBoxesPage,
} from '../../api/retrieval';
import ItemThumbnailMedia from '../ItemThumbnailMedia';
import { MOBILE_BREAKPOINT } from '../../styles/tokens';
import * as S from './Retrieval.styles';
import {
  normalizeRetrievalBoxesPage,
  normalizeRetrievalFilterOptions,
  normalizeRetrievalSortOptions,
} from './retrievalModel';
import RetrievalSearchForm from './RetrievalSearchForm';
import RetrievalConsolePortal from './RetrievalConsoleControls';
import useRetrievalBrowseSort from './useRetrievalBrowseSort';
import RetrievalBoxResultRow from './RetrievalBoxResultRow';
import { BOX_RECORD_UPDATED_EVENT } from '../../constants/inventoryFinderEvents';

const DEFAULT_BOX_SORT_OPTIONS = [
  { key: 'random', label: 'Shuffled' },
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

  return [debounced, setDebounced];
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

function BoxInspectContent({
  selectedBoxId,
  boxDetailsLoading,
  boxDetailsError,
  directItems,
  selectedBoxHref,
  onItemNavigate,
  retrievalReturnTo,
  shelfPicker,
}) {
  return (
    <>
      {shelfPicker}
      <S.BoxInspectHeader>
        <S.BoxInspectSectionTitle>
          {shelfPicker ? 'Contents' : 'Direct items'} · {boxDetailsLoading ? '…' : directItems.length}
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
            const quantityLabel = Number.isFinite(quantity) ? `×${quantity}` : '';

            return (
              <S.BoxInspectRow key={`box-item-${itemId}`}>
                <S.BoxInspectItemThumb aria-hidden="true">
                  <ItemThumbnailMedia item={item} />
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
                  {String(item?.name || 'Unnamed item').trim()}{item.ownerBoxId ? <small> · #{item.placementLabel} · {item.placementTrail}</small> : null}
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
  presentation = 'cards',
  onPresentationChange,
  desktop = false,
  tagScope = null,
}) {
  const [addressParams, setAddressParams] = useSearchParams();
  const addressLocation = useLocation();
  const scopedTag = tagScope?.key || '';
  const initialPersistedState = persistedState && typeof persistedState === 'object'
    ? persistedState
    : null;
  const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT})`);
  const [boxes, setBoxes] = useState([]);
  const [total, setTotal] = useState(0);
  const [matchCounts, setMatchCounts] = useState(null);
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
  const [boxIdPrefix, setBoxIdPrefixValue] = useState(() =>
    normalizeBoxAddress(addressParams.get('addressScope') || initialPersistedState?.boxIdPrefix),
  );
  const scopeInUrl = addressParams.get('addressScope');
  const previousScopeInUrl = useRef(scopeInUrl);
  useEffect(() => {
    if (previousScopeInUrl.current === scopeInUrl) return;
    previousScopeInUrl.current = scopeInUrl;
    setBoxIdPrefixValue(normalizeBoxAddress(scopeInUrl));
  }, [scopeInUrl]);
  const setBoxIdPrefix = value => {
    setBoxIdPrefixValue(value);
    setAddressParams(current => { const next = new URLSearchParams(current); if (value) next.set('addressScope', value); else next.delete('addressScope'); return next; }, { replace: true, state: addressLocation.state });
  };
  const [selectedRooms, setSelectedRooms] = useState(() =>
    normalizeTagSelection(initialPersistedState?.selectedRooms),
  );
  const [selectedLocations, setSelectedLocations] = useState(() =>
    normalizeTagSelection(initialPersistedState?.selectedLocations),
  );
  const [selectedTags, setSelectedTags] = useState(() =>
    normalizeTagSelection(initialPersistedState?.selectedTags || initialPersistedState?.selectedTag),
  );
  const [tagOperator, setTagOperator] = useState(() =>
    normalizeTagOperator(initialPersistedState?.tagOperator),
  );
  const [sortOptions, setSortOptions] = useState(DEFAULT_BOX_SORT_OPTIONS);
  const { selectedSort, setSelectedSort, shuffleSeed, reshuffle } = useRetrievalBrowseSort({
    q: searchValue, boxIdPrefix, rooms: selectedRooms, locations: selectedLocations, tags: selectedTags,
  }, 'box');
  const [filterOptions, setFilterOptions] = useState(EMPTY_FILTER_OPTIONS);
  const [selectedBoxId, setSelectedBoxId] = useState(() =>
    normalizeBoxAddress(addressParams.get('boxAddress') || initialPersistedState?.selectedBoxId) || '',
  );
  useEffect(() => {
    const value = addressParams.get('boxAddress');
    setSelectedBoxId(normalizeBoxAddress(value));
  }, [addressParams]);
  const [selectedBoxDetails, setSelectedBoxDetails] = useState(null);
  const [boxDetailsLoading, setBoxDetailsLoading] = useState(false);
  const [boxDetailsError, setBoxDetailsError] = useState('');
  const [boxRecordsRevision, setBoxRecordsRevision] = useState(0);

  const [debouncedSearchValue] = useDebouncedValue(searchValue, 400);
  const [debouncedBoxIdPrefix, activateAddressQuery] = useDebouncedValue(boxIdPrefix, 400);
  const lastAddressLookup = useRef(addressParams.has('boxAddress')
    ? boxIdPrefix || (parseBoxAddress(searchValue)?.complete ? searchValue : '')
    : '');
  useEffect(() => {
    if (loading) return;
    const lookup = debouncedBoxIdPrefix || (parseBoxAddress(debouncedSearchValue)?.complete ? debouncedSearchValue : '');
    if (lookup === lastAddressLookup.current) return;
    const parsed = parseBoxAddress(lookup);
    if (!parsed?.complete) { lastAddressLookup.current = lookup; return; }
    if (!boxes.some(box => box.address === parsed.address || (box.kind === 'cabinet' && box.address === `${parsed.boxId}${parsed.cabinet}`))) return;
    lastAddressLookup.current = lookup;
    setSelectedBoxId(parsed.address);
    setAddressParams(current => { const next = new URLSearchParams(current); next.set('boxAddress', parsed.address); return next; }, { replace: true, state: addressLocation.state });
  }, [boxes, loading, debouncedBoxIdPrefix, debouncedSearchValue, setAddressParams, addressLocation.state]);
  const loadMoreControllerRef = useRef(null);
  const queryKeyRef = useRef('');

  const queryState = useMemo(
    () => ({
      q: debouncedSearchValue,
      addressScope: debouncedBoxIdPrefix,
      includeCabinets: true,
      rooms: selectedRooms,
      locations: selectedLocations,
      tags: scopedTag ? tagScope.tags : selectedTags,
      tagOperator: scopedTag ? tagScope.operator : tagOperator,
      tagSource: scopedTag ? 'box' : undefined,
      exactTag: scopedTag ? tagScope.tags : undefined,
      sort: selectedSort,
      shuffleSeed: selectedSort === 'random' ? shuffleSeed : '',
    }),
    [
      debouncedBoxIdPrefix,
      debouncedSearchValue,
      selectedRooms,
      selectedLocations,
      selectedSort,
      shuffleSeed,
      selectedTags,
      tagOperator,
      scopedTag,
      tagScope,
    ],
  );

  const queryKey = useMemo(
    () => JSON.stringify({ queryState, boxRecordsRevision }),
    [boxRecordsRevision, queryState],
  );

  useEffect(() => {
    const handleBoxUpdated = (event) => {
      const previousShortId = normalizeBoxAddress(event?.detail?.previousShortId);
      const nextShortId = normalizeBoxAddress(event?.detail?.box?.box_id);
      if (previousShortId && nextShortId) {
        setSelectedBoxId((current) =>
          normalizeBoxAddress(current) === previousShortId ? nextShortId : current
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
      selectedRooms,
      selectedTags,
      selectedLocations,
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
    selectedRooms,
    selectedLocations,
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
      setMatchCounts(null);
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
        setMatchCounts({ boxes: payload.physicalBoxMatches || 0, sections: payload.cabinetMatches || 0 });
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
        setMatchCounts({ boxes: 0, sections: 0 });
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
  }, [onAnalyticsChange, queryKey, queryState, setSelectedSort]);

  useEffect(() => {
    if (loading) return;

    const validIds = new Set(
      boxes
        .map((box) => normalizeBoxAddress(box?.address || box?.boxId))
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
      const normalizedCurrent = normalizeBoxAddress(current);
      if (normalizedCurrent && (validIds.has(normalizedCurrent) || validIds.has(normalizedCurrent.replace(/[1-9]\d?$/, '')))) {
        return normalizedCurrent;
      }

      if (isMobile) {
        return '';
      }

      return normalizeBoxAddress(boxes[0]?.address || boxes[0]?.boxId);
    });
  }, [boxes, isMobile, loading]);

  const handleSelectBox = useCallback(
    (rawBoxId) => {
      const normalized = normalizeBoxAddress(rawBoxId);
      if (!normalized) return;

      setAddressParams(current => { const next = new URLSearchParams(current); next.set('boxAddress', normalized); next.delete('shelves'); return next; }, { state: addressLocation.state });
      setSelectedBoxId((current) => {
        const currentNormalized = normalizeBoxAddress(current);
        if (isMobile && currentNormalized === normalized) {
          return '';
        }

        return normalized;
      });
    },
    [isMobile, setAddressParams, addressLocation.state],
  );

  useMissingInventoryRefresh(async () => {
    const key = queryKeyRef.current;
    try {
      const payload = await fetchRetrievalBoxesPage({ ...queryState, limit: Math.max(boxes.length, limit), offset: 0 });
      if (queryKeyRef.current !== key) return;
      setBoxes(normalizeRetrievalBoxesPage(payload.boxes));
      setMatchCounts({ boxes: payload.physicalBoxMatches, sections: payload.cabinetMatches });
      setTotal(Number(payload.total) || 0);
      setHasMore(Boolean(payload.hasMore));
      if (selectedBoxId) {
        const record = await fetchBoxTreeByShortId(parseBoxAddress(selectedBoxId)?.boxId);
        if (queryKeyRef.current === key) setSelectedBoxDetails(record);
      }
    } catch (failure) { setError(failure.message || 'Could not refresh box placement.'); }
  });

  const selectedBoxSummary = useMemo(() => {
    const normalizedSelected = normalizeBoxAddress(selectedBoxId);
    if (!normalizedSelected) return null;

    return (
      boxes.find(
        (box) => normalizeBoxAddress(box?.address || box?.boxId) === normalizedSelected || (box.kind === 'cabinet' && box.address === `${parseBoxAddress(normalizedSelected)?.boxId}${parseBoxAddress(normalizedSelected)?.cabinet}`),
      ) || null
    );
  }, [boxes, selectedBoxId]);

  useEffect(() => {
    const normalizedBoxId = normalizeBoxAddress(selectedBoxId);
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
        const detail = await fetchBoxTreeByShortId(parseBoxAddress(normalizedBoxId)?.boxId, {
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
        boxes: locationBoxes,
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
        const existingIds = new Set(current.map((box) => normalizeBoxAddress(box.address || box.boxId)));

        for (const box of nextBoxes) {
          const key = normalizeBoxAddress(box?.address || box?.boxId);
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
  const selectedCompartment = parseBoxAddress(selectedBoxId)?.compartmentKey || '';
  const selectedShelfKeys = readShelfSelection(addressParams.get('shelves'), selectedCompartment, selectedBoxSummary?.shelves || [], selectedCompartment);
  const scopedTree = selectedCompartment ? scopeBoxToShelves(selectedTree, selectedCompartment, selectedShelfKeys) : selectedTree;
  const directItems = selectedCompartment ? collectPlacedItems(scopedTree) : (selectedTree?.items || []);
  const shelfPicker = selectedBoxSummary?.kind === 'cabinet' ? <CabinetShelfPicker boxId={selectedBoxSummary.boxId} cabinetKey={selectedBoxSummary.compartmentKey} parentLabel={selectedBoxSummary.boxLabel} ownerBox={boxDetailsLoading ? null : selectedTree} shelves={selectedBoxSummary.shelves} selectedKeys={selectedShelfKeys} onChange={keys => {
    const key = keys.length === 1 ? keys[0] : selectedBoxSummary.compartmentKey[0];
    const address = `${selectedBoxSummary.boxId}${key}`;
    setSelectedBoxId(address);
    setAddressParams(current => { const next = new URLSearchParams(current); next.set('boxAddress', address); next.delete('shelves'); if (keys.length > 1) next.set('shelves', keys.join(',')); if (parseBoxAddress(boxIdPrefix)?.cabinet) next.set('addressScope', address); return next; }, { state: addressLocation.state });
  }} /> : null;
  const selectedBoxHref = selectedBoxId ? `/boxes/${selectedBoxId}` : '';
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
    <S.PageShell $mode="boxes">
      <RetrievalConsolePortal boxMatches={matchCounts?.boxes} sectionMatches={matchCounts?.sections} mode={mode} onModeChange={onModeChange} shown={boxes.length} total={total} loading={loading || loadingMore}
        scope={tagScope ? { ...tagScope, options: filterOptions.tags } : null}
        presentation={presentation} onPresentationChange={onPresentationChange} desktop={desktop}
        />
      <RetrievalSearchForm
        desktop={desktop}
        mode={mode}
        scope={tagScope ? { ...tagScope, options: filterOptions.tags } : null}
        onModeChange={onModeChange}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchLabel={tagScope ? 'Search This Tag' : 'Find Boxes'}
        searchPlaceholder={tagScope ? `Search boxes tagged #${tagScope.label}` : 'Search box name, location, or item tag'}
        boxIdPrefix={boxIdPrefix}
        onBoxIdPrefixChange={setBoxIdPrefix}
        onBoxAddressActivate={() => activateAddressQuery(boxIdPrefix)}
        filterOptions={filterOptions}
        selectedBoxRooms={selectedRooms}
        selectedBoxLocations={selectedLocations}
        selectedBoxTags={selectedTags}
        onBoxRoomsChange={setSelectedRooms}
        onBoxLocationsChange={setSelectedLocations}
        onBoxTagAdd={addSelectedTag}
        onBoxTagRemove={removeSelectedTag}
        tagOperator={tagOperator}
        onTagOperatorChange={setTagOperator}
        sortOptions={sortOptions}
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
        onReshuffle={reshuffle} shuffled={selectedSort === 'random'} loading={loading || loadingMore}
        finderMinimized={finderMinimized}
        onFinderDetachedChange={onFinderDetachedChange}
      />

      {error ? <S.ErrorState role="alert">{error}</S.ErrorState> : null}

      <S.ResultsPanel $headerless>
        {matchCounts ? <S.ExpandedMuted role="status">{matchCounts.boxes} boxes · {matchCounts.sections} sections</S.ExpandedMuted> : null}
        {loading ? (
          <S.LoadingState>Loading box retrieval results…</S.LoadingState>
        ) : !boxes.length ? (
          <S.EmptyState>No boxes or sections match the current search/filter.</S.EmptyState>
        ) : (
          <S.BoxCentricLayout>
            <S.BoxMapPanel>
              {groupedBoxes.map((group) => (
                <S.LocationSection key={group.location}>
                  <S.LocationSectionLabel>{group.location}</S.LocationSectionLabel>
                  <S.BoxList $presentation={presentation}>
                    {group.boxes.map((box) => {
                      const normalizedId = normalizeBoxAddress(box?.address || box?.boxId);
                      const parsedSelected = parseBoxAddress(selectedBoxId);
                      const isActive = normalizedId === selectedBoxId || (box.kind === 'cabinet' && normalizedId === `${parsedSelected?.boxId}${parsedSelected?.cabinet}`);
                      const inlinePanelId = `retrieval-box-inline-${normalizedId || box.id}`;
                      return (
                        <S.BoxListItem key={box.resultKey || box.id}>
                          <RetrievalBoxResultRow box={box} isActive={isActive}
                            onSelect={() => handleSelectBox(normalizedId)} isMobile={isMobile}
                            panelId={inlinePanelId} presentation={presentation} />

                          {isMobile && isActive ? (
                            <S.MobileInlineInspectPanel id={inlinePanelId}>
                              <BoxInspectContent
                                shelfPicker={shelfPicker}
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
                </S.LocationSection>
              ))}
            </S.BoxMapPanel>

            {!isMobile ? (
              <S.BoxInspectPanel>
                {!hasSelection ? (
                  <S.ExpandedMuted>Select a box to inspect its contents.</S.ExpandedMuted>
                ) : (
                  <BoxInspectContent
                    shelfPicker={shelfPicker}
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
              <S.ResultsEndState>All matching rows loaded.</S.ResultsEndState>
            )}
          </S.ResultsFooter>
        ) : null}
      </S.ResultsPanel>
    </S.PageShell>
  );
}
