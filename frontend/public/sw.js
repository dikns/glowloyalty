// Service worker — push notifications + auto-update only.
// No HTML caching: Vite content-hashes all JS/CSS so they never go stale.
// Caching index.html causes white screens after deploys — don't do it.

self.addEventListener('install', () => {
  self.skipWaiting(); // activate immediately on every new deploy
});

self.addEventListener('activate', (event) => {
  // Wipe every cache from previous versions
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Push notification received
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'GlowLoyalty', body: 'Novo obvestilo' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: data.data || {},
    })
  );
});

// Notification tapped — open / focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
