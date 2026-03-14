import { useCallback, useEffect, useState } from 'react';

import { createLocation, listLocations } from '../api/locations';

const subscribers = new Set();
let cache = [];
let loaded = false;
let fetchPromise = null;

const normalizeLocationName = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const sortByName = (locations) =>
  [...(Array.isArray(locations) ? locations : [])].sort((a, b) =>
    String(a?.name || '').localeCompare(String(b?.name || ''), undefined, {
      sensitivity: 'base',
      numeric: true,
    }),
  );

const publish = () => {
  subscribers.forEach((notify) => notify(cache));
};

const fetchAndCacheLocations = async () => {
  if (fetchPromise) return fetchPromise;

  fetchPromise = listLocations()
    .then((locations) => {
      cache = sortByName(locations);
      loaded = true;
      publish();
      return cache;
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
};

export default function useLocationRegistry() {
  const [locations, setLocations] = useState(cache);
  const [loading, setLoading] = useState(!loaded);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleUpdate = (nextLocations) => {
      setLocations(Array.isArray(nextLocations) ? nextLocations : []);
    };
    subscribers.add(handleUpdate);
    return () => subscribers.delete(handleUpdate);
  }, []);

  const refreshLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchAndCacheLocations();
      setLocations(next);
      return next;
    } catch (e) {
      setError(e?.message || 'Failed to load locations');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loaded) return;
    refreshLocations().catch(() => {});
  }, [refreshLocations]);

  const createLocationInline = useCallback(async (name) => {
    const normalized = String(name || '').trim().replace(/\s+/g, ' ');
    if (!normalized) {
      throw new Error('Location name is required');
    }

    const existing = cache.find(
      (loc) => normalizeLocationName(loc?.name) === normalizeLocationName(normalized),
    );
    if (existing) return existing;

    try {
      const created = await createLocation({ name: normalized });
      if (created?._id) {
        cache = sortByName([...cache, created]);
        loaded = true;
        publish();
        return created;
      }
      await fetchAndCacheLocations();
      const matched = cache.find(
        (loc) =>
          normalizeLocationName(loc?.name) ===
          normalizeLocationName(normalized),
      );
      if (matched) return matched;
      throw new Error('Location created but could not be resolved');
    } catch (e) {
      const msg = String(e?.message || '');
      if (/already exists/i.test(msg)) {
        await fetchAndCacheLocations();
        const matched = cache.find(
          (loc) =>
            normalizeLocationName(loc?.name) ===
            normalizeLocationName(normalized),
        );
        if (matched) return matched;
      }
      throw e;
    }
  }, []);

  return {
    locations,
    loading,
    error,
    refreshLocations,
    createLocationInline,
  };
}
