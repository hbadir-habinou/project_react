import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import { LanguageProvider } from "./contexts/LanguageContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import "./App.css"
import { offlineService } from "./services/offlineService"

// Enregistrement du service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      console.log('Service Worker enregistré avec succès:', registration);

      // Écouter les changements de statut du service worker
      registration.addEventListener('statechange', (event) => {
        console.log('Service Worker state changed:', event.target.state);
      });

      // Vérifier si une mise à jour est disponible
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('Nouveau Service Worker en cours d\'installation');

        newWorker.addEventListener('statechange', () => {
          console.log('Nouveau Service Worker - état:', newWorker.state);
        });
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
    }
  });

  // Écouter les changements de connectivité
  window.addEventListener('online', () => {
    console.log('Application en ligne');
    document.dispatchEvent(new CustomEvent('appOnline'));
  });

  window.addEventListener('offline', () => {
    console.log('Application hors ligne');
    document.dispatchEvent(new CustomEvent('appOffline'));
  });
}

// Logique pour l'installation PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('Application installable détectée');
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)