/**
 * OfflineWeb AI Service Worker
 * Fully offline-first caching architecture.
 * - Cache-first for core assets and versioned bundles
 * - Network-first with cache fallback for HTML navigation
 * - Offline fallback page when navigating to uncached routes offline
 * - Cache cleanup on activation
 */

const CACHE_VERSION = 'v1.0.0';
const CORE_CACHE = `offlineweb-core-${CACHE_VERSION}`;

// Pre-cached assets
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/offline-fallback.html',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// 1. Install Event: Cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => {
      console.log('[SW] Pre-caching static assets for offline reliability');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith('offlineweb-') && key !== CORE_CACHE) {
            console.log('[SW] Removing old cache version:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()).then(() => {
      // Notify clients that cache is verified
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'CACHE_STATUS',
            ready: true,
            cacheName: CORE_CACHE
          });
        });
      });
    })
  );
});

// 3. Fetch Event: Cache-First strategy with fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests (e.g. POST to Ollama or forms)
  if (request.method !== 'GET') {
    return;
  }

  // Do NOT intercept Ollama API requests (localhost:11434)
  if (url.port === '11434' || url.pathname.startsWith('/api/')) {
    return;
  }

  // Handle HTML navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If valid response, update cache
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CORE_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          // If network failed (offline), check cache for route or return offline fallback
          const cached = await caches.match(request);
          if (cached) return cached;
          const rootCached = await caches.match('/index.html');
          if (rootCached) return rootCached;
          return caches.match('/offline-fallback.html');
        })
    );
    return;
  }

  // Cache-first strategy for static assets (scripts, styles, icons, fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, fetch from network and cache for subsequent offline sessions
      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CORE_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Fallback for image/icon requests if offline
          if (request.headers.get('accept')?.includes('image')) {
            return caches.match('/icons/icon-192.svg');
          }
          return new Response('Offline resource not found', { status: 503, statusText: 'Offline' });
        });
    })
  );
});

// 4. Message Listener for manual cache queries
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    event.source.postMessage({
      type: 'CACHE_STATUS',
      ready: true,
      cacheName: CORE_CACHE
    });
  }
});
