// Conecta el recomendador con su vista
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
      () => { this.modelo.siguiente(); this.mostrarRecomendacion(); },
      () => this.empezar()
    );
  }
}
