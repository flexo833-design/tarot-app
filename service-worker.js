const CACHE_NAME = "tarot-pwa-v5";
const PRECACHE = ["./","./index.html","./manifest.webmanifest","./service-worker.js","./icons/icon-192.png","./icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => (k!==CACHE_NAME) ? caches.delete(k) : Promise.resolve())))
  );
  self.clients.claim();
});

// Cache-first for images (including cross-origin). First open online to warm the cache.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  const isImage = req.destination === "image" || url.pathname.match(/\.(png|jpg|jpeg|webp)$/i);

  if (isImage) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(req, {ignoreSearch:false});
        if (cached) return cached;
        try{
          const fresh = await fetch(req, {mode:"no-cors"});
          cache.put(req, fresh.clone());
          return fresh;
        }catch(e){
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // Default: network-first, fallback to cache
  event.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(()=>{});
      return res;
    }).catch(() => caches.match(req))
  );
});
