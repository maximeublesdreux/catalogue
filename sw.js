// Keeps the app working without internet once it has been opened one time.
const C = 'maxi-meubles-v2';
const SHELL = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
// Network first (to get updates when online), cache as fallback (offline).
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok || r.type === 'opaque'){ const copy = r.clone(); caches.open(C).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('./index.html')))
  );
});
