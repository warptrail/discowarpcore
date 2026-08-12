import { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '../api/API_BASE';
import { BOX_RECORD_UPDATED_EVENT } from '../constants/inventoryFinderEvents';

const OPERATIONS_PAGE_LIMIT = 50;

function normalizeGroupLabel(value) {
  return String(value || '').trim();
}

function collectGroupOptionsFromTree(nodes) {
  const byKey = new Map();
  const walk = (list) => {
    for (const node of list || []) {
      const label = normalizeGroupLabel(node?.group);
      if (label && !byKey.has(label.toLowerCase())) byKey.set(label.toLowerCase(), label);
      walk(node?.childBoxes);
    }
  };
  walk(nodes);
  return [...byKey.values()].sort((left, right) => left.localeCompare(right, undefined, {
    sensitivity: 'base',
    numeric: true,
  }));
}

export default function useOperationsData({ includeSupportingData = true } = {}) {
  const [boxes, setBoxes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [orphanedItems, setOrphanedItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const requestRefresh = useCallback(() => setRefreshTick((current) => current + 1), []);

  useEffect(() => {
    const handleBoxUpdated = () => requestRefresh();
    window.addEventListener(BOX_RECORD_UPDATED_EVENT, handleBoxUpdated);
    return () => window.removeEventListener(BOX_RECORD_UPDATED_EVENT, handleBoxUpdated);
  }, [requestRefresh]);

  useEffect(() => {
    const controller = new AbortController();
    const buildBoxesQuery = (requestedPage) => new URLSearchParams({
      page: String(requestedPage),
      limit: String(OPERATIONS_PAGE_LIMIT),
    });

    const load = async () => {
      try {
        const boxesRequest = fetch(`${API_BASE}/api/boxes/tree?${buildBoxesQuery(1)}`, {
          signal: controller.signal,
        });
        const orphanedRequest = includeSupportingData
          ? fetch(`${API_BASE}/api/items/orphaned?sort=recent&limit=10000`, {
            signal: controller.signal,
          })
          : Promise.resolve(null);
        const locationsRequest = includeSupportingData
          ? fetch(`${API_BASE}/api/locations`, { signal: controller.signal })
          : Promise.resolve(null);
        const [boxesResponse, orphanedResponse, locationsResponse] = await Promise.all([
          boxesRequest,
          orphanedRequest,
          locationsRequest,
        ]);
        if (!boxesResponse.ok) throw new Error(`Failed to fetch boxes (${boxesResponse.status})`);

        const boxesBody = await boxesResponse.json();
        const firstPage = Array.isArray(boxesBody?.items)
          ? boxesBody.items
          : Array.isArray(boxesBody)
            ? boxesBody
            : [];
        const apiTotal = Number(boxesBody?.total);
        const apiTotalPages = Number(boxesBody?.totalPages);
        const pageCount = Number.isFinite(apiTotalPages)
          ? Math.max(1, apiTotalPages)
          : Math.max(1, Math.ceil(firstPage.length / OPERATIONS_PAGE_LIMIT));
        const remainingPages = pageCount > 1
          ? await Promise.all(
            Array.from({ length: pageCount - 1 }, async (_, index) => {
              const response = await fetch(
                `${API_BASE}/api/boxes/tree?${buildBoxesQuery(index + 2)}`,
                { signal: controller.signal },
              );
              const body = await response.json();
              return Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : [];
            }),
          )
          : [];
        const allBoxes = [firstPage, ...remainingPages].flat();
        const nextTotal = Number.isFinite(apiTotal) ? apiTotal : allBoxes.length;
        const apiGroups = Array.isArray(boxesBody?.filters?.groups)
          ? boxesBody.filters.groups
          : collectGroupOptionsFromTree(allBoxes);
        const orphanedBody = orphanedResponse?.ok ? await orphanedResponse.json() : [];
        const locationsBody = locationsResponse?.ok ? await locationsResponse.json() : {};
        if (controller.signal.aborted) return;

        setBoxes(allBoxes);
        setGroups(apiGroups.map(normalizeGroupLabel).filter(Boolean));
        setTotal(nextTotal);
        setTotalPages(Math.max(1, Math.ceil(nextTotal / OPERATIONS_PAGE_LIMIT)));
        setOrphanedItems(
          Array.isArray(orphanedBody)
            ? orphanedBody
            : Array.isArray(orphanedBody?.items)
              ? orphanedBody.items
              : [],
        );
        setLocations(Array.isArray(locationsBody?.locations) ? locationsBody.locations : []);
      } catch (error) {
        if (error?.name === 'AbortError') return;
        console.error('Error fetching operations data:', error);
      }
    };

    void load();
    return () => controller.abort();
  }, [includeSupportingData, refreshTick]);

  return {
    boxes,
    groups,
    page,
    setPage,
    total,
    totalPages,
    orphanedItems,
    orphanedCount: orphanedItems.length,
    locations,
    requestRefresh,
    pageLimit: OPERATIONS_PAGE_LIMIT,
  };
}
