/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkOnly } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: any;
};

// Take control ASAP
self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

// Precache
precacheAndRoute(self.__WB_MANIFEST);

// Cache Google Fonts
registerRoute(
  ({ url }) => url.origin === "https://fonts.googleapis.com",
  new CacheFirst({
    cacheName: "google-fonts-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
    ],
  }),
);

// Never cache Supabase API calls
registerRoute(({ url }) => /\.supabase\.co$/.test(url.hostname), new NetworkOnly());

// --- Push Notifications ---
self.addEventListener("push", (event: PushEvent) => {
  console.log("[SW] ========== PUSH EVENT RECEIVED ==========");
  console.log("[SW] Event:", event);
  console.log("[SW] Has data:", !!event.data);

  let data: any = { title: "New Message", body: "You have a new message", url: "/community" };

  if (event.data) {
    console.log("[SW] Raw data text:", event.data.text());
    try {
      const parsed = event.data.json();
      console.log("[SW] Parsed JSON:", parsed);
      data = parsed;
    } catch (e) {
      console.error("[SW] JSON parse error:", e);
    }
  } else {
    console.log("[SW] No data in push event");
  }

  const options: any = {
    body: data.body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/community",
      channelId: data.channelId,
      messageId: data.messageId,
    },
    actions: [
      { action: "open", title: "Open" },
      { action: "dismiss", title: "Dismiss" },
    ],
    tag: data.channelId || "community-message",
    renotify: true,
  };

  console.log("[SW] Showing notification:", data.title, options);

  event.waitUntil(
    self.registration
      .showNotification(data.title || "New Message", options)
      .then(() => console.log("[SW] Notification shown!"))
      .catch((err) => console.error("[SW] Show notification error:", err)),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const urlToOpen = (event.notification.data as any)?.url || "/community";

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientList) {
        if ("focus" in client) {
          await (client as WindowClient).navigate(urlToOpen);
          return (client as WindowClient).focus();
        }
      }
      return self.clients.openWindow(urlToOpen);
    })(),
  );
});
