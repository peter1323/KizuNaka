// Vista de "Buscar por captura"
import { esc, htmlCargando, htmlError } from './html.js';

export class CapturaView {
  constructor(raiz) {
    this.raiz = raiz;
  }

  // Estructura de la sección y evento al elegir imagen
  mostrar(alElegirImagen) {
    this.raiz.innerHTML = `
      <h2 class="titulo-seccion">Buscar por captura</h2>
      <p class="subtitulo">Sube una captura de un anime y te digo cuál es, el episodio y el minuto.</p>
      <label class="zona-imagen">
        <input type="file" accept="image/*" hidden>
        <img class="vista-previa" alt="" hidden>
        <span class="zona-texto">📷 Toca para elegir una imagen</span>
      </label>
      <div class="resultados"></div>`;

    this.input = this.raiz.querySelector('input');
    this.previa = this.raiz.querySelector('.vista-previa');
    this.resultados = this.raiz.querySelector('.resultados');

    this.input.addEventListener('change', () => {
      const archivo = this.input.files[0];
      if (!archivo) return;
      // Muestra la imagen elegida
      if (this.previa.src) URL.revokeObjectURL(this.previa.src);
      this.previa.src = URL.createObjectURL(archivo);
      this.previa.hidden = false;
      this.raiz.querySelector('.zona-texto').textContent = 'Toca para elegir otra imagen';
      alElegirImagen(archivo);
      this.input.value = '';
    });
  }

  mostrarCargando() {
    this.resultados.innerHTML = htmlCargando('Buscando el anime…');
  }

  mostrarError(mensaje) {
    this.resultados.innerHTML = htmlError(mensaje);
  }

  mostrarResultados(lista) {
    if (!lista.length) {
      this.resultados.innerHTML = htmlError('No se ha encontrado ningún anime.');
      return;
    }
    this.resultados.innerHTML = lista
      .map((r) => `<article class="tarjeta resultado">
        <img src="${esc(r.imagen)}" alt="Escena de ${esc(r.titulo)}" loading="lazy">
        <div class="resultado-info">
          <h3>${esc(r.titulo)}</h3>
          ${r.romaji && r.romaji !== r.titulo ? `<p class="pequeno">${esc(r.romaji)}</p>` : ''}
          <p>📺 Episodio ${esc(r.episodio)} · ⏱️ ${esc(r.minuto)}</p>
          <p class="similitud ${r.fiable ? 'fiable' : 'dudosa'}">
            ${r.similitud}% de coincidencia
            ${r.fiable ? '' : '<span class="etiqueta-dudosa">poco fiable</span>'}
          </p>
        </div>
      </article>`)
      .join('');
  }
}
