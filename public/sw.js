/* Tyre Shop Manager service worker.
   Strategy:
   - App navigations: network-first, falling back to the cached shell when offline.
   - Build assets (hashed /assets/*): cache-first — a hash change means a new URL,
     so stale entries are never served for new builds.
   Firestore data itself is handled by the Firebase SDK's own offline persistence,
   NOT by this worker — we deliberately skip caching any Google/Firebase request. */

const CACHE = 'tyreshop-shell-v1';
const SHELL = ['/', '/manifest.webmanifest', '/favicon.svg'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Never intercept Firebase/Google traffic (auth popups, Firestore channels, fonts API metadata).
    if (url.origin !== self.location.origin) return;

    // SPA navigations: try network, fall back to cached shell.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(CACHE).then((cache) => cache.put('/', copy));
                    return res;
                })
                .catch(() => caches.match('/'))
        );
        return;
    }

    // Hashed build assets: cache-first.
    if (url.pathname.startsWith('/assets/')) {
        event.respondWith(
            caches.match(request).then((hit) =>
                hit ||
                fetch(request).then((res) => {
                    const copy = res.clone();
                    caches.open(CACHE).then((cache) => cache.put(request, copy));
                    return res;
                })
            )
        );
    }
});
