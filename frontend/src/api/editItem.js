// src/api/editItem.js
import { API_BASE } from './API_BASE'; // adjust path if needed

export async function editItem(itemId, payload, { signal } = {}) {
  const url = `${API_BASE}/api/items/${itemId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update item (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data?.data || data; // unwrap { ok, data } shape if present
}
