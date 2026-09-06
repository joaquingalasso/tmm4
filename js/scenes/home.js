"use strict";
/* ============================================================
 * home.js — ESTADO 0 del sistema
 *
 * Es la portada y el índice: junto con el menú, la única
 * superficie del sistema donde hay palabra. Título, cátedra,
 * integrantes y una grilla de 3×3, una celda por signo, con la
 * misma vista previa cinética que usan las pantallas "cero".
 * Pulsar una celda entra a ese signo.
 * ============================================================ */

class HomeScene extends Scene {
  enter() {
    super.enter();
    // orden fijo, fila por subsistema: tiempo · vínculo · devenir
    this.grid = [];
    for (const sid of SYSTEM.order) {
      for (const cid of SYSTEM.subs[sid].concepts) this.grid.push(cid);
    }
  }

  /** Geometría: 3×3 celdas cuadradas e iguales, con aire entre ellas. */
  layout() {
    const headY = this.H * 0.19;                 // fin del encabezado
    // franja de los nombres de las celdas + la de los integrantes
    const labelBand = this.U * 0.024 + Math.max(9, this.U * 0.0115);
    const footH = labelBand + this.U * 0.055 + Math.max(9, this.U * 0.0125) * 3.4;
    const availH = this.H - headY - footH;
    const availW = this.W * 0.9;
    const GAP_RATIO = 0.16;
    const cell = Math.min(availW, availH) / (3 + 2 * GAP_RATIO);
    const gap = cell * GAP_RATIO;
    const totalSide = cell * 3 + gap * 2;
    const x0 = this.CX - totalSide / 2 + cell / 2;
    // la grilla, sus nombres y los integrantes se centran como un bloque
    const y0 = headY + Math.max(0, (availH - totalSide) / 2) + cell / 2;
    const footY = y0 - cell / 2 + totalSide + labelBand + this.U * 0.055;
    return { cell, gap, x0, y0, footY };
  }

  /** Centro y lado de la celda i (0..8, fila por fila). */
  cellAt(i) {
    const { cell, gap, x0, y0 } = this.layout();
    const col = i % 3, row = Math.floor(i / 3);
    return { x: x0 + col * (cell + gap), y: y0 + row * (cell + gap), s: cell };
  }

  onTap(x, y) {
    for (let i = 0; i < this.grid.length; i++) {
      const c = this.cellAt(i);
      if (Math.abs(x - c.x) < c.s / 2 && Math.abs(y - c.y) < c.s / 2) {
        this.app.scenes.go(this.grid[i]);
        return;
      }
    }
  }

  /** Mantener una celda también entra: no hay tercer gesto que aprender. */
  onHoldStart(x, y) { this.onTap(x, y); }

  draw() {
    const k = this.enterK(1.1);
    const u = this.U;
    textFont('Helvetica');
    setDash(Dash.none);

    // título del sistema (dos líneas, para caber en pantallas angostas)
    const titleA = 220 * this.enterK(1, 0.15);
    fadedText('Sistema de signos de representación', this.CX, this.H * 0.07,
      Math.max(13, u * 0.021), Palette.ink, titleA);
    fadedText('geométrica, cinética y reactiva.', this.CX, this.H * 0.07 + u * 0.032,
      Math.max(13, u * 0.021), Palette.ink, titleA);

    fadedText('Taller de Diseño Multimedial 4 · Facultad de Artes · UNLP · 2026',
      this.CX, this.H * 0.07 + u * 0.07, Math.max(10, u * 0.0125), Palette.ink,
      130 * this.enterK(1, 0.35));

    // la grilla 3×3: una vista previa por signo
    for (let i = 0; i < this.grid.length; i++) {
      const cid = this.grid[i];
      const c = SYSTEM.concepts[cid];
      const p = this.cellAt(i);
      const appearK = this.enterK(0.6, 0.25 + i * 0.03);
      if (appearK <= 0) continue;

      push();
      rectMode(CENTER);
      noFill();
      stroke(Palette.inkA(46 * appearK * k));
      strokeWeight(1);
      rect(p.x, p.y, p.s, p.s);
      pop();

      drawConceptPreview(cid, p.x, p.y, p.s * 0.72, 200 * appearK * k, this.t());

      fadedText(c.title, p.x, p.y + p.s / 2 + u * 0.024,
        Math.max(9, u * 0.0115), Palette.ink, 130 * appearK * k);
    }

    // integrantes del grupo, en orden alfabético
    fittedText(MEMBERS.join('   ·   '), this.CX, this.layout().footY,
      Math.max(9, u * 0.0125), this.W * 0.9,
      Palette.ink, 140 * this.enterK(1, 0.7));
  }
}
