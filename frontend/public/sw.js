const STATIC_CACHE = "gardoon-static-v5";
const IMAGE_CACHE = "gardoon-images-v5";
const PAGES_CACHE = "gardoon-pages-v5";

const OFFLINE_SHELL_PAGES = ["/", "/auth"];

const PRECACHE_ASSETS = [
  "/onboarding/onb-cards.png",
  "/onboarding/onb-draw.png",
  "/onboarding/onb-shield.png",
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-128x128.png",
  "/icons/icon-144x144.png",
  "/icons/icon-152x152.png",
  "/icons/icon-192x192.png",
  "/icons/icon-384x384.png",
  "/icons/icon-512x512.png",
  "/icons/maskable-512x512.png",
  "/apple-touch-icon.png",
];

const isStaticAsset = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  PRECACHE_ASSETS.includes(url.pathname);

const isOptimizedPublicImage = (url) => {
  if (url.pathname !== "/_next/image") return false;
  const target = url.searchParams.get("url") || "";
  return target.startsWith("/");
};

const isPublicMedia = (url) =>
  !url.pathname.startsWith("/_next/") &&
  !url.pathname.startsWith("/api/") &&
  /\.(svg|png|jpe?g|webp|woff2|ico)$/i.test(url.pathname);

async function cachePageAndAssets(path, response) {
  if (!response.ok || response.redirected || response.type !== "basic") return;
  const html = await response.clone().text();
  const assetUrls = new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) || []);
  const staticCache = await caches.open(STATIC_CACHE);
  await Promise.all([...assetUrls].map((u) => staticCache.add(u).catch(() => undefined)));
  const pagesCache = await caches.open(PAGES_CACHE);
  await pagesCache.put(path, response);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .open(STATIC_CACHE)
        .then((cache) =>
          Promise.all(
            PRECACHE_ASSETS.map((path) => cache.add(path).catch(() => undefined))
          )
        ),
      Promise.all(
        OFFLINE_SHELL_PAGES.map((path) =>
          fetch(path, { credentials: "same-origin", redirect: "manual" })
            .then((res) => cachePageAndAssets(path, res))
            .catch(() => undefined)
        )
      ),
    ]).then(() => {
      // Activate immediately on initial install; hold updates in waiting state
      // so the client can prompt the user to refresh stale data cleanly.
      if (!self.registration.active) {
        return self.skipWaiting();
      }
      return undefined;
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    event.waitUntil(
      caches
        .delete(PAGES_CACHE)
        .catch(() => undefined)
        .then(() => self.skipWaiting())
    );
  }
});

self.addEventListener("activate", (event) => {
  const expected = new Set([STATIC_CACHE, IMAGE_CACHE, PAGES_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !expected.has(k)).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/ws")
  ) {
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  if (isPublicMedia(url) || isOptimizedPublicImage(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(IMAGE_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkPromise;
      })
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (OFFLINE_SHELL_PAGES.includes(url.pathname)) {
            cachePageAndAssets(url.pathname, response.clone()).catch(() => undefined);
          }
          return response;
        })
        .catch(async () => {
          const directMatch = await caches.match(url.pathname);
          if (directMatch) return directMatch;
          return (await caches.match("/")) || Response.error();
        })
    );
  }
});
