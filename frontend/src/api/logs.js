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
