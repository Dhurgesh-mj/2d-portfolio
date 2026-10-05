import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

import './styles/variables.css';
import './styles/globals.css';
import './styles/typography.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Offline frame cache — production only (dev must always hit the network)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline support is a bonus; the app works fine without it
    });
  });
}
