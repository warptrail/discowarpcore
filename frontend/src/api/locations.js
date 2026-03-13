import { API_BASE } from './API_BASE';

export async function listLocations(opts = {}) {
  const res = await fetch(`${API_BASE}/api/locations`, {
    signal: opts.signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to list locations');
  }
  return data?.locations || [];
}

export async function createLocation(payload, opts = {}) {
  const res = await fetch(`${API_BASE}/api/locations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: opts.signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to create location');
  }
  return data?.location || null;
}

export async function renameLocation(locationId, payload, opts = {}) {
  const res = await fetch(`${API_BASE}/api/locations/${encodeURIComponent(locationId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: opts.signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to rename location');
  }
  return data?.location || null;
}

export async function deleteLocation(locationId, opts = {}) {
  const res = await fetch(`${API_BASE}/api/locations/${encodeURIComponent(locationId)}`, {
    method: 'DELETE',
    signal: opts.signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to delete location');
  }
  return data;
}
