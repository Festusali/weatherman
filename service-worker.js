'use strict';

// Cache names. Must be updated anytime cache changes.
// Even if it is spelling correction.
const CACHE_ASSETS_NAME = 'assets-cache-v6';

// List of files to cache for offline use
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/offline.html',
    'assets/favicon.ico',
    'assets/icons/icon-32x32.png',
    'assets/icons/icon-128x128.png',
    'assets/icons/icon-144x144.png',
    'assets/icons/icon-152x152.png',
    'assets/icons/icon-192x192.png',
    'assets/icons/icon-512x512.png',
    'assets/icons/maskable_icon.png',
    '/css/styles.css',
    '/js/script.js',
    '/robots.txt'
]


// Listen for Service Worker Installation.
// Cache Assets for offline use.
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installation.');
    // Cache assets for offline use.
    event.waitUntil(
        caches.open(CACHE_ASSETS_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    // Enable Service Worker immediately after installation.
    // Even when there is still other open tab(s)/window(s)
    self.skipWaiting();
});

// After Activating new Service Worker and Cache,
// Remove Old Cache from disk.
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activation');
    // Remove old cache from disk.
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_ASSETS_NAME) {
                    console.log('[Service Worker] Removing old cacched data/assets', key)
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

// Listen to fetch events
self.addEventListener('fetch', (event) => {
    if (event.request.mode !== 'navigate') {
        // Not a page navigation, ignore.
        return;
    }
    event.respondWith(
        fetch(event.request)
        .catch(() => {
            return caches.open(CACHE_ASSETS_NAME)
                .then((cache) => {
                    return cache.match('/offline.html');
                });
        })
    );
});
