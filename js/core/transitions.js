"use strict";
/* ============================================================
 * transitions.js — TransitionManager
 *
 * Transición poética única del sistema: TODO COLAPSA A LA LÍNEA.
 * Dos cortinas del color de fondo se cierran hacia el eje
 * horizontal; sobre la línea encendida aparece el nombre del
 * estado de destino; luego la línea se abre y revela la escena.
 * La línea es el estadío que conecta los tres subsistemas.
 *
 * Es el único momento fuera del menú en que hay una palabra, y
 * cumple una función estrictamente de navegación: decir a dónde
 * se llegó. Dentro del signo ya no queda ni un texto.
 * ============================================================ */

class TransitionManager {
  constructor(app) {
    this.app = app;
    this.active = false;
    this.phase = 'idle';   // close → hold → open
    this.t = 0;
    this.label = '';
    this.onSwitch = null;
    this.DUR = { close: 0.5, hold: 0.7, open: 0.6 };
  }

  run(label, _sub, onSwitch) {
    if (this.active) return false;
    this.active = true;
    this.phase = 'close';
    this.t = 0;
    this.label = label || '';
    this.onSwitch = onSwitch;
    return true;
  }

  update(dt) {
    if (!this.active) return;
    this.t += dt;
    if (this.phase === 'close' && this.t >= this.DUR.close) {
      this.phase = 'hold';
      this.t = 0;
      if (this.onSwitch) { this.onSwitch(); this.onSwitch = null; }
    } else if (this.phase === 'hold' && this.t >= this.DUR.hold) {
      this.phase = 'open';
      this.t = 0;
    } else if (this.phase === 'open' && this.t >= this.DUR.open) {
      this.active = false;
      this.phase = 'idle';
    }
  }

  /** Fracción de cierre 0..1 (1 = pantalla reducida a la línea). */
  coverage() {
    if (!this.active) return 0;
    if (this.phase === 'close') return Ease.inOutCubic(clamp01(this.t / this.DUR.close));
    if (this.phase === 'hold') return 1;
    return 1 - Ease.inOutCubic(clamp01(this.t / this.DUR.open));
  }

  draw() {
    if (!this.active) return;
    const f = this.coverage();
    const cy = height / 2;
    const coverH = f * (cy + 2);

    setDash(Dash.none);
    noStroke();
    fill(Palette.bg);
    rect(0, 0, width, coverH);
    rect(0, height - coverH, width, coverH);

    // la línea: crece con el cierre, respira durante el hold
    const breathe = this.phase === 'hold' ? 1 + 0.15 * Math.sin(millis() / 120) : 1;
    const lw = width * (0.12 + 0.82 * f);
    const c = Palette.inkA(60 + 195 * f);
    stroke(c);
    strokeWeight(1.4 * breathe);
    line(width / 2 - lw / 2, cy, width / 2 + lw / 2, cy);

    // el nombre del destino, sólo mientras vivimos en la línea
    let labelA = 0;
    if (this.phase === 'hold') labelA = Ease.outCubic(clamp01(this.t / 0.28));
    if (this.phase === 'open') labelA = 1 - clamp01(this.t / 0.22);
    if (labelA > 0.01 && this.label) {
      textFont('Helvetica');
      trackedText(this.label, width / 2, cy - 32,
        Math.max(15, unit() * 0.026), 6, Palette.ink, 235 * labelA);
    }
  }
}
