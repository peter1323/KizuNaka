// Preguntas y lógica del recomendador "¿Qué leo ahora?"
import { buscarMangas } from './anilist.js';

export const PREGUNTAS = [
  {
    clave: 'tipo',
    titulo: '¿Qué te apetece leer?',
    opciones: [
      { texto: '🇯🇵 Manga', valor: 'JP' },
      { texto: '🇰🇷 Manhwa', valor: 'KR' },
      { texto: '🇨🇳 Manhua', valor: 'CN' },
      { texto: '🎲 Me da igual', valor: null }
    ]
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
    opciones: [
      { texto: '📗 Corta (menos de 50 caps.)', valor: 'corta' },
      { texto: '📘 Media (50 a 150 caps.)', valor: 'media' },
      { texto: '📚 Larga (más de 150 caps.)', valor: 'larga' },
      { texto: '🔄 Que siga saliendo', valor: 'saliendo' },
      { texto: '🎲 Me da igual', valor: null }
    ]
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
export function crearFiltros(r) {
  const f = { pais: r.tipo, genero: r.genero, orden: ['POPULARITY_DESC'] };

  if (r.ambiente === 'ligero') f.generosFuera = ['Horror', 'Psychological', 'Thriller'];
  if (r.ambiente === 'oscuro') f.generosFuera = ['Comedy', 'Slice of Life'];

  if (r.longitud === 'corta') Object.assign(f, { estado: 'FINISHED', capMenos: 50 });
  if (r.longitud === 'media') Object.assign(f, { estado: 'FINISHED', capMas: 49, capMenos: 151 });
  if (r.longitud === 'larga') Object.assign(f, { estado: 'FINISHED', capMas: 150 });
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

  preguntaActual() {
    return PREGUNTAS[this.paso];
  }

  // Guarda la respuesta y avanza; devuelve true si ya no quedan preguntas
  responder(valor) {
    this.respuestas[PREGUNTAS[this.paso].clave] = valor;
    this.paso++;
    return this.paso >= PREGUNTAS.length;
  }

  async buscar() {
    const mangas = await buscarMangas(crearFiltros(this.respuestas));
    this.resultados = mezclar(
      mangas.map((m) => ({
        titulo: m.title.english || m.title.romaji,
        romaji: m.title.romaji || '',
        portada: m.coverImage.large,
        nota: m.averageScore ? (m.averageScore / 10).toFixed(1) : '?',
        capitulos: m.chapters ?? '?',
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
}
