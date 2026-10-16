import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/theme.css';

// Register Service Worker for true 100% offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Check if we are not on an unsupported protocol
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      navigator.serviceWorker
        .register('/service-worker.js', { scope: '/' })
        .then((reg) => {
          console.log('[OfflineWeb AI] Service Worker active, scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[OfflineWeb AI] Service Worker registration failed:', err);
        });
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
