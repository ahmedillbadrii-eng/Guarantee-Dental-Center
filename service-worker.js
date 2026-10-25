const CACHE_NAME = "gdc-dashboard-v8";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/logo-192.jpg",
  "./assets/logo-512.jpg",
  "./assets/wy-horizontal.png",
  "./assets/wy-horizontal-white.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Never touch live data/action calls to n8n — they must always hit the network fresh.
  if (url.includes("/webhook/")) return;

  // Only handle same-origin GET requests for the app shell; let everything else pass through normally.
  if (event.request.method !== "GET" || !url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
