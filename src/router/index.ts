import navaid from 'navaid';
import { writable } from 'svelte/store';
import { trackPageView } from '@shared/utils/analytics';

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

const ROUTES = [
  '/',
  '/my-events',
  '/admin',
  '/admin/login',
  '/register',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/profile',
  '/team-manager',
  '/report-bug',
  '/about',
  '/guide',
  '/faq',
  '/race-day',
  '/tracks',
  '/get-in-touch',
  '/news',
  '/news/:slug',
  '/privacy-policy',
  '/terms',
];

for (const path of ROUTES) {
  router.on(path, (params) => setRoute(path, params));
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
