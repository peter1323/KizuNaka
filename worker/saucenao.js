// Cloudflare Worker: intermediario entre KizuNaka y SauceNAO.
// - Guarda la clave de SauceNAO en secreto (variable de entorno SAUCENAO_KEY).
// - Añade las cabeceras CORS para que la app pueda llamarlo desde el navegador.
// Uso desde la app: POST con la imagen como cuerpo y su tipo MIME en Content-Type.

// Webs que pueden usar el Worker (GitHub Pages, pruebas en local, Capacitor y Tauri)
// shortcut: CORS solo frena a los navegadores; alguien con curl podría gastar tu cuota diaria.
// Si pasa, añadir un límite por IP con Cloudflare (Rate Limiting) o una clave propia de la app.
const ORIGENES = [
  'https://peter1323.github.io',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://localhost',
  'tauri://localhost',
  'http://tauri.localhost'
];

const TAMANO_MAXIMO = 15 * 1024 * 1024; // 15 MB, el límite de SauceNAO

export default {
  async fetch(request, env) {
    const origen = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ORIGENES.includes(origen) ? origen : ORIGENES[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin'
    };
    const responder = (cuerpo, estado) =>
      new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...cors, 'Content-Type': 'application/json' } });

    // El navegador pregunta primero si puede llamar (preflight)
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return responder({ error: 'Usa POST con una imagen.' }, 405);

    // Comprueba que llega una imagen de tamaño razonable
    const tipo = request.headers.get('Content-Type') || '';
    if (!tipo.startsWith('image/')) return responder({ error: 'El cuerpo debe ser una imagen.' }, 400);
    const imagen = await request.arrayBuffer();
    if (imagen.byteLength === 0) return responder({ error: 'La imagen está vacía.' }, 400);
    if (imagen.byteLength > TAMANO_MAXIMO) return responder({ error: 'La imagen es demasiado grande.' }, 413);

    // Reenvía la imagen a SauceNAO con la clave secreta
    const formulario = new FormData();
    formulario.append('file', new Blob([imagen], { type: tipo }), 'imagen');
    const url = `https://saucenao.com/search.php?output_type=2&numres=5&api_key=${env.SAUCENAO_KEY}`;

    let respuesta;
    try {
      respuesta = await fetch(url, { method: 'POST', body: formulario });
    } catch {
      return responder({ error: 'No hay conexión con SauceNAO.' }, 502);
    }
    if (respuesta.status === 429) return responder({ error: 'Se ha alcanzado el límite de búsquedas de hoy.' }, 429);

    // Devuelve la respuesta de SauceNAO tal cual (JSON)
    return new Response(await respuesta.text(), {
      status: respuesta.status,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
};
