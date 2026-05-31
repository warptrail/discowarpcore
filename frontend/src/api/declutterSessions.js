import { API_BASE } from './API_BASE';

const DECLUTTER_SESSIONS_PATH = '/api/declutter-sessions';

export const DECLUTTER_DECISIONS = [
  'pending',
  'keep',
  'toss',
  'donate',
  'sell',
  'unsure',
];

function buildUrl(path, params = {}) {
  const apiRoot = String(API_BASE || '').replace(/\/+$/, '');
  const url = new URL(`${apiRoot}${path}`, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    const normalized = String(value ?? '').trim();
    if (normalized) url.searchParams.set(key, normalized);
  });

  return `${url.pathname}${url.search}${url.hash}`;
}

async function parseJsonResponse(response, fallbackMessage) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(body?.error || fallbackMessage || 'Request failed');
  }

  return body;
}

async function sendJson(path, { method = 'GET', body, params } = {}) {
  const response = await fetch(buildUrl(path, params), {
    method,
    headers: body == null ? undefined : { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body),
  });

  return parseJsonResponse(response, 'Declutter session request failed');
}

export async function fetchDeclutterSessions({ status = '' } = {}) {
  const body = await sendJson(DECLUTTER_SESSIONS_PATH, {
    params: status ? { status } : undefined,
  });
  return Array.isArray(body?.sessions) ? body.sessions : [];
}

export async function fetchDeclutterSessionsForItem(itemId, { status = 'active' } = {}) {
  const body = await sendJson(
    `${DECLUTTER_SESSIONS_PATH}/items/${encodeURIComponent(itemId)}/sessions`,
    {
      params: status ? { status } : undefined,
    }
  );
  return Array.isArray(body?.sessions) ? body.sessions : [];
}

export async function createDeclutterSession(payload) {
  const body = await sendJson(DECLUTTER_SESSIONS_PATH, {
    method: 'POST',
    body: payload,
  });
  return body?.session || null;
}

export async function fetchDeclutterSession(sessionId) {
  const body = await sendJson(
    `${DECLUTTER_SESSIONS_PATH}/${encodeURIComponent(sessionId)}`
  );
  return {
    session: body?.session || null,
    items: Array.isArray(body?.items) ? body.items : [],
  };
}

export async function updateDeclutterSession(sessionId, payload) {
  const body = await sendJson(
    `${DECLUTTER_SESSIONS_PATH}/${encodeURIComponent(sessionId)}`,
    {
      method: 'PATCH',
      body: payload,
    }
  );
  return body?.session || null;
}

export async function deleteDeclutterSession(sessionId) {
  return sendJson(`${DECLUTTER_SESSIONS_PATH}/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  });
}

export async function resetDeclutterSession(sessionId) {
  return sendJson(
    `${DECLUTTER_SESSIONS_PATH}/${encodeURIComponent(sessionId)}/reset`,
    {
      method: 'POST',
    }
  );
}

export async function addItemsToDeclutterSession(sessionId, itemIds) {
  return sendJson(
    `${DECLUTTER_SESSIONS_PATH}/${encodeURIComponent(sessionId)}/items`,
    {
      method: 'POST',
      body: { itemIds },
    }
  );
}

export async function updateDeclutterSessionItem(sessionId, itemId, payload) {
  const body = await sendJson(
    `${DECLUTTER_SESSIONS_PATH}/${encodeURIComponent(sessionId)}/items/${encodeURIComponent(itemId)}`,
    {
      method: 'PATCH',
      body: payload,
    }
  );
  return body?.sessionItem || null;
}

export async function removeItemFromDeclutterSession(sessionId, itemId) {
  return sendJson(
    `${DECLUTTER_SESSIONS_PATH}/${encodeURIComponent(sessionId)}/items/${encodeURIComponent(itemId)}`,
    {
      method: 'DELETE',
    }
  );
}
