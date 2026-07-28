import { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  fetchDeclutterDeck,
  fetchDeclutterActionResources,
  completeDeclutterAction,
  reopenDeclutterAction,
  reopenDeclutterCandidate,
  rerouteDeclutterAction,
  resetDeclutterVote,
  resetAllDeclutterVotes,
  restoreDeclutterActionAsKeep,
  voteOnDeclutterCandidate,
} from '../../api/declutterDeck';
import * as S from './Declutter.styles';
import DeclutterCandidateLane from './DeclutterCandidateLane';
import DeclutterPlayerPicker from './DeclutterPlayerPicker';
import DeclutterProgressPanel from './DeclutterProgressPanel';
import DeclutterReviewCard from './DeclutterReviewCard';
import DeclutterWaitingOverlay from './DeclutterWaitingOverlay';
import DeclutterCoolingOffLane from './DeclutterCoolingOffLane';
import DeclutterActionsPanel from './DeclutterActionsPanel';
import DeclutterHoldButton from './DeclutterHoldButton';
import { getStoredDeclutterPlayer } from './declutterPlayers';
import { ToastContext } from '../Toast';

const CARD_EXIT_DURATION_MS = 260;

function waitForCardExit() {
  return new Promise((resolve) => window.setTimeout(resolve, CARD_EXIT_DURATION_MS));
}

export default function DeclutterDeckPage() {
  const [player, setPlayer] = useState(getStoredDeclutterPlayer);
  const [deck, setDeck] = useState(null);
  const [mode, setMode] = useState('deck');
  const [notesDraft, setNotesDraft] = useState('');
  const [saving, setSaving] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isWaitingOverlayOpen, setIsWaitingOverlayOpen] = useState(false);
  const [stagingBoxes, setStagingBoxes] = useState([]);
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;

  const loadDeck = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      setDeck(await fetchDeclutterDeck(player));
    } catch (err) {
      setError(err?.message || 'Failed to load the Declutter Deck.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [player]);

  useEffect(() => { void loadDeck(); }, [loadDeck]);

  const mergeCandidate = useCallback((updated) => {
    if (!updated?.id) return;
    setDeck((current) => {
      if (!current) return current;
      const candidateId = String(updated.id);
      const without = (entries = []) => entries.filter(
        (candidate) => String(candidate?.id) !== candidateId
      );
      const activeCandidates = without(current.activeCandidates);
      const discussionCandidates = without(current.discussionCandidates);
      const coolingOffCandidates = without(current.coolingOffCandidates);
      const actionCandidates = without(current.actionCandidates);
      const resolvedCandidates = without(current.resolvedCandidates);

      if (updated.deckState === 'active') {
        if (updated.needsMyVote) activeCandidates.unshift(updated);
        else activeCandidates.push(updated);
      } else if (updated.deckState === 'discussion') {
        discussionCandidates.unshift(updated);
      } else if (updated.deckState === 'cooling_off') {
        coolingOffCandidates.unshift(updated);
      } else if (updated.deckState === 'action') {
        actionCandidates.unshift(updated);
      } else if (updated.deckState === 'resolved') {
        resolvedCandidates.unshift(updated);
      }

      return {
        ...current,
        activeCandidates,
        discussionCandidates,
        coolingOffCandidates,
        actionCandidates,
        resolvedCandidates,
        counts: {
          active: activeCandidates.length,
          discussion: discussionCandidates.length,
          coolingOff: coolingOffCandidates.length,
          action: actionCandidates.length,
          resolved: Math.max(
            resolvedCandidates.length,
            Number(current.counts?.resolved || 0) + (updated.deckState === 'resolved' ? 1 : 0)
          ),
        },
      };
    });
  }, []);

  const isReviewableCandidate = useCallback(
    (candidate) => String(candidate?.item?.item_status || '').toLowerCase() !== 'gone',
    []
  );
  const activeCandidates = useMemo(
    () => (deck?.activeCandidates || []).filter(isReviewableCandidate),
    [deck?.activeCandidates, isReviewableCandidate]
  );
  const discussionCandidates = useMemo(
    () => (deck?.discussionCandidates || []).filter(isReviewableCandidate),
    [deck?.discussionCandidates, isReviewableCandidate]
  );
  const resolvedCandidates = useMemo(
    () => (deck?.resolvedCandidates || []).filter(isReviewableCandidate),
    [deck?.resolvedCandidates, isReviewableCandidate]
  );
  const coolingOffCandidates = useMemo(
    () => (deck?.coolingOffCandidates || []).filter(isReviewableCandidate),
    [deck?.coolingOffCandidates, isReviewableCandidate]
  );
  const actionCandidates = useMemo(
    () => (deck?.actionCandidates || []).filter(isReviewableCandidate),
    [deck?.actionCandidates, isReviewableCandidate]
  );
  const currentCandidate = useMemo(
    () => activeCandidates.find((candidate) => candidate.needsMyVote) || null,
    [activeCandidates]
  );
  const awaitingPartnerCandidates = useMemo(
    () => activeCandidates.filter((candidate) => !candidate.needsMyVote),
    [activeCandidates]
  );
  const waitingForMeCandidates = useMemo(
    () => activeCandidates.filter((candidate) => candidate.needsMyVote),
    [activeCandidates]
  );
  const awaitingPartnerCount = awaitingPartnerCandidates.length;
  const waitingForMeCount = waitingForMeCandidates.length;
  const queueTotal = waitingForMeCount + Number(deck?.metrics?.[`${player}Reviewed`] || 0);
  const queuePercent = queueTotal
    ? Math.min(100, Math.round((Number(deck?.metrics?.[`${player}Reviewed`] || 0) / queueTotal) * 100))
    : 100;

  useEffect(() => {
    setNotesDraft(currentCandidate?.notes || '');
  }, [currentCandidate?.id, currentCandidate?.notes]);

  const handleVote = async (vote) => {
    if (!currentCandidate?.id) return;
    try {
      setSaving(currentCandidate.id);
      setError('');
      const updated = await voteOnDeclutterCandidate(currentCandidate.id, { player, vote, notes: notesDraft });
      const itemName = currentCandidate?.item?.name || 'Item';
      const voteLabel = vote.charAt(0).toUpperCase() + vote.slice(1);
      const messageByResolution = {
        kept: `Match: both kept “${itemName}”. It left the deck.`,
        release_approved: [
          `Release approved. You both decided “${itemName}” should leave the household.`,
          updated?.stagingRoute
            ? `Route noted: ${updated.stagingRoute === 'needs_routing'
              ? 'Needs routing'
              : updated.stagingRoute.charAt(0).toUpperCase() + updated.stagingRoute.slice(1)}.`
            : '',
        ].filter(Boolean).join(' '),
        review_later: `“${itemName}” needs another look. It moved to Talk it out.`,
        conflict: `Split decision on “${itemName}”. It moved to Talk it out.`,
      };
      showToast?.({
        variant: ['conflict', 'review_later'].includes(updated?.resolution) ? 'warning' : 'success',
        title: `${voteLabel} locked in`,
        message:
          messageByResolution[updated?.resolution] ||
          `${voteLabel} locked in for “${itemName}”. Waiting for the other decision.`,
        timeoutMs: 4200,
      });
      await waitForCardExit();
      mergeCandidate(updated);
      void loadDeck({ silent: true });
    } catch (err) {
      setError(err?.message || 'Failed to save vote.');
    } finally {
      setSaving('');
    }
  };

  const handleReopen = async (candidate) => {
    try {
      setSaving(candidate.id);
      setError('');
      const updated = await reopenDeclutterCandidate(candidate.id);
      mergeCandidate(updated);
      void loadDeck({ silent: true });
      setMode('deck');
    } catch (err) {
      setError(err?.message || 'Failed to reopen candidate.');
    } finally {
      setSaving('');
    }
  };

  const handleResetVote = async (candidate) => {
    try {
      setSaving(candidate.id);
      setError('');
      const updated = await resetDeclutterVote(candidate.id, player);
      mergeCandidate(updated);
      setMode('deck');
      showToast?.({
        variant: 'warning',
        title: 'Decision reset',
        message: 'Your choice is open again. The previous cooling timer, if any, was cancelled.',
      });
      void loadDeck({ silent: true });
    } catch (err) {
      setError(err?.message || 'Failed to reset your decision.');
    } finally {
      setSaving('');
    }
  };

  const handleResetAllVotes = async () => {
    try {
      setSaving('reset-all');
      setError('');
      const result = await resetAllDeclutterVotes(player);
      showToast?.({
        variant: 'warning',
        title: 'Decisions reset',
        message: result?.resetCount
          ? `${result.resetCount} decision${result.resetCount === 1 ? '' : 's'} returned to your queue.`
          : 'There were no editable decisions to reset.',
      });
      await loadDeck({ silent: true });
    } catch (err) {
      setError(err?.message || 'Failed to reset your decisions.');
    } finally {
      setSaving('');
    }
  };

  const openActions = async () => {
    setMode('actions');
    try {
      const resources = await fetchDeclutterActionResources();
      setStagingBoxes(resources?.stagingBoxes || []);
    } catch (err) {
      setError(err?.message || 'Failed to load staging boxes.');
    }
  };

  const handleAction = async (candidate, action, payload = {}) => {
    const actions = {
      reroute: () => rerouteDeclutterAction(candidate.id, { ...payload, player }),
      restore: () => restoreDeclutterActionAsKeep(candidate.id, { player }),
      reopen: () => reopenDeclutterAction(candidate.id, { player }),
      complete: () => completeDeclutterAction(candidate.id, payload),
    };
    try {
      setSaving(candidate.id);
      setError('');
      await actions[action]?.();
      showToast?.({
        variant: action === 'complete' ? 'success' : 'warning',
        title: action === 'complete' ? 'Physical exit complete' : 'Declutter action updated',
        message: action === 'complete'
          ? 'It is officially out of the household. Glorious.'
          : 'The inventory placement and workflow state were updated.',
      });
      await loadDeck({ silent: true });
    } catch (err) {
      setError(err?.message || 'Failed to update the action.');
    } finally {
      setSaving('');
    }
  };

  if (loading) return <S.PageShell><S.StatusPanel>Shuffling the Declutter Deck...</S.StatusPanel></S.PageShell>;

  return (
    <S.DeclutterSurface $player={player}>
      <S.PlayerDock>
        <DeclutterPlayerPicker
          value={player}
          metrics={deck?.metrics}
          onChange={setPlayer}
        />
      </S.PlayerDock>

      <S.ModeBar>
        <S.ModeGroup>
          <S.ModeButton type="button" $active={mode === 'deck'} onClick={() => setMode('deck')}>▣ Review <S.ModeCount>{waitingForMeCount}</S.ModeCount></S.ModeButton>
          <S.ModeButton type="button" $active={mode === 'discussion'} onClick={() => setMode('discussion')}>▤ Discuss <S.ModeCount>{deck?.counts?.discussion || 0}</S.ModeCount></S.ModeButton>
          <S.ModeButton type="button" $active={mode === 'cooling'} onClick={() => setMode('cooling')}>◷ Cooling Off <S.ModeCount>{deck?.counts?.coolingOff || 0}</S.ModeCount></S.ModeButton>
          <S.ModeButton type="button" $active={mode === 'actions'} onClick={openActions}>⚡ Actions <S.ModeCount>{deck?.counts?.action || 0}</S.ModeCount></S.ModeButton>
          <S.ModeButton type="button" $active={mode === 'progress'} onClick={() => setMode('progress')}>▥ Progress</S.ModeButton>
        </S.ModeGroup>
        <S.ProgressText>{awaitingPartnerCount ? `${awaitingPartnerCount} waiting on your partner` : 'Shared deck is current'}</S.ProgressText>
      </S.ModeBar>

      {error ? <S.ErrorState role="alert">{error}</S.ErrorState> : null}

      {mode === 'deck' ? (
        <>
          <S.QueueProgress>
            <S.QueueProgressTop>
              <span>Your queue</span>
              <S.QueueProgressButton
                type="button"
                aria-haspopup="dialog"
                aria-expanded={isWaitingOverlayOpen}
                onClick={() => setIsWaitingOverlayOpen(true)}
              >
                {waitingForMeCount} waiting
              </S.QueueProgressButton>
            </S.QueueProgressTop>
            <S.QueueTrack><S.QueueFill $percent={queuePercent} /></S.QueueTrack>
          </S.QueueProgress>
          {isWaitingOverlayOpen ? (
            <DeclutterWaitingOverlay
              candidates={waitingForMeCandidates}
              onRequestClose={() => setIsWaitingOverlayOpen(false)}
            />
          ) : null}
          {currentCandidate ? (
            <DeclutterReviewCard
              sessionItem={{ ...currentCandidate, decision: 'pending' }}
              player={player}
              progressText={`${waitingForMeCount} decision${waitingForMeCount === 1 ? '' : 's'} left`}
              notesDraft={notesDraft}
              savingDecision={saving ? 'saving' : ''}
              onNotesDraftChange={setNotesDraft}
              onDecision={handleVote}
            />
          ) : (
            <S.StatusPanel>
              {awaitingPartnerCount
                ? 'You cleared your queue. Your partner has the next move.'
                : 'The deck is empty. Add an inventory item to start the next round.'}
            </S.StatusPanel>
          )}
          {awaitingPartnerCount ? (
            <S.WorkflowGrid>
              <S.WorkflowLaneTitle>
                Waiting on partner
                <DeclutterHoldButton
                  disabled={Boolean(saving)}
                  onComplete={handleResetAllVotes}
                >
                  Reset all my decisions
                </DeclutterHoldButton>
                <span>{awaitingPartnerCount}</span>
              </S.WorkflowLaneTitle>
              {awaitingPartnerCandidates.map((candidate) => (
                <S.WorkflowCard key={candidate.id}>
                  <S.ItemName>{candidate.item?.name || 'Inventory item'}</S.ItemName>
                  <S.SmallText>Your submitted choice remains private until your partner decides.</S.SmallText>
                  <S.QueueActions>
                    <S.Button type="button" disabled={saving === candidate.id} onClick={() => handleResetVote(candidate)}>Change</S.Button>
                    <S.Button type="button" disabled={saving === candidate.id} onClick={() => handleResetVote(candidate)}>Reset my decision</S.Button>
                  </S.QueueActions>
                </S.WorkflowCard>
              ))}
            </S.WorkflowGrid>
          ) : null}
        </>
      ) : mode === 'discussion' ? (
        <DeclutterCandidateLane
          title="Talk it out"
          candidates={discussionCandidates}
          emptyText="No split votes right now."
          actionLabel="Reopen voting"
          busyCandidateId={saving}
          onAction={handleReopen}
        />
      ) : mode === 'cooling' ? (
        <DeclutterCoolingOffLane
          candidates={coolingOffCandidates}
          busyCandidateId={saving}
          onChangeVote={handleResetVote}
        />
      ) : mode === 'actions' ? (
        <DeclutterActionsPanel
          candidates={actionCandidates}
          player={player}
          stagingBoxes={stagingBoxes}
          busyCandidateId={saving}
          onAction={handleAction}
        />
      ) : (
        <>
          <DeclutterProgressPanel metrics={deck?.metrics} counts={deck?.counts} />
            <DeclutterCandidateLane
            title="Recent resolutions"
            candidates={resolvedCandidates}
            emptyText="No resolved candidates yet."
          />
        </>
      )}
    </S.DeclutterSurface>
  );
}
