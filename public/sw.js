/*
 * Modo offline do Pedrinho Tracker.
 * Estratégia "rede primeiro": sempre tenta buscar a versão mais nova; se estiver
 * sem internet, usa a última cópia guardada. Assim, depois de atualizar o app,
 * a versão nova aparece na hora, e o app abre mesmo sem sinal.
 * Chamadas para outros sites (ex.: Supabase) nunca passam por aqui.
 */
const CACHE = "pedrinho-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key !== CACHE) await caches.delete(key);
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        if (res && res.ok && res.type === "basic") {
          const cache = await caches.open(CACHE);
          cache.put(req, res.clone());
        }
        return res;
      } catch (err) {
        const hit =
          (await caches.match(req)) ||
          (req.mode === "navigate" ? await caches.match("/") : undefined);
        if (hit) return hit;
        throw err;
      }
    })()
  );
});

// Toque na notificação: volta para o app.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const all = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of all) {
        if ("focus" in c) return c.focus();
      }
      return clients.openWindow("/");
    })()
  );
});

// Aviso enviado pelo servidor (chega mesmo com o app fechado).
self.addEventListener("push", (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch (e) {
    d = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(d.title || "Pedrinho Tracker", {
      body: d.body || "",
      tag: d.tag || undefined,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: d.url || "/" },
    })
  );
});
