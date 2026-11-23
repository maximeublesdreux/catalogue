// Lets the catalogue work without internet once it has been opened one time.
const C = 'maxi-meubles-v3';
const SHELL = ['./', './index.html', './manifest.json', './catalogue.json', './icons/logo.png', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  const same = url.origin === location.origin;
  if (!same && !/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return;   // GitHub API etc.: not touched
  if (same && url.pathname.endsWith('/admin.html')) return;                         // admin page: always live

  // Photos never change name: take them from the device first.
  if (same && url.pathname.includes('/images/')){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok){ const copy = r.clone(); caches.open(C).then(c => c.put(req, copy)); }
      return r;
    })));
    return;
  }
  // Everything else: internet first (to get updates), device copy when offline.
  e.respondWith(fetch(req).then(r => {
    if (r.ok || r.type === 'opaque'){ const copy = r.clone(); caches.open(C).then(c => c.put(req, copy)); }
    return r;
  }).catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
