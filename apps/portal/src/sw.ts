/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
clientsClaim();

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
}

self.addEventListener("push", (event) => {
  const payload = parsePayload(event.data?.text());

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Martylab", {
      body: payload.body ?? "Nouvelle notification",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      data: { url: payload.url ?? "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    typeof event.notification.data?.url === "string"
      ? event.notification.data.url
      : "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client && client.url.includes(self.location.origin)) {
            void client.focus();
            if ("navigate" in client) {
              void (client as WindowClient).navigate(targetUrl);
            }
            return;
          }
        }

        return self.clients.openWindow(targetUrl);
      }),
  );
});

function parsePayload(raw: string | undefined): PushPayload {
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as PushPayload;
  } catch {
    return { body: raw };
  }
}
