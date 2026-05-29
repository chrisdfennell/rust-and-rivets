// Slice 57 — minimal service worker for PWA installability.
//
// Strategy: cache-first for the app shell so the game loads instantly on
// repeat visits and works offline (the only "online" calls the game makes
// are localStorage reads + writes, which work just as well with no
// network). On every new SW activation we wipe the previous cache so
// users always pick up the latest deploy.

// Bump this when you ship — it forces every client to re-download the
// app shell on next visit. The format is purely informational; any
// change to the literal forces a cache miss.
const CACHE_VERSION = 'rust-and-rivets-v1';

// App shell. The hashed JS bundle filename changes every build, so we
// can't enumerate it here — we let it land in the cache on first fetch
// via the runtime caching strategy below.
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL))
  );
  // Activate the new SW immediately on install so the next refresh
  // picks up the new shell without the player needing to close all tabs.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  // Take control of any clients (open tabs) that were live during install.
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GETs; let everything else pass through. We treat all
  // same-origin GETs as cacheable since the game is fully static.
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      // On miss: fetch, cache (only if 2xx + same-origin), return.
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
