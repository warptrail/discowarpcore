import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import GlobalStyles from './styles/globalStyles';

import Header from './components/Header';
import BoxList from './components/BoxList';
import AllItemsList from './components/AllItemsList';
import BoxDetailView from './components/BoxDetailView';
import BoxCreate from './components/BoxCreate';
import ItemPage from './components/ItemPage';
import IntakePage from './components/Intake/IntakePage';
import BulkImportPage from './components/BulkImport/BulkImportPage';
import RetrievalPage from './components/Retrieval/RetrievalPage';
import LogsPage from './components/SystemLogsPage';
import { API_BASE } from './api/API_BASE';
import { MOBILE_BREAKPOINT, MOBILE_PAGE_GAP } from './styles/tokens';

const OPERATIONS_PAGE_LIMIT = 50;

// ! STYLES
const AppContainer = styled.div`
  max-width: 1024px;
  margin: 0 auto;
  padding: 2rem;
  font-family: Arial, Helvetica, sans-serif;
  min-width: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    max-width: 100%;
    padding: ${MOBILE_PAGE_GAP};
  }
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
  const [boxes, setBoxes] = useState([]);
  const [boxesPage, setBoxesPage] = useState(1);
  const [boxesTotal, setBoxesTotal] = useState(0);
  const [boxesTotalPages, setBoxesTotalPages] = useState(1);
  const [orphanedCount, setOrphanedCount] = useState(0);
  const [locations, setLocations] = useState([]);

  // for refreshing the home page on location change
  const location = useLocation();

  useEffect(() => {
    let isAlive = true;

    const loadHomeData = async () => {
      try {
        const boxesQuery = new URLSearchParams({
          page: String(boxesPage),
          limit: String(OPERATIONS_PAGE_LIMIT),
        });

        const [boxesRes, orphanedRes, locationsRes] = await Promise.all([
          fetch(`${API_BASE}/api/boxes/tree?${boxesQuery}`),
          fetch(`${API_BASE}/api/items/orphaned?sort=recent&limit=10000`),
          fetch(`${API_BASE}/api/locations`),
        ]);

        const boxesBody = await boxesRes.json();
        const boxesData = Array.isArray(boxesBody?.items)
          ? boxesBody.items
          : Array.isArray(boxesBody)
            ? boxesBody
            : [];
        const apiTotal = Number(boxesBody?.total);
        const total = Number.isFinite(apiTotal) ? apiTotal : boxesData.length;
        const apiTotalPages = Number(boxesBody?.totalPages);
        const totalPages = Number.isFinite(apiTotalPages)
          ? Math.max(1, apiTotalPages)
          : Math.max(1, Math.ceil(total / OPERATIONS_PAGE_LIMIT));
        const apiPage = Number(boxesBody?.page);
        const currentPage = Number.isFinite(apiPage)
          ? Math.max(1, Math.min(apiPage, totalPages))
          : boxesPage;
        const orphanedBody = orphanedRes.ok ? await orphanedRes.json() : [];
        const orphanedData = Array.isArray(orphanedBody)
          ? orphanedBody
          : Array.isArray(orphanedBody?.items)
            ? orphanedBody.items
            : [];
        const locationsData = locationsRes.ok ? await locationsRes.json() : {};

        if (!isAlive) return;
        setBoxes(Array.isArray(boxesData) ? boxesData : []);
        setBoxesTotal(total);
        setBoxesTotalPages(totalPages);
        if (currentPage !== boxesPage) setBoxesPage(currentPage);
        setOrphanedCount(orphanedData.length);
        setLocations(
          Array.isArray(locationsData?.locations) ? locationsData.locations : [],
        );
      } catch (err) {
        if (!isAlive) return;
        console.error('Error fetching home data:', err);
        setBoxes([]);
        setBoxesTotal(0);
        setBoxesTotalPages(1);
        setOrphanedCount(0);
        setLocations([]);
      }
    };

    loadHomeData();
    return () => {
      isAlive = false;
    };
  }, [location, boxesPage]);

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

  return (
    <AppContainer>
      <GlobalStyles />
      <Header />

      <Routes>
        <Route
          path="/"
          element={
            <BoxList
              boxes={boxes}
              orphanedCount={orphanedCount}
              locations={locations}
              pagination={{
                page: boxesPage,
                limit: OPERATIONS_PAGE_LIMIT,
                total: boxesTotal,
                totalPages: boxesTotalPages,
              }}
              onPageChange={setBoxesPage}
            />
          }
        />
        <Route path="/boxes/:shortId" element={<BoxDetailView />} />
        <Route path="/create-box" element={<BoxCreate />} />
        <Route path="/intake" element={<IntakePage boxes={boxes} />} />
        <Route path="/import" element={<BulkImportPage />} />
        <Route path="/all-items" element={<AllItemsList />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/retrieval" element={<RetrievalPage />} />
        <Route path="/items/:itemId" element={<ItemPage />} />
      </Routes>
    </AppContainer>
  );
}

export default App;
