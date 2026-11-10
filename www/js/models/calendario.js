// Calendario semanal de emisiones (datos de AniList)
import { consultar } from './anilist.js';

export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const PAISES = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'JP', texto: '🇯🇵 Japón' },
  { valor: 'CN', texto: '🇨🇳 China' },
  { valor: 'KR', texto: '🇰🇷 Corea' }
];

// Etiqueta que se muestra en los animes que no son japoneses
const ETIQUETA_PAIS = { CN: '🇨🇳 Donghua', KR: '🇰🇷 Coreano', TW: '🇹🇼 Taiwán' };

const QUERY_EMISIONES = `
query ($pagina: Int, $desde: Int, $hasta: Int) {
  Page(page: $pagina, perPage: 50) {
    pageInfo { hasNextPage }
    airingSchedules(airingAt_greater: $desde, airingAt_lesser: $hasta, sort: TIME) {
      episode
      airingAt
      media {
        id
        title { romaji english }
        coverImage { large }
        countryOfOrigin
        isAdult
        siteUrl
        relations { edges { relationType node { type countryOfOrigin } } }
      }
    }
  }
}`;

// Lunes a las 00:00 de esta semana (hora local)
function inicioSemana() {
  const lunes = new Date();
  lunes.setHours(0, 0, 0, 0);
  lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
  return lunes;
}

// ¿Viene de un manhwa? (la obra original es un manga coreano)
function basadoEnManhwa(media) {
  return media.relations.edges.some((e) =>
    (e.relationType === 'SOURCE' || e.relationType === 'ADAPTATION') &&
    e.node.type === 'MANGA' && e.node.countryOfOrigin === 'KR');
}

export class CalendarioModel {
  constructor() {
    this.emisiones = [];
    this.pais = 'todos';
  }

  // Descarga todas las emisiones de lunes a domingo
  async cargar() {
    const desde = Math.floor(inicioSemana() / 1000);
    const hasta = desde + 7 * 24 * 3600;
    const lista = [];
    // shortcut: máximo 10 páginas (500 emisiones), de sobra para una semana normal
    for (let pagina = 1; pagina <= 10; pagina++) {
      const data = await consultar(QUERY_EMISIONES, { pagina, desde: desde - 1, hasta });
      lista.push(...data.Page.airingSchedules);
      if (!data.Page.pageInfo.hasNextPage) break;
    }

    this.emisiones = lista
      .filter((e) => e.media && !e.media.isAdult)
      .map((e) => {
        const fecha = new Date(e.airingAt * 1000);
        return {
          id: e.media.id,
          titulo: e.media.title.english || e.media.title.romaji,
          portada: e.media.coverImage.large,
          enlace: e.media.siteUrl,
          episodio: e.episode,
          dia: (fecha.getDay() + 6) % 7, // 0 = lunes
          hora: fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          emitido: fecha < Date.now(),
          estreno: e.episode === 1,
          pais: e.media.countryOfOrigin,
          etiquetaPais: ETIQUETA_PAIS[e.media.countryOfOrigin] || '',
          manhwa: basadoEnManhwa(e.media)
        };
      });
  }

  cambiarPais(pais) {
    this.pais = pais;
  }

  // Emisiones agrupadas por día, con el filtro de país aplicado
  porDias() {
    const dias = DIAS.map(() => []);
    for (const e of this.emisiones) {
      if (this.pais === 'todos' || e.pais === this.pais) dias[e.dia].push(e);
    }
    return dias;
  }

  // Índice del día de hoy (0 = lunes)
  hoy() {
    return (new Date().getDay() + 6) % 7;
  }
}
