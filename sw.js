/* BasKar service worker: lets the app open and work offline.
   - On install it reads index.html and caches every file it loads (app files, pinned CDN libraries, fonts).
   - The page itself is network-first, so a new release shows up as soon as there is signal.
   - Everything else is cache-first; versioned URLs (?v=…) mean a release never mixes old and new files.
   VERSION must match the top entry of js/core/releases.js (tests/run-tests.js checks); bumping it clears old caches.
   It never sees or stores account data: that lives in cookies and local storage, not in HTTP responses. */
var VERSION = '2.6';
var CACHE = 'baskar-' + VERSION;
var PAGE_TIMEOUT = 4000;

function assetsFrom(html) {
  var out = ['./', 'index.html', 'manifest.webmanifest', 'icon-512.png', 'apple-touch-icon.png'];
  var re = /(?:src|href)="([^"#]+)"/g, m;
  while ((m = re.exec(html))) {
    var u = m[1].replace(/&amp;/g, '&');
    if (/^https:\/\/(cdnjs\.cloudflare\.com|fonts\.googleapis\.com)\//.test(u) || !/^[a-z]+:/i.test(u)) out.push(u);
  }
  return out.filter(function (u, i, a) { return a.indexOf(u) === i && !/^(\/\/|data:)/.test(u); });
}

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (cache) {
    return fetch('index.html', { cache: 'reload' }).then(function (r) { return r.text(); }).then(function (html) {
      // One failed file (e.g. a font) mustn't block the rest, so cache them one by one.
      return Promise.all(assetsFrom(html).map(function (u) {
        var cross = /^https:/.test(u);
        return fetch(new Request(u, cross ? { mode: 'no-cors' } : { cache: 'reload' })).then(function (res) { if (res.ok || res.type === 'opaque') return cache.put(u, res); }).catch(function () { });
      }));
    });
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('baskar-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function pageFirst(req) {
  return caches.open(CACHE).then(function (cache) {
    var net = fetch(req).then(function (res) { if (res.ok) cache.put('index.html', res.clone()); return res; });
    var timeout = new Promise(function (_, reject) { setTimeout(function () { reject(new Error('slow')); }, PAGE_TIMEOUT); });
    return Promise.race([net, timeout]).catch(function () {
      return cache.match('index.html').then(function (hit) { return hit || net; });
    });
  });
}

function cacheFirst(req) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; });
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (req.mode === 'navigate' && url.origin === self.location.origin) { e.respondWith(pageFirst(req)); return; }
  if (url.origin === self.location.origin || /^(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname)) e.respondWith(cacheFirst(req));
});
