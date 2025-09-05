// src/api/boxes.js
import { API_BASE } from './API_BASE';

export async function fetchBoxByShortId(
  shortId,
  { tree = false, signal } = {}
) {
  if (
    shortId === undefined ||
    shortId === null ||
    String(shortId).trim() === ''
  ) {
    throw new Error('shortId is required');
  }

  // Keep whatever zero-padding you pass (e.g., "003")
  const base = `${API_BASE}/api/boxes/by-short-id/${encodeURIComponent(
    String(shortId)
  )}`;
  const url = new URL(base);
  if (tree) url.searchParams.set('tree', '1');

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Fetch failed (${res.status}): ${text || res.statusText}`);
  }
  const json = await res.json();
  return json.box ?? json.data ?? json;
}
export async function destroyBoxById(boxMongoId, opts = {}) {
  const res = await fetch(`${API_BASE}/api/boxes/${boxMongoId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    signal: opts.signal, // optional AbortController
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Failed to delete box ${boxMongoId}`);
  }

  // Some APIs return JSON, some don’t — handle both
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function fetchBoxTreeByShortId(shortId, { signal } = {}) {
  const res = await fetch(
    `${API_BASE}/api/boxes/by-short-id/${encodeURIComponent(shortId)}/tree`,
    { signal }
  );
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  const json = await res.json();
  return json.box ?? json.data ?? json; // normalize
}
