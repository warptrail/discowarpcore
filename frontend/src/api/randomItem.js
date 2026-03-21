import { API_BASE } from './API_BASE';

function toErrorMessage(body, fallback) {
  return body?.error || body?.message || fallback;
}

export async function fetchRandomItem({ signal } = {}) {
  const response = await fetch(`${API_BASE}/api/items/random`, { signal });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      toErrorMessage(body, `Failed to fetch random item (${response.status})`)
    );
    error.status = response.status;
    error.code = body?.code || '';
    throw error;
  }

  return body?.data ?? null;
}
