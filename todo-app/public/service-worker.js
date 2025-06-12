const CACHE_NAME = 'meal-planner-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Liste des ressources à mettre en cache
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Force l'activation immédiate
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Nettoyage des anciens caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
              console.log('Suppression de l\'ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Prend le contrôle immédiatement
      self.clients.claim()
    ])
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes vers l'API Google Maps
  if (event.request.url.includes('maps.googleapis.com') ||
      event.request.url.includes('google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retourner la réponse du cache
        if (response) {
          // Vérifier si la ressource doit être mise à jour en arrière-plan
          if (navigator.onLine) {
            fetch(event.request)
              .then((freshResponse) => {
                if (freshResponse) {
                  caches.open(CACHE_NAME)
                    .then((cache) => {
                      cache.put(event.request, freshResponse.clone());
                    });
                }
              });
          }
          return response;
        }

        // Pas de correspondance dans le cache - récupérer depuis le réseau
        return fetch(event.request)
          .then((response) => {
            // Vérifier si la réponse est valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Mettre en cache la nouvelle ressource
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Si la requête échoue (offline), retourner la page offline
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            // Pour les autres ressources, retourner une réponse vide
            return new Response();
          });
      })
  );
});

// Gestion des messages depuis l'application
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data === 'clearCache') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('Nettoyage du cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
}); 