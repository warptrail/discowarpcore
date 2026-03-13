import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';

import GlobalStyles from './styles/globalStyles';

import Header from './components/Header';
import BoxList from './components/BoxList';
import AllItemsList from './components/AllItemsList';
import BoxDetailView from './components/BoxDetailView';
import BoxCreate from './components/BoxCreate';
import ItemPage from './components/ItemPage';
import { API_BASE } from './api/API_BASE';

// ! STYLES
const AppContainer = styled.div`
  max-width: 1024px;
  margin: 0 auto;
  padding: 2rem;
  font-family: Arial, Helvetica, sans-serif;
`;

const Heading = styled.h1`
  text-align: center;
  color: #0077cc;
  margin-bottom: 2rem;
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
        const orphanedData = orphanedRes.ok ? await orphanedRes.json() : [];
        const locationsData = locationsRes.ok ? await locationsRes.json() : {};

        if (!isAlive) return;
        setBoxes(Array.isArray(boxesData) ? boxesData : []);
        setOrphanedCount(
          Array.isArray(orphanedData) ? orphanedData.length : 0,
        );
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
        <Route path="/all-items" element={<AllItemsList />} />
        <Route path="/items/:itemId" element={<ItemPage />} />
      </Routes>
    </AppContainer>
  );
}

export default App;
