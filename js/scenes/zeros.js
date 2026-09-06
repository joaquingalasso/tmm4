"use strict";
/* ============================================================
 * zeros.js — ZeroScene: estado cero de cada subsistema
 *
 * Un continuo sobre la línea: las tres posibilidades del
 * subsistema conviven como estaciones y se recorren de a una.
 * Es una pantalla de navegación, no un signo: por eso conserva
 * el nombre del subsistema y el de la estación enfocada.
 *
 * Navegación (idéntica en todo el sistema):
 *   ← →      mueve el foco entre las tres estaciones, sin entrar
 *   pulsar   entra a la estación enfocada
 *   ↑        entra a la estación enfocada
 *   ↓        vuelve al estado 0
 * Deslizar NUNCA entra solo, y nunca salta al estado 0 de costado.
 * ============================================================ */

class ZeroScene extends Scene {
  constructor(app, id, subId) {
    super(app, id);
    this.subId = subId;
    this.sub = SYSTEM.subs[subId];
  }

  enter() {
    super.enter();
    this.focus = 1;
    this.focusF = 1;
  }

  // las tres posibilidades conviven en el encuadre: las laterales
  // quedan visibles (apagadas) a los costados de la enfocada
  spacing() { return this.W * 0.42; }
  stationX(i) { return this.CX + (i - this.focusF) * this.spacing(); }

  update(dt) {
    this.focusF += (this.focus - this.focusF) * Math.min(1, dt * 8);
  }

  /* --------- navegación --------- */

  onSwipe(dir) {
    // el foco se mueve dentro del continuo y se queda en los bordes:
    // nunca entra solo, nunca se escapa a otra pantalla
    if (dir === 'left')  { this.focus = clampv(this.focus + 1, 0, 2); return true; }
    if (dir === 'right') { this.focus = clampv(this.focus - 1, 0, 2); return true; }
    if (dir === 'up')    { this.app.scenes.go(this.sub.concepts[this.focus]); return true; }
    return false; // ↓ lo resuelve el sistema: vuelve al estado 0
  }

  onTap(x, y) {
    for (let i = 0; i < 3; i++) {
      const sx = this.stationX(i);
      if (Math.abs(x - sx) < this.spacing() * 0.38 && Math.abs(y - this.CY) < this.U * 0.3) {
        // la enfocada se entra; una lateral primero se trae al centro
        if (i === this.focus) this.app.scenes.go(this.sub.concepts[i]);
        else this.focus = i;
        return;
      }
    }
  }

  onHoldStart(x, y) { this.onTap(x, y); }

  /* --------- dibujo --------- */

  draw() {
    const k = this.enterK(1);
    const u = this.U;
    textFont('Helvetica');
    setDash(Dash.none);

    // encabezado del subsistema
    trackedText(this.sub.name, this.CX, this.H * 0.12, Math.max(13, u * 0.021), 6, Palette.ink, 210 * k);

    // la línea-continuo que une las tres estaciones
    stroke(Palette.inkA(90 * k));
    strokeWeight(1.2);
    line(0, this.CY, this.W, this.CY);

    for (let i = 0; i < 3; i++) {
      const cid = this.sub.concepts[i];
      const fk = clamp01(1 - Math.abs(i - this.focusF));
      const sx = this.stationX(i);
      if (sx < -this.W * 0.4 || sx > this.W * 1.4) continue;
      const s = u * (0.16 + 0.1 * fk) * k;
      const a = (70 + 185 * fk) * k;

      drawConceptPreview(cid, sx, this.CY, s, a, this.t());

      const c = SYSTEM.concepts[cid];
      const la = Math.max(0, (fk - 0.5) / 0.5) * 255 * k;
      if (la > 4) {
        trackedText(c.title, sx, this.CY + u * 0.22, Math.max(12, u * 0.019), 5, Palette.ink, la * 0.92);
      }
    }

    // tres muescas: en cuál de las tres estaciones estamos parados
    rectMode(CORNER);
    for (let i = 0; i < 3; i++) {
      const on = Math.abs(this.focusF - i) < 0.5;
      noStroke();
      fill(Palette.inkA((on ? 220 : 70) * k));
      rect(this.CX + (i - 1) * 16 - 4, this.H * 0.88, 8, 2);
    }
  }
}
