import { API_BASE } from './API_BASE';
import { ITEM_OWNERS } from '../util/itemOwners';

const DECK_PATH = '/api/declutter-deck';

export const DECLUTTER_PLAYERS = ITEM_OWNERS.map((owner) => ({
  ...owner,
}));

function buildUrl(path, params = {}) {
  const apiRoot = String(API_BASE || '').replace(/\/+$/, '');
  const url = new URL(`${apiRoot}${path}`, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    const normalized = String(value ?? '').trim();
    if (normalized) url.searchParams.set(key, normalized);
  });
  return `${url.pathname}${url.search}`;
}

async function sendJson(path, { method = 'GET', body, params } = {}) {
  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers: body == null ? undefined : { 'Content-Type': 'application/json' },
      body: body == null ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Could not reach the Declutter backend. Check Express in Tarot, then try again.');
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const requestId = String(
      payload?.requestId || response.headers.get('x-request-id') || ''
    ).trim();
    const message = payload?.error || (
      response.status === 404
        ? 'The running backend does not have this Declutter Deck command yet. Restart Express through Tarot and try again.'
        : 'Declutter Deck request failed.'
    );
    const error = new Error(requestId ? `${message} Request: ${requestId}` : message);
    error.requestId = requestId;
    throw error;
  }
  return payload;
}

export async function fetchDeclutterDeck(player) {
  return sendJson(DECK_PATH, { params: { player } });
}

const HISTORY_ROUTE_BY_DISPOSITION = {
  trashed: 'discard',
  donated: 'donate',
  sold: 'sell',
  gifted: 'gift',
};

function getCandidateHistoryRoute(candidate) {
  const item = candidate?.item || {};
  const dispositionRoute = HISTORY_ROUTE_BY_DISPOSITION[
    String(item?.disposition || '').trim().toLowerCase()
  ];
  const completed = item?.declutterExitState === 'completed'
    || String(item?.item_status || '').trim().toLowerCase() === 'gone';
  return completed && dispositionRoute
    ? dispositionRoute
    : String(candidate?.stagingRoute || '').trim().toLowerCase();
}

export async function fetchDeclutterHistory({ filter = 'all', route = '', player = '', page = 1, limit = 10 } = {}) {
  const payload = await sendJson(`${DECK_PATH}/history`, {
    params: { filter, route, player, page, limit },
  });
  const normalizedRoute = route === 'toss' ? 'discard' : route;
  const backendSupportsPagination = Number.isFinite(Number(payload?.page));
  const backendAppliedRoute = !normalizedRoute || payload?.route === normalizedRoute;

  if (backendSupportsPagination && backendAppliedRoute) return payload;

  const sourceCandidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  const filteredCandidates = normalizedRoute && !backendAppliedRoute
    ? sourceCandidates.filter((candidate) => getCandidateHistoryRoute(candidate) === normalizedRoute)
    : sourceCandidates;
  const pageSize = Math.max(1, Number(limit) || 10);
  const total = filteredCandidates.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const offset = (currentPage - 1) * pageSize;

  return {
    ...payload,
    route: normalizedRoute,
    candidates: filteredCandidates.slice(offset, offset + pageSize),
    total,
    page: currentPage,
    limit: pageSize,
    totalPages,
  };
}

export async function nominateDeclutterCandidates(itemIds, { nominatedBy = '' } = {}) {
  const ids = Array.from(new Set((Array.isArray(itemIds) ? itemIds : [itemIds])
    .map((itemId) => String(itemId || '').trim())
    .filter(Boolean)));
  const results = [];
  for (const itemId of ids) {
    results.push(await sendJson(`${DECK_PATH}/candidates`, {
      method: 'POST',
      body: { itemId, nominatedBy },
    }));
  }
  return results;
}

export async function removeDeclutterCandidateByItem(itemId) {
  const id = String(itemId || '').trim();
  if (!id) throw new Error('An item is required to remove it from the Declutter Deck.');
  return sendJson(`${DECK_PATH}/candidates/by-item/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function voteOnDeclutterCandidate(candidateId, { player, vote, notes = '' }) {
  const body = await sendJson(`${DECK_PATH}/candidates/${encodeURIComponent(candidateId)}/votes`, {
    method: 'POST',
    body: { player, vote, notes },
  });
  return body?.candidate || null;
}

export async function reopenDeclutterCandidate(candidateId) {
  const body = await sendJson(`${DECK_PATH}/candidates/${encodeURIComponent(candidateId)}/reopen`, {
    method: 'POST',
  });
  return body?.candidate || null;
}

export async function resolveDeclutterDiscussion(candidateId, { choice, notes = '' }) {
  const body = await sendJson(
    `${DECK_PATH}/candidates/${encodeURIComponent(candidateId)}/resolve-discussion`,
    { method: 'POST', body: { choice, notes } }
  );
  return body?.candidate || null;
}

export async function resetDeclutterVote(candidateId, player) {
  const body = await sendJson(`${DECK_PATH}/candidates/${encodeURIComponent(candidateId)}/votes/mine`, {
    method: 'DELETE',
    body: { player },
  });
  return body?.candidate || null;
}

export async function resetAllDeclutterVotes(player) {
  return sendJson(`${DECK_PATH}/votes/mine`, {
    method: 'DELETE',
    body: { player },
  });
}

export async function fetchDeclutterActionResources() {
  return sendJson(`${DECK_PATH}/actions/resources`);
}

async function sendAction(candidateId, action, body = {}) {
  const response = await sendJson(
    `${DECK_PATH}/actions/${encodeURIComponent(candidateId)}/${action}`,
    { method: 'POST', body }
  );
  return response?.candidate || null;
}

export const rerouteDeclutterAction = (candidateId, payload) =>
  sendAction(candidateId, 'reroute', payload);

export const restoreDeclutterActionAsKeep = (candidateId, payload) =>
  sendAction(candidateId, 'restore-keep', payload);

export const reopenDeclutterAction = (candidateId, payload) =>
  sendAction(candidateId, 'reopen', payload);

export const completeDeclutterAction = (candidateId, payload) =>
  sendAction(candidateId, 'complete', payload);
