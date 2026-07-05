"use strict";
/* ============================================================
 * scene.js — clase base de toda escena del sistema
 *
 * Contrato común: ciclo (enter/exit/update/draw) + vocabulario
 * de gestos (onTap, onSwipe, onDrag…, sin hover). El marco de
 * encierro es un elemento de composición constante del sistema.
 * ============================================================ */

class Scene {
  constructor(app, id) {
    this.app = app;
    this.id = id;
    this.enterAt = 0;
  }

  get W() { return width; }
  get H() { return height; }
  get CX() { return width / 2; }
  get CY() { return height / 2; }
  get U() { return unit(); }

  enter() { this.enterAt = millis(); }
  exit() {}

  /** Segundos desde que la escena entró. */
  t() { return (millis() - this.enterAt) / 1000; }

  /** Clave de animación de entrada, 0..1 easing suave. */
  enterK(dur = 1, delay = 0) {
    return Ease.outCubic(clamp01((this.t() - delay) / dur));
  }

  update(dt) {}
  draw() {}

  /* gestos — las escenas sobreescriben lo que usan */
  onDown(x, y) {}
  onTap(x, y) {}
  onDragStart(x, y) {}
  onDrag(x, y, dx, dy) {}
  onDragEnd(x, y) {}
  onHoldStart(x, y) {}
  onHoldEnd(durS) {}
  /** Devolver true consume el swipe (anula la navegación por defecto). */
  onSwipe(dir, vel) { return false; }

  /** Marco de encierro: constante compositiva de las 9 interfaces. */
  drawFrame() {
    push();
    rectMode(CORNER); // las escenas suelen dejar rectMode(CENTER)
    noFill();
    stroke(Palette.inkA(36));
    strokeWeight(1);
    const m = Math.max(10, this.U * 0.02);
    rect(m, m, this.W - 2 * m, this.H - 2 * m);
    pop();
  }
}
