import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from "@react-oauth/google"

const CLIENT_ID = "1006853668173-75eaio89vlrratui45tiq2hsqu3q9rmk.apps.googleusercontent.com"

// ✅ registrar service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => {
        console.log('Service Worker registrado');
      })
      .catch((error) => {
        console.error('Error registrando SW:', error);
      });
  });
}

// ✅ capturar instalación PWA globalmente
window.deferredPromptEvent = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPromptEvent = e;
  window.dispatchEvent(new Event('pwa-install-ready'));
});

window.addEventListener('appinstalled', () => {
  window.deferredPromptEvent = null;
  window.dispatchEvent(new Event('pwa-installed'));
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)