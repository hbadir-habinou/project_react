const CACHE_NAME = 'family-planner-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/static/js/main.js',
  '/static/css/main.css'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert');
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Stratégie de cache : Network First avec fallback sur le cache
self.addEventListener('fetch', (event) => {
  // Ne pas mettre en cache les requêtes POST
  if (event.request.method !== 'GET') {
    return;
  }

  // Ne pas mettre en cache les requêtes d'API
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache la nouvelle réponse
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseClone);
          });

        return response;
      })
      .catch(() => {
        // Si la requête échoue, essayer de retourner la version en cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Si l'asset n'est pas en cache et que nous sommes hors ligne
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
          });
      })
  );
}); 