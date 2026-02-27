// Offline support for app shell + runtime-cached book assets.
// Kept intentionally dependency-free.

const CACHE_NAME = 'book-reader-v5';
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
const OFFLINE_STATUS_URL = '/__offline-status';

let warmupPromise = null;
let offlineReady = false;

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

async function cacheUrlWithRetry(cache, url, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      const req = new Request(url, { cache: 'no-store' });
      const res = await fetch(req);
      if (res && res.ok) {
        await cache.put(url, res.clone());
        return true;
      }
    } catch {
      // retry
    }
  }
  return false;
}

async function setOfflineStatus(cache, payload) {
  try {
    await cache.put(
      OFFLINE_STATUS_URL,
      new Response(JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json' },
      })
    );
  } catch {
    // ignore status write issues
  }
}

async function warmOfflineCache() {
  if (warmupPromise) return warmupPromise;

  warmupPromise = (async () => {
    const cache = await caches.open(CACHE_NAME);
    const manifestAssets = await getManifestAssets();
    const dedupedAssets = Array.from(new Set(manifestAssets));

    let cached = 0;
    let failed = 0;

    for (const asset of dedupedAssets) {
      const ok = await cacheUrlWithRetry(cache, asset, 3);
      if (ok) cached += 1;
      else failed += 1;
    }

    offlineReady = dedupedAssets.length > 0 && failed === 0;

    await setOfflineStatus(cache, {
      ready: offlineReady,
      total: dedupedAssets.length,
      cached,
      failed,
      updatedAt: new Date().toISOString(),
    });

    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach((client) => {
      client.postMessage({
        type: 'OFFLINE_CACHE_STATUS',
        ready: offlineReady,
        total: dedupedAssets.length,
        cached,
        failed,
      });
    });
  })()
    .catch(async () => {
      offlineReady = false;
      try {
        const cache = await caches.open(CACHE_NAME);
        await setOfflineStatus(cache, {
          ready: false,
          total: 0,
          cached: 0,
          failed: 1,
          updatedAt: new Date().toISOString(),
        });
      } catch {
        // no-op
      }
    })
    .finally(() => {
      warmupPromise = null;
    });

  return warmupPromise;
}

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'WARM_OFFLINE_CACHE') {
    event.waitUntil(warmOfflineCache());
    return;
  }

  if (data.type === 'GET_OFFLINE_CACHE_STATUS') {
    const source = event.source;
    if (source && typeof source.postMessage === 'function') {
      source.postMessage({ type: 'OFFLINE_CACHE_STATUS', ready: offlineReady });
    }
  }
});

async function putInCache(req, res) {
  if (!res || !res.ok) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(req, res.clone());
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Keep install fast and reliable (especially on iOS).
      // Large content pre-caching is done right after activation and can be retried.
      await addMany(cache, CORE_ASSETS);
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
      await warmOfflineCache();
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

  if (url.pathname === OFFLINE_STATUS_URL) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(OFFLINE_STATUS_URL);
        if (cached) return cached;
        return new Response(
          JSON.stringify({ ready: offlineReady, total: 0, cached: 0, failed: 0 }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })()
    );
    return;
  }

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
