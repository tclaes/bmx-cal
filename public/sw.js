const CACHE_NAME = 'bmx-calendar-v5';
const urlsToCache = [
  '/',
  '/index.html',
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

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
  );
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
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      return self.clients.matchAll({ type: 'window' });
    }).then(clients => {
      clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
    })
  );
});
