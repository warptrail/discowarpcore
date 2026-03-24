import { API_BASE } from './API_BASE';

export const DEFAULT_LOGS_LIMIT = 25;

export async function fetchLogsPage(
  { limit = DEFAULT_LOGS_LIMIT, offset = 0 } = {},
  { signal } = {}
) {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('offset', String(offset));

  const response = await fetch(`${API_BASE}/api/logs?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch logs (${response.status})`);
  }

  return response.json();
}

export async function fetchItemMoveLogs(
  { itemId, limit = 100 } = {},
  { signal } = {}
) {
  const id = String(itemId || '').trim();
  if (!id) {
    return {
      entries: [],
      total: 0,
      limit: 0,
      offset: 0,
      hasMore: false,
    };
  }

  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('offset', '0');
  params.set('eventType', 'item_moved');
  params.set('entityType', 'item');
  params.set('entityId', id);

  const response = await fetch(`${API_BASE}/api/logs?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch item move logs (${response.status})`);
  }

  return response.json();
}
