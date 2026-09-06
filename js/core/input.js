"use strict";
/* ============================================================
 * input.js — GestureManager
 *
 * Vocabulario mínimo y sin ambigüedad, pensado para tacto y sin
 * hover. Los signos sólo reciben DOS gestos:
 *
 *   tap   — pulsar
 *   hold  — mantener pulsado (holdStart / holdMove / holdEnd)
 *
 * y el sistema recibe uno solo, reservado a la navegación:
 *
 *   swipe — deslizar franco y veloz
 *
 * Reglas de desambiguación (el problema anterior era que un
 * gesto de interacción terminaba navegando):
 *  · si el hold ya disparó, el dedo puede moverse cuanto quiera:
 *    NUNCA se convierte en swipe ni en tap.
 *  · el swipe exige distancia larga Y tiempo corto Y dirección
 *    dominante clara; si no, el gesto no hace nada.
 *  · un arrastre lento no es nada: ni tap, ni swipe, ni navegación.
 * ============================================================ */

class GestureManager {
  constructor(app) {
    this.app = app;
    this.active = false;
    this.holdFired = false;
    this.start = { x: 0, y: 0, t: 0 };
    this.last = { x: 0, y: 0, t: 0 };

    this.TAP_MAX_MS = 400;     // pulsar: breve
    this.TAP_MAX_DIST = 18;    // pulsar: casi sin desplazamiento
    this.HOLD_MS = 380;        // mantener: a partir de acá
    this.HOLD_SLOP = 34;       // mantener tolera temblor de dedo
    this.SWIPE_MIN_DIST = 90;  // deslizar: recorrido franco
    this.SWIPE_MAX_MS = 450;   // deslizar: veloz
    this.SWIPE_RATIO = 1.5;    // deslizar: dirección dominante clara
  }

  down(x, y) {
    this.active = true;
    this.holdFired = false;
    const t = millis();
    this.start = { x, y, t };
    this.last = { x, y, t };
    this.app.dispatch('down', x, y);
  }

  move(x, y) {
    if (!this.active) return;
    this.last = { x, y, t: millis() };
    // mientras se mantiene, el dedo puede acompañar: es parte del hold
    if (this.holdFired) this.app.dispatch('holdMove', x, y);
  }

  up(x, y) {
    if (!this.active) return;
    this.active = false;
    const dur = millis() - this.start.t;
    const dx = x - this.start.x, dy = y - this.start.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    // mantener: se cierra como hold, pase lo que pase con el dedo
    if (this.holdFired) {
      this.app.dispatch('holdEnd', dur / 1000);
      return;
    }

    // deslizar: sólo si es largo, veloz y con eje dominante claro
    if (d > this.SWIPE_MIN_DIST && dur < this.SWIPE_MAX_MS) {
      const ax = Math.abs(dx), ay = Math.abs(dy);
      if (ax > ay * this.SWIPE_RATIO) {
        this.app.dispatch('swipe', dx > 0 ? 'right' : 'left', d / dur);
        return;
      }
      if (ay > ax * this.SWIPE_RATIO) {
        this.app.dispatch('swipe', dy > 0 ? 'down' : 'up', d / dur);
        return;
      }
      return; // diagonal: no se adivina, no se navega
    }

    // pulsar
    if (dur < this.TAP_MAX_MS && d <= this.TAP_MAX_DIST) {
      this.app.dispatch('tap', x, y);
    }
    // cualquier otra cosa (arrastre lento) no produce nada
  }

  /** El hold se detecta por tiempo, en cada frame. */
  update() {
    if (this.active && !this.holdFired && millis() - this.start.t > this.HOLD_MS) {
      const d = dist(this.last.x, this.last.y, this.start.x, this.start.y);
      if (d <= this.HOLD_SLOP) {
        this.holdFired = true;
        this.app.dispatch('holdStart', this.start.x, this.start.y);
      }
    }
  }
}
