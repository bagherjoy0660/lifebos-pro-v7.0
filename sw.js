// ================== SERVICE WORKER (v7.0) ==================
const CACHE_NAME = "lifebospro-v7.0";
const urlsToCache = [
  "/lifebos-pro-v7.0/",
  "/lifebos-pro-v7.0/index.html",
  "/lifebos-pro-v7.0/css/style.css",
  "/lifebos-pro-v7.0/js/main.js",
  "/lifebos-pro-v7.0/js/modules/core/utils.js",
  "/lifebos-pro-v7.0/js/modules/core/state.js",
  "/lifebos-pro-v7.0/js/modules/features/dashboard.js",
  "/lifebos-pro-v7.0/js/modules/features/planner.js",
  "/lifebos-pro-v7.0/js/modules/features/habits.js",
  "/lifebos-pro-v7.0/js/modules/features/focus.js",
  "/lifebos-pro-v7.0/js/modules/features/wellness.js",
  "/lifebos-pro-v7.0/js/modules/features/exercise.js",
  "/lifebos-pro-v7.0/js/modules/features/notepad.js",
  "/lifebos-pro-v7.0/js/modules/features/goals.js",
  "/lifebos-pro-v7.0/js/modules/features/journal.js",
  "/lifebos-pro-v7.0/js/modules/features/settings.js",
  "/lifebos-pro-v7.0/manifest.json",
];

// ---------- INSTALL ----------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching app shell...");
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()),
  );
});

// ---------- ACTIVATE ----------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log("Deleting old cache:", cache);
              return caches.delete(cache);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// ---------- FETCH ----------
self.addEventListener("fetch", (event) => {
  // فقط درخواست‌های GET را هندل کن
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches
      .match(event.request)
      .then((cachedResponse) => {
        // استراتژی Cache First (از کش برگردون، اگر نبود برو شبکه)
        return (
          cachedResponse ||
          fetch(event.request).then((response) => {
            // پاسخ‌های موفق را در کش ذخیره کن (برای آپدیت تدریجی)
            if (
              response &&
              response.status === 200 &&
              response.type === "basic"
            ) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          })
        );
      })
      .catch(() => {
        // آفلاین fallback برای Navigation requests
        if (event.request.mode === "navigate") {
          return caches.match("/lifebos-pro-v7.0/index.html");
        }
      }),
  );
});
