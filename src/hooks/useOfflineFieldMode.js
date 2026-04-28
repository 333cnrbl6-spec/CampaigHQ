import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const CONTACTS_KEY = 'offline_contacts_cache';
const QUEUE_KEY = 'offline_sync_queue';

function loadCache(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}

function saveCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

export function useOfflineFieldMode() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [contacts, setContacts] = useState([]);
  const [queue, setQueue] = useState(() => loadCache(QUEUE_KEY));
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null); // { synced, failed }
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);

  // Track online/offline
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Load contacts: from network if online, fallback to cache
  useEffect(() => {
    async function fetchContacts() {
      setIsLoadingContacts(true);
      if (isOnline) {
        try {
          const data = await base44.entities.Contact.list();
          setContacts(data);
          saveCache(CONTACTS_KEY, data);
        } catch {
          setContacts(loadCache(CONTACTS_KEY));
        }
      } else {
        setContacts(loadCache(CONTACTS_KEY));
      }
      setIsLoadingContacts(false);
    }
    fetchContacts();
  }, [isOnline]);

  // Persist queue to localStorage whenever it changes
  useEffect(() => {
    saveCache(QUEUE_KEY, queue);
  }, [queue]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      syncQueue();
    }
  }, [isOnline]);

  const enqueue = useCallback((action) => {
    const item = { ...action, _id: Date.now() + Math.random() };
    setQueue(prev => [...prev, item]);
    // Also optimistically update local contacts cache for support_level changes
    if (action.type === 'update_contact') {
      setContacts(prev => {
        const updated = prev.map(c => c.id === action.payload.id ? { ...c, ...action.payload.data } : c);
        saveCache(CONTACTS_KEY, updated);
        return updated;
      });
    }
    return item._id;
  }, []);

  const syncQueue = useCallback(async () => {
    if (isSyncing) return;
    const current = loadCache(QUEUE_KEY);
    if (current.length === 0) return;

    setIsSyncing(true);
    let synced = 0;
    let failed = 0;
    const remaining = [];

    for (const item of current) {
      try {
        if (item.type === 'create_interaction') {
          await base44.entities.ContactInteraction.create(item.payload);
        } else if (item.type === 'update_contact') {
          await base44.entities.Contact.update(item.payload.id, item.payload.data);
        }
        synced++;
      } catch {
        failed++;
        remaining.push(item);
      }
    }

    setQueue(remaining);
    saveCache(QUEUE_KEY, remaining);
    setIsSyncing(false);
    setSyncResult({ synced, failed });
    // Clear result after 4s
    setTimeout(() => setSyncResult(null), 4000);
  }, [isSyncing]);

  const logInteraction = useCallback((interactionPayload, contactUpdatePayload) => {
    if (isOnline) {
      // Online: direct save
      return Promise.all([
        base44.entities.ContactInteraction.create(interactionPayload),
        contactUpdatePayload
          ? base44.entities.Contact.update(contactUpdatePayload.id, contactUpdatePayload.data)
          : Promise.resolve(),
      ]);
    } else {
      // Offline: queue it
      enqueue({ type: 'create_interaction', payload: interactionPayload });
      if (contactUpdatePayload) {
        enqueue({ type: 'update_contact', payload: contactUpdatePayload });
      }
      return Promise.resolve('queued');
    }
  }, [isOnline, enqueue]);

  return {
    isOnline,
    contacts,
    isLoadingContacts,
    queue,
    isSyncing,
    syncResult,
    logInteraction,
    syncQueue,
  };
}