import './app.css'
import App from './App.svelte'
import { updateAvailable } from '@shared/stores/pwa.store';

const app = new App({
  target: document.getElementById('app')!,
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data?.type === 'SW_UPDATED') {
            updateAvailable.set(true);
          }
        });

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch(() => {});
  });
}

export default app
