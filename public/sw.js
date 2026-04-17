// ER Schedule Service Worker
const CACHE_NAME = "er-schedule-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log("[SW] Deleting old cache:", name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network-first strategy for API calls, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith("http")) return;

  // API requests: network-first, no caching
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: "オフラインのため接続できません" }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      })
    );
    return;
  }

  // Static assets: cache-first strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((networkResponse) => {
          // Only cache successful responses for same-origin requests
          if (
            networkResponse.ok &&
            url.origin === self.location.origin
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // For navigation requests, return the cached root page
          if (request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("オフライン", { status: 503 });
        });
    })
  );
});

// Push notification event
self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event);

  let notificationData = {
    title: "ER スケジュール",
    body: "新しい予定のお知らせがあります",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: "er-schedule-notification",
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      url: "/",
    },
  };

  // Try to parse push data if provided
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch {
      const text = event.data.text();
      if (text) {
        notificationData.body = text;
      }
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      vibrate: notificationData.vibrate,
      data: notificationData.data,
    })
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.notification.tag);
  event.notification.close();

  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // If there is already an open window, focus it
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Handle background sync (for offline event additions)
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);
  if (event.tag === "sync-events") {
    event.waitUntil(syncPendingEvents());
  }
});

async function syncPendingEvents() {
  // In a full implementation, this would retrieve pending events from IndexedDB
  // and attempt to sync them with the Google Calendar API
  console.log("[SW] Syncing pending events...");
}
