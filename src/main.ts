import './app.css'
import App from './App.svelte'
import { updateStore } from '@shared/stores/pwa.store';
import { checkForUpdate, storeCurrentVersion } from '@shared/utils/version-checker';

const app = new App({
  target: document.getElementById('app')!,
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const versionInfo = checkForUpdate();

    if (versionInfo.hasUpdate || versionInfo.forceUpdate) {
      updateStore.setAvailable(true, versionInfo.forceUpdate);
    } else {
      storeCurrentVersion();
    }

    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data?.type === 'SW_UPDATED') {
            const updatedVersionInfo = checkForUpdate();
            updateStore.setAvailable(true, updatedVersionInfo.forceUpdate);
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
