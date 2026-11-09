// Escapa texto para meterlo en HTML sin riesgos
export function esc(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Pantalla de carga y de error, comunes a todas las vistas
export function htmlCargando(mensaje) {
  return `<div class="cargando"><div class="spinner"></div><p>${esc(mensaje)}</p></div>`;
}

export function htmlError(mensaje, textoBoton) {
  return `<div class="tarjeta aviso-error">
    <p class="aviso-emoji">😵</p>
    <p>${esc(mensaje)}</p>
    ${textoBoton ? `<button class="boton" data-accion="reintentar">${esc(textoBoton)}</button>` : ''}
  </div>`;
}
