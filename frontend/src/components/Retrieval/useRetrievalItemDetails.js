import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchItemDetails } from '../../api/itemDetails';

const EMPTY_DETAIL_RESOURCE = Object.freeze({
  status: 'idle',
  data: null,
  error: '',
});

function normalizeItemId(value) {
  return String(value || '').trim();
}

export default function useRetrievalItemDetails(activeItemId) {
  const [resourcesById, setResourcesById] = useState({});
  const resourcesRef = useRef(resourcesById);
  const requestRef = useRef(null);
  const mutationOverlayRef = useRef({});

  const updateResource = useCallback((itemId, updater) => {
    const id = normalizeItemId(itemId);
    if (!id) return;

    setResourcesById((current) => {
      const currentResource = current[id] || EMPTY_DETAIL_RESOURCE;
      const nextResource =
        typeof updater === 'function' ? updater(currentResource) : updater;
      const next = { ...current, [id]: nextResource };
      resourcesRef.current = next;
      return next;
    });
  }, []);

  const loadDetails = useCallback(
    async (rawItemId, { force = false } = {}) => {
      const itemId = normalizeItemId(rawItemId);
      if (!itemId) return;

      const cached = resourcesRef.current[itemId] || EMPTY_DETAIL_RESOURCE;
      if (!force && (cached.status === 'loading' || cached.status === 'ready')) {
        return;
      }

      if (requestRef.current) {
        requestRef.current.controller.abort();
      }

      const controller = new AbortController();
      requestRef.current = { itemId, controller };
      updateResource(itemId, (current) => ({
        ...current,
        status: 'loading',
        error: '',
      }));

      try {
        const data = await fetchItemDetails(itemId, { signal: controller.signal });
        if (controller.signal.aborted) return;

        updateResource(itemId, (current) => ({
          status: 'ready',
          data: {
            ...(current.data && typeof current.data === 'object' ? current.data : {}),
            ...(data && typeof data === 'object' ? data : {}),
            ...(mutationOverlayRef.current[itemId] || {}),
          },
          error: '',
        }));
      } catch (error) {
        if (error?.name === 'AbortError' || controller.signal.aborted) return;
        updateResource(itemId, (current) => ({
          ...current,
          status: 'error',
          error: error?.message || 'Item dossier data could not be loaded.',
        }));
      } finally {
        if (requestRef.current?.controller === controller) {
          requestRef.current = null;
        }
      }
    },
    [updateResource],
  );

  useEffect(() => {
    const itemId = normalizeItemId(activeItemId);

    if (requestRef.current && requestRef.current.itemId !== itemId) {
      const obsoleteItemId = requestRef.current.itemId;
      requestRef.current.controller.abort();
      requestRef.current = null;
      updateResource(obsoleteItemId, (current) => ({
        ...current,
        status: current.status === 'loading' ? 'idle' : current.status,
      }));
    }

    if (itemId) loadDetails(itemId);
  }, [activeItemId, loadDetails, updateResource]);

  useEffect(
    () => () => {
      requestRef.current?.controller.abort();
    },
    [],
  );

  const retry = useCallback(
    (itemId) => loadDetails(itemId, { force: true }),
    [loadDetails],
  );

  const merge = useCallback(
    (rawItemId, update) => {
      const itemId = normalizeItemId(rawItemId);
      if (!itemId || !update || typeof update !== 'object') return;

      mutationOverlayRef.current[itemId] = {
        ...(mutationOverlayRef.current[itemId] || {}),
        ...update,
      };

      updateResource(itemId, (current) => ({
        status:
          current.status === 'ready' || current.status === 'loading'
            ? current.status
            : 'idle',
        data: {
          ...(current.data && typeof current.data === 'object' ? current.data : {}),
          ...update,
        },
        error: current.status === 'error' ? '' : current.error,
      }));
    },
    [updateResource],
  );

  const remove = useCallback((rawItemId) => {
    const itemId = normalizeItemId(rawItemId);
    if (!itemId) return;

    if (requestRef.current?.itemId === itemId) {
      requestRef.current.controller.abort();
      requestRef.current = null;
    }
    delete mutationOverlayRef.current[itemId];

    setResourcesById((current) => {
      if (!current[itemId]) return current;
      const next = { ...current };
      delete next[itemId];
      resourcesRef.current = next;
      return next;
    });
  }, []);

  const activeId = normalizeItemId(activeItemId);
  const detailResource = useMemo(() => {
    const resource = activeId
      ? resourcesById[activeId] || EMPTY_DETAIL_RESOURCE
      : EMPTY_DETAIL_RESOURCE;
    return {
      ...resource,
      retry: activeId ? () => retry(activeId) : () => {},
    };
  }, [activeId, resourcesById, retry]);

  return {
    detailResource,
    merge,
    remove,
  };
}
