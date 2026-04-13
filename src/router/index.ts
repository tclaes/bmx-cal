import navaid from 'navaid';
import { writable } from 'svelte/store';
import { trackPageView } from '@shared/utils/analytics';

export interface Route {
  path: string;
  component: string;
}

export const currentRoute = writable<string>('/');
export const routeParams = writable<Record<string, string>>({});

const router = navaid('/', () => {
  currentRoute.set('/');
});

function setRoute(path: string) {
  currentRoute.set(path);
  trackPageView(path);
}

router
  .on('/', () => setRoute('/'))
  .on('/my-events', () => setRoute('/my-events'))
  .on('/admin', () => setRoute('/admin'))
  .on('/admin/login', () => setRoute('/admin/login'))
  .on('/register', () => setRoute('/register'))
  .on('/login', () => setRoute('/login'))
  .on('/forgot-password', () => setRoute('/forgot-password'))
  .on('/reset-password', () => setRoute('/reset-password'))
  .on('/profile', () => setRoute('/profile'))
  .on('/team-manager', () => setRoute('/team-manager'))
  .on('/report-bug', () => setRoute('/report-bug'))
  .on('/about', () => setRoute('/about'))
  .on('/get-in-touch', () => setRoute('/get-in-touch'));

export function navigate(path: string) {
  router.route(path);
}

export function startRouter() {
  router.listen();
}

export default router;
