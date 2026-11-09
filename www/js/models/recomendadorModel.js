// Preguntas y lógica del recomendador "¿Qué leo o veo?"
import { buscarRecomendaciones } from './anilist.js';
import { traducir } from './traductor.js';

// Las opciones pueden depender del medio elegido (MANGA o ANIME)
export const PREGUNTAS = [
  {
    clave: 'medio',
    titulo: '¿Qué buscas?',
    opciones: [
      { texto: '📚 Algo para leer', valor: 'MANGA' },
      { texto: '📺 Algo para ver', valor: 'ANIME' }
    ]
  },
  {
    clave: 'tipo',
    titulo: '¿De dónde?',
    opciones: {
      MANGA: [
        { texto: '🇯🇵 Manga', valor: 'JP' },
        { texto: '🇰🇷 Manhwa', valor: 'KR' },
        { texto: '🇨🇳 Manhua', valor: 'CN' },
        { texto: '🎲 Me da igual', valor: null }
      ],
      ANIME: [
        { texto: '🇯🇵 Anime japonés', valor: 'JP' },
        { texto: '🇨🇳 Donghua (chino)', valor: 'CN' },
        { texto: '🎲 Me da igual', valor: null }
      ]
    }
  },
  {
    clave: 'genero',
    titulo: '¿Qué género?',
    opciones: [
      { texto: '💘 Romance', valor: 'Romance' },
      { texto: '⚔️ Acción', valor: 'Action' },
      { texto: '🐉 Fantasía', valor: 'Fantasy' },
      { texto: '✨ Poderes / sobrenatural', valor: 'Supernatural' },
      { texto: '😂 Comedia', valor: 'Comedy' },
      { texto: '🔍 Misterio', valor: 'Mystery' },
      { texto: '👻 Terror', valor: 'Horror' },
      { texto: '🏀 Deportes', valor: 'Sports' }
    ]
  },
  {
    clave: 'ambiente',
    titulo: '¿Qué ambiente buscas?',
    opciones: [
      { texto: '🌸 Ligero y divertido', valor: 'ligero' },
      { texto: '🌑 Intenso y oscuro', valor: 'oscuro' },
      { texto: '🎲 Me da igual', valor: null }
    ]
  },
  {
    clave: 'longitud',
    titulo: '¿Qué longitud?',
    opciones: {
      MANGA: [
        { texto: '📗 Corta (menos de 50 caps.)', valor: 'corta' },
        { texto: '📘 Media (50 a 150 caps.)', valor: 'media' },
        { texto: '📚 Larga (más de 150 caps.)', valor: 'larga' },
        { texto: '🔄 Que siga saliendo', valor: 'saliendo' },
        { texto: '🎲 Me da igual', valor: null }
      ],
      ANIME: [
        { texto: '📗 Corta (hasta 13 episodios)', valor: 'corta' },
        { texto: '📘 Media (14 a 50 episodios)', valor: 'media' },
        { texto: '📚 Larga (más de 50 episodios)', valor: 'larga' },
        { texto: '🔄 Que siga en emisión', valor: 'saliendo' },
        { texto: '🎲 Me da igual', valor: null }
      ]
    }
  },
  {
    clave: 'fama',
    titulo: '¿Popular o joya oculta?',
    opciones: [
      { texto: '🔥 Lo más popular', valor: 'popular' },
      { texto: '💎 Una joya oculta', valor: 'joya' }
    ]
  }
];

// Convierte las respuestas en variables para la consulta de AniList
// (AniList NO ignora un país a null: busca títulos sin país, así que solo se añade si hay)
export function crearFiltros(r) {
  const f = { medio: r.medio, genero: r.genero, orden: ['POPULARITY_DESC'] };
  if (r.tipo) f.pais = r.tipo;

  if (r.ambiente === 'ligero') f.generosFuera = ['Horror', 'Psychological', 'Thriller'];
  if (r.ambiente === 'oscuro') f.generosFuera = ['Comedy', 'Slice of Life'];

  // Límites de longitud: capítulos para manga, episodios para anime
  const anime = r.medio === 'ANIME';
  const mas = anime ? 'epMas' : 'capMas';
  const menos = anime ? 'epMenos' : 'capMenos';
  const limites = anime
    ? { corta: [null, 14], media: [13, 51], larga: [50, null] }
    : { corta: [null, 50], media: [49, 151], larga: [150, null] };
  if (limites[r.longitud]) {
    const [desde, hasta] = limites[r.longitud];
    f.estado = 'FINISHED';
    if (desde) f[mas] = desde;
    if (hasta) f[menos] = hasta;
  }
  if (r.longitud === 'saliendo') f.estado = 'RELEASING';

  if (r.fama === 'joya') Object.assign(f, { orden: ['SCORE_DESC'], popMenos: 15000 });
  return f;
}

// Quita las etiquetas HTML y las entidades más comunes
function limpiarDescripcion(texto) {
  return (texto || 'Sin descripción.')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Mezcla una lista al azar (Fisher-Yates)
function mezclar(lista) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

export class RecomendadorModel {
  constructor() {
    this.reiniciar();
  }

  reiniciar() {
    this.paso = 0;
    this.respuestas = {};
    this.resultados = [];
    this.indice = 0;
  }

  // Devuelve la pregunta con las opciones del medio elegido
  preguntaActual() {
    const p = PREGUNTAS[this.paso];
    const opciones = Array.isArray(p.opciones) ? p.opciones : p.opciones[this.respuestas.medio];
    return { ...p, opciones };
  }

  // Guarda la respuesta y avanza; devuelve true si ya no quedan preguntas
  responder(valor) {
    this.respuestas[PREGUNTAS[this.paso].clave] = valor;
    this.paso++;
    return this.paso >= PREGUNTAS.length;
  }

  async buscar() {
    const lista = await buscarRecomendaciones(crearFiltros(this.respuestas));
    const anime = this.respuestas.medio === 'ANIME';
    this.resultados = mezclar(
      lista.map((m) => ({
        titulo: m.title.english || m.title.romaji,
        romaji: m.title.romaji || '',
        portada: m.coverImage.large,
        nota: m.averageScore ? (m.averageScore / 10).toFixed(1) : '?',
        cantidad: (anime ? m.episodes : m.chapters) ?? '?',
        unidad: anime ? 'episodios' : 'capítulos',
        generos: m.genres || [],
        descripcion: limpiarDescripcion(m.description),
        enlace: m.siteUrl
      }))
    );
    this.indice = 0;
  }

  actual() {
    return this.resultados[this.indice];
  }

  // Pasa a la siguiente (vuelve al principio al llegar al final)
  siguiente() {
    this.indice = (this.indice + 1) % this.resultados.length;
  }

  anterior() {
    if (this.indice > 0) this.indice--;
  }

  // Alterna entre la sinopsis original y la traducida (se traduce solo la primera vez)
  async alternarTraduccion() {
    const actual = this.actual();
    if (!actual.traduccion) actual.traduccion = await traducir(actual.descripcion);
    actual.verTraduccion = !actual.verTraduccion;
  }
}
