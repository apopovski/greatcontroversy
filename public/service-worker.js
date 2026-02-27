// Offline support for app shell + runtime-cached book assets.
// Kept intentionally dependency-free.

const CACHE_NAME = 'book-reader-v4';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline-precache.json',
  '/service-worker.js',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192-maskable.png',
  '/icon-512-maskable.png',
  '/apple-touch-icon.png',
];
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

async function putInCache(req, res) {
  if (!res || !res.ok) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(req, res.clone());
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
  // Cache-first helps reopening while offline even after app restart.
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          event.waitUntil(putInCache(req, res.clone()));
          return res;
        } catch {
          return (await caches.match('/index.html')) || Response.error();
        }
      })()
    );
    return;
  }

  // Static assets: cache-first, update cache in background.
  const dest = req.destination;
  const isStatic = dest === 'script' || dest === 'style' || dest === 'image' || dest === 'font';

  // Book/text/data files are fetched by JS with destination="".
  // Stale-while-revalidate keeps offline reopen reliable and updates when online.
  if (isBookContent || isDataFile) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        const networkFetch = fetch(req)
          .then((res) => {
            event.waitUntil(putInCache(req, res.clone()));
            return res;
          })
          .catch(() => null);

        if (cached) {
          event.waitUntil(networkFetch);
          return cached;
        }

        const net = await networkFetch;
        return net || Response.error();
      })()
    );
    return;
  }

  if (isStatic) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) {
          event.waitUntil(
            fetch(req)
              .then((res) => putInCache(req, res))
              .catch(() => null)
          );
          return cached;
        }

        const res = await fetch(req);
        event.waitUntil(putInCache(req, res.clone()));
        return res;
      })()
    );
  }
});
