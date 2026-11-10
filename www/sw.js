// Service worker: guarda la app en caché para que abra rápido y sin conexión
const CACHE = 'kizunaka-v8';

const ARCHIVOS = [
  './',
  './index.html',
  './manifest.json',
  './css/estilos.css',
  './js/app.js',
  './js/models/anilist.js',
  './js/models/tracemoe.js',
  './js/models/almacen.js',
  './js/models/juegoModel.js',
  './js/models/recomendadorModel.js',
  './js/models/traductor.js',
  './js/models/calendario.js',
  './js/views/html.js',
  './js/views/juegoView.js',
  './js/views/capturaView.js',
  './js/views/recomendadorView.js',
  './js/views/calendarioView.js',
  './js/controllers/juegoController.js',
  './js/controllers/capturaController.js',
  './js/controllers/recomendadorController.js',
  './js/controllers/calendarioController.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

// Al instalar, descarga todos los archivos
self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ARCHIVOS)));
  self.skipWaiting();
});

// Al activar, borra cachés antiguas
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c)))
    )
  );
  self.clients.claim();
});

// Responde desde la caché y la actualiza en segundo plano.
// Las peticiones a las APIs (otro dominio) van directas a la red.
self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET' || new URL(peticion.url).origin !== self.location.origin) return;

  evento.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const enCache = await cache.match(peticion, { ignoreSearch: true });
      const desdeRed = fetch(peticion)
        .then((respuesta) => {
          if (respuesta.ok) cache.put(peticion, respuesta.clone());
          return respuesta;
        })
        .catch(() => enCache);
      return enCache || desdeRed;
    })
  );
});
