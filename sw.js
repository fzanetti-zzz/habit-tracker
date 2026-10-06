// Service worker: rende l'app utilizzabile anche offline.
// Quando modifichi i file dell'app, aumenta VERSION.
const VERSION = 'v4';
const CACHE = 'habit-tracker-' + VERSION;
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'icons.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'fonts/jakarta-400.woff2', 'fonts/jakarta-500.woff2', 'fonts/jakarta-600.woff2', 'fonts/jakarta-700.woff2', 'fonts/jakarta-800.woff2',
  'fonts/jbmono-400.woff2', 'fonts/jbmono-500.woff2', 'fonts/jbmono-700.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // File dell'app: prima la rete (così gli aggiornamenti arrivano), poi la cache
  if (url.origin === location.origin) {
    e.respondWith(fetch(e.request).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
    return;
  }
});
