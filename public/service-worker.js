// Service Worker - immediately claim and clear all caches on install
const CACHE_VERSION = 'v' + Date.now();

self.addEventListener('install', (event) => {
  // Skip waiting so the new SW activates immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Delete ALL caches to prevent stale React bundles
    caches.keys().then(cacheNames => {
      return Promise.all(cacheNames.map(name => caches.delete(name)));
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Don't cache anything - let the browser handle it normally
self.addEventListener('fetch', (event) => {
  // Pass through all requests without caching
  event.respondWith(fetch(event.request));
});
