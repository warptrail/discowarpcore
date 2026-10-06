import { useCallback, useEffect, useState } from 'react';

import { createLocation, listLocations, renameLocation, deleteLocation } from '../api/locations';

const subscribers = new Set();
let cache = [];
let loaded = false;
let fetchPromise = null;

const normalizeLocationPart = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');

const normalizeLocationStructure = (value) => ({
  room: normalizeLocationPart(value?.room),
  vicinity: normalizeLocationPart(value?.vicinity),
  specifics: normalizeLocationPart(value?.specifics),
  exactSpot: normalizeLocationPart(value?.exactSpot),
});

const locationStructureKey = (value) => {
  const { room, vicinity, specifics, exactSpot } = normalizeLocationStructure(value);
  return [room, vicinity, specifics, exactSpot].map((part) => part.toLowerCase()).join('\u001f');
};

const sortByName = (locations) =>
  [...(Array.isArray(locations) ? locations : [])].sort((a, b) =>
    locationStructureKey(a).localeCompare(locationStructureKey(b), undefined, {
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

  const createLocationInline = useCallback(async (location) => {
    const normalized = normalizeLocationStructure(location);
    if (!normalized.room) {
      throw new Error('Room is required');
    }

    const existing = cache.find(
      (loc) => locationStructureKey(loc) === locationStructureKey(normalized),
    );
    if (existing) return existing;

    try {
      const created = await createLocation(normalized);
      if (created?._id) {
        cache = sortByName([...cache, created]);
        loaded = true;
        publish();
        return created;
      }
      await fetchAndCacheLocations();
      const matched = cache.find(
        (loc) =>
          locationStructureKey(loc) === locationStructureKey(normalized),
      );
      if (matched) return matched;
      throw new Error('Location created but could not be resolved');
    } catch (e) {
      const msg = String(e?.message || '');
      if (/already exists/i.test(msg)) {
        await fetchAndCacheLocations();
        const matched = cache.find(
          (loc) =>
            locationStructureKey(loc) === locationStructureKey(normalized),
        );
        if (matched) return matched;
      }
      throw e;
    }
  }, []);

  const renameLocationInline = useCallback(async (id, location) => {
    const updated = await renameLocation(id, normalizeLocationStructure(location));
    if (!updated?._id) throw new Error('Location update did not return a saved location');
    cache = sortByName(cache.map((entry) => entry._id === id ? updated : entry));
    publish();
    return updated;
  }, []);

  const deleteLocationInline = useCallback(async (id) => {
    await deleteLocation(id);
    cache = cache.filter((entry) => entry._id !== id);
    publish();
  }, []);

  return {
    locations,
    loading,
    error,
    refreshLocations,
    createLocationInline,
    renameLocationInline,
    deleteLocationInline,
  };
}
