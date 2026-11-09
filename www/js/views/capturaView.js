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
    // Si ninguno es fiable, explica las causas más probables
    const aviso = lista.some((r) => r.fiable) ? '' : `
      <div class="tarjeta aviso-dudoso">
        <p><b>⚠️ No lo he encontrado con seguridad.</b> Puede ser porque:</p>
        <ul>
          <li>Es de un episodio o especial muy reciente que trace.moe aún no ha añadido.</li>
          <li>Es una portada, fan art o imagen promocional, no una escena de un episodio.</li>
          <li>La imagen está recortada, editada o muy comprimida.</li>
        </ul>
        <p class="pequeno">Compara la vista previa con tu imagen: a veces el primer resultado acierta igualmente.</p>
        <a class="boton boton-lens" href="https://lens.google.com/" target="_blank" rel="noopener">🔍 Probar en Google Lens</a>
        <p class="pequeno">Se abre en otra pestaña: sube allí la misma imagen. Va mejor con recortes, manga y fan art.</p>
      </div>`;
    this.resultados.innerHTML = aviso + lista
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
