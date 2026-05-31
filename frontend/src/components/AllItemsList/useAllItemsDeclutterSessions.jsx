import { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  addItemsToDeclutterSession,
  createDeclutterSession,
  fetchDeclutterSessions,
} from '../../api/declutterSessions';
import { ToastContext } from '../Toast';

function normalizeItemIds(itemIds = []) {
  if (!Array.isArray(itemIds)) return [];

  const seen = new Set();
  const next = [];

  for (const entry of itemIds) {
    const normalized = String(entry || '').trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    next.push(normalized);
  }

  return next;
}

function summarizeAddResult(result, requestedCount) {
  const addedCount = Number(result?.addedCount || 0);
  const existingCount = Number(result?.existingCount || 0);
  const missingCount = Array.isArray(result?.missingItemIds)
    ? result.missingItemIds.length
    : 0;

  const parts = [];
  if (addedCount) parts.push(`${addedCount} added`);
  if (existingCount) parts.push(`${existingCount} already present`);
  if (missingCount) parts.push(`${missingCount} not found`);

  return parts.length
    ? parts.join(', ')
    : `${requestedCount} item${requestedCount === 1 ? '' : 's'} processed`;
}

export default function useAllItemsDeclutterSessions({
  enabled = false,
  selectedItemIds = [],
  onAdded = null,
}) {
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [newSessionName, setNewSessionName] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const selectedIds = useMemo(
    () => normalizeItemIds(selectedItemIds),
    [selectedItemIds]
  );

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    setError('');

    try {
      const nextSessions = await fetchDeclutterSessions({ status: 'active' });
      setSessions(nextSessions);
    } catch (err) {
      setError(err?.message || 'Failed to load declutter sessions.');
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void loadSessions();
  }, [enabled, loadSessions]);

  useEffect(() => {
    if (!enabled) {
      setSelectedSessionId('');
      setNewSessionName('');
      setError('');
      setAdding(false);
      return;
    }

    const activeIds = new Set(
      sessions.map((session) => String(session?.id || session?._id || '').trim())
    );
    if (selectedSessionId && activeIds.has(selectedSessionId)) return;
    const firstSessionId = sessions.length
      ? String(sessions[0]?.id || sessions[0]?._id || '').trim()
      : '';
    setSelectedSessionId(firstSessionId);
  }, [enabled, selectedSessionId, sessions]);

  const addSelectedToSession = useCallback(async (sessionId) => {
    const normalizedSessionId = String(sessionId || '').trim();
    if (!selectedIds.length) {
      showToast?.({
        variant: 'warning',
        title: 'No items selected',
        message: 'Select candidate items before adding them to a review queue.',
        timeoutMs: 3600,
      });
      return null;
    }

    if (!normalizedSessionId) {
      showToast?.({
        variant: 'warning',
        title: 'Session required',
        message: 'Choose or create a declutter session first.',
        timeoutMs: 3600,
      });
      return null;
    }

    const result = await addItemsToDeclutterSession(normalizedSessionId, selectedIds);
    const summary = summarizeAddResult(result, selectedIds.length);
    showToast?.({
      variant: 'success',
      title: 'Review queue updated',
      message: summary,
      timeoutMs: 4200,
    });
    onAdded?.();
    return result;
  }, [onAdded, selectedIds, showToast]);

  const addToSelectedSession = useCallback(async () => {
    try {
      setAdding(true);
      setError('');
      await addSelectedToSession(selectedSessionId);
    } catch (err) {
      setError(err?.message || 'Failed to add items to declutter session.');
      showToast?.({
        variant: 'danger',
        title: 'Declutter add failed',
        message: err?.message || 'Could not add selected items.',
        timeoutMs: 5200,
      });
    } finally {
      setAdding(false);
    }
  }, [addSelectedToSession, selectedSessionId, showToast]);

  const createSessionAndAdd = useCallback(async () => {
    const trimmedName = newSessionName.trim();
    if (!selectedIds.length) {
      showToast?.({
        variant: 'warning',
        title: 'No items selected',
        message: 'Select candidate items before creating a review queue.',
        timeoutMs: 3600,
      });
      return;
    }

    if (!trimmedName) {
      setError('Session name is required.');
      return;
    }

    try {
      setAdding(true);
      setError('');
      const session = await createDeclutterSession({ name: trimmedName });
      const sessionId = String(session?.id || session?._id || '').trim();
      if (!sessionId) throw new Error('Created session did not include an id.');
      await addSelectedToSession(sessionId);
      setNewSessionName('');
      setSelectedSessionId(sessionId);
      await loadSessions();
    } catch (err) {
      setError(err?.message || 'Failed to create declutter session.');
      showToast?.({
        variant: 'danger',
        title: 'Declutter session failed',
        message: err?.message || 'Could not create a session.',
        timeoutMs: 5200,
      });
    } finally {
      setAdding(false);
    }
  }, [addSelectedToSession, loadSessions, newSessionName, selectedIds.length, showToast]);

  return {
    sessions,
    selectedSessionId,
    newSessionName,
    loadingSessions,
    adding,
    error,
    setSelectedSessionId,
    setNewSessionName,
    loadSessions,
    addToSelectedSession,
    createSessionAndAdd,
  };
}
