import { useState, useEffect } from 'react';

/**
 * Hook to monitor online/offline connectivity and service worker caching readiness
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swRegistered, setSwRegistered] = useState(false);
  const [cacheReady, setCacheReady] = useState(false);
  const [cacheName, setCacheName] = useState('offlineweb-core-v1');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check service worker state
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        setSwRegistered(Boolean(registration.active));
        checkCacheIntegrity();
      }).catch(() => {
        setSwRegistered(false);
      });

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_STATUS') {
          setCacheReady(event.data.ready);
          if (event.data.cacheName) setCacheName(event.data.cacheName);
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  async function checkCacheIntegrity() {
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        const coreCache = keys.find(k => k.startsWith('offlineweb-core-'));
        if (coreCache) {
          const cache = await caches.open(coreCache);
          const cachedRequests = await cache.keys();
          setCacheReady(cachedRequests.length > 0);
          setCacheName(coreCache);
          return;
        }
      } catch (err) {
        console.warn('Cache check error:', err);
      }
    }
    setCacheReady(false);
  }

  return {
    isOnline,
    swRegistered,
    cacheReady,
    cacheName,
    recheckCache: checkCacheIntegrity
  };
}
