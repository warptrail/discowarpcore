import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import styled from 'styled-components';
import GlobalStyles from '../src/styles/globalStyles';
import BoxManagementSheet from '../src/components/BoxDetailView/BoxManagementSheet';
import EditBoxDetailsForm from '../src/components/EditBoxDetailsForm';
import { ToastContext } from '../src/components/Toast';

const Header = styled.header`height: 112px; padding: 12px; border-bottom: 1px solid var(--dw-border); color: var(--dw-text); font: 500 .8rem/1.4 var(--dw-font-ui);`;
const Button = styled.button`min-height: 44px; padding: 8px; border: 1px solid var(--dw-border); color: var(--dw-cyan); background: var(--dw-surface-raised);`;
const Log = styled.pre`font-size: 12px; white-space: pre-wrap; overflow-wrap: anywhere;`;
const location = { _id: 'synthetic-office', name: 'Office', room: 'Office', vicinity: '', specifics: '', exactSpot: '' };
const fixturePhoto = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#192637"/><text x="30" y="150" fill="#71d2ff" font-size="24">Synthetic photo</text></svg>');
const initialBox = { _id: 'synthetic-box', box_id: '001', label: 'Synthetic box', tags: ['fixture'], description: '', notes: '', locationId: location._id, declutterPurpose: 'standard', items: [],
  image: new URLSearchParams(window.location.search).has('photo') ? { thumb: { url: fixturePhoto }, display: { url: fixturePhoto } } : null };
const requests = [];
const json = (body) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });

// Install before any component mounts. This fixture never forwards a request to inventory.
window.fetch = async (input, options = {}) => {
  const url = new URL(String(input), window.location.origin);
  const method = options.method || 'GET';
  if (method === 'GET' && url.pathname === '/api/locations') return json({ locations: [location] });
  if (method === 'GET' && url.pathname.includes('availability')) return json({ available: true });
  if (method === 'PATCH' && url.pathname === '/api/boxes/synthetic-box') {
    const payload = JSON.parse(options.body);
    requests.push({ method, path: url.pathname, payload });
    window.dispatchEvent(new Event('synthetic-box-request'));
    return json({ box: { ...initialBox, ...payload } });
  }
  if (method === 'POST' && url.pathname === '/api/locations') {
    const payload = JSON.parse(options.body);
    requests.push({ method, path: url.pathname, payload });
    window.dispatchEvent(new Event('synthetic-box-request'));
    return json({ location: { ...payload, _id: 'synthetic-created-location', name: payload.room } });
  }
  throw new Error(`Fixture blocked unexpected request: ${method} ${url.pathname}`);
};

export default function Fixture() {
  const [box, setBox] = useState(initialBox);
  const [open, setOpen] = useState(true);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(requests.length);
    window.addEventListener('synthetic-box-request', update);
    return () => window.removeEventListener('synthetic-box-request', update);
  }, []);
  return <MemoryRouter><ToastContext.Provider value={{ showToast: () => {} }}>
    <GlobalStyles />
    <Header data-app-header>Synthetic box editor — all requests mocked.<br />{count} mock requests</Header>
    <main><Button onClick={() => setOpen(true)}>Open synthetic editor</Button><Log aria-label="Mock box requests" role="log">{JSON.stringify(requests)}</Log></main>
    <BoxManagementSheet open={open} paginated boxId="001" title="Synthetic box" onClose={() => setOpen(false)}>
      <EditBoxDetailsForm compact flat autoSave paginated boxMongoId={box._id} initial={box} onAutoSaved={setBox}
        onProcessImage={async () => {}} />
    </BoxManagementSheet>
  </ToastContext.Provider></MemoryRouter>;
}

createRoot(document.getElementById('root')).render(<Fixture />);
