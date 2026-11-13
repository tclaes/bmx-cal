import './app.css'
import App from './App.svelte'
import { startUpdateChecks } from '@core/stores';

const app = new App({
  target: document.getElementById('app')!,
})

window.addEventListener('load', () => {
  // Version detection compares the bundle with /version.json; it does not depend on the service worker.
  startUpdateChecks();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});

export default app
