/**
 * Error tracking & monitoring utility
 * Logs errors to console and optionally to external service (Sentry)
 */

export const initErrorTracking = () => {
  // Log uncaught errors
  window.addEventListener('error', (event) => {
    logError('Uncaught Error', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Log unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError('Unhandled Rejection', event.reason);
  });
};

export const logError = (title, error, context = {}) => {
  const errorData = {
    title,
    message: error?.message || String(error),
    stack: error?.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    ...context,
  };

  console.error(`[${title}]`, error);

  // Send to Sentry if available (optional)
  if (window.__SENTRY_ENABLED__) {
    fetch('/__sentry__', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
    }).catch(() => {}); // Silently fail
  }
};

export const captureException = (error, context = {}) => {
  logError('Exception', error, context);
};

export const captureMessage = (message, level = 'info') => {
  console.log(`[${level.toUpperCase()}] ${message}`);
};