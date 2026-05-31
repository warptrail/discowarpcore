import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import {
  addItemsToDeclutterSession,
  createDeclutterSession,
  fetchDeclutterSessions,
} from '../../api/declutterSessions';

const Panel = styled.div`
  display: grid;
  gap: 0.56rem;
  min-width: min(100%, 460px);
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(160px, 1fr) auto;
  gap: 0.42rem;
  align-items: end;

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: grid;
  gap: 0.18rem;
`;

const Label = styled.span`
  color: rgba(230, 237, 243, 0.64);
  font-size: 0.6rem;
  font-weight: 820;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
`;

const Select = styled.select`
  width: 100%;
  min-height: 31px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 4px;
  background: rgba(9, 14, 20, 0.96);
  color: #e6edf3;
  padding: 0.34rem 0.46rem;
  font-size: 0.78rem;
`;

const Input = styled.input`
  width: 100%;
  min-height: 31px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 4px;
  background: rgba(9, 14, 20, 0.96);
  color: #e6edf3;
  padding: 0.34rem 0.46rem;
  font-size: 0.78rem;

  &::placeholder {
    color: rgba(230, 237, 243, 0.42);
  }
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.36rem;
  justify-content: flex-end;
`;

const Button = styled.button`
  min-height: 31px;
  border-radius: 4px;
  border: 1px solid
    ${({ $tone = 'default' }) =>
      $tone === 'primary'
        ? 'rgba(100, 188, 151, 0.82)'
        : 'rgba(102, 167, 212, 0.56)'};
  background:
    ${({ $tone = 'default' }) =>
      $tone === 'primary'
        ? 'linear-gradient(180deg, rgba(23, 75, 60, 0.96), rgba(16, 51, 42, 0.96))'
        : 'rgba(14, 24, 34, 0.95)'};
  color: ${({ $tone = 'default' }) => ($tone === 'primary' ? '#e8fff5' : '#cfefff')};
  font-size: 0.64rem;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0 0.58rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.54;
    cursor: not-allowed;
  }
`;

const StatusText = styled.div`
  color: rgba(230, 237, 243, 0.66);
  font-size: 0.76rem;
  line-height: 1.35;
`;

const ErrorText = styled(StatusText)`
  color: #ffd3cf;
`;

function summarizeAddResult(result, sessionName) {
  const addedCount = Number(result?.addedCount || 0);
  const existingCount = Number(result?.existingCount || 0);

  if (addedCount > 0) {
    return `Added to "${sessionName}".`;
  }

  if (existingCount > 0) {
    return `Already in "${sessionName}".`;
  }

  return `Review queue "${sessionName}" updated.`;
}

export default function AddItemToDeclutterSessionToastContent({
  itemId,
  itemName = 'Item',
  onAdded,
  onCancel,
}) {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [newSessionName, setNewSessionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    async function loadSessions() {
      try {
        setLoading(true);
        setError('');
        const nextSessions = await fetchDeclutterSessions({ status: 'active' });
        if (!alive) return;
        setSessions(nextSessions);
        setSelectedSessionId((current) => {
          if (current) return current;
          return String(nextSessions[0]?.id || nextSessions[0]?._id || '').trim();
        });
      } catch (err) {
        if (!alive) return;
        setError(err?.message || 'Failed to load declutter sessions.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadSessions();
    return () => {
      alive = false;
    };
  }, []);

  const selectedSession = useMemo(
    () =>
      sessions.find(
        (session) =>
          String(session?.id || session?._id || '').trim() === selectedSessionId
      ) || null,
    [selectedSessionId, sessions]
  );

  const handleAddToSelected = async () => {
    if (!selectedSessionId || !itemId) return;

    try {
      setSaving(true);
      setError('');
      const result = await addItemsToDeclutterSession(selectedSessionId, [itemId]);
      const sessionName = selectedSession?.name || 'Declutter Session';
      onAdded?.({
        sessionId: selectedSessionId,
        sessionName,
        message: summarizeAddResult(result, sessionName),
        result,
      });
    } catch (err) {
      setError(err?.message || 'Failed to add item to declutter session.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAndAdd = async () => {
    const trimmedName = newSessionName.trim();
    if (!trimmedName || !itemId) return;

    try {
      setSaving(true);
      setError('');
      const session = await createDeclutterSession({ name: trimmedName });
      const sessionId = String(session?.id || session?._id || '').trim();
      if (!sessionId) throw new Error('Created session did not include an id.');
      const result = await addItemsToDeclutterSession(sessionId, [itemId]);
      onAdded?.({
        sessionId,
        sessionName: session?.name || trimmedName,
        message: summarizeAddResult(result, session?.name || trimmedName),
        result,
      });
    } catch (err) {
      setError(err?.message || 'Failed to create declutter session.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel>
      {loading ? (
        <StatusText>Loading active declutter sessions...</StatusText>
      ) : (
        <>
          <FieldGrid>
            <Field>
              <Label>Existing Session</Label>
              <Select
                value={selectedSessionId}
                disabled={saving || !sessions.length}
                onChange={(event) => setSelectedSessionId(event.target.value)}
              >
                {sessions.length ? null : (
                  <option value="">No active sessions</option>
                )}
                {sessions.map((session) => {
                  const sessionId = String(session?.id || session?._id || '').trim();
                  return (
                    <option key={sessionId} value={sessionId}>
                      {session?.name || 'Declutter Session'} - {session?.counts?.total || 0} items
                    </option>
                  );
                })}
              </Select>
            </Field>
            <Button
              type="button"
              $tone="primary"
              disabled={saving || !selectedSessionId}
              onClick={handleAddToSelected}
            >
              {saving ? 'Adding...' : 'Add'}
            </Button>
          </FieldGrid>

          <FieldGrid>
            <Field>
              <Label>New Session</Label>
              <Input
                value={newSessionName}
                disabled={saving}
                onChange={(event) => setNewSessionName(event.target.value)}
                placeholder={`${itemName} review`}
              />
            </Field>
            <Button
              type="button"
              $tone="primary"
              disabled={saving || !newSessionName.trim()}
              onClick={handleCreateAndAdd}
            >
              Create + Add
            </Button>
          </FieldGrid>
        </>
      )}

      {error ? <ErrorText role="alert">{error}</ErrorText> : null}

      <ActionRow>
        <Button type="button" disabled={saving} onClick={() => onCancel?.()}>
          Cancel
        </Button>
      </ActionRow>
    </Panel>
  );
}
