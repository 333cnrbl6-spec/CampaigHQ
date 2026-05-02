import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initErrorTracking } from '@/lib/errorTracking'

// Initialize error tracking
initErrorTracking()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)