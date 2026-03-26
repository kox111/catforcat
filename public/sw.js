// CATforCAT Service Worker
// Caches app shell + static assets for offline use
// API routes are NOT cached (require server)

const CACHE_NAME = "catforcat-v1";

// App shell files to precache
const PRECACHE_URLS = [
  "/",
  "/login",
  "/register",
  "/app/projects",
  "/app/tm",
  "/app/glossary",
  "/app/settings",
  "/manifest.json",
];

// Install: precache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        return self.skipWaiting();
      }),
  );
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        );
      })
      .then(() => {
        return self.clients.claim();
      }),
  );
});

// Fetch: network-first for API, cache-first for app shell/assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip API routes — these should NOT be cached
  if (url.pathname.startsWith("/api/")) return;

  // Skip NextAuth routes
  if (url.pathname.startsWith("/api/auth/")) return;

  // For navigation and static assets: stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          // Only cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed — return cached if available
          return cached;
        });

      // Return cached immediately, update cache in background
      return cached || fetchPromise;
    }),
  );
});
