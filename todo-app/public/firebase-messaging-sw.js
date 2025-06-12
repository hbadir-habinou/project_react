importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Remplacez avec votre propre configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCDLWSJzeHDztUxUobZBkEIMSrMfLdidRE",
  authDomain: "todo-web-a57a0.firebaseapp.com",
  projectId: "todo-web-a57a0",
  storageBucket: "todo-web-a57a0.firebasestorage.app",
  messagingSenderId: "271944674192",
  appId: "1:271944674192:web:dcaeb44fabce6af407a115",
  measurementId: "G-16DHRLB31K",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: payload.data?.tag || 'default',
    data: payload.data,
    actions: [
      {
        action: 'view',
        title: 'Voir détails'
      },
      {
        action: 'dismiss',
        title: 'Ignorer'
      }
    ],
    requireInteraction: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click Received.');

  event.notification.close();

  if (event.action === 'view' && event.notification.data?.url) {
    clients.openWindow(event.notification.data.url);
  } else {
    clients.openWindow('/');
  }
});

// Facultatif: Pour la mise en cache (si vous utilisez Workbox ou d'autres stratégies de PWA)
// self.addEventListener('install', event => {
//   self.skipWaiting();
// });
//
// self.addEventListener('activate', event => {
//   clients.claim();
// });