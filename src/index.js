import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Cache transformed Supabase thumbnails between table visits. Full-size
// originals remain uncached so gallery updates are always current.
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/media-cache-sw.js').catch(error => {
      console.warn('Media cache unavailable', error);
    });
  });
}
