import { useCallback, useEffect, useState } from 'react';

import { listBoxGroups } from '../api/boxes';

const subscribers = new Set();
let cache = [];
let loaded = false;
let fetchPromise = null;

const sortAndDeduplicateGroups = (groups) => {
  const byKey = new Map();

  for (const entry of Array.isArray(groups) ? groups : []) {
    const label = String(entry || '').trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (!byKey.has(key)) byKey.set(key, label);
  }

  return [...byKey.values()].sort((left, right) =>
    String(left).localeCompare(String(right), undefined, {
      sensitivity: 'base',
      numeric: true,
    }),
  );
};

const publish = () => {
  subscribers.forEach((notify) => notify(cache));
};

const fetchAndCacheGroups = async () => {
  if (fetchPromise) return fetchPromise;

  fetchPromise = listBoxGroups()
    .then((groups) => {
      cache = sortAndDeduplicateGroups(groups);
      loaded = true;
      publish();
      return cache;
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
};

export default function useBoxGroupRegistry() {
  const [groups, setGroups] = useState(cache);
  const [loading, setLoading] = useState(!loaded);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleUpdate = (nextGroups) => {
      setGroups(Array.isArray(nextGroups) ? nextGroups : []);
    };

    subscribers.add(handleUpdate);
    return () => subscribers.delete(handleUpdate);
  }, []);

  const refreshGroups = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const next = await fetchAndCacheGroups();
      setGroups(next);
      return next;
    } catch (e) {
      setError(e?.message || 'Failed to load box groups');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loaded) return;
    refreshGroups().catch(() => {});
  }, [refreshGroups]);

  return {
    groups,
    loading,
    error,
    refreshGroups,
  };
}
