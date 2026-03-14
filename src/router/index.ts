import navaid from 'navaid';
import { writable } from 'svelte/store';

export interface Route {
  path: string;
  component: string;
}

export const currentRoute = writable<string>('/');
export const routeParams = writable<Record<string, string>>({});

const router = navaid('/', () => {
  currentRoute.set('/');
});

router
  .on('/', () => {
    currentRoute.set('/');
  })
  .on('/my-events', () => {
    currentRoute.set('/my-events');
  })
  .on('/admin', () => {
    currentRoute.set('/admin');
  })
  .on('/admin/login', () => {
    currentRoute.set('/admin/login');
  })
  .on('/register', () => {
    currentRoute.set('/register');
  })
  .on('/login', () => {
    currentRoute.set('/login');
  })
  .on('/profile', () => {
    currentRoute.set('/profile');
  })
  .on('/team-manager', () => {
    currentRoute.set('/team-manager');
  })
  .on('/report-bug', () => {
    currentRoute.set('/report-bug');
  });

export function navigate(path: string) {
  router.route(path);
}

export function startRouter() {
  router.listen();
}

export default router;
