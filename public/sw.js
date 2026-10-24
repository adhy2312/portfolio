// Service Worker for Adhithya Mohan Portfolio PWA (V2)
const CACHE_NAME = 'adhy-portfolio-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/dp.jpg'
];

// Install: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Stale-while-revalidate for static assets, NEVER cache dynamic APIs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Only process GET requests
  if (event.request.method !== 'GET') return;

  // 2. CRITICAL: Never intercept or cache serverless APIs (/api/spotify, /api/gemini, etc.)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/studio')) {
    return;
  }

  // 3. Static assets: Cache first with network fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
    );
  }
});
