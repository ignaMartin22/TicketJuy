/*
 * Service worker mínimo de Infinity: sólo lo necesario para que la app se pueda
 * instalar y no muestre la pantalla del dinosaurio sin conexión.
 *
 * A propósito NO guarda páginas ni datos: precios, cupos y compras tienen que
 * venir siempre del servidor. Sin conexión, las páginas muestran /offline.html.
 */
const CACHE = "infinity-offline-v2";
const OFFLINE = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  // Sólo las navegaciones (abrir una página); todo lo demás va directo a la red.
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE)));
});
