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

  // for refreshing the home page on location change
  const location = useLocation();

  useEffect(() => {
    fetch('http://localhost:5002/api/boxes/tree')
      .then((res) => res.json())
      .then((data) => setBoxes(data))
      .catch((err) => console.error('Error fetching boxes:', err));
  }, [location]);

  return (
    <AppContainer>
      <GlobalStyles />
      <Header />

      <Routes>
        <Route path="/" element={<BoxList boxes={boxes} />} />
        <Route path="/boxes/:shortId" element={<BoxDetailView />} />
        <Route path="/create-box" element={<BoxCreate />} />
        <Route path="/all-items" element={<AllItemsList />} />
        <Route path="/items/:itemId" element={<ItemPage />} />
      </Routes>
    </AppContainer>
  );
}

export default App;
