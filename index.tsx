

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import ScrollToTop from './components/ScrollToTop';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);
