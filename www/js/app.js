// Punto de entrada: router por hash, barra de navegación y tema
import { JuegoController } from './controllers/juegoController.js';
import { CapturaController } from './controllers/capturaController.js';
import { RecomendadorController } from './controllers/recomendadorController.js';
import { leer, guardar } from './models/almacen.js';

// Cada ruta tiene su controlador (se crea la primera vez que se visita)
const rutas = {
  juego: JuegoController,
  captura: CapturaController,
  recomendador: RecomendadorController
};
const controladores = {};

function navegar() {
  const hash = location.hash.slice(1);
  const ruta = hash in rutas ? hash : 'juego';

  // Muestra solo la sección activa
  for (const nombre of Object.keys(rutas)) {
    document.getElementById(nombre).hidden = nombre !== ruta;
  }
  // Marca el enlace activo en la barra
  document.querySelectorAll('.navegacion a').forEach((enlace) => {
    enlace.classList.toggle('activo', enlace.dataset.ruta === ruta);
  });

  if (!controladores[ruta]) {
    controladores[ruta] = new rutas[ruta](document.getElementById(ruta));
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', navegar);
navegar();

// Tema claro / oscuro (por defecto, el del sistema)
const botonTema = document.getElementById('boton-tema');

function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  botonTema.textContent = tema === 'oscuro' ? '☀️' : '🌙';
  document.querySelector('meta[name="theme-color"]').content = tema === 'oscuro' ? '#14111f' : '#fdf2f8';
}

const temaSistema = matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'oscuro';
aplicarTema(leer('tema', temaSistema));

botonTema.addEventListener('click', () => {
  const nuevo = document.documentElement.dataset.tema === 'oscuro' ? 'claro' : 'oscuro';
  aplicarTema(nuevo);
  guardar('tema', nuevo);
});

// Registra el service worker (solo si el navegador lo soporta)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
