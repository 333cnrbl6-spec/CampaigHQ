import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const CONTACTS_KEY = 'offline_contacts_cache';
const CONTACTS_EXPIRY_KEY = 'offline_contacts_cache_expiry';
const QUEUE_KEY = 'offline_sync_queue';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

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
  const isSyncingRef = useRef(false);
  const [syncResult, setSyncResult] = useState(null); // { synced, failed }
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [cacheStatus, setCacheStatus] = useState(null);

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

  // Load contacts once on mount, fallback to cache if offline
  useEffect(() => {
    async function fetchContacts() {
      setIsLoadingContacts(true);
      try {
        // Check if cache is still valid
        const cacheExpiry = localStorage.getItem(CONTACTS_EXPIRY_KEY);
        const isCacheValid = cacheExpiry && Date.now() < parseInt(cacheExpiry);
        
        // Try online fetch first
        let data = [];
        try {
          data = await base44.entities.Contact.list();
        } catch (err) {
          console.error('Failed to fetch contacts online:', err);
          throw err;
        }
        
        if (!Array.isArray(data)) {
          console.warn('Contacts list is not an array, defaulting to []');
          data = [];
        }
        
        setContacts(data);
        saveCache(CONTACTS_KEY, data);
        localStorage.setItem(CONTACTS_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
        setCacheStatus({ isValid: true, age: 0 });
      } catch (err) {
        console.error('Error loading contacts:', err);
        // Fallback to cache
        const cached = loadCache(CONTACTS_KEY);
        const cacheExpiry = localStorage.getItem(CONTACTS_EXPIRY_KEY);
        const isCacheValid = cacheExpiry && Date.now() < parseInt(cacheExpiry);
        
        setContacts(Array.isArray(cached) ? cached : []);
        setCacheStatus({ 
          isValid: isCacheValid, 
          age: isCacheValid ? 'recent' : 'stale',
          count: Array.isArray(cached) ? cached.length : 0
        });
      }
      setIsLoadingContacts(false);
    }
    fetchContacts();
  }, []); // only on mount

  // Re-fetch contacts when coming back online (not on every isOnline toggle)
  const prevOnlineRef = useRef(null);
  useEffect(() => {
    if (prevOnlineRef.current === false && isOnline) {
      // came back online — refresh contacts
      base44.entities.Contact.list()
        .then(data => { 
          if (!Array.isArray(data)) {
            console.warn('Contacts list is not an array after reconnection');
            data = [];
          }
          setContacts(data); 
          saveCache(CONTACTS_KEY, data);
          localStorage.setItem(CONTACTS_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
          setCacheStatus({ isValid: true, age: 0 });
        })
        .catch(err => console.error('Failed to refresh contacts on reconnect:', err));
    }
    prevOnlineRef.current = isOnline;
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
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  const enqueue = useCallback((action) => {
    if (!action || typeof action !== 'object') {
      console.error('Invalid action for enqueue:', action);
      return null;
    }
    
    const item = { ...action, _id: Date.now() + Math.random() };
    setQueue(prev => Array.isArray(prev) ? [...prev, item] : [item]);
    
    // Also optimistically update local contacts cache for support_level changes
    if (action.type === 'update_contact' && action.payload?.id) {
      setContacts(prev => {
        if (!Array.isArray(prev)) return prev;
        const updated = prev.map(c => c?.id === action.payload.id ? { ...c, ...action.payload.data } : c);
        saveCache(CONTACTS_KEY, updated);
        return updated;
      });
    }
    return item._id;
  }, []);

  const syncQueue = useCallback(async () => {
    if (isSyncingRef.current) return;
    const current = loadCache(QUEUE_KEY);
    if (!Array.isArray(current) || current.length === 0) return;

    isSyncingRef.current = true;
    setIsSyncing(true);
    let synced = 0;
    let failed = 0;
    const remaining = [];

    for (const item of current) {
      try {
        if (!item || typeof item !== 'object') {
          failed++;
          remaining.push(item);
          continue;
        }
        
        if (item.type === 'create_interaction' && item.payload) {
          await base44.entities.ContactInteraction.create(item.payload);
          synced++;
        } else if (item.type === 'update_contact' && item.payload?.id && item.payload?.data) {
          await base44.entities.Contact.update(item.payload.id, item.payload.data);
          synced++;
        } else {
          failed++;
          remaining.push(item);
        }
      } catch (err) {
        console.error('Sync failed for item:', item, err);
        failed++;
        remaining.push(item);
      }
    }

    setQueue(remaining);
    saveCache(QUEUE_KEY, remaining);
    isSyncingRef.current = false;
    setIsSyncing(false);
    setSyncResult({ synced, failed });
    setTimeout(() => setSyncResult(null), 4000);
  }, []);

  const logInteraction = useCallback((interactionPayload, contactUpdatePayload) => {
    if (!interactionPayload || typeof interactionPayload !== 'object') {
      console.error('Invalid interaction payload');
      return Promise.reject(new Error('Invalid interaction payload'));
    }
    
    if (isOnline) {
      // Online: direct save
      return Promise.all([
        base44.entities.ContactInteraction.create(interactionPayload).catch(err => {
          console.error('Failed to create interaction:', err);
          throw err;
        }),
        contactUpdatePayload && contactUpdatePayload.id && contactUpdatePayload.data
          ? base44.entities.Contact.update(contactUpdatePayload.id, contactUpdatePayload.data).catch(err => {
              console.error('Failed to update contact:', err);
              throw err;
            })
          : Promise.resolve(),
      ]);
    } else {
      // Offline: queue it
      enqueue({ type: 'create_interaction', payload: interactionPayload });
      if (contactUpdatePayload && contactUpdatePayload.id && contactUpdatePayload.data) {
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
    cacheStatus,
    logInteraction,
    syncQueue,
  };
}