// __APP_VERSION__ is replaced with the release version at build time (vite.config.ts),
// so every release ships a byte-different sw.js and gets its own cache.
const CACHE_NAME = 'bmx-calendar-__APP_VERSION__';
const APP_SHELL = '/index.html';
const urlsToCache = [
  APP_SHELL,
  '/bmx-calendar.png',
  '/favicon.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => {
        console.warn('Cache addAll failed:', err);
      })
  );
  self.skipWaiting();
});

function putInCache(request, response) {
  if (!response || response.status !== 200 || response.type !== 'basic') return;
  const copy = response.clone();
  caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
}

// Pages: network first, so a reload always loads the deployed release. Offline: cached shell.
function networkFirstNavigation(request) {
  return fetch(request)
    .then(response => {
      // Only HTML can serve as the app shell; a direct visit to /sitemap.xml or /robots.txt
      // is a navigation too and must not replace it.
      const isHtml = (response?.headers.get('content-type') || '').includes('text/html');
      if (response && response.ok && isHtml) putInCache(APP_SHELL, response);
      return response;
    })
    .catch(() => caches.match(APP_SHELL).then(cached => cached || Response.error()));
}

// Other files: cache first (hashed assets never change).
function cacheFirst(request) {
  return caches.match(request).then(cached => {
    if (cached) return cached;
    return fetch(request).then(response => {
      putInCache(request, response);
      return response;
    });
  });
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.origin !== location.origin || request.method !== 'GET') {
    return;
  }

  // Release information must always come from the network.
  if (url.pathname === '/version.json') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('push', event => {
  let data = { title: 'BMX Kalender', body: '', url: '/' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (err) {
    data = { title: 'BMX Kalender', body: event.data ? event.data.text() : '', url: '/' };
  }

  const options = {
    body: data.body,
    icon: '/bmx-calendar.png',
    badge: '/bmx-calendar.png',
    data: { url: data.url || '/' },
    tag: data.tag || 'bmx-notification',
    renotify: true,
    requireInteraction: false,
    actions: data.url ? [
      { action: 'open', title: 'Bekijken' },
      { action: 'close', title: 'Sluiten' },
    ] : undefined,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    silent: false,
    dir: 'auto',
    lang: 'nl',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});
