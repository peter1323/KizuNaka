// Vista del recomendador: preguntas, recomendaciones y avisos
import { esc, htmlCargando, htmlError } from './html.js';

export class RecomendadorView {
  constructor(raiz) {
    this.raiz = raiz;
  }

  // Una pregunta con sus botones
  mostrarPregunta(pregunta, numero, total, alResponder) {
    this.raiz.innerHTML = `
      <h2 class="titulo-seccion">¿Qué leo o veo?</h2>
      <div class="progreso"><div style="width:${((numero - 1) / total) * 100}%"></div></div>
      <p class="subtitulo">Pregunta ${numero} de ${total}</p>
      <div class="tarjeta pregunta">
        <h3>${esc(pregunta.titulo)}</h3>
        <div class="opciones">
          ${pregunta.opciones.map((o, i) => `<button class="boton opcion" data-i="${i}">${esc(o.texto)}</button>`).join('')}
        </div>
      </div>`;
    this.raiz.querySelectorAll('[data-i]').forEach((boton) => {
      boton.onclick = () => alResponder(pregunta.opciones[boton.dataset.i].valor);
    });
  }

  mostrarCargando() {
    this.raiz.innerHTML = htmlCargando('Buscando algo que te guste…');
  }

  mostrarError(mensaje, alReintentar) {
    this.raiz.innerHTML = htmlError(mensaje, 'Empezar de nuevo');
    this.raiz.querySelector('[data-accion="reintentar"]').onclick = alReintentar;
  }

  mostrarSinResultados(alReiniciar) {
    this.raiz.innerHTML = htmlError('No he encontrado nada con esas respuestas. Prueba otra combinación.', 'Empezar de nuevo');
    this.raiz.querySelector('[data-accion="reintentar"]').onclick = alReiniciar;
  }

  // Una recomendación con sus botones.
  // acciones: { anterior, otra, reiniciar, traducir }
  mostrarRecomendacion(manga, posicion, total, acciones) {
    this.raiz.innerHTML = `
      <h2 class="titulo-seccion">Te recomiendo…</h2>
      <p class="subtitulo">${posicion} de ${total}</p>
      <article class="tarjeta recomendacion">
        <img class="recomendacion-portada" src="${esc(manga.portada)}" alt="Portada de ${esc(manga.titulo)}">
        <div class="recomendacion-info">
          <h3><a href="${esc(manga.enlace)}" target="_blank" rel="noopener">${esc(manga.titulo)}</a></h3>
          ${manga.romaji !== manga.titulo ? `<p class="pequeno">${esc(manga.romaji)}</p>` : ''}
          <p class="datos">⭐ ${esc(manga.nota)} · ${manga.unidad === 'episodios' ? '📺' : '📖'} ${esc(manga.cantidad)} ${manga.unidad}</p>
          <div class="chips">${manga.generos.map((g) => `<span class="chip">${esc(g)}</span>`).join('')}</div>
          <p class="descripcion">${esc(manga.verTraduccion ? manga.traduccion : manga.descripcion)}</p>
          <button class="enlace" data-accion="traducir">${manga.verTraduccion ? '🌐 Ver original' : '🌐 Traducir'}</button>
          <span class="pequeno error-traduccion"></span>
        </div>
      </article>
      <div class="botones">
        <button class="boton secundario" data-accion="anterior" ${posicion === 1 ? 'disabled' : ''}>← Anterior</button>
        <button class="boton" data-accion="otra">🔀 Otra recomendación</button>
        <button class="boton secundario" data-accion="reiniciar">↺ Empezar de nuevo</button>
      </div>`;
    for (const accion of ['anterior', 'otra', 'reiniciar', 'traducir']) {
      this.raiz.querySelector(`[data-accion="${accion}"]`).onclick = acciones[accion];
    }
  }

  mostrarTraduciendo() {
    const boton = this.raiz.querySelector('[data-accion="traducir"]');
    boton.disabled = true;
    boton.textContent = '🌐 Traduciendo…';
  }

  mostrarErrorTraduccion(mensaje) {
    const boton = this.raiz.querySelector('[data-accion="traducir"]');
    boton.disabled = false;
    boton.textContent = '🌐 Traducir';
    this.raiz.querySelector('.error-traduccion').textContent = mensaje;
  }
}
