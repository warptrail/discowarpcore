import { createRoot } from 'react-dom/client';
import { useCallback, useMemo, useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import styled from 'styled-components';
import GlobalStyles from '../src/styles/globalStyles';
import IntakePage from '../src/components/Intake/IntakePage';
import { ToastContext } from '../src/components/Toast';
import { QUICK_CAPTURE_DRAFT_STATE_KEY } from '../src/components/Intake/quickCaptureDraft';

const storage = new Map();
Object.defineProperty(window, 'localStorage', { configurable: true, value: {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key),
} });
const boxes = [
  { _id: 'synthetic-091', box_id: '091', label: 'Navigation equipment case', location: 'Garage',
    locationId: 'synthetic-location', tags: ['equipment'], notes: 'Synthetic box notes', isComplexBox: true,
    compartments: [{ key: 'A', label: 'Left' }, { key: 'B', label: 'Right' }] },
  { _id: 'synthetic-200', box_id: '200', label: 'Spare parts', location: 'Office', tags: ['parts'] },
];
let items = [
  { _id: 'synthetic-item', name: 'Synthetic sensor', quantity: 2, category: 'electronics', box: boxes[0], boxId: boxes[0]._id, createdAt: new Date().toISOString() },
  { _id: 'synthetic-adrift', name: 'Synthetic spare cable', quantity: 1, category: 'electronics', box: null, orphanedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
];
let failNextSave = false;
let recordRequest = () => {};
window.fetch = async (input, options = {}) => {
  const url = new URL(String(input), location.origin);
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  if (!options.method || options.method === 'GET') {
    if (url.pathname === '/api/items') return json(items);
    if (url.pathname === '/api/boxes') return json(boxes);
    if (url.pathname === '/api/locations') return json({ locations: [{ _id: 'synthetic-location', room: 'Garage', vicinity: 'North shelf', specifics: 'Equipment bay', exactSpot: 'Left slot' }] });
    if (url.pathname.includes('/check-id/')) return json({ available: true });
    return json([]); // Data-safe read boundary; no request reaches a real service.
  }
  const body = JSON.parse(options.body || '{}');
  recordRequest({ path: url.pathname, method: options.method, ...body });
  if (failNextSave) { failNextSave = false; return json({ error: 'Synthetic save failed. Try again.' }, 500); }
  if (options.method === 'POST' && (url.pathname === '/api/items' || url.pathname.endsWith('/items'))) {
    const item = { _id: `synthetic-created-${items.length}`, createdAt: new Date().toISOString(), ...body };
    items = [item, ...items]; return json(item);
  }
  if (options.method === 'PATCH' && url.pathname.startsWith('/api/boxes/')) return json({ ...boxes[0], ...body });
  throw new Error(`Fixture blocked unexpected mutation: ${url.pathname}`);
};

const Shell = styled.div`padding: 12px; max-width: 1500px; margin: auto; color: var(--dw-text); --dw-header-height: 60px;`;
const Header = styled.header`display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 8px 0 16px; button { min-height: 44px; color: var(--dw-cyan); border: 1px solid var(--dw-border); background: var(--dw-surface); cursor: pointer; }`;
const Log = styled.pre`white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px;`;

export default function Fixture() {
  const [toast, setToast] = useState(null);
  const [requests, setRequests] = useState([]);
  const hideToast = useCallback((id) => setToast((current) => !id || id === current?.id ? null : current), []);
  const context = useMemo(() => ({ showToast: setToast, hideToast }), [hideToast]);
  recordRequest = (request) => setRequests((current) => [...current, request]);
  return <MemoryRouter initialEntries={[{ pathname: '/intake', state: { [QUICK_CAPTURE_DRAFT_STATE_KEY]: {
    version: 1, name: 'Synthetic draft item', description: 'Handed off from Quick Peek', notes: 'Preserve this note', tags: ['draft'], category: 'electronics', quantity: 3, mode: 'inBox', targetBoxId: boxes[0]._id,
  } } }]}><ToastContext.Provider value={context}><GlobalStyles /><Shell>
    <Header><strong>Intake · synthetic inventory only</strong><button onClick={() => { failNextSave = true; }}>Fail next save</button></Header>
    {toast ? <section aria-label="Synthetic toast"><strong>{toast.title}</strong><p>{toast.message}</p>{toast.content}</section> : null}
    <IntakePage boxes={boxes} />
    <Log role="log" aria-label="Mock inventory requests">{JSON.stringify(requests)}</Log>
  </Shell></ToastContext.Provider></MemoryRouter>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
