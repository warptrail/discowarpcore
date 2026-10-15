import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import styled from 'styled-components';
import GlobalStyles from '../src/styles/globalStyles';
import QuickPeekBoxHeader from '../src/components/OperationsQuickPeek/QuickPeekBoxHeader';
import QuickPeekItemActionPanel from '../src/components/OperationsQuickPeek/QuickPeekItemActionPanel';
import OperationsBoxQuickPeek from '../src/components/OperationsQuickPeek/OperationsBoxQuickPeek';
import { ToastContext } from '../src/components/Toast';

const Page = styled.main`max-width: 600px; margin: 30px auto; padding: 8px; color: var(--dw-text);`;
const Preview = styled.section`margin-top: 20px; border: 1px solid var(--dw-border); border-radius: 8px; --box-primary: #f2b45c; --box-secondary: #c388ff;`;
const StateButton = styled.button`margin: 6px 3px; min-height: 44px; padding: 8px; color: var(--dw-text); background: var(--dw-surface-raised); border: 1px solid var(--dw-border);`;
const RequestLog = styled.pre`white-space: pre-wrap; overflow-wrap: anywhere; font-size: 11px;`;
const syntheticBox = { _id: 'synthetic-source', box_id: '100', label: 'Synthetic trunk', location: 'Living Room',
  locationId: { room: 'Living Room', vicinity: 'North shelving', specifics: 'Lower storage shelf', exactSpot: 'Behind the blue basket' }, isComplexBox: true,
  compartments: [{ key: 'A', label: 'Left' }, { key: 'B', label: 'Right' }] };
const destinations = [
  syntheticBox,
  { _id: 'synthetic-recent', box_id: '102', label: 'Synthetic towels', items: [] },
  { _id: 'synthetic-destination', box_id: '200', label: 'Synthetic drawer', isComplexBox: true, compartments: [{ key: 'A', label: 'Left' }, { key: 'B', label: 'Right' }], items: [] },
  ...Array.from({ length: 14 }, (_, index) => ({ _id: `synthetic-extra-${index}`, box_id: String(300 + index), label: `Synthetic extra ${index}`, items: [] })),
];

export default function Fixture() {
  const [inDeck, setInDeck] = useState(false);
  const [pending, setPending] = useState(false);
  const [gone, setGone] = useState(false);
  const [adrift, setAdrift] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [docked, setDocked] = useState(false);
  const [boxView, setBoxView] = useState(false);
  const [toast, setToast] = useState(null);
  const [requests, setRequests] = useState([]);
  const [lastAction, setLastAction] = useState('No action');
  const item = { _id: 'synthetic-only', name: 'Synthetic hood', compartmentKey: 'B', item_status: gone ? 'gone' : 'active' };
  const box = adrift ? { systemType: 'orphaned', label: 'Items Adrift' } : syntheticBox;
  useEffect(() => {
    const originalFetch = window.fetch;
    // Fixture-only boundary: never forward an inventory request to a real service.
    window.fetch = async (input, options = {}) => {
      const url = new URL(String(input), window.location.origin);
      const json = (body) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
      if (options.method === 'PATCH' && url.pathname.startsWith('/api/boxed-items/')) {
        setRequests((previous) => [...previous, { path: url.pathname, ...JSON.parse(options.body) }]);
        return json({ ok: true });
      }
      if (options.method === 'POST' && (url.pathname === '/api/items' || url.pathname.endsWith('/items'))) {
        const body = JSON.parse(options.body);
        setRequests((previous) => [...previous, { path: url.pathname, ...body }]);
        return json({ _id: 'synthetic-created', ...body });
      }
      if (url.pathname === '/api/items') return json({ items: [
        { _id: 'synthetic-boxed', name: 'Synthetic move target', quantity: 1, category: 'miscellaneous', compartmentKey: 'B', box: destinations[2] },
        { _id: 'synthetic-adrift', name: 'Synthetic adrift target', quantity: 1, category: 'miscellaneous' },
        { _id: 'synthetic-here', name: 'Synthetic item already here', quantity: 1, category: 'miscellaneous', box: syntheticBox },
      ], total: 3, hasMore: false });
      if (url.pathname === '/api/declutter-deck') return json({ entries: [] });
      if (url.pathname === '/api/boxes') return json(destinations);
      if (url.pathname === '/api/logs') return json({ entries: [{ details: { to_box_id: 'synthetic-recent', to_box_label: 'Synthetic towels' } }] });
      throw new Error(`Fixture blocked unexpected request: ${url.pathname}`);
    };
    return () => { window.fetch = originalFetch; };
  }, []);
  const record = (action) => () => setLastAction(action);
  return <MemoryRouter><ToastContext.Provider value={{ showToast: setToast, hideToast: () => setToast(null) }}><GlobalStyles /><Page>
    <p>Synthetic Quick Peek control test — every inventory request is mocked.</p>
    <StateButton aria-pressed={pending} onClick={() => setPending(!pending)}>Toggle pending</StateButton>
    <StateButton aria-pressed={gone} onClick={() => setGone(!gone)}>Toggle gone</StateButton>
    <StateButton aria-pressed={adrift} onClick={() => setAdrift(!adrift)}>Toggle Adrift</StateButton>
    <StateButton aria-pressed={docked} onClick={() => setDocked(!docked)}>Toggle docked</StateButton>
    <StateButton onClick={() => { setExpanded(false); setBoxView(true); }}>Open synthetic box list</StateButton>
    <p role="status">{lastAction}</p>
    {!boxView ? <Preview>
      <QuickPeekBoxHeader box={box}
        expanded={expanded} docked={docked}
        onClose={record('Closed entire panel')}
        onToggleExpanded={() => { setExpanded(!expanded); setLastAction(expanded ? 'Collapsed panel' : 'Expanded panel'); }}
        itemFocused itemPosition={13} itemTotal={17} canSelectPrevious canSelectNext
        onPrevious={record('Previous box')} onNext={record('Next box')} onReturnToItems={record('Returned to item list')}
        itemActionPanel={<QuickPeekItemActionPanel embedded item={item} box={box}
          inDeclutterDeck={inDeck} declutterPending={pending}
          onMoved={record('Placement refreshed')} onOpenFullItem={record('Full item callback')}
          onToggleDeclutterDeck={() => { setInDeck(!inDeck); setLastAction(inDeck ? 'Removed from synthetic deck' : 'Added to synthetic deck'); }} />}
      />
    </Preview> : <OperationsBoxQuickPeek
      presentation={docked ? 'dock' : 'sheet'}
      box={{ ...box, notes: 'Synthetic box notes for checking the shared footer.', items: Array.from({ length: 36 }, (_, index) => ({
        _id: `synthetic-list-${index}`, name: `Synthetic item ${index + 1}`, category: 'Miscellaneous', quantity: 1,
      })) }}
      expanded={expanded} onToggleExpanded={() => setExpanded(!expanded)} onSetExpanded={setExpanded}
      onClose={() => { setBoxView(false); setLastAction('Closed entire panel'); }}
      onDismiss={() => { setBoxView(false); setLastAction('Closed entire panel'); }}
      canSelectPrevious canSelectNext onPrevious={record('Previous box')} onNext={record('Next box')}
      onOpenFullBox={record('Full box callback')} />}
    {toast ? <section aria-label="Synthetic toast"><h2>{toast.title}</h2><p>{toast.message}</p>
      {toast.actions?.map((action) => <StateButton key={action.label} onClick={action.onClick}>{action.label}</StateButton>)}
    </section> : null}
    <RequestLog role="log" aria-label="Mock inventory requests">{JSON.stringify(requests, null, 2)}</RequestLog>
  </Page></ToastContext.Provider></MemoryRouter>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
