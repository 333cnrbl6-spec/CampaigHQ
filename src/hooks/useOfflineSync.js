import { useEffect, useState, useCallback } from 'react';

/**
 * useOfflineSync — handles IndexedDB queue management and Service Worker sync for offline logs
 * 
 * Returns:
 *   - isOnline: boolean
 *   - queuedCount: number of pending syncs
 *   - isSyncing: boolean indicating active sync
 *   - lastSyncTime: Date or null
 *   - queueLog: async function to add log to sync queue
 *   - triggerSync: async function to manually sync queued logs
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queuedCount, setQueuedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [db, setDb] = useState(null);

  // Initialize Service Worker and IndexedDB
  useEffect(() => {
    const initOfflineSupport = async () => {
      // Register Service Worker
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/',
          });
          console.log('[OfflineSync] Service Worker registered');
        } catch (err) {
          console.error('[OfflineSync] Service Worker registration failed:', err);
        }
      }

      // Open IndexedDB
      try {
        const openDB = new Promise((resolve, reject) => {
          const request = indexedDB.open('CanvassingDB', 1);

          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);

          request.onupgradeneeded = (e) => {
            const database = e.target.result;
            if (!database.objectStoreNames.contains('syncQueue')) {
              database.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
            }
          };
        });

        const database = await openDB;
        setDb(database);
        await updateQueueCount(database);
        console.log('[OfflineSync] IndexedDB initialized');
      } catch (err) {
        console.error('[OfflineSync] IndexedDB init failed:', err);
      }
    };

    initOfflineSupport();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('[OfflineSync] Online detected');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('[OfflineSync] Offline detected');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for Service Worker sync completion
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event) => {
        if (event.data?.type === 'SYNC_COMPLETE') {
          console.log('[OfflineSync] Sync complete, updating queue');
          setLastSyncTime(new Date());
          setIsSyncing(false);
          if (db) {
            updateQueueCount(db);
          }
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
  }, [db]);

  // Update queue count from IndexedDB
  const updateQueueCount = useCallback(async (database) => {
    try {
      const transaction = database.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();

      request.onerror = () => console.error('Failed to get queue count');
      request.onsuccess = () => setQueuedCount(request.result.length);
    } catch (err) {
      console.error('[OfflineSync] Error updating queue count:', err);
    }
  }, []);

  // Add log to sync queue
  const queueLog = useCallback(
    async (logData) => {
      if (!db) {
        console.warn('[OfflineSync] IndexedDB not ready, retrying...');
        return false;
      }

      try {
        const transaction = db.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');
        const request = store.add({
          data: logData,
          timestamp: new Date().toISOString(),
          attempts: 0,
        });

        request.onerror = () => {
          console.error('[OfflineSync] Failed to queue log:', request.error);
        };

        request.onsuccess = async () => {
          console.log('[OfflineSync] Log queued:', request.result);
          await updateQueueCount(db);
        };

        return true;
      } catch (err) {
        console.error('[OfflineSync] Error queueing log:', err);
        return false;
      }
    },
    [db, updateQueueCount]
  );

  // Trigger manual sync
  const triggerSync = useCallback(async () => {
    if (!isOnline) {
      console.warn('[OfflineSync] Cannot sync while offline');
      return;
    }

    if (queuedCount === 0) {
      console.log('[OfflineSync] No queued logs to sync');
      return;
    }

    setIsSyncing(true);

    try {
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-canvassing-logs');
        console.log('[OfflineSync] Background sync registered');
      } else {
        // Fallback: manually sync
        await manualSync();
      }
    } catch (err) {
      console.error('[OfflineSync] Failed to trigger sync:', err);
      setIsSyncing(false);
    }
  }, [isOnline, queuedCount]);

  // Manual sync fallback (for browsers without background sync)
  const manualSync = useCallback(async () => {
    if (!db) return;

    try {
      const transaction = db.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const allLogs = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

      let synced = 0;
      for (const item of allLogs) {
        try {
          const response = await fetch('/api/functions/logCanvassingInteraction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data),
          });

          if (response.ok) {
            // Remove from queue
            const delTransaction = db.transaction(['syncQueue'], 'readwrite');
            const delStore = delTransaction.objectStore('syncQueue');
            await new Promise((resolve, reject) => {
              const delRequest = delStore.delete(item.id);
              delRequest.onerror = () => reject(delRequest.error);
              delRequest.onsuccess = () => resolve();
            });
            synced++;
            console.log('[OfflineSync] Synced log:', item.id);
          }
        } catch (err) {
          console.error('[OfflineSync] Failed to sync log:', err);
        }
      }

      console.log(`[OfflineSync] Synced ${synced} logs`);
      setLastSyncTime(new Date());
      await updateQueueCount(db);
    } catch (err) {
      console.error('[OfflineSync] Manual sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [db, updateQueueCount]);

  return {
    isOnline,
    queuedCount,
    isSyncing,
    lastSyncTime,
    queueLog,
    triggerSync,
  };
}