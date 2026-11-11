
const CACHE_NAME = "monkey-store-v3";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./monkey-icon.png"
];

// تثبيت النسخة الجديدة
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// تفعيل النسخة الجديدة وحذف النسخ القديمة
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key =>
              key.startsWith("monkey-store-") &&
              key !== CACHE_NAME
            )
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// جلب الملفات من الإنترنت وتحديث التخزين المؤقت
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // تجاهل المواقع الخارجية
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();

          event.waitUntil(
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, copy))
          );
        }

        return response;
      })
      .catch(async () => {
        // استخدام النسخة المخزنة عند انقطاع الإنترنت
        const cached = await caches.match(request);

        if (cached) return cached;

        // فتح الصفحة الرئيسية عند انقطاع الإنترنت
        if (request.mode === "navigate") {
          const home = await caches.match("./index.html");

          if (home) return home;
        }

        return new Response(
          "لا يوجد اتصال بالإنترنت. يرجى المحاولة مرة أخرى.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );
      })
  );
});
