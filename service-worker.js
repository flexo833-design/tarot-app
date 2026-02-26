
const CACHE_NAME = "tarot-pwa-v8";
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./service-worker.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : null)))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Our app files: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(()=>{});
        return resp;
      }).catch(() => caches.match("./index.html")))
    );
    return;
  }

  // Images (e.g., Wikimedia): runtime cache-first
  if (req.destination === "image") {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(()=>{});
        return resp;
      }))
    );
    return;
  }

  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
