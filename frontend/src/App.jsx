import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import GlobalStyles from './styles/globalStyles';
import DynamicRouteButton from './components/DynamicRouteButton';
import BoxList from './components/BoxList';
import AllItemsList from './components/AllItemsList';
import BoxDetailView from './components/BoxDetailView';
import BoxCreate from './components/BoxCreate';

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

const HeadingLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

const Centered = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const NewBoxLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  margin: 2rem auto;
  font-size: 1rem;
  font-weight: bold;
  background-color: #222;
  color: #f0f0f0;
  border: 2px solid #00cc99;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 2px 10px rgba(0, 255, 200, 0.15);

  &:hover {
    background-color: #00cc99;
    color: #000;
    box-shadow: 0 0 20px rgba(0, 255, 200, 0.4);
  }

  &:active {
    transform: scale(0.98);
    box-shadow: 0 0 10px rgba(0, 255, 200, 0.6);
  }
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
      <HeadingLink to="/">
        <Heading>Discowarpcore Inventory</Heading>
      </HeadingLink>
      <Centered>
        <NewBoxLink to="/create-box">📦 New Box</NewBoxLink>
        <DynamicRouteButton />
      </Centered>

      <Routes>
        <Route path="/" element={<BoxList boxes={boxes} />} />
        <Route path="/boxes/:shortId" element={<BoxDetailView />} />
        <Route path="/create-box" element={<BoxCreate />} />
        <Route path="/all-items" element={<AllItemsList />} />
      </Routes>
    </AppContainer>
  );
}

export default App;
