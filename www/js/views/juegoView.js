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

  // Estructura del juego y sus eventos.
  // acciones: { escribir, elegir, cambiarModo, jugarNivel, verNiveles, siguiente }
  mostrarJuego(acciones) {
    this.acciones = acciones;
    this.raiz.innerHTML = `
      <h2 class="titulo-seccion">Adivina el anime</h2>
      <div class="modos">
        <button class="modo" data-modo="diario">📅 Diario</button>
        <button class="modo" data-modo="practica">🎯 Práctica</button>
      </div>
      <p class="subtitulo"></p>
      <div class="niveles"></div>
      <div class="partida">
      <button class="enlace volver" data-accion="niveles">← Ver niveles</button>
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
      <div class="intentos"></div>
      </div>`;

    this.niveles = this.raiz.querySelector('.niveles');
    this.partida = this.raiz.querySelector('.partida');
    this.buscador = this.raiz.querySelector('.buscador');
    this.input = this.raiz.querySelector('input');
    this.sugerencias = this.raiz.querySelector('.sugerencias');

    this.raiz.querySelectorAll('[data-modo]').forEach((boton) => {
      boton.onclick = () => acciones.cambiarModo(boton.dataset.modo);
    });
    this.raiz.querySelector('[data-accion="niveles"]').onclick = acciones.verNiveles;
    // Elegir nivel o partida aleatoria en la lista
    this.niveles.addEventListener('click', (e) => {
      const boton = e.target.closest('[data-nivel]');
      if (!boton) return;
      const nivel = boton.dataset.nivel;
      acciones.jugarNivel(nivel === 'aleatorio' ? nivel : Number(nivel));
    });
    this.input.addEventListener('input', () => acciones.escribir(this.input.value));
    this.sugerencias.addEventListener('click', (e) => {
      const opcion = e.target.closest('[data-id]');
      if (!opcion) return;
      this.input.value = '';
      this.pintarSugerencias([]);
      acciones.elegir(Number(opcion.dataset.id));
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

  marcarModo(modo, subtitulo) {
    this.raiz.querySelectorAll('[data-modo]').forEach((boton) => {
      boton.classList.toggle('activo', boton.dataset.modo === modo);
    });
    this.raiz.querySelector('.subtitulo').textContent = subtitulo;
  }

  // Lista de niveles de práctica, coloreados según el resultado
  pintarNiveles(resultados, total) {
    const ganados = Object.values(resultados).filter((r) => r === 'ganado').length;
    this.marcarModo('practica', `Elige un nivel. Has acertado ${ganados} de ${total}.`);
    this.partida.hidden = true;
    this.niveles.hidden = false;
    let botones = '';
    for (let n = 1; n <= total; n++) {
      const r = resultados[n];
      const titulo = r === 'ganado' ? 'acertado' : r === 'perdido' ? 'fallado' : 'sin jugar';
      botones += `<button class="nivel ${r || ''}" data-nivel="${n}" aria-label="Nivel ${n}, ${titulo}">${n}</button>`;
    }
    this.niveles.innerHTML = `
      <button class="boton aleatorio" data-nivel="aleatorio">🎲 Partida aleatoria</button>
      <div class="rejilla-niveles">${botones}</div>`;
  }

  // Prepara la partida: subtítulo, buscador vacío y sin pantalla final
  pintarPartida(modo, nivel, totalNiveles) {
    let subtitulo = 'Un anime nuevo cada día entre los 200 más populares.';
    if (nivel === 'aleatorio') subtitulo = 'Partida aleatoria entre los 200 más populares.';
    else if (modo === 'practica') subtitulo = `Nivel ${nivel} de ${totalNiveles}.`;
    this.marcarModo(modo, subtitulo);
    this.niveles.hidden = true;
    this.partida.hidden = false;
    this.raiz.querySelector('.volver').hidden = modo === 'diario';
    this.raiz.querySelector('.final').innerHTML = '';
    this.buscador.hidden = false;
    this.input.value = '';
    this.pintarSugerencias([]);
  }

  // Intentos, del más nuevo al más antiguo
  pintarIntentos(comparaciones, maxIntentos) {
    this.raiz.querySelector('.contador').textContent =
      `Intentos: ${comparaciones.length} / ${maxIntentos}`;
    this.raiz.querySelector('.intentos').innerHTML =
      comparaciones.slice().reverse().map(tarjetaIntento).join('');
  }

  // Pantalla final: portada y título del secreto
  // (en práctica, con botón de siguiente nivel en vez de "Vuelve mañana")
  pintarFinal(estado, secreto, enPractica) {
    this.buscador.hidden = true;
    const mensaje = estado === 'ganado' ? '🎉 ¡Lo has adivinado!' : '😢 Se acabaron los intentos';
    this.raiz.querySelector('.final').innerHTML = `
      <div class="tarjeta final-tarjeta ${estado}">
        <p class="final-mensaje">${mensaje}</p>
        <img class="final-portada" src="${esc(secreto.portada)}" alt="Portada de ${esc(secreto.titulo)}">
        <h3>${esc(secreto.titulo)}</h3>
        ${secreto.romaji !== secreto.titulo ? `<p class="pequeno">${esc(secreto.romaji)}</p>` : ''}
        ${enPractica
          ? '<button class="boton" data-accion="siguiente">Siguiente →</button>'
          : '<p class="final-vuelve">Vuelve mañana 🌙</p>'}
      </div>`;
    if (enPractica) this.raiz.querySelector('[data-accion="siguiente"]').onclick = this.acciones.siguiente;
  }
}
