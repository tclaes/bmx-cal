import navaid from 'navaid';
import { writable } from 'svelte/store';
import { trackPageView } from '@shared/utils/analytics';
import { routes } from './routes';

export const currentRoute = writable<string>('/');
export const routeParams = writable<Record<string, string>>({});

const router = navaid('/', () => {
  currentRoute.set('/');
  routeParams.set({});
});

function setRoute(path: string, params?: Record<string, string>) {
  currentRoute.set(path);
  routeParams.set(params ?? {});
  trackPageView(path);
}

for (const route of routes) {
  router.on(route.path, (params) => setRoute(route.path, params));
}

// Canonical URL is /privacy-policy; redirect so AdSense crawlers always land on the real page
router.on('/privacy', () => {
  history.replaceState(null, '', '/privacy-policy');
  setRoute('/privacy-policy');
});

export function navigate(path: string) {
  router.route(path);
}

export function startRouter() {
  router.listen();
}

export default router;
