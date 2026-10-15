import MissingItemsProvider from './components/MissingItems/MissingItemsProvider.jsx';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ToastProvider } from './components/Toast/index.js';
import HouseholdProfileProvider from './components/HouseholdProfile/HouseholdProfileProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <HouseholdProfileProvider>
            <MissingItemsProvider><App /></MissingItemsProvider>
          </HouseholdProfileProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
