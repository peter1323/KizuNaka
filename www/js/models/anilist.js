// Consultas GraphQL a la API de AniList
const URL_API = 'https://graphql.anilist.co';

// Envía una consulta y devuelve "data" (o lanza un error)
async function consultar(query, variables = {}) {
  let respuesta;
  try {
    respuesta = await fetch(URL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables })
    });
  } catch {
    throw new Error('No hay conexión con AniList.');
  }
  const json = await respuesta.json().catch(() => null);
  if (!respuesta.ok || !json || json.errors) {
    if (respuesta.status === 429) throw new Error('Demasiadas peticiones a AniList. Espera un minuto.');
    throw new Error(json?.errors?.[0]?.message || `AniList respondió con error ${respuesta.status}.`);
  }
  return json.data;
}

// Una página (50) de los animes más populares
const QUERY_POPULARES = `
query ($pagina: Int) {
  Page(page: $pagina, perPage: 50) {
    media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
      id
      title { romaji english }
      seasonYear
      startDate { year }
      episodes
      format
      genres
      studios(isMain: true) { nodes { name } }
      coverImage { large }
    }
  }
}`;

export async function obtenerAnimesPopulares(pagina) {
  const data = await consultar(QUERY_POPULARES, { pagina });
  return data.Page.media;
}

// Búsqueda de mangas con filtros (las variables a null se ignoran)
const QUERY_MANGAS = `
query ($pais: CountryCode, $genero: String, $generosFuera: [String], $estado: MediaStatus,
       $capMas: Int, $capMenos: Int, $orden: [MediaSort], $popMenos: Int) {
  Page(page: 1, perPage: 30) {
    media(type: MANGA, isAdult: false, countryOfOrigin: $pais, genre: $genero,
          genre_not_in: $generosFuera, status: $estado, chapters_greater: $capMas,
          chapters_lesser: $capMenos, sort: $orden, popularity_lesser: $popMenos) {
      id
      title { romaji english }
      coverImage { large }
      averageScore
      chapters
      genres
      description
      siteUrl
    }
  }
}`;

export async function buscarMangas(filtros) {
  const data = await consultar(QUERY_MANGAS, filtros);
  return data.Page.media;
}
