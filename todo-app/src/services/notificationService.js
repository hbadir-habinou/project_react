import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '../firebase';

class NotificationService {
  constructor() {
    this.messaging = getMessaging(app);
    this.vapidKey = 'BD1ujPRQgbOOIaj-0_DLE5J8pmXyz_CNsvJmUqYvZn9Wcax3CcvF6pPNh__01IzJGxMqcLauHGfkt5L-jLFfOa0';
    this.swRegistration = null;
    this.initializeServiceWorker();
  }

  async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker enregistré avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
      }
    }
  }

  async requestPermission() {
    try {
      if (!('Notification' in window)) {
        console.log('Ce navigateur ne supporte pas les notifications');
        return false;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await this.getToken();
        console.log('Token FCM:', token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      return false;
    }
  }

  async getToken() {
    try {
      const currentToken = await getToken(this.messaging, {
        vapidKey: this.vapidKey
      });

      if (currentToken) {
        return currentToken;
      } else {
        console.log('Aucun token d\'enregistrement disponible. Demandez la permission d\'abord.');
        return null;
      }
    } catch (error) {
      console.error('Une erreur s\'est produite lors de la récupération du token:', error);
      return null;
    }
  }

  onMessageListener() {
    return new Promise((resolve) => {
      onMessage(this.messaging, (payload) => {
        resolve(payload);
      });
    });
  }

  async sendLocalNotification(title, options = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      if (this.swRegistration) {
        // Utiliser le Service Worker pour les notifications si disponible
        await this.swRegistration.showNotification(title, {
          icon: '/logo192.png',
          badge: '/logo192.png',
          requireInteraction: true,
          ...options,
          actions: [
            {
              action: 'view',
              title: 'Voir détails'
            },
            {
              action: 'dismiss',
              title: 'Ignorer'
            }
          ]
        });
      } else {
        // Fallback vers les notifications locales simples
        const notification = new Notification(title, {
          icon: '/logo192.png',
          badge: '/logo192.png',
          requireInteraction: true,
          ...options
        });

        notification.onclick = () => {
          window.focus();
          if (options.onClick) {
            options.onClick();
          }
          notification.close();
        };
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
    }
  }
}

export const notificationService = new NotificationService(); 