// Vista del calendario semanal: filtro por país y un desplegable por día
import { esc, htmlCargando, htmlError } from './html.js';
import { DIAS, PAISES } from '../models/calendario.js';

export class CalendarioView {
  constructor(raiz) {
    this.raiz = raiz;
  }

  // Estructura fija: título, filtro y zona de días
  mostrar(alFiltrar, alReintentar) {
    this.raiz.innerHTML = `
      <h2 class="titulo-seccion">Calendario</h2>
      <p class="subtitulo">Lo que se emite esta semana, con la hora de tu zona horaria.</p>
      <div class="modos filtro-pais">
        ${PAISES.map((p, i) => `<button class="modo ${i === 0 ? 'activo' : ''}" data-pais="${p.valor}">${p.texto}</button>`).join('')}
      </div>
      <div class="dias"></div>`;

    this.dias = this.raiz.querySelector('.dias');

    this.raiz.querySelector('.filtro-pais').addEventListener('click', (e) => {
      const boton = e.target.closest('[data-pais]');
      if (!boton) return;
      this.raiz.querySelectorAll('[data-pais]').forEach((b) => b.classList.toggle('activo', b === boton));
      alFiltrar(boton.dataset.pais);
    });
    this.dias.addEventListener('click', (e) => {
      if (e.target.closest('[data-accion="reintentar"]')) alReintentar();
    });
  }

  mostrarCargando() {
    this.dias.innerHTML = htmlCargando('Cargando el calendario…');
  }

  mostrarError(mensaje) {
    this.dias.innerHTML = htmlError(mensaje, 'Reintentar');
  }

  // Pinta los 7 días; abre hoy la primera vez y luego respeta lo que abra el usuario
  pintarDias(dias, hoy) {
    const abiertos = [...this.dias.querySelectorAll('details')].map((d) => d.open);
    this.dias.innerHTML = dias.map((lista, i) => {
      const abierto = abiertos.length ? abiertos[i] : i === hoy;
      return `<details class="dia ${i === hoy ? 'hoy' : ''}" ${abierto ? 'open' : ''}>
        <summary>${DIAS[i]}${i === hoy ? ' · hoy' : ''} <span class="dia-cuenta">${lista.length}</span></summary>
        <div class="emisiones">
          ${lista.length ? lista.map(htmlEmision).join('') : '<p class="pequeno">No hay emisiones este día.</p>'}
        </div>
      </details>`;
    }).join('');
  }
}

// Tarjeta de un episodio
function htmlEmision(e) {
  return `<a class="tarjeta emision ${e.emitido ? 'emitido' : ''}" href="${esc(e.enlace)}" target="_blank" rel="noopener">
    <img src="${esc(e.portada)}" alt="" loading="lazy">
    <div>
      <h3>${esc(e.titulo)}</h3>
      <p class="datos">Ep. ${esc(e.episodio)} · ${esc(e.hora)}</p>
      <div>
        ${e.estreno ? '<span class="chip chip-estreno">🆕 Estreno</span>' : ''}
        ${e.etiquetaPais ? `<span class="chip">${esc(e.etiquetaPais)}</span>` : ''}
        ${e.manhwa ? '<span class="chip">📖 Basado en manhwa</span>' : ''}
      </div>
    </div>
  </a>`;
}
