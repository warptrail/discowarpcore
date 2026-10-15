import { API_BASE } from './API_BASE';

async function request(path = '', { method = 'GET', body, signal } = {}) {
  const response = await fetch(`${API_BASE}/api/loadouts${path}`, {
    method, signal,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Could not load your loadouts.'), { status: response.status });
  return data;
}

export const fetchLoadouts = (signal) => request('', { signal });
export const fetchLoadout = (id, signal) => request(`/${encodeURIComponent(id)}`, { signal });
export const saveLoadout = (id, body) => request(`/${encodeURIComponent(id)}`, { method: 'PUT', body });
