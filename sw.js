self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('neoai-cache').then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json',
        './images/icon-192.png',
        './images/icon-512.png'
      ]);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});