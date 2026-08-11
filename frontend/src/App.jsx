import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import GlobalStyles from './styles/globalStyles';

import Header from './components/Header';
import { MOBILE_BREAKPOINT, MOBILE_PAGE_GAP } from './styles/tokens';

const OperationsPage = lazy(() => import('./components/OperationsPage'));
const AllItemsList = lazy(() => import('./components/AllItemsList'));
const BoxDetailView = lazy(() => import('./components/BoxDetailView'));
const BoxCreate = lazy(() => import('./components/BoxCreate'));
const ItemPage = lazy(() => import('./components/ItemPage'));
const IntakeRoutePage = lazy(() => import('./components/Intake/IntakeRoutePage'));
const BulkImportPage = lazy(() => import('./components/BulkImport/BulkImportPage'));
const RetrievalPage = lazy(() => import('./components/Retrieval/RetrievalPage'));
const DeclutterDeckPage = lazy(() => import('./components/Declutter/DeclutterDeckPage'));
const DeclutterHistoryPage = lazy(() => import('./components/Declutter/DeclutterHistoryPage'));
const LogsPage = lazy(() => import('./components/SystemLogsPage'));

// ! STYLES
const AppContainer = styled.div`
  max-width: ${({ $retrievalPage, $itemPage }) => (
    $retrievalPage ? '1280px' : $itemPage ? '1440px' : '1024px'
  )};
  margin: 0 auto;
  padding: ${({ $retrievalPage }) =>
    $retrievalPage ? 'clamp(1rem, 2vw, 1.5rem)' : 'clamp(1rem, 3vw, 2rem)'};
  font-family: Arial, Helvetica, sans-serif;
  min-width: 0;

  @media (min-width: 980px) {
    ${({ $retrievalPage }) => $retrievalPage && `
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      gap: 0.38rem;
      height: 100dvh;
      overflow: hidden;
      padding-block: 0.38rem 0.5rem;
    `}
  }

  @media (min-width: calc(${MOBILE_BREAKPOINT} + 1px)) and (max-width: 899px) {
    padding: ${({ $retrievalPage }) => ($retrievalPage ? '0.75rem' : '2rem')};
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    max-width: 100%;
    padding: ${MOBILE_PAGE_GAP};
  }
`;

const RouteLoading = styled.div`
  min-height: 35vh;
  display: grid;
  place-items: center;
  color: rgba(230, 237, 243, 0.66);
  font: 800 0.72rem/1.2 "SFMono-Regular", Consolas, monospace;
  letter-spacing: 0.1em;
  text-transform: uppercase;
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

function App() {
  const location = useLocation();
  const isRetrievalPage = /^\/(?:retrieval|tags\/[^/]+)\/?$/.test(
    location.pathname,
  );
  const isItemPage = /^\/items\/[^/]+\/?$/.test(location.pathname);
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
    <AppContainer $retrievalPage={isRetrievalPage} $itemPage={isItemPage}>
      <GlobalStyles />
      <Header />

      <Suspense fallback={<RouteLoading>Loading console…</RouteLoading>}>
        <Routes>
          <Route path="/" element={<OperationsPage />} />
          <Route path="/operations" element={<OperationsPage />} />
          <Route path="/boxes/:shortId" element={<BoxDetailView />} />
          <Route path="/create-box" element={<BoxCreate />} />
          <Route path="/intake" element={<IntakeRoutePage />} />
          <Route path="/import" element={<BulkImportPage />} />
          <Route path="/all-items" element={<AllItemsList />} />
          <Route path="/declutter" element={<DeclutterDeckPage />} />
          <Route path="/declutter/history" element={<DeclutterHistoryPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/retrieval" element={retrievalPage} />
          <Route path="/tags/:tag" element={retrievalPage} />
          <Route path="/items/:itemId" element={<ItemPage />} />
        </Routes>
      </Suspense>
    </AppContainer>
  );
}

export default App;
