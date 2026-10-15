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
