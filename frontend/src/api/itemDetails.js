// src/api/itemDetails.js
import { API_BASE } from './API_BASE';

/** Build FRONTEND route to the item’s page (React). */
export function getItemHomeHref(id, opts = {}) {
  if (!id) throw new Error('getItemHomeHref: "id" is required');
  const basePath = opts.basePath ?? '';
  const pathname = `${basePath}/items/${encodeURIComponent(id)}`;
  const qp = opts.query ?? null;
  if (!qp) return pathname;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(qp)) {
    if (v === undefined || v === null) continue;
    qs.set(k, String(v));
  }
  const q = qs.toString();
  return q ? `${pathname}?${q}` : pathname;
}

/** Build BACKEND API URL for a single item. */
export function makeItemDetailsURL(id, opts = {}) {
  if (!id) throw new Error('makeItemDetailsURL: id is required');
  const qs = new URLSearchParams();
  const sel = opts.select
    ? (Array.isArray(opts.select)
        ? opts.select.join(',')
        : String(opts.select)
      ).trim()
    : '';
  if (sel) qs.set('select', sel);
  return `${API_BASE}/api/items/${encodeURIComponent(id)}${
    qs.toString() ? `?${qs}` : ''
  }`;
}

/** GET enriched item (includes box, breadcrumb, depth, topBox). */
export async function fetchItemDetails(id, opts = {}) {
  const url = makeItemDetailsURL(id, { select: opts.select });
  const res = await fetch(url, { signal: opts.signal });
  if (!res.ok) throw new Error(`GET ${url} failed (${res.status})`);
  const json = await res.json();
  return json.data; // { ...item, box, breadcrumb, depth, topBox, ... }
}

/** PATCH generic item fields. Used for "Mark last used", etc. */
export async function patchItem(id, body, opts = {}) {
  if (!id) throw new Error('patchItem: id is required');
  const url = `${API_BASE}/api/items/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    signal: opts.signal,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${url} failed (${res.status})`);
  const json = await res.json().catch(() => ({}));
  // Controller may return item or { ok, data: item }
  return json.data ?? json;
}

/** Small helper to make aborting easy. */
export function createAborter() {
  const ac = new AbortController();
  return { signal: ac.signal, cancel: () => ac.abort() };
}
