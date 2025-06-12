import { enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';

// Gestion du mode hors ligne
const CACHE_KEY_PREFIX = 'family-planner-offline-';

class OfflineService {
  constructor() {
    this.setupPersistence();
  }

  async setupPersistence() {
    try {
      await enableIndexedDbPersistence(db, {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
      });
      console.log('Persistence hors ligne activée avec succès');
    } catch (err) {
      if (err.code === 'failed-precondition') {
        console.warn('La persistence a échoué car plusieurs onglets sont ouverts');
      } else if (err.code === 'unimplemented') {
        console.warn('Le navigateur ne supporte pas la persistence');
      }
    }
  }

  // Sauvegarder des données en local
  async saveData(key, data) {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
      const serializedData = JSON.stringify({
        timestamp: Date.now(),
        data: data
      });
      localStorage.setItem(cacheKey, serializedData);
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données hors ligne:', error);
      return false;
    }
  }

  // Récupérer des données du cache local
  async getData(key) {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
      const serializedData = localStorage.getItem(cacheKey);
      if (!serializedData) return null;

      const { timestamp, data } = JSON.parse(serializedData);
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données hors ligne:', error);
      return null;
    }
  }

  // Vérifier si des données sont disponibles hors ligne
  hasOfflineData(key) {
    const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
    return localStorage.getItem(cacheKey) !== null;
  }

  // Supprimer des données du cache
  async removeData(key) {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
      localStorage.removeItem(cacheKey);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression des données hors ligne:', error);
      return false;
    }
  }

  // Synchroniser les données avec le serveur
  async syncWithServer(key, syncFunction) {
    try {
      const offlineData = await this.getData(key);
      if (offlineData) {
        await syncFunction(offlineData);
        await this.removeData(key);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      return false;
    }
  }

  // Vérifier la connexion Internet
  isOnline() {
    return navigator.onLine;
  }

  // Écouter les changements de connexion
  addConnectivityListeners(onlineCallback, offlineCallback) {
    window.addEventListener('online', onlineCallback);
    window.addEventListener('offline', offlineCallback);

    return () => {
      window.removeEventListener('online', onlineCallback);
      window.removeEventListener('offline', offlineCallback);
    };
  }

  // Sauvegarder les modifications en attente
  savePendingChanges(changes) {
    const pendingChanges = this.getFromLocalStorage('pendingChanges') || [];
    pendingChanges.push({
      ...changes,
      timestamp: Date.now(),
      userId: getAuth().currentUser?.uid
    });
    this.saveToLocalStorage('pendingChanges', pendingChanges);
  }

  // Récupérer les modifications en attente
  getPendingChanges() {
    return this.getFromLocalStorage('pendingChanges') || [];
  }

  // Supprimer les modifications synchronisées
  clearPendingChanges() {
    localStorage.removeItem('pendingChanges');
  }

  // Méthodes utilitaires pour le localStorage
  saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error('Erreur lors de la sauvegarde dans le localStorage:', err);
    }
  }

  getFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Erreur lors de la lecture du localStorage:', err);
      return null;
    }
  }
}

// Export d'une instance unique du service
export const offlineService = new OfflineService(); 