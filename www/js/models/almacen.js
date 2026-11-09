// Leer y guardar datos en localStorage (en formato JSON)

export function leer(clave, porDefecto = null) {
  try {
    const valor = localStorage.getItem(clave);
    return valor === null ? porDefecto : JSON.parse(valor);
  } catch {
    return porDefecto;
  }
}

export function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Si el almacenamiento está lleno o bloqueado, no pasa nada
  }
}
