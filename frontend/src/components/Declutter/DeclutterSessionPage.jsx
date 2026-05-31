import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  fetchDeclutterSession,
  removeItemFromDeclutterSession,
  resetDeclutterSession,
  updateDeclutterSessionItem,
} from '../../api/declutterSessions';
import * as S from './Declutter.styles';
import DeclutterCounts from './DeclutterCounts';
import DeclutterReviewCard from './DeclutterReviewCard';
import DeclutterSessionItemList from './DeclutterSessionItemList';
import {
  countSessionItems,
  getReviewedCount,
  getSessionCounts,
  normalizeDecision,
} from './declutterUtils';

function mergeUpdatedSessionItem(currentItems, updated) {
  if (!updated?.itemId) return currentItems;

  return currentItems.map((entry) => {
    if (String(entry?.itemId || '') !== String(updated.itemId || '')) return entry;
    return {
      ...entry,
      ...updated,
      item: entry.item,
    };
  });
}

export default function DeclutterSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [mode, setMode] = useState('review');
  const [decisionFilter, setDecisionFilter] = useState('all');
  const [reviewCursor, setReviewCursor] = useState(0);
  const [notesDraft, setNotesDraft] = useState('');
  const [lastDecision, setLastDecision] = useState(null);
  const [savingDecision, setSavingDecision] = useState('');
  const [removingItemId, setRemovingItemId] = useState('');
  const [resettingItemId, setResettingItemId] = useState('');
  const [resettingSession, setResettingSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshSession = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError('');

    try {
      const payload = await fetchDeclutterSession(sessionId);
      setSession(payload.session);
      setItems(payload.items);
    } catch (err) {
      setError(err?.message || 'Failed to load declutter session.');
      setSession(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const counts = useMemo(() => getSessionCounts(session, items), [items, session]);
  const reviewedCount = getReviewedCount(counts);

  const pendingItems = useMemo(
    () => items.filter((entry) => normalizeDecision(entry?.decision) === 'pending'),
    [items]
  );

  const currentReviewItem = pendingItems.length
    ? pendingItems[Math.min(reviewCursor, pendingItems.length - 1)]
    : null;

  const visibleItems = useMemo(() => {
    if (decisionFilter === 'all') return items;
    return items.filter((entry) => normalizeDecision(entry?.decision) === decisionFilter);
  }, [decisionFilter, items]);

  useEffect(() => {
    if (reviewCursor < pendingItems.length) return;
    setReviewCursor(Math.max(0, pendingItems.length - 1));
  }, [pendingItems.length, reviewCursor]);

  useEffect(() => {
    setNotesDraft(currentReviewItem?.notes || '');
  }, [currentReviewItem?.id, currentReviewItem?.notes]);

  const replaceSessionItem = useCallback((updated) => {
    setItems((currentItems) => {
      const nextItems = mergeUpdatedSessionItem(currentItems, updated);
      setSession((currentSession) =>
        currentSession
          ? { ...currentSession, counts: countSessionItems(nextItems) }
          : currentSession
      );
      return nextItems;
    });
  }, []);

  const removeSessionItemLocally = useCallback((itemId) => {
    setItems((currentItems) => {
      const nextItems = currentItems.filter(
        (entry) => String(entry?.itemId || '') !== String(itemId || '')
      );
      setSession((currentSession) =>
        currentSession
          ? { ...currentSession, counts: countSessionItems(nextItems) }
          : currentSession
      );
      return nextItems;
    });
  }, []);

  const handleDecision = async (decision) => {
    const itemId = String(currentReviewItem?.itemId || '').trim();
    if (!sessionId || !itemId) return;

    try {
      setSavingDecision(decision);
      setError('');
      const previous = {
        itemId,
        decision: currentReviewItem.decision || 'pending',
        notes: currentReviewItem.notes || '',
      };
      const updated = await updateDeclutterSessionItem(sessionId, itemId, {
        decision,
        notes: notesDraft,
      });
      replaceSessionItem(updated);
      setLastDecision(previous);
    } catch (err) {
      setError(err?.message || 'Failed to save decision.');
    } finally {
      setSavingDecision('');
    }
  };

  const handleSkip = () => {
    if (pendingItems.length <= 1) return;
    setReviewCursor((current) => (current + 1) % pendingItems.length);
  };

  const handleUndoLast = async () => {
    if (!sessionId || !lastDecision?.itemId) return;

    try {
      setSavingDecision('undo');
      setError('');
      const updated = await updateDeclutterSessionItem(
        sessionId,
        lastDecision.itemId,
        {
          decision: lastDecision.decision || 'pending',
          notes: lastDecision.notes || '',
        }
      );
      replaceSessionItem(updated);
      setLastDecision(null);
    } catch (err) {
      setError(err?.message || 'Failed to undo decision.');
    } finally {
      setSavingDecision('');
    }
  };

  const handleRemoveItem = async (sessionItem) => {
    const itemId = String(sessionItem?.itemId || '').trim();
    if (!sessionId || !itemId) return;

    try {
      setRemovingItemId(itemId);
      setError('');
      await removeItemFromDeclutterSession(sessionId, itemId);
      removeSessionItemLocally(itemId);
    } catch (err) {
      setError(err?.message || 'Failed to remove item from session.');
    } finally {
      setRemovingItemId('');
    }
  };

  const handleResetItemDecision = async (sessionItem) => {
    const itemId = String(sessionItem?.itemId || '').trim();
    if (!sessionId || !itemId) return;

    try {
      setResettingItemId(itemId);
      setError('');
      const updated = await updateDeclutterSessionItem(sessionId, itemId, {
        decision: 'pending',
      });
      replaceSessionItem(updated);
      if (lastDecision?.itemId === itemId) {
        setLastDecision(null);
      }
    } catch (err) {
      setError(err?.message || 'Failed to reset item decision.');
    } finally {
      setResettingItemId('');
    }
  };

  const handleResetSession = async () => {
    if (!sessionId || !items.length) return;

    const confirmed = window.confirm(
      'Reset all decisions in this Declutter Session to Pending Review? Candidate items and review notes will stay in the queue.'
    );
    if (!confirmed) return;

    try {
      setResettingSession(true);
      setError('');
      const result = await resetDeclutterSession(sessionId);
      setItems((currentItems) =>
        currentItems.map((entry) => ({
          ...entry,
          decision: 'pending',
          decidedAt: null,
          decidedBy: '',
        }))
      );
      setSession((currentSession) => result?.session || currentSession);
      setReviewCursor(0);
      setLastDecision(null);
      setDecisionFilter('all');
    } catch (err) {
      setError(err?.message || 'Failed to reset declutter session.');
    } finally {
      setResettingSession(false);
    }
  };

  if (loading) {
    return (
      <S.PageShell>
        <S.StatusPanel>Loading review queue...</S.StatusPanel>
      </S.PageShell>
    );
  }

  if (!session) {
    return (
      <S.PageShell>
        <S.ErrorState role="alert">
          {error || 'Declutter session was not found.'}
        </S.ErrorState>
        <S.Button type="button" onClick={() => navigate('/declutter')}>
          Back to Sessions
        </S.Button>
      </S.PageShell>
    );
  }

  const progressText = `${reviewedCount} / ${counts.total} reviewed`;

  return (
    <S.PageShell>
      <S.PageHeader>
        <S.HeaderTop>
          <div>
            <S.Eyebrow>Declutter Session</S.Eyebrow>
            <S.Title>{session.name || 'Review Queue'}</S.Title>
            {session.description ? (
              <S.HeaderMeta>{session.description}</S.HeaderMeta>
            ) : null}
          </div>
          <S.HeaderActions>
            <S.Button
              type="button"
              $tone="warning"
              disabled={resettingSession || !items.length}
              onClick={handleResetSession}
            >
              {resettingSession ? 'Resetting...' : 'Reset Session'}
            </S.Button>
            <S.LinkButton to="/declutter">All Sessions</S.LinkButton>
          </S.HeaderActions>
        </S.HeaderTop>
        <DeclutterCounts session={session} items={items} />
      </S.PageHeader>

      <S.ModeBar>
        <S.ModeGroup>
          <S.ModeButton
            type="button"
            $active={mode === 'review'}
            onClick={() => setMode('review')}
          >
            Review Mode
          </S.ModeButton>
          <S.ModeButton
            type="button"
            $active={mode === 'list'}
            onClick={() => setMode('list')}
          >
            Queue List
          </S.ModeButton>
        </S.ModeGroup>
        <S.ProgressText>{progressText}</S.ProgressText>
      </S.ModeBar>

      {error ? <S.ErrorState role="alert">{error}</S.ErrorState> : null}

      <S.PlaceholderNote>
        Apply Dispositions is planned as a separate workflow. These decisions do not
        change item status, disposition history, box, or location.
      </S.PlaceholderNote>

      {mode === 'review' ? (
        <DeclutterReviewCard
          sessionItem={currentReviewItem}
          progressText={progressText}
          notesDraft={notesDraft}
          savingDecision={savingDecision}
          canUndo={Boolean(lastDecision)}
          onNotesDraftChange={setNotesDraft}
          onDecision={handleDecision}
          onSkip={handleSkip}
          onUndo={handleUndoLast}
        />
      ) : (
        <DeclutterSessionItemList
          items={visibleItems}
          decisionFilter={decisionFilter}
          removingItemId={removingItemId}
          resettingItemId={resettingItemId}
          onDecisionFilterChange={setDecisionFilter}
          onRemoveItem={handleRemoveItem}
          onResetDecision={handleResetItemDecision}
        />
      )}
    </S.PageShell>
  );
}
