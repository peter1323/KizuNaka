// Conecta el modelo del juego con su vista
import { JuegoModel, MAX_INTENTOS } from '../models/juegoModel.js';
import { JuegoView } from '../views/juegoView.js';

export class JuegoController {
  constructor(raiz) {
    this.modelo = new JuegoModel();
    this.vista = new JuegoView(raiz);
    this.cargar();
  }

  async cargar() {
    this.vista.mostrarCargando();
    try {
      await this.modelo.cargar();
    } catch (error) {
      this.vista.mostrarError(error.message, () => this.cargar());
      return;
    }
    this.vista.mostrarJuego(
      (texto) => this.vista.pintarSugerencias(this.modelo.buscar(texto)),
      (id) => this.adivinar(id)
    );
    this.actualizar();
  }

  adivinar(id) {
    this.modelo.adivinar(id);
    this.actualizar();
  }

  actualizar() {
    this.vista.pintarIntentos(this.modelo.comparaciones(), MAX_INTENTOS);
    const estado = this.modelo.estado();
    if (estado !== 'jugando') this.vista.pintarFinal(estado, this.modelo.secreto);
  }
}
