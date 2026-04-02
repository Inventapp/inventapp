// InventApp Service Worker
// Para forzar actualización de caché en producción: incrementar CACHE_VERSION
const CACHE_VERSION = 'v3';
const CACHE = `inventapp-${CACHE_VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// ── Install: pre-cache assets ─────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: limpiar cachés viejos + notificar clientes ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k.startsWith('inventapp-') && k !== CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => {
        // Notificar a todas las pestañas que hay una versión nueva
        return self.clients.matchAll({ type: 'window' });
      })
      .then(clients => {
        clients.forEach(client =>
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION })
        );
      })
  );
});

// ── Fetch: network-first, fallback a caché ────────────
self.addEventListener('fetch', e => {
  // No interceptar llamadas Firebase / Firestore (datos en tiempo real)
  if (
    e.request.url.includes('firebase') ||
    e.request.url.includes('googleapis.com/identitytoolkit') ||
    e.request.url.includes('firestore') ||
    e.request.url.includes('gstatic.com/firebasejs')
  ) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
