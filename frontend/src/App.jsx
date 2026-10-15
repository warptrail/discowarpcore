import useTagSourceRestoration from './hooks/useTagSourceRestoration';
import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import GlobalStyles from './styles/globalStyles';

import Header from './components/Header';
import DesktopShell from './components/DesktopWorkspace/DesktopShell';

const OperationsPage = lazy(() => import('./components/OperationsPage'));
const AllItemsPlaceholder = lazy(() => import('./components/AllItemsPlaceholder'));
const BoxDetailView = lazy(() => import('./components/BoxDetailView'));
const BoxCreate = lazy(() => import('./components/BoxCreate'));
const ItemPage = lazy(() => import('./components/ItemPage'));
const IntakeRoutePage = lazy(() => import('./components/Intake/IntakeRoutePage'));
const ConfigurationPage = lazy(() => import('./components/Configuration/ConfigurationPage'));
const RetrievalPage = lazy(() => import('./components/Retrieval/RetrievalPage'));
const DeclutterDeckPage = lazy(() => import('./components/Declutter/DeclutterDeckPage'));
const DeclutterHistoryPage = lazy(() => import('./components/Declutter/DeclutterHistoryPage'));
const LocationPage = lazy(() => import('./components/Location/LocationPage'));
const LoadoutsPage = lazy(() => import('./components/Loadouts/LoadoutsPage'));

// ! STYLES

const SkipLink = styled.a`
  position: fixed;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 2000;
  transform: translateY(calc(-100% - 1rem));
  padding: 0.75rem 1rem;
  border: 2px solid var(--dw-cyan);
  border-radius: var(--dw-radius-sm);
  background: var(--dw-surface);
  color: var(--dw-text);
  font: 600 0.9rem/1.3 var(--dw-font-ui);
  text-decoration: none;
  &:focus { transform: translateY(0); outline: 2px solid var(--dw-amber); outline-offset: 3px; }
`;

const RouteContent = styled.main`
  position: relative;
  min-width: 0;
  scroll-margin-top: calc(var(--dw-header-height, 0px) + 16px);
  &:focus { outline: none; }
  @media (min-width: 980px) {
    ${({ $retrievalPage }) => $retrievalPage && `
      height: 100%;
      min-height: 0;
    `}
  }
`;

const RouteHeading = styled.h1`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;

function getRouteTitle(pathname) {
  if (/^\/boxes\//.test(pathname)) return 'Box inventory';
  if (/^\/items\//.test(pathname)) return 'Item details';
  if (/^\/tags?\//.test(pathname)) return 'Inventory by tag';
  const titles = {
    '/': 'Operations',
    '/operations': 'Operations',
    '/create-box': 'Create a box',
    '/intake': 'Intake',
    '/import': 'Configuration',
    '/configuration': 'Configuration',
    '/all-items': 'All items',
    '/declutter': 'Declutter',
    '/declutter/history': 'Declutter history',
    '/logs': 'Configuration',
    '/location': 'Location',
    '/retrieval': 'Retrieval',
    '/loadouts': 'Loadouts',
  };
  return titles[pathname.replace(/\/$/, '') || '/'] || 'Inventory';
}

const RouteLoading = styled.div`
  min-height: 35vh;
  display: grid;
  place-items: center;
  color: var(--dw-text-secondary);
  font: 500 0.9rem/1.4 var(--dw-font-ui);
`;

// ! End STYLES

const AUTOFILL_DISABLED_TYPES = new Set([
  '',
  'text',
  'search',
  'number',
  'email',
  'tel',
  'url',
  'password',
]);

function disableAutofillOnElement(element) {
  if (!(element instanceof HTMLElement)) return;

  if (element instanceof HTMLTextAreaElement) {
    element.setAttribute('autocomplete', 'off');
    element.setAttribute('autocorrect', 'off');
    element.setAttribute('autocapitalize', 'none');
    element.setAttribute('spellcheck', 'false');
    return;
  }

  if (!(element instanceof HTMLInputElement)) return;

  const inputType = String(element.type || '').toLowerCase();
  if (!AUTOFILL_DISABLED_TYPES.has(inputType)) return;

  element.setAttribute('autocomplete', 'off');
  element.setAttribute('autocorrect', 'off');
  element.setAttribute('autocapitalize', 'none');
  element.setAttribute('spellcheck', 'false');
}

function disableAutofillWithin(root) {
  if (!(root instanceof HTMLElement)) return;

  disableAutofillOnElement(root);
  const fields = root.querySelectorAll('input, textarea, form');

  for (const field of fields) {
    if (field instanceof HTMLFormElement) {
      field.setAttribute('autocomplete', 'off');
      continue;
    }
    disableAutofillOnElement(field);
  }
}

function LegacyLogsRedirect() {
  const { search, hash } = useLocation();
  const params = new URLSearchParams(search);
  params.set('tab', 'logs');
  return <Navigate replace to={`/configuration?${params}${hash}`} />;
}

function App() {
  useTagSourceRestoration();
  const location = useLocation();
  const isRetrievalPage = /^\/(?:retrieval|tags?\/[^/]+)\/?$/.test(
    location.pathname,
  );
  const isItemPage = /^\/items\/[^/]+\/?$/.test(location.pathname);
  const isIntakePage = /^\/intake\/?$/.test(location.pathname);
  const isLoadoutsPage = /^\/loadouts\/?$/.test(location.pathname);
  const isImportPage = /^\/(?:import|configuration)\/?$/.test(location.pathname);
  const routeTitle = getRouteTitle(location.pathname);
  useEffect(() => {
    disableAutofillWithin(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          disableAutofillWithin(node);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  const retrievalPage = <RetrievalPage key={location.pathname} />;

  return (
    <DesktopShell $retrievalPage={isRetrievalPage} $itemPage={isItemPage}>
      <GlobalStyles />
      <SkipLink
        href="#route-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('route-content')?.focus();
        }}
      >
        Skip to content
      </SkipLink>
      <Header />

      <RouteContent
        as={isIntakePage ? 'div' : 'main'}
        id="route-content"
        tabIndex={-1}
        aria-label={isIntakePage ? undefined : routeTitle}
        $retrievalPage={isRetrievalPage}
      >
        {!isImportPage && !isLoadoutsPage && <RouteHeading>{routeTitle}</RouteHeading>}
        <Suspense fallback={<RouteLoading role="status">Loading inventory…</RouteLoading>}>
          <Routes>
            <Route path="/" element={<OperationsPage />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/boxes/:shortId" element={<BoxDetailView />} />
            <Route path="/create-box" element={<BoxCreate />} />
            <Route path="/intake" element={<IntakeRoutePage />} />
            <Route path="/configuration" element={<ConfigurationPage />} />
            <Route path="/import" element={<ConfigurationPage />} />
            <Route path="/all-items" element={<AllItemsPlaceholder />} />
            <Route path="/declutter" element={<DeclutterDeckPage />} />
            <Route path="/declutter/history" element={<DeclutterHistoryPage />} />
            <Route path="/logs" element={<LegacyLogsRedirect />} />
            <Route path="/location" element={<LocationPage />} />
            <Route path="/loadouts" element={<LoadoutsPage />} />
            <Route path="/retrieval" element={retrievalPage} />
            <Route path="/tags/:tag" element={retrievalPage} />
            <Route path="/tag/:tag" element={retrievalPage} />
            <Route path="/items/:itemId" element={<ItemPage />} />
          </Routes>
        </Suspense>
      </RouteContent>
    </DesktopShell>
  );
}

export default App;
