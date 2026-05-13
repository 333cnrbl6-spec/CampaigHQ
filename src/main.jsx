import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initErrorTracking } from '@/lib/errorTracking'

// Initialize error tracking
initErrorTracking()

// Unregister all service workers to prevent stale cache / duplicate React instance errors
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)