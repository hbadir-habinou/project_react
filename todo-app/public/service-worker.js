const CACHE_NAME = 'family-planner-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const DATA_CACHE = 'data-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/assets/index.css',
  '/assets/index.js',
  '/icons/16.png',
  '/icons/32.png',
  '/icons/64.png',
  '/icons/72.png',
  '/icons/128.png',
  '/icons/144.png',
  '/icons/152.png',
  '/icons/192.png',
  '/icons/384.png',
  '/icons/512.png',
  '/icons/1024.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Mise en cache des ressources statiques');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(error => {
        console.error('[Service Worker] Erreur lors de la mise en cache:', error);
      })
  );
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![CACHE_NAME, DYNAMIC_CACHE, DATA_CACHE].includes(cacheName)) {
            console.log('[Service Worker] Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ne pas mettre en cache les requêtes non GET
  if (request.method !== 'GET') return;

  // Gestion des requêtes d'API
  if (request.url.includes('firebaseio.com') || request.url.includes('googleapis.com')) {
    event.respondWith(
      caches.open(DATA_CACHE).then((cache) => {
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            return cache.match(request);
          });
      })
    );
    return;
  }

  // Stratégie pour les ressources statiques
  if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request)
            .then((fetchResponse) => {
              return caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, fetchResponse.clone());
                  return fetchResponse;
                });
            });
        })
        .catch(() => {
          if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/offline.html');
          }
        })
    );
    return;
  }

  // Stratégie pour les autres ressources
  event.respondWith(
    caches.match(request)
      .then((response) => {
        return response || fetch(request)
          .then((fetchResponse) => {
            return caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, fetchResponse.clone());
                return fetchResponse;
              });
          });
      })
      .catch(() => {
        if (request.headers.get('accept').includes('text/html')) {
          return caches.match('/offline.html');
        }
      })
  );
}); 