import { API_BASE } from './API_BASE';
export async function missingRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}/api/items/${path}`, options);
  const body = await response.json();
  if (!response.ok) throw Object.assign(new Error(body.error || 'Could not update Missing Items.'), { status: response.status, data: body.data });
  return body.data;
}
export const fetchMissingItems = (params = {}, signal) => missingRequest(`missing?${new URLSearchParams(params)}`, { signal });
export const saveMissingItem = (id, mode, payload) => missingRequest(`${encodeURIComponent(id)}/${mode === 'found' ? 'found' : 'missing'}`, {
  method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
});
