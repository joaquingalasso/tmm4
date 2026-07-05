"use strict";
/* ============================================================
 * input.js — GestureManager
 *
 * Traduce el puntero crudo (touch o mouse) a un vocabulario de
 * gestos pensado para superficie multitáctil, SIN hover:
 *   down / tap / hold (mantener) / drag (arrastrar) / swipe
 * Las escenas sólo conocen ese vocabulario.
 * ============================================================ */

class GestureManager {
  constructor(app) {
    this.app = app;
    this.active = false;
    this.dragging = false;
    this.holdFired = false;
    this.start = { x: 0, y: 0, t: 0 };
    this.last = { x: 0, y: 0, t: 0 };
    this.path = [];
    this.TAP_MAX_MS = 320;
    this.TAP_MAX_DIST = 14;
    this.HOLD_MS = 430;
    this.SWIPE_MIN_DIST = 70;
    this.SWIPE_MAX_MS = 500;
  }

  down(x, y) {
    this.active = true;
    this.dragging = false;
    this.holdFired = false;
    const t = millis();
    this.start = { x, y, t };
    this.last = { x, y, t };
    this.path = [{ x, y, t }];
    this.app.dispatch('down', x, y);
  }

  move(x, y) {
    if (!this.active) return;
    const t = millis();
    const dx = x - this.last.x, dy = y - this.last.y;
    const distStart = dist(x, y, this.start.x, this.start.y);
    if (!this.dragging && !this.holdFired && distStart > this.TAP_MAX_DIST) {
      this.dragging = true;
      this.app.dispatch('dragStart', this.start.x, this.start.y);
    }
    if (this.dragging || this.holdFired) {
      this.app.dispatch('drag', x, y, dx, dy);
    }
    this.last = { x, y, t };
    this.path.push({ x, y, t });
    if (this.path.length > 24) this.path.shift();
  }

  up(x, y) {
    if (!this.active) return;
    this.active = false;
    const t = millis();
    const durTotal = t - this.start.t;
    const distTotal = dist(x, y, this.start.x, this.start.y);

    if (this.holdFired) {
      this.app.dispatch('holdEnd', (t - this.start.t) / 1000);
      return;
    }

    // swipe: desplazamiento franco y veloz
    if (distTotal > this.SWIPE_MIN_DIST && durTotal < this.SWIPE_MAX_MS) {
      const dx = x - this.start.x, dy = y - this.start.y;
      const dir = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'down' : 'up');
      const vel = distTotal / Math.max(1, durTotal); // px/ms
      if (this.dragging) this.app.dispatch('dragEnd', x, y);
      this.app.dispatch('swipe', dir, vel);
      return;
    }

    if (this.dragging) {
      this.app.dispatch('dragEnd', x, y);
      return;
    }

    if (durTotal < this.TAP_MAX_MS && distTotal <= this.TAP_MAX_DIST) {
      this.app.dispatch('tap', x, y);
    }
  }

  /** El hold se detecta por tiempo, en cada frame. */
  update() {
    if (this.active && !this.dragging && !this.holdFired &&
        millis() - this.start.t > this.HOLD_MS) {
      const distStart = dist(this.last.x, this.last.y, this.start.x, this.start.y);
      if (distStart <= this.TAP_MAX_DIST) {
        this.holdFired = true;
        this.app.dispatch('holdStart', this.start.x, this.start.y);
      }
    }
  }
}
