const CACHE_NAME = 'wpa-advanced-cache-v1';
const STATIC_RESOURCES = [
    '/',
    '/index.html',
    '/css/main.css',
    '/js/main.js',
    '/manifest_and_icons/manifest.json',
    '/pages/offline.html',
    '/pages/404.html',
    '/pages/page2.html',
    '/manifest_and_icons/icon-192.png',
    '/manifest_and_icons/icon-512.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap'
];

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Pre-caching offline pages and assets');
            return cache.addAll(STATIC_RESOURCES);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    
    const url = new URL(event.request.url);
    if (!url.protocol.startsWith('http')) return;

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 404) {
                    return caches.match('/404.html');
                }

                if (networkResponse && networkResponse.ok) {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                }
                
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    if (event.request.mode === 'navigate') {
                        return caches.match('/offline.html');
                    }
                });
            })
    );
});
