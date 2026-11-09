// Lógica del juego diario "Adivina el anime"
import { obtenerAnimesPopulares } from './anilist.js';
import { leer, guardar } from './almacen.js';

export const MAX_INTENTOS = 8;
const CLAVE = 'juego';

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
    this.secreto = null;
    this.intentos = [];
  }

  // Descarga los 200 más populares y elige el secreto del día
  async cargar() {
    const paginas = await Promise.all([1, 2, 3, 4].map(obtenerAnimesPopulares));
    this.animes = paginas.flat().map(normalizar).sort((a, b) => a.id - b.id);

    const azar = aleatorioConSemilla(this.semilla);
    this.secreto = this.animes[Math.floor(azar() * this.animes.length)];

    // Recupera los intentos de hoy (si son de otro día, empieza de cero)
    const guardado = leer(CLAVE, null);
    const ids = guardado?.semilla === this.semilla ? guardado.ids : [];
    this.intentos = ids.map((id) => this.animes.find((a) => a.id === id)).filter(Boolean);
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
    guardar(CLAVE, { semilla: this.semilla, ids: this.intentos.map((a) => a.id) });
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
