// Lógica del juego diario "Adivina el anime"
import { obtenerAnimesPopulares } from './anilist.js';
import { leer, guardar } from './almacen.js';

export const MAX_INTENTOS = 8;
export const NIVELES_PRACTICA = 100;
const CLAVE = 'juego';
const CLAVE_PRACTICA = 'practica';

// Semilla del día: año*10000 + mes*100 + día
export function semillaDeHoy(fecha = new Date()) {
  return fecha.getFullYear() * 10000 + (fecha.getMonth() + 1) * 100 + fecha.getDate();
}

// Generador aleatorio con semilla (mulberry32): mismo número para la misma semilla
function aleatorioConSemilla(semilla) {
  return function () {
    semilla = (semilla + 0x6d2b79f5) | 0;
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deja cada anime con los campos que usa el juego
function normalizar(m) {
  return {
    id: m.id,
    titulo: m.title.english || m.title.romaji,
    ingles: m.title.english || '',
    romaji: m.title.romaji || '',
    anio: m.seasonYear ?? m.startDate?.year ?? null,
    episodios: m.episodes ?? null,
    formato: (m.format || '?').replace('_', ' '),
    estudio: m.studios.nodes[0]?.name || 'Desconocido',
    generos: m.genres || [],
    portada: m.coverImage.large
  };
}

// Compara un número: verde si coincide, rojo con flecha si no
function compararNumero(valor, secreto) {
  if (valor === secreto) return { valor: valor ?? '?', estado: 'ok', flecha: '' };
  let flecha = '';
  if (valor != null && secreto != null) flecha = secreto > valor ? '↑' : '↓';
  return { valor: valor ?? '?', estado: 'mal', flecha };
}

export class JuegoModel {
  constructor() {
    this.semilla = semillaDeHoy();
    this.animes = [];
    this.practica = [];
    this.modo = 'diario';
    this.nivel = null; // en práctica: número, 'aleatorio' o null (viendo la lista de niveles)
    this.resultados = {}; // en práctica: { nivel: 'ganado' | 'perdido' }
    this.secreto = null;
    this.intentos = [];
  }

  // Descarga los 200 más populares y empieza en el modo diario
  async cargar() {
    const paginas = await Promise.all([1, 2, 3, 4].map(obtenerAnimesPopulares));
    this.animes = paginas.flat().map(normalizar).sort((a, b) => a.id - b.id);

    // Orden fijo para la práctica: los 100 primeros de una mezcla con semilla
    const azar = aleatorioConSemilla(1);
    this.practica = this.animes.slice();
    for (let i = this.practica.length - 1; i > 0; i--) {
      const j = Math.floor(azar() * (i + 1));
      [this.practica[i], this.practica[j]] = [this.practica[j], this.practica[i]];
    }
    this.practica = this.practica.slice(0, NIVELES_PRACTICA);

    this.cambiarModo('diario');
  }

  // Elige el secreto del modo y recupera sus intentos guardados
  cambiarModo(modo) {
    this.modo = modo;
    let ids;
    if (modo === 'diario') {
      const azar = aleatorioConSemilla(this.semilla);
      this.secreto = this.animes[Math.floor(azar() * this.animes.length)];
      const guardado = leer(CLAVE, null);
      ids = guardado?.semilla === this.semilla ? guardado.ids : []; // otro día: de cero
    } else {
      const guardado = leer(CLAVE_PRACTICA, {});
      const partida = guardado.partida;
      this.resultados = guardado.resultados || {};
      this.secreto = partida ? this.animes.find((a) => a.id === partida.secretoId) : null;
      this.nivel = this.secreto ? partida.nivel : null;
      ids = this.secreto ? partida.ids : [];
    }
    this.intentos = ids.map((id) => this.animes.find((a) => a.id === id)).filter(Boolean);
  }

  // Empieza un nivel (1-100) o una partida 'aleatorio' con cualquiera de los 200
  jugarNivel(nivel) {
    const secreto = nivel === 'aleatorio'
      ? this.animes[Math.floor(Math.random() * this.animes.length)]
      : this.practica[nivel - 1];
    this.guardarPractica({ nivel, secretoId: secreto.id, ids: [] });
    this.cambiarModo('practica');
  }

  // Siguiente nivel (tras el 100 vuelve al 1); en aleatorio, otra aleatoria
  siguienteNivel() {
    this.jugarNivel(this.nivel === 'aleatorio' ? 'aleatorio' : (this.nivel % NIVELES_PRACTICA) + 1);
  }

  verNiveles() {
    this.guardarPractica(null);
    this.cambiarModo('practica');
  }

  guardarPractica(partida) {
    guardar(CLAVE_PRACTICA, { resultados: this.resultados, partida });
  }

  guardarIntentos() {
    const ids = this.intentos.map((a) => a.id);
    if (this.modo === 'diario') {
      guardar(CLAVE, { semilla: this.semilla, ids });
      return;
    }
    // Apunta el resultado del nivel (un nivel ganado se queda ganado)
    const estado = this.estado();
    if (estado !== 'jugando' && this.nivel !== 'aleatorio' && this.resultados[this.nivel] !== 'ganado') {
      this.resultados[this.nivel] = estado;
    }
    this.guardarPractica({ nivel: this.nivel, secretoId: this.secreto.id, ids });
  }

  // Autocompletado por título en inglés y romaji
  buscar(texto) {
    const t = texto.trim().toLowerCase();
    if (!t) return [];
    const usados = new Set(this.intentos.map((a) => a.id));
    return this.animes
      .filter((a) => !usados.has(a.id))
      .filter((a) => a.ingles.toLowerCase().includes(t) || a.romaji.toLowerCase().includes(t))
      .slice(0, 8);
  }

  adivinar(id) {
    if (this.estado() !== 'jugando') return;
    const anime = this.animes.find((a) => a.id === id);
    if (!anime || this.intentos.includes(anime)) return;
    this.intentos.push(anime);
    this.guardarIntentos();
  }

  estado() {
    const ultimo = this.intentos[this.intentos.length - 1];
    if (ultimo && ultimo.id === this.secreto.id) return 'ganado';
    if (this.intentos.length >= MAX_INTENTOS) return 'perdido';
    return 'jugando';
  }

  // Pistas de un intento comparado con el secreto
  comparar(anime) {
    const s = this.secreto;
    const comunes = anime.generos.filter((g) => s.generos.includes(g));
    const iguales = comunes.length === anime.generos.length && comunes.length === s.generos.length;
    return {
      anime,
      acierto: anime.id === s.id,
      anio: compararNumero(anime.anio, s.anio),
      episodios: compararNumero(anime.episodios, s.episodios),
      formato: { valor: anime.formato, estado: anime.formato === s.formato ? 'ok' : 'mal' },
      estudio: { valor: anime.estudio, estado: anime.estudio === s.estudio ? 'ok' : 'mal' },
      generos: { comunes, estado: iguales ? 'ok' : comunes.length ? 'parcial' : 'mal' }
    };
  }

  comparaciones() {
    return this.intentos.map((a) => this.comparar(a));
  }
}
