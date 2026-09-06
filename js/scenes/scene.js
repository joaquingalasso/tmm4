"use strict";
/* ============================================================
 * scene.js — clase base de toda escena del sistema
 *
 * Contrato común: ciclo (enter/exit/update/draw) + el vocabulario
 * de gestos, que para los nueve signos es SÓLO dos:
 *   onTap        — pulsar: opera el signo
 *   onHoldStart / onHoldMove / onHoldEnd — mantener: anima y
 *                  resalta la cualidad que el signo describe
 * onSwipe existe únicamente para que una escena pueda resolver
 * ella misma un movimiento de navegación (el cero mueve su foco).
 * ============================================================ */

class Scene {
  constructor(app, id) {
    this.app = app;
    this.id = id;
    this.enterAt = 0;
    this.holding = false;
    this.holdK = 0;       // 0..1 suavizado: cuánto se está manteniendo
  }

  get W() { return width; }
  get H() { return height; }
  get CX() { return width / 2; }
  get CY() { return height / 2; }
  get U() { return unit(); }

  enter() { this.enterAt = millis(); this.holding = false; this.holdK = 0; }
  exit() {}

  /** Segundos desde que la escena entró. */
  t() { return (millis() - this.enterAt) / 1000; }

  /** Clave de animación de entrada, 0..1 easing suave. */
  enterK(dur = 1, delay = 0) {
    return Ease.outCubic(clamp01((this.t() - delay) / dur));
  }

  /** Las subclases llaman a esto desde su update para tener holdK. */
  updateHold(dt, speed = 3.2) {
    const target = this.holding ? 1 : 0;
    this.holdK += (target - this.holdK) * Math.min(1, dt * speed);
  }

  update(dt) {}
  draw() {}

  /* gestos — las escenas sobreescriben lo que usan */
  onDown(x, y) {}
  onTap(x, y) {}
  onHoldStart(x, y) { this.holding = true; }
  onHoldMove(x, y) {}
  onHoldEnd(durS) { this.holding = false; }
  /** Devolver true consume el movimiento (lo resuelve la escena). */
  onSwipe(dir, vel) { return false; }
}
