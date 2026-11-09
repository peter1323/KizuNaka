// Conecta la búsqueda por imagen con su vista
import { buscarPorImagen } from '../models/tracemoe.js';
import { CapturaView } from '../views/capturaView.js';

export class CapturaController {
  constructor(raiz) {
    this.vista = new CapturaView(raiz);
    this.vista.mostrar((archivo) => this.buscar(archivo));
  }

  async buscar(archivo) {
    this.vista.mostrarCargando();
    try {
      const resultados = await buscarPorImagen(archivo);
      this.vista.mostrarResultados(resultados);
    } catch (error) {
      this.vista.mostrarError(error.message);
    }
  }
}
