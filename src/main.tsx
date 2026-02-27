
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

// Ask the browser to persist storage so offline caches survive app restarts
// and are less likely to be evicted under storage pressure.
if ('storage' in navigator && 'persist' in navigator.storage) {
  navigator.storage.persist().catch(() => {
    // best-effort only
  });
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}