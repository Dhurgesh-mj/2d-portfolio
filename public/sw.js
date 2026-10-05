/* Offline worker: cache-first for the comic frame sequence so repeat
   visits and flaky networks still scrub smoothly. Version the cache name
   when the artwork changes. */

const CACHE = 'portfolio-comic-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !url.pathname.startsWith('/comic/')) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(event.request);
      if (hit) return hit;
      try {
        const res = await fetch(event.request);
        if (res && res.ok) cache.put(event.request, res.clone());
        return res;
      } catch (err) {
        // Offline with nothing cached: rethrow so the app's
        // nearest-frame fallback can cover the gap.
        throw err;
      }
    })
  );
});
