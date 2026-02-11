
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Register the service worker only in production builds.
// The file lives in `public/` so it is emitted at `/service-worker.js`.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      // ignore registration errors (e.g., unsupported or blocked contexts)
    });
  });
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}