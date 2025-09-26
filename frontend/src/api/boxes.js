import { API_BASE } from './API_BASE';

// frontend/src/api/boxes.js
export async function fetchBoxTreeByShortId(shortId, { signal } = {}) {
  if (!shortId) throw new Error('shortId is required');

  console.log('fetchBoxTreeByShortId called with:', shortId);

  const res = await fetch(
    `${API_BASE}/api/boxes/by-short-id/${encodeURIComponent(shortId)}`,
    { signal }
  );

  console.log('Response status:', res.status);

  const json = await res.json();
  console.log('Raw JSON from API:', json);

  return json.box ?? json.data ?? json;
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
