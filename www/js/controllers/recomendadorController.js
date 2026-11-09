// Conecta el recomendador (manga o anime) con su vista
import { RecomendadorModel, PREGUNTAS } from '../models/recomendadorModel.js';
import { RecomendadorView } from '../views/recomendadorView.js';

export class RecomendadorController {
  constructor(raiz) {
    this.modelo = new RecomendadorModel();
    this.vista = new RecomendadorView(raiz);
    this.empezar();
  }

  empezar() {
    this.modelo.reiniciar();
    this.mostrarPregunta();
  }

  mostrarPregunta() {
    this.vista.mostrarPregunta(
      this.modelo.preguntaActual(),
      this.modelo.paso + 1,
      PREGUNTAS.length,
      (valor) => this.responder(valor)
    );
  }

  responder(valor) {
    const terminado = this.modelo.responder(valor);
    if (terminado) this.buscar();
    else this.mostrarPregunta();
  }

  async buscar() {
    this.vista.mostrarCargando();
    try {
      await this.modelo.buscar();
    } catch (error) {
      this.vista.mostrarError(error.message, () => this.empezar());
      return;
    }
    if (this.modelo.resultados.length === 0) this.vista.mostrarSinResultados(() => this.empezar());
    else this.mostrarRecomendacion();
  }

  mostrarRecomendacion() {
    this.vista.mostrarRecomendacion(
      this.modelo.actual(),
      this.modelo.indice + 1,
      this.modelo.resultados.length,
      {
        anterior: () => { this.modelo.anterior(); this.mostrarRecomendacion(); },
        otra: () => { this.modelo.siguiente(); this.mostrarRecomendacion(); },
        reiniciar: () => this.empezar(),
        traducir: () => this.traducir()
      }
    );
  }

  async traducir() {
    const indice = this.modelo.indice;
    this.vista.mostrarTraduciendo();
    try {
      await this.modelo.alternarTraduccion();
    } catch (error) {
      this.vista.mostrarErrorTraduccion(error.message);
      return;
    }
    // Solo repinta si el usuario sigue en la misma recomendación
    if (this.modelo.indice === indice) this.mostrarRecomendacion();
  }
}
