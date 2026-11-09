// Búsqueda de anime por imagen con trace.moe
const URL_API = 'https://api.trace.moe/search?anilistInfo&cutBorders';
const UMBRAL_FIABLE = 87;

// Pasa segundos a "mm:ss"
export function formatoMinuto(segundos) {
  const total = Math.floor(segundos || 0);
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

// Envía la imagen (archivo o dirección web) y devuelve los 3 mejores resultados ya preparados
export async function buscarPorImagen(imagen) {
  let respuesta;
  try {
    respuesta = typeof imagen === 'string'
      // Con una URL, trace.moe descarga la imagen por su cuenta
      ? await fetch(`${URL_API}&url=${encodeURIComponent(imagen)}`)
      : await fetch(URL_API, {
        method: 'POST',
        headers: { 'Content-Type': imagen.type || 'image/jpeg' },
        body: imagen
      });
  } catch {
    throw new Error('No hay conexión con trace.moe.');
  }
  const json = await respuesta.json().catch(() => null);
  if (!respuesta.ok || !json || json.error) {
    if (respuesta.status === 402 || respuesta.status === 429) {
      throw new Error('Se ha alcanzado el límite de búsquedas. Prueba más tarde.');
    }
    if (respuesta.status === 413) throw new Error('La imagen es demasiado grande.');
    throw new Error(json?.error || `trace.moe respondió con error ${respuesta.status}.`);
  }

  return json.result.slice(0, 3).map((r) => {
    const similitud = Math.round(r.similarity * 1000) / 10;
    const titulos = r.anilist?.title || {};
    return {
      titulo: titulos.english || titulos.romaji || r.filename || 'Desconocido',
      romaji: titulos.romaji || '',
      episodio: Array.isArray(r.episode) ? r.episode.join('-') : r.episode ?? '?',
      minuto: formatoMinuto(r.from),
      similitud,
      fiable: similitud >= UMBRAL_FIABLE,
      imagen: r.image
    };
  });
}
