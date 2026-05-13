import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initErrorTracking } from '@/lib/errorTracking'

// Initialize error tracking
initErrorTracking()

// Register Service Worker for offline support with automatic sync
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Unregister any stale service workers first to prevent React duplicate instance errors
    navigator.serviceWorker.getRegistrations().then(registrations => {
      const unregisterAll = registrations.map(reg => reg.unregister());
      return Promise.all(unregisterAll);
    }).then(() => {
      return navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
    }).then(reg => console.log('[App] Service Worker registered for offline sync'))
      .catch(err => console.warn('[App] Service Worker registration failed:', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)