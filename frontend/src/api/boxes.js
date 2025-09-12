import { API_BASE } from './API_BASE';

export async function fetchBoxDataStructure(
  shortId,
  { ancestors = false, flat = 'none', stats = true, signal } = {}
) {
  if (!shortId) throw new Error('shortId is required');

  const url = new URL(
    `${API_BASE}/api/boxes/by-short-id/${encodeURIComponent(shortId)}`
  );

  if (ancestors) url.searchParams.set('ancestors', '1'); // breadcrumb
  if (flat === 'items' || flat === 'all') url.searchParams.set('flat', flat); // flatten server-side
  if (!stats) url.searchParams.set('stats', '0'); // skip stats if you want

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || res.statusText);
  }
  const json = await res.json();
  return json.box ?? json; // controller returns { ok, box }
}

//? Destroy a box by mongo id
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
