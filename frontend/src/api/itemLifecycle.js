import { API_BASE } from './API_BASE';

export const GONE_DISPOSITIONS = Object.freeze([
  'consumed',
  'lost',
  'stolen',
  'trashed',
  'recycled',
  'gifted',
  'donated',
]);

async function readApiError(response, fallbackMessage) {
  const body = await response.json().catch(() => ({}));
  return body?.error || body?.message || fallbackMessage;
}

export async function markItemGone(itemId, { disposition, dispositionNotes } = {}) {
  if (!itemId) throw new Error('itemId is required');

  const res = await fetch(`${API_BASE}/api/items/${encodeURIComponent(itemId)}/mark-gone`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      disposition,
      disposition_notes: dispositionNotes || '',
    }),
  });

  if (!res.ok) {
    throw new Error(await readApiError(res, 'Failed to mark item gone'));
  }

  const data = await res.json().catch(() => ({}));
  return data?.data ?? data;
}

export async function restoreItemToActive(itemId) {
  if (!itemId) throw new Error('itemId is required');

  const res = await fetch(
    `${API_BASE}/api/items/${encodeURIComponent(itemId)}/restore-active`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!res.ok) {
    throw new Error(await readApiError(res, 'Failed to restore item'));
  }

  const data = await res.json().catch(() => ({}));
  return data?.data ?? data;
}

export async function deleteItemPermanently(itemId) {
  if (!itemId) throw new Error('itemId is required');

  const res = await fetch(`${API_BASE}/api/items/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(await readApiError(res, 'Failed to permanently delete item'));
  }

  return res.json().catch(() => ({}));
}
