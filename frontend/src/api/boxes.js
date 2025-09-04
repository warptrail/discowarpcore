// src/api/boxes.js
import { API_BASE } from './API_BASE';

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
