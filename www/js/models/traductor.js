// Traduce texto al español con el traductor de Google (sin clave)
// shortcut: endpoint no oficial, puede dejar de funcionar; si pasa, cambiar a una API con clave detrás de un servidor
const URL_API = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=es&dt=t';

export async function traducir(texto) {
  let respuesta;
  try {
    // POST para que quepan las sinopsis largas
    respuesta = await fetch(URL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams({ q: texto })
    });
  } catch {
    throw new Error('No hay conexión con el traductor.');
  }
  const json = await respuesta.json().catch(() => null);
  if (!respuesta.ok || !Array.isArray(json?.[0])) throw new Error('El traductor no está disponible ahora.');
  // La respuesta viene en trozos: [[traducido, original, ...], ...]
  return json[0].map((trozo) => trozo[0]).join('');
}
