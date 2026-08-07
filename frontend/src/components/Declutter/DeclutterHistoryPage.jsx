import { useCallback, useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  completeDeclutterAction,
  fetchDeclutterActionResources,
  fetchDeclutterHistory,
  rerouteDeclutterAction,
} from '../../api/declutterDeck';
import { ToastContext } from '../Toast';
import * as S from './Declutter.styles';
import DeclutterHistoryActionControls from './DeclutterHistoryActionControls';
import DeclutterCandidateLane from './DeclutterCandidateLane';
import { DECLUTTER_PLAYER_CHANGE_EVENT, getStoredDeclutterPlayer } from './declutterPlayers';

const FILTERS = [
  ['all', 'All history'],
  ['resolved', 'Resolved'],
  ['active', 'Voting'],
  ['discussion', 'Discussion'],
  ['action', 'Actions'],
  ['kept', 'Confirmed keep'],
  ['release_approved', 'Approved to leave'],
  ['physically_completed', 'Destroyed'],
];
const HISTORY_PAGE_SIZE = 10;
const ROUTE_FILTERS = [
  ['discard', 'Toss', '🗑', 'toss'],
  ['donate', 'Donate', '💙', 'donate'],
  ['sell', 'Sell', '🏷', 'sell'],
  ['gift', 'Gift', '🎁', 'gift'],
];
const ROUTE_FILTER_PARENTS = new Set(['release_approved', 'physically_completed']);

function buildHistoryPath({ filter = 'all', route = '', view = 'compact', page = 1 } = {}) {
  const params = new URLSearchParams();
  if (filter !== 'all') params.set('filter', filter);
  if (ROUTE_FILTER_PARENTS.has(filter) && route) params.set('route', route);
  if (view === 'cards') params.set('view', 'cards');
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `/declutter/history?${query}` : '/declutter/history';
}

export default function DeclutterHistoryPage() {
  const { showToast } = useContext(ToastContext) || {};

  useEffect(() => {
    const syncPlayer = (event) => {
      if (event.detail?.playerId) setPlayer(event.detail.playerId);
    };
    window.addEventListener(DECLUTTER_PLAYER_CHANGE_EVENT, syncPlayer);
    return () => window.removeEventListener(DECLUTTER_PLAYER_CHANGE_EVENT, syncPlayer);
  }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedFilter = searchParams.get('filter') || 'all';
  const filter = FILTERS.some(([value]) => value === requestedFilter) ? requestedFilter : 'all';
  const view = searchParams.get('view') === 'cards' ? 'cards' : 'compact';
  const route = ROUTE_FILTERS.some(([value]) => value === searchParams.get('route'))
    ? searchParams.get('route')
    : '';
  const requestedPage = Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1);
  const [history, setHistory] = useState({ candidates: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [player, setPlayer] = useState(getStoredDeclutterPlayer);
  const [stagingBoxes, setStagingBoxes] = useState([]);
  const [busyCandidateId, setBusyCandidateId] = useState('');
  const keptCandidates = filter === 'all'
    ? history.candidates.filter((candidate) => candidate?.resolution === 'kept')
    : [];
  const tossedCandidates = filter === 'all'
    ? history.candidates.filter((candidate) => ['release_approved', 'ready_to_declutter', 'ready_to_donate', 'ready_to_sell'].includes(candidate?.resolution))
    : [];

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setHistory(await fetchDeclutterHistory({
        filter,
        route,
        player,
        page: requestedPage,
        limit: HISTORY_PAGE_SIZE,
      }));
    } catch (err) {
      setError(err?.message || 'Failed to load declutter history.');
    } finally {
      setLoading(false);
    }
  }, [filter, player, requestedPage, route]);

  useEffect(() => { void loadHistory(); }, [loadHistory]);

  useEffect(() => {
    let isAlive = true;
    fetchDeclutterActionResources()
      .then((resources) => {
        if (isAlive) setStagingBoxes(resources?.stagingBoxes || []);
      })
      .catch(() => {
        if (isAlive) setStagingBoxes([]);
      });
    return () => { isAlive = false; };
  }, []);

  const handleStage = useCallback(async (candidate, { boxId, boxLabel, route }) => {
    if (!candidate?.id || !boxId || busyCandidateId) return false;
    try {
      setBusyCandidateId(candidate.id);
      setError('');
      await rerouteDeclutterAction(candidate.id, { player, route, boxId });
      showToast?.({
        id: `declutter-history-staged:${candidate.id}`,
        variant: 'success',
        title: 'Departure staged',
        message: `Moved the item to ${boxLabel}.`,
        timeoutMs: 4200,
      });
      await loadHistory();
      return true;
    } catch (err) {
      setError(err?.message || 'Failed to move the item to its staging box.');
      return false;
    } finally {
      setBusyCandidateId('');
    }
  }, [busyCandidateId, loadHistory, player, showToast]);

  const handleComplete = useCallback(async (candidate, payload) => {
    if (!candidate?.id || busyCandidateId) return false;
    try {
      setBusyCandidateId(candidate.id);
      setError('');
      await completeDeclutterAction(candidate.id, payload);
      showToast?.({
        id: `declutter-history-completed:${candidate.id}`,
        variant: 'success',
        title: 'Departure archived',
        message: 'The item is no longer in inventory and is now recorded under Destroyed.',
        timeoutMs: 7000,
      });
      await loadHistory();
      return true;
    } catch (err) {
      setError(err?.message || 'Failed to complete the departure action.');
      return false;
    } finally {
      setBusyCandidateId('');
    }
  }, [busyCandidateId, loadHistory, showToast]);

  return (
    <S.DeclutterSurface $player={player}>
      <S.HistoryHeader>
        <S.HistoryBackLink to="/declutter" aria-label="Back to Declutter Deck">
          ← Back to deck
        </S.HistoryBackLink>
        <S.PanelHeading>
          <span>Declutter history</span>
          <small>{history.total || 0} record{history.total === 1 ? '' : 's'}</small>
        </S.PanelHeading>
      </S.HistoryHeader>
      <S.HistoryFilters aria-label="Declutter history filters">
        {FILTERS.map(([value, label]) => (
          <S.HistoryFilterLink key={value} to={buildHistoryPath({ filter: value, view })} $active={value === filter}>
            {label}
          </S.HistoryFilterLink>
        ))}
      </S.HistoryFilters>
      {ROUTE_FILTER_PARENTS.has(filter) ? (
        <S.HistoryRouteFilters aria-label={`${filter === 'physically_completed' ? 'Destroyed fate' : 'Approved route'} filters`}>
          <span>{filter === 'physically_completed' ? 'Actual fate' : 'Exit route'}</span>
          <S.HistoryRouteLink
            to={buildHistoryPath({ filter, view })}
            $active={!route}
            $tone="pending"
          >
            All
          </S.HistoryRouteLink>
          {ROUTE_FILTERS.map(([value, label, icon, tone]) => (
            <S.HistoryRouteLink
              key={value}
              to={buildHistoryPath({ filter, route: value, view })}
              $active={route === value}
              $tone={tone}
            >
              <span aria-hidden="true">{icon}</span> {label}
            </S.HistoryRouteLink>
          ))}
        </S.HistoryRouteFilters>
      ) : null}
      <S.HistoryViewBar>
        <S.HistoryViewLabel>Ledger density</S.HistoryViewLabel>
        <S.HistoryViewChoices aria-label="History display density">
          <S.HistoryViewButton
            type="button"
            $active={view === 'compact'}
            aria-pressed={view === 'compact'}
            onClick={() => setSearchParams((current) => {
              const next = new URLSearchParams(current);
              next.delete('view');
              next.delete('page');
              return next;
            })}
          >
            ▤ Condensed
          </S.HistoryViewButton>
          <S.HistoryViewButton
            type="button"
            $active={view === 'cards'}
            aria-pressed={view === 'cards'}
            onClick={() => setSearchParams((current) => {
              const next = new URLSearchParams(current);
              next.set('view', 'cards');
              next.delete('page');
              return next;
            })}
          >
            ▣ Card view
          </S.HistoryViewButton>
        </S.HistoryViewChoices>
        <S.HistoryPageSummary>
          Page {history.page || 1} / {history.totalPages || 1}
        </S.HistoryPageSummary>
      </S.HistoryViewBar>
      {loading ? <S.StatusPanel>Loading declutter history...</S.StatusPanel> : null}
      {error ? <S.ErrorState role="alert">{error}</S.ErrorState> : null}
      {!loading && !error ? (
        filter === 'all' ? (
          <S.HistoryLedger>
            <S.HistoryLedgerColumn $tone="keep"><h3>Keep · {keptCandidates.length}</h3><DeclutterCandidateLane compact={view === 'compact'} title="Confirmed keeps" candidates={keptCandidates} emptyText="No confirmed keeps yet." /></S.HistoryLedgerColumn>
            <S.HistoryLedgerColumn $tone="toss"><h3>Toss · {tossedCandidates.length}</h3><DeclutterCandidateLane compact={view === 'compact'} title="Confirmed tosses" candidates={tossedCandidates} emptyText="No confirmed tosses yet." /></S.HistoryLedgerColumn>
          </S.HistoryLedger>
        ) : (
          <DeclutterCandidateLane
            title={FILTERS.find(([value]) => value === filter)?.[1] || 'History'}
            candidates={history.candidates}
            emptyText="No declutter history matches this filter."
            busyCandidateId={busyCandidateId}
            compact={view === 'compact'}
            renderActions={filter === 'release_approved' && view === 'cards' ? (candidate) => (
              <DeclutterHistoryActionControls
                candidate={candidate}
                stagingBoxes={stagingBoxes}
                busy={busyCandidateId === candidate.id}
                onStage={handleStage}
                onComplete={handleComplete}
              />
            ) : undefined}
          />
        )
      ) : null}
      {history.totalPages > 1 ? (
        <S.HistoryPagination aria-label="Declutter history pages">
          <S.HistoryPageLink
            to={buildHistoryPath({ filter, route, view, page: Math.max(1, history.page - 1) })}
            $disabled={history.page <= 1}
            aria-disabled={history.page <= 1}
            tabIndex={history.page <= 1 ? -1 : undefined}
          >
            ← Previous
          </S.HistoryPageLink>
          <span>{history.total} records · {HISTORY_PAGE_SIZE} per page</span>
          <S.HistoryPageLink
            to={buildHistoryPath({ filter, route, view, page: Math.min(history.totalPages, history.page + 1) })}
            $disabled={history.page >= history.totalPages}
            aria-disabled={history.page >= history.totalPages}
            tabIndex={history.page >= history.totalPages ? -1 : undefined}
          >
            Next ➤
          </S.HistoryPageLink>
        </S.HistoryPagination>
      ) : null}
      <S.HistoryBackLink to="/declutter">← Back to Declutter Deck</S.HistoryBackLink>
    </S.DeclutterSurface>
  );
}
