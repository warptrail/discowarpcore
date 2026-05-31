import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createDeclutterSession,
  deleteDeclutterSession,
  fetchDeclutterSessions,
  updateDeclutterSession,
} from '../../api/declutterSessions';
import * as S from './Declutter.styles';
import DeclutterSessionCards from './DeclutterSessionCards';

function normalizeStatusFilter(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'all' || normalized === 'archived') return normalized;
  return 'active';
}

export default function DeclutterPage() {
  const [sessions, setSessions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('active');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busySessionId, setBusySessionId] = useState('');
  const [error, setError] = useState('');

  const loadSessions = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');

    try {
      const nextSessions = await fetchDeclutterSessions({
        status: statusFilter === 'all' ? '' : statusFilter,
      });
      setSessions(nextSessions);
    } catch (err) {
      setError(err?.message || 'Failed to load declutter sessions.');
      if (!silent) setSessions([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort((left, right) => {
        const leftStatus = String(left?.status || '');
        const rightStatus = String(right?.status || '');
        if (leftStatus !== rightStatus) return leftStatus.localeCompare(rightStatus);
        return String(right?.updatedAt || '').localeCompare(String(left?.updatedAt || ''));
      }),
    [sessions]
  );

  const handleCreate = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Declutter session name is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await createDeclutterSession({
        name: trimmedName,
        description: description.trim(),
      });
      setName('');
      setDescription('');
      await loadSessions({ silent: true });
    } catch (err) {
      setError(err?.message || 'Failed to create declutter session.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleArchive = async (session) => {
    const sessionId = String(session?.id || session?._id || '').trim();
    if (!sessionId) return;

    const nextStatus =
      String(session?.status || '').toLowerCase() === 'archived'
        ? 'active'
        : 'archived';

    try {
      setBusySessionId(sessionId);
      setError('');
      await updateDeclutterSession(sessionId, { status: nextStatus });
      await loadSessions({ silent: true });
    } catch (err) {
      setError(err?.message || 'Failed to update declutter session.');
    } finally {
      setBusySessionId('');
    }
  };

  const handleDelete = async (session) => {
    const sessionId = String(session?.id || session?._id || '').trim();
    if (!sessionId) return;

    const confirmed = window.confirm(
      `Delete "${session?.name || 'Declutter Session'}" and its review queue?`
    );
    if (!confirmed) return;

    try {
      setBusySessionId(sessionId);
      setError('');
      await deleteDeclutterSession(sessionId);
      await loadSessions({ silent: true });
    } catch (err) {
      setError(err?.message || 'Failed to delete declutter session.');
    } finally {
      setBusySessionId('');
    }
  };

  return (
    <S.PageShell>
      <S.PageHeader>
        <S.HeaderTop>
          <div>
            <S.Eyebrow>Declutter Sessions</S.Eyebrow>
            <S.Title>Review Queue Control</S.Title>
          </div>
          <S.HeaderActions>
            <S.Field>
              <S.FieldLabel>Status</S.FieldLabel>
              <S.Select
                value={statusFilter}
                onChange={(event) => setStatusFilter(normalizeStatusFilter(event.target.value))}
              >
                <option value="active">Active Sessions</option>
                <option value="archived">Archived Sessions</option>
                <option value="all">All Sessions</option>
              </S.Select>
            </S.Field>
          </S.HeaderActions>
        </S.HeaderTop>
      </S.PageHeader>

      <S.FormPanel onSubmit={handleCreate}>
        <S.Field>
          <S.FieldLabel>Name</S.FieldLabel>
          <S.Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Garage shelf pass"
          />
        </S.Field>
        <S.Field>
          <S.FieldLabel>Description</S.FieldLabel>
          <S.Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Candidate items for review"
          />
        </S.Field>
        <S.Button type="submit" $tone="primary" disabled={saving}>
          {saving ? 'Creating...' : 'Create Session'}
        </S.Button>
      </S.FormPanel>

      {error ? <S.ErrorState role="alert">{error}</S.ErrorState> : null}

      {loading ? (
        <S.StatusPanel>Loading declutter sessions...</S.StatusPanel>
      ) : sortedSessions.length ? (
        <DeclutterSessionCards
          sessions={sortedSessions}
          busySessionId={busySessionId}
          onToggleArchive={handleToggleArchive}
          onDelete={handleDelete}
        />
      ) : (
        <S.StatusPanel>No declutter sessions match this view.</S.StatusPanel>
      )}
    </S.PageShell>
  );
}
