// Conecta el calendario semanal con su vista
import { CalendarioModel } from '../models/calendario.js';
import { CalendarioView } from '../views/calendarioView.js';

export class CalendarioController {
  constructor(raiz) {
    this.modelo = new CalendarioModel();
    this.vista = new CalendarioView(raiz);
    this.vista.mostrar((pais) => this.filtrar(pais), () => this.cargar());
    this.cargar();
  }

  async cargar() {
    this.vista.mostrarCargando();
    try {
      await this.modelo.cargar();
      this.pintar();
    } catch (error) {
      this.vista.mostrarError(error.message);
    }
  }

  filtrar(pais) {
    this.modelo.cambiarPais(pais);
    if (this.modelo.emisiones.length) this.pintar();
  }

  pintar() {
    this.vista.pintarDias(this.modelo.porDias(), this.modelo.hoy());
  }
}
