/* global self, caches */
// Makes the documentation site installable and readable offline. Requests go
// to the network first, so a deploy shows up on the next load; the cache only
// answers when the network can't.
const PREFIX = "squonk-docs-";
const CACHE = `${PREFIX}v1`;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      // Only this worker's older caches; other code on the origin keeps its own.
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith(PREFIX) && key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Pages' sign-in redirects aren't worth keeping.
        if (response.ok && !response.redirected) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
        }
        return response;
      })
      .catch(() =>
        caches
          .match(request, { ignoreSearch: request.mode === "navigate" })
          .then((cached) => cached ?? Response.error()),
      ),
  );
});
