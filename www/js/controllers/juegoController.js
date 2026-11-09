// Conecta el modelo del juego con su vista
import { JuegoModel, MAX_INTENTOS, NIVELES_PRACTICA } from '../models/juegoModel.js';
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
    const m = this.modelo;
    // Cada acción cambia el modelo y vuelve a pintar
    const yActualizar = (fn) => (...args) => { fn(...args); this.actualizar(); };
    this.vista.mostrarJuego({
      escribir: (texto) => this.vista.pintarSugerencias(m.buscar(texto)),
      elegir: yActualizar((id) => m.adivinar(id)),
      cambiarModo: yActualizar((modo) => m.cambiarModo(modo)),
      jugarNivel: yActualizar((nivel) => m.jugarNivel(nivel)),
      verNiveles: yActualizar(() => m.verNiveles()),
      siguiente: yActualizar(() => m.siguienteNivel())
    });
    this.actualizar();
  }

  actualizar() {
    const m = this.modelo;
    if (m.modo === 'practica' && m.nivel === null) {
      this.vista.pintarNiveles(m.resultados, NIVELES_PRACTICA);
      return;
    }
    this.vista.pintarPartida(m.modo, m.nivel, NIVELES_PRACTICA);
    this.vista.pintarIntentos(m.comparaciones(), MAX_INTENTOS);
    const estado = m.estado();
    if (estado !== 'jugando') this.vista.pintarFinal(estado, m.secreto, m.modo === 'practica');
  }
}
