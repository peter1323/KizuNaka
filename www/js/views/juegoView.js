// Vista del juego: pinta el buscador, los intentos y el final
import { esc, htmlCargando, htmlError } from './html.js';

// Una pista de color (Año, Episodios, Formato, Estudio)
function pista(etiqueta, p) {
  return `<div class="pista ${p.estado}">
    <span class="pista-etiqueta">${etiqueta}</span>
    <span class="pista-valor">${esc(p.valor)} ${p.flecha || ''}</span>
  </div>`;
}

function tarjetaIntento(c) {
  const generos = c.generos.comunes.length
    ? c.generos.comunes.map((g) => `<span class="chip">${esc(g)}</span>`).join('')
    : 'Ninguno en común';
  return `<article class="intento ${c.acierto ? 'acertado' : ''}">
    <header class="intento-cabecera">
      <img src="${esc(c.anime.portada)}" alt="" loading="lazy">
      <h3>${esc(c.anime.titulo)}</h3>
    </header>
    <div class="pistas">
      ${pista('Año', c.anio)}
      ${pista('Episodios', c.episodios)}
      ${pista('Formato', c.formato)}
      ${pista('Estudio', c.estudio)}
      <div class="pista generos ${c.generos.estado}">
        <span class="pista-etiqueta">Géneros</span>
        <span class="pista-valor">${generos}</span>
      </div>
    </div>
  </article>`;
}

export class JuegoView {
  constructor(raiz) {
    this.raiz = raiz;
  }

  mostrarCargando() {
    this.raiz.innerHTML = htmlCargando('Cargando el anime de hoy…');
  }

  mostrarError(mensaje, alReintentar) {
    this.raiz.innerHTML = htmlError(`No se pudo cargar el juego. ${mensaje}`, 'Reintentar');
    this.raiz.querySelector('[data-accion="reintentar"]').onclick = alReintentar;
  }

  // Estructura del juego y eventos del buscador
  mostrarJuego(alEscribir, alElegir) {
    this.raiz.innerHTML = `
      <h2 class="titulo-seccion">Adivina el anime</h2>
      <p class="subtitulo">Un anime nuevo cada día entre los 200 más populares.</p>
      <div class="final"></div>
      <div class="buscador">
        <input type="search" placeholder="Escribe un anime…" autocomplete="off" aria-label="Buscar anime">
        <ul class="sugerencias" role="listbox"></ul>
      </div>
      <p class="contador"></p>
      <div class="leyenda">
        <span class="pista ok">Igual</span>
        <span class="pista parcial">Parecido</span>
        <span class="pista mal">Distinto</span>
        <span class="leyenda-texto">↑ el secreto es mayor · ↓ es menor</span>
      </div>
      <div class="intentos"></div>`;

    this.buscador = this.raiz.querySelector('.buscador');
    this.input = this.raiz.querySelector('input');
    this.sugerencias = this.raiz.querySelector('.sugerencias');

    this.input.addEventListener('input', () => alEscribir(this.input.value));
    this.sugerencias.addEventListener('click', (e) => {
      const opcion = e.target.closest('[data-id]');
      if (!opcion) return;
      this.input.value = '';
      this.pintarSugerencias([]);
      alElegir(Number(opcion.dataset.id));
    });
    // Con Enter se elige la primera sugerencia
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.sugerencias.querySelector('[data-id]')?.click();
    });
  }

  pintarSugerencias(animes) {
    this.sugerencias.innerHTML = animes
      .map((a) => `<li data-id="${a.id}" role="option">
        <img src="${esc(a.portada)}" alt="" loading="lazy">
        <span>${esc(a.titulo)}${a.romaji !== a.titulo ? `<small>${esc(a.romaji)}</small>` : ''}</span>
      </li>`)
      .join('');
  }

  // Intentos, del más nuevo al más antiguo
  pintarIntentos(comparaciones, maxIntentos) {
    this.raiz.querySelector('.contador').textContent =
      `Intentos: ${comparaciones.length} / ${maxIntentos}`;
    this.raiz.querySelector('.intentos').innerHTML =
      comparaciones.slice().reverse().map(tarjetaIntento).join('');
  }

  // Pantalla final: portada y título del secreto
  pintarFinal(estado, secreto) {
    this.buscador.hidden = true;
    const mensaje = estado === 'ganado' ? '🎉 ¡Lo has adivinado!' : '😢 Se acabaron los intentos';
    this.raiz.querySelector('.final').innerHTML = `
      <div class="tarjeta final-tarjeta ${estado}">
        <p class="final-mensaje">${mensaje}</p>
        <img class="final-portada" src="${esc(secreto.portada)}" alt="Portada de ${esc(secreto.titulo)}">
        <h3>${esc(secreto.titulo)}</h3>
        ${secreto.romaji !== secreto.titulo ? `<p class="pequeno">${esc(secreto.romaji)}</p>` : ''}
        <p class="final-vuelve">Vuelve mañana 🌙</p>
      </div>`;
  }
}
