// Offline support for app shell + runtime-cached book assets.
// Kept intentionally dependency-free.

const CACHE_NAME = 'book-reader-v3';
const CORE_ASSETS = ['/', '/index.html', '/manifest.json'];
const PRECACHE_MANIFEST_PATH = '/offline-precache.json';

async function getManifestAssets() {
  try {
    const res = await fetch(PRECACHE_MANIFEST_PATH, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    if (!json || !Array.isArray(json.assets)) return [];
    return json.assets.filter((x) => typeof x === 'string' && x.startsWith('/'));
  } catch {
    return [];
  }
}

async function addMany(cache, urls) {
  for (const url of urls) {
    try {
      await cache.add(url);
    } catch {
      // Continue even if a single asset fails.
    }
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await addMany(cache, CORE_ASSETS);
      const manifestAssets = await getManifestAssets();
      if (manifestAssets.length) {
        await addMany(cache, manifestAssets);
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle same-origin GET requests.
  if (req.method !== 'GET') return;
  if (req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isBookContent = url.pathname.startsWith('/book-content/');
  const isDataFile = url.pathname.startsWith('/data/');

  // Navigations: network-first, fall back to cached app shell.
  // This preserves the URL in the address bar (no redirect-to-/ behavior).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets: cache-first, update cache in background.
  const dest = req.destination;
  const isStatic = dest === 'script' || dest === 'style' || dest === 'image' || dest === 'font';

  // Book/text/data files are fetched by JS with destination="".
  // Cache-first lets users keep reading already-opened languages offline.
  if (isBookContent || isDataFile) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        });
      })
    );
    return;
  }

  if (isStatic) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          // Only cache successful basic/cors responses.
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        });
      })
    );
  }
});
