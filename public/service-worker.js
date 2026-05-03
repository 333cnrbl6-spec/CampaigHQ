const CACHE_VERSION = 'v1';
const CACHE_NAME = `campaign-app-${CACHE_VERSION}`;
const SYNC_TAG = 'sync-canvassing-logs';

// Cache static assets and API responses
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network-first for API calls, cache fallback for offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin
  if (request.method !== 'GET' || !url.pathname.includes('/')) {
    return;
  }

  // Handle API endpoints — network first with cache fallback
  if (url.pathname.includes('/api/') || url.pathname.includes('.json')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          // Clone and cache successful responses
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Return cached response on network failure
          return caches.match(request).then((cached) => {
            return cached || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // For HTML, JS, CSS — cache first with network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
            return response;
          })
          .catch(() => {
            return new Response('Offline - Page Not Cached', { status: 503 });
          })
      );
    })
  );
});

// Handle background sync for queued logs
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    console.log('[Service Worker] Background sync triggered');
    event.waitUntil(
      (async () => {
        try {
          const db = await openIndexedDB();
          const queue = await getQueuedLogs(db);
          
          if (queue.length > 0) {
            console.log(`[Service Worker] Syncing ${queue.length} queued logs...`);
            
            // Send each queued log
            for (const item of queue) {
              try {
                const response = await fetch('/api/functions/logCanvassingInteraction', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(item.data),
                });
                
                if (response.ok) {
                  await removeQueuedLog(db, item.id);
                  console.log(`[Service Worker] Synced log ${item.id}`);
                } else {
                  console.warn(`[Service Worker] Failed to sync log ${item.id}`);
                }
              } catch (err) {
                console.error(`[Service Worker] Error syncing log ${item.id}:`, err);
              }
            }
            
            // Notify all clients of sync completion
            const clients = await self.clients.matchAll();
            clients.forEach((client) => {
              client.postMessage({
                type: 'SYNC_COMPLETE',
                synced: queue.length,
              });
            });
          }
        } catch (err) {
          console.error('[Service Worker] Sync failed:', err);
          throw err;
        }
      })()
    );
  }
});

// Helper: Open IndexedDB
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CanvassingDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Helper: Get queued logs
function getQueuedLogs(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Helper: Remove queued log
function removeQueuedLog(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
