import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from "@react-oauth/google"

const CLIENT_ID = "1006853668173-75eaio89vlrratui45tiq2hsqu3q9rmk.apps.googleusercontent.com"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)

// 👇 AÑADE ESTO (no quites nada de arriba)
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