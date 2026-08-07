import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

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
  DECLUTTER_PLAYERS,
} from '../../api/declutterDeck';
import * as S from './Declutter.styles';
import DeclutterCandidateLane from './DeclutterCandidateLane';
import DeclutterProgressPanel from './DeclutterProgressPanel';
import DeclutterReviewCard from './DeclutterReviewCard';
import DeclutterWaitingOverlay from './DeclutterWaitingOverlay';
import DeclutterActionsPanel from './DeclutterActionsPanel';
import DeclutterHoldButton from './DeclutterHoldButton';
import DeclutterSystemCollectionCard from './DeclutterSystemCollectionCard';
import {
  DECLUTTER_PLAYER_CHANGE_EVENT,
  getStoredDeclutterPlayer,
  publishDeclutterPendingCounts,
} from './declutterPlayers';
import { ToastContext } from '../Toast';

const CARD_EXIT_DURATION_MS = 260;
const DECLUTTER_MODES = new Set(['deck', 'discussion', 'actions', 'progress']);

function waitForCardExit() {
  return new Promise((resolve) => window.setTimeout(resolve, CARD_EXIT_DURATION_MS));
}

function hasPlayerDecided(candidate, votePlayer, activePlayer) {
  const decision = String(candidate?.votes?.[votePlayer]?.decision || '').toLowerCase();
  if (decision && !['pending', 'hidden'].includes(decision)) return true;
  return votePlayer !== activePlayer && Boolean(candidate?.partnerHasVoted);
}

export default function DeclutterDeckPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedMode = searchParams.get('mode') || 'deck';
  const routeMode = DECLUTTER_MODES.has(requestedMode) ? requestedMode : 'deck';
  const [player, setPlayer] = useState(getStoredDeclutterPlayer);
  const [deck, setDeck] = useState(null);
  const [mode, setMode] = useState(routeMode);
  const [notesDraft, setNotesDraft] = useState('');
  const [saving, setSaving] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isWaitingOverlayOpen, setIsWaitingOverlayOpen] = useState(false);
  const [stagingBoxes, setStagingBoxes] = useState([]);
  const toastCtx = useContext(ToastContext);
  const showToast = toastCtx?.showToast;

  const selectMode = useCallback((nextMode) => {
    const normalizedMode = DECLUTTER_MODES.has(nextMode) ? nextMode : 'deck';
    setMode(normalizedMode);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (normalizedMode === 'deck') next.delete('mode');
      else next.set('mode', normalizedMode);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    setMode(routeMode);
  }, [routeMode]);

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

  useEffect(() => {
    const syncPlayer = (event) => {
      if (event.detail?.playerId) setPlayer(event.detail.playerId);
    };
    window.addEventListener(DECLUTTER_PLAYER_CHANGE_EVENT, syncPlayer);
    return () => window.removeEventListener(DECLUTTER_PLAYER_CHANGE_EVENT, syncPlayer);
  }, []);

  useEffect(() => {
    if (mode !== 'actions') return undefined;
    let isAlive = true;
    (async () => {
      try {
        const resources = await fetchDeclutterActionResources();
        if (isAlive) setStagingBoxes(resources?.stagingBoxes || []);
      } catch (err) {
        if (isAlive) setError(err?.message || 'Failed to load staging boxes.');
      }
    })();
    return () => {
      isAlive = false;
    };
  }, [mode]);

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
      const actionCandidates = without(current.actionCandidates);
      const resolvedCandidates = without(current.resolvedCandidates);

      if (updated.deckState === 'active') {
        if (updated.needsMyVote) activeCandidates.unshift(updated);
        else activeCandidates.push(updated);
      } else if (updated.deckState === 'discussion') {
        discussionCandidates.unshift(updated);
      } else if (updated.deckState === 'action') {
        actionCandidates.unshift(updated);
      } else if (updated.deckState === 'resolved') {
        resolvedCandidates.unshift(updated);
      }

      return {
        ...current,
        activeCandidates,
        discussionCandidates,
        actionCandidates,
        resolvedCandidates,
        counts: {
          active: activeCandidates.length,
          discussion: discussionCandidates.length,
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
    () => deck?.resolvedCandidates || [],
    [deck?.resolvedCandidates]
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
  const pendingDecisionCounts = useMemo(
    () => Object.fromEntries(
      DECLUTTER_PLAYERS.map(({ id }) => [
        id,
        activeCandidates.filter((candidate) => (
          String(candidate?.votes?.[id]?.decision || '').toLowerCase() === 'pending'
        )).length,
      ])
    ),
    [activeCandidates]
  );
  const playerDecisionCounts = useMemo(
    () => Object.fromEntries(
      DECLUTTER_PLAYERS.map(({ id }) => [
        id,
        activeCandidates.filter((candidate) => hasPlayerDecided(candidate, id, player)).length,
      ])
    ),
    [activeCandidates, player]
  );

  useEffect(() => {
    publishDeclutterPendingCounts(pendingDecisionCounts);
  }, [pendingDecisionCounts]);
  const awaitingPartnerCount = awaitingPartnerCandidates.length;
  const waitingForMeCount = waitingForMeCandidates.length;

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
      const itemId = String(currentCandidate?.item?.id || currentCandidate?.itemId || '').trim();
      const item = currentCandidate?.item || null;
      const box = item?.box || null;
      const boxLabel = [box?.box_id ? `#${box.box_id}` : '', box?.label || 'Box']
        .filter(Boolean)
        .join(' ');
      const locationLabel = String(box?.locationName || item?.location || '').trim();
      const isConfirmedToss = updated?.resolution === 'release_approved'
        && updated?.stagingRoute === 'discard';
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
        content: isConfirmedToss && itemId ? (
          <S.DepartureToastContent>
            <S.DepartureToastBreadcrumb>
              {boxLabel || 'Virtual non-existent'}
              {locationLabel ? ` › ${locationLabel}` : ' › Don\'t have'}
            </S.DepartureToastBreadcrumb>
            <S.DepartureToastLink to={`/items/${encodeURIComponent(itemId)}`}>
              Open “{itemName}” and its full breadcrumb ↗
            </S.DepartureToastLink>
          </S.DepartureToastContent>
        ) : null,
        timeoutMs: isConfirmedToss ? 9000 : 4200,
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

  const handleSkip = () => {
    if (!currentCandidate?.id) return;
    setDeck((current) => {
      if (!current) return current;
      const candidateId = String(currentCandidate.id);
      const skipped = current.activeCandidates.find(
        (candidate) => String(candidate?.id) === candidateId
      );
      if (!skipped) return current;
      return {
        ...current,
        activeCandidates: [
          ...current.activeCandidates.filter(
            (candidate) => String(candidate?.id) !== candidateId
          ),
          skipped,
        ],
      };
    });
  };

  const handleReopen = async (candidate) => {
    try {
      setSaving(candidate.id);
      setError('');
      const updated = await reopenDeclutterCandidate(candidate.id);
      mergeCandidate(updated);
      void loadDeck({ silent: true });
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
      selectMode('deck');
      showToast?.({
        variant: 'warning',
        title: 'Decision reset',
        message: 'Your choice is open again.',
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

  const openActions = () => selectMode('actions');

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
      <S.ModeBar>
        <S.ModeGroup>
          <S.ModeButton type="button" $active={mode === 'deck'} aria-pressed={mode === 'deck'} onClick={() => selectMode('deck')}>▣ Review <S.ModeCount>{waitingForMeCount}</S.ModeCount></S.ModeButton>
          <S.ModeButton type="button" $active={mode === 'discussion'} aria-pressed={mode === 'discussion'} onClick={() => selectMode('discussion')}>▤ Discuss <S.ModeCount>{deck?.counts?.discussion || 0}</S.ModeCount></S.ModeButton>
          <S.ModeButton type="button" $active={mode === 'actions'} aria-pressed={mode === 'actions'} onClick={openActions}>⚡ Actions <S.ModeCount>{deck?.counts?.action || 0}</S.ModeCount></S.ModeButton>
          <S.ModeButton type="button" $active={mode === 'progress'} aria-pressed={mode === 'progress'} onClick={() => selectMode('progress')}>▥ Progress</S.ModeButton>
        </S.ModeGroup>
        <S.ProgressText $health={error ? 'error' : 'healthy'} role="status">
          {error
            ? 'Deck needs attention'
            : awaitingPartnerCount
              ? `Shared deck healthy · ${awaitingPartnerCount} waiting on your partner`
              : 'Shared deck is current'}
        </S.ProgressText>
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
            <S.QueueScoreboard aria-label="Declutter decisions by player">
              {DECLUTTER_PLAYERS.map((queuePlayer) => (
                <S.QueuePlayerRow key={queuePlayer.id}>
                  <S.QueuePlayerLabel $player={queuePlayer.id}>
                    <span aria-hidden="true">{queuePlayer.icon}</span>
                    {queuePlayer.label}
                  </S.QueuePlayerLabel>
                  <S.QueueSegments $columns={Math.min(20, Math.max(1, activeCandidates.length))}>
                    {activeCandidates.map((candidate, index) => (
                      <S.QueueSegment
                        key={`${queuePlayer.id}-${candidate.id}`}
                        $player={queuePlayer.id}
                        $decided={index < playerDecisionCounts[queuePlayer.id]}
                        title={`${queuePlayer.label}: ${playerDecisionCounts[queuePlayer.id]} of ${activeCandidates.length} active decisions complete`}
                      />
                    ))}
                  </S.QueueSegments>
                </S.QueuePlayerRow>
              ))}
            </S.QueueScoreboard>
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
              onSkip={handleSkip}
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
                <span>Waiting on partner</span>
                <span>
                  {awaitingPartnerCount} awaiting response{awaitingPartnerCount === 1 ? '' : 's'}
                </span>
                <DeclutterHoldButton
                  disabled={Boolean(saving)}
                  onComplete={handleResetAllVotes}
                >
                  Reset all my decisions
                </DeclutterHoldButton>
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
          <DeclutterSystemCollectionCard
            candidates={actionCandidates}
            onOpen={openActions}
          />
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
          <DeclutterProgressPanel
            metrics={deck?.metrics}
            counts={deck?.counts}
            resolvedCandidates={resolvedCandidates}
          />
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
