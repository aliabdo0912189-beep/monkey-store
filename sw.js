
const CACHE_NAME = "monkey-store-v10";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./app.js?v=20261114-3",
  "./admin.html",
  "./manifest.webmanifest",
  "./monkey-logo.png",
  "./bankak-logo.png"
];

// تثبيت النسخة الجديدة
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// حذف النسخ القديمة
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) =>
            key.startsWith("monkey-store-") &&
            key !== CACHE_NAME
          )
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// تحديث الصفحات وملف JavaScript من الشبكة أولاً
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  const isPage = request.mode === "navigate";
  const isAppScript = url.pathname.endsWith("/app.js");

  if (isPage || isAppScript) {
    event.respondWith(
      fetch(new Request(request, { cache: "no-store" }))
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }

          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);

          return (
            await cache.match(request, { ignoreSearch: true })
          ) || await cache.match("./index.html");
        })
    );

    return;
  }

  // الملفات الثابتة: النسخة المحفوظة أولاً
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
        }

        return response;
      });
    })
  );
});
