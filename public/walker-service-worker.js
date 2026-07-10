const WALKER_CACHE_NAME = "walker-field-beta-v1";
const WALKER_CORE_ASSETS = [
  "/",
  "/manifest.json",
  "/offline-readiness.txt",
  "/walker-icon-192.png",
  "/walker-icon-512.png",
  "/fonts/EBGaramond.ttf",
  "/fonts/Inter.ttf"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(WALKER_CACHE_NAME)
      .then((cache) => cache.addAll(WALKER_CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== WALKER_CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request)
        .then((response) => {
          const shouldCache =
            response.ok &&
            new URL(request.url).origin === self.location.origin &&
            (request.destination === "script" ||
              request.destination === "style" ||
              request.destination === "font" ||
              request.destination === "image" ||
              request.url.includes("/_expo/"));

          if (shouldCache) {
            const clone = response.clone();
            caches.open(WALKER_CACHE_NAME).then((cache) => cache.put(request, clone));
          }

          return response;
        })
        .catch(() =>
          new Response(
            "Walker is offline. Saved routes and checked-in inventory can be viewed after the app shell is cached; verify live hours when back online.",
            {
              headers: { "Content-Type": "text/plain; charset=utf-8" },
              status: 200
            }
          )
        );
    })
  );
});
