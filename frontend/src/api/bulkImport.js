import { API_BASE } from './API_BASE';

async function readJson(response) {
  return response.json().catch(() => ({}));
}

export async function resolveBoxByShortId(shortId, opts = {}) {
  const normalizedShortId = String(shortId || '').trim();
  if (!/^\d{3}$/.test(normalizedShortId)) {
    throw new Error('Box ID must be exactly 3 digits.');
  }

  const res = await fetch(
    `${API_BASE}/api/boxes/resolve-short-id/${encodeURIComponent(normalizedShortId)}`,
    { signal: opts.signal },
  );

  if (res.status === 404) {
    return null;
  }

  const body = await readJson(res);
  if (!res.ok) {
    throw new Error(body?.error || body?.message || 'Failed to resolve box ID');
  }

  return body?.box || null;
}

export async function bulkCreateItems(
  { itemNames, boxShortId = '', sourceFileName = '' },
  opts = {}
) {
  const payload = {
    itemNames: Array.isArray(itemNames) ? itemNames : [],
  };

  const normalizedBoxShortId = String(boxShortId || '').trim();
  if (normalizedBoxShortId) {
    payload.boxShortId = normalizedBoxShortId;
  }

  const normalizedSourceFileName = String(sourceFileName || '').trim();
  if (normalizedSourceFileName) {
    payload.sourceFileName = normalizedSourceFileName;
  }

  const res = await fetch(`${API_BASE}/api/items/bulk-create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: opts.signal,
  });

  const body = await readJson(res);
  if (!res.ok) {
    throw new Error(body?.error || body?.message || 'Failed to import items');
  }

  return body;
}
