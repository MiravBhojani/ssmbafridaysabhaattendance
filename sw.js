/* Keeps the app opening offline. Database traffic is never cached here (Firestore has its own offline storage). */
var V = 'hajari-v1';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'firebase-config.js', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  if (/firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com|\/__\/auth\/|accounts\.google\.com|apis\.google\.com/.test(r.url)) return;
  e.respondWith(
    fetch(r).then(function (res) {
      var copy = res.clone();
      caches.open(V).then(function (c) { c.put(r, copy); });
      return res;
    }).catch(function () {
      return caches.match(r).then(function (m) { return m || (r.mode === 'navigate' ? caches.match('index.html') : undefined); });
    })
  );
});
