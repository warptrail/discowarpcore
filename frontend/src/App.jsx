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
import RetrievalPage from './components/Retrieval/RetrievalPage';
import { API_BASE } from './api/API_BASE';
import { MOBILE_BREAKPOINT, MOBILE_PAGE_GAP } from './styles/tokens';

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

function App() {
  const [boxes, setBoxes] = useState([]);
  const [orphanedCount, setOrphanedCount] = useState(0);
  const [locations, setLocations] = useState([]);

  // for refreshing the home page on location change
  const location = useLocation();

  useEffect(() => {
    let isAlive = true;

    const loadHomeData = async () => {
      try {
        const [boxesRes, orphanedRes, locationsRes] = await Promise.all([
          fetch(`${API_BASE}/api/boxes/tree`),
          fetch(`${API_BASE}/api/items/orphaned?sort=recent&limit=10000`),
          fetch(`${API_BASE}/api/locations`),
        ]);

        const boxesData = await boxesRes.json();
        const orphanedBody = orphanedRes.ok ? await orphanedRes.json() : [];
        const orphanedData = Array.isArray(orphanedBody)
          ? orphanedBody
          : Array.isArray(orphanedBody?.items)
            ? orphanedBody.items
            : [];
        const locationsData = locationsRes.ok ? await locationsRes.json() : {};

        if (!isAlive) return;
        setBoxes(Array.isArray(boxesData) ? boxesData : []);
        setOrphanedCount(orphanedData.length);
        setLocations(
          Array.isArray(locationsData?.locations) ? locationsData.locations : [],
        );
      } catch (err) {
        if (!isAlive) return;
        console.error('Error fetching home data:', err);
        setBoxes([]);
        setOrphanedCount(0);
        setLocations([]);
      }
    };

    loadHomeData();
    return () => {
      isAlive = false;
    };
  }, [location]);

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
            />
          }
        />
        <Route path="/boxes/:shortId" element={<BoxDetailView />} />
        <Route path="/create-box" element={<BoxCreate />} />
        <Route path="/intake" element={<IntakePage boxes={boxes} />} />
        <Route path="/all-items" element={<AllItemsList />} />
        <Route path="/retrieval" element={<RetrievalPage />} />
        <Route path="/items/:itemId" element={<ItemPage />} />
      </Routes>
    </AppContainer>
  );
}

export default App;
