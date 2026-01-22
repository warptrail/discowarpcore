import { API_BASE } from './API_BASE';

// frontend/src/api/boxes.js
export async function fetchBoxTreeByShortId(shortId, { signal } = {}) {
  if (!shortId) throw new Error('shortId is required');

  console.log('fetchBoxTreeByShortId called with:', shortId);

  const res = await fetch(
    `${API_BASE}/api/boxes/by-short-id/${encodeURIComponent(shortId)}`,
    { signal },
  );

  console.log('Response status:', res.status);

  const json = await res.json();
  console.log('Raw JSON from API:', json);

  return json.box ?? json.data ?? json;
}

export async function releaseChildrenToFloor(boxMongoId, opts = {}) {
  const res = await fetch(
    `${API_BASE}/api/boxes/${boxMongoId}/release-children`,
    {
      method: 'POST',
      signal: opts.signal,
    },
  );

  if (!res.ok) {
    let errorMessage = `Failed to release children for box ${boxMongoId}`;
    try {
      const json = await res.json();
      errorMessage = json.error || json.message || errorMessage;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function updateBoxById(boxMongoId, patch, opts = {}) {
  const res = await fetch(`${API_BASE}/api/boxes/${boxMongoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
    signal: opts.signal,
  });

  if (!res.ok) {
    let errorMessage = `Failed to update box ${boxMongoId}`;
    try {
      const json = await res.json();
      errorMessage = json.error || json.message || errorMessage;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  const json = await res.json();
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
