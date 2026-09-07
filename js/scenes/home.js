"use strict";
/* ============================================================
 * home.js — ESTADO 0 del sistema
 *
 * El índice: una grilla de 3×3, una celda por signo, con la misma
 * vista previa cinética que usan las pantallas "cero". El nombre
 * de cada signo va ARRIBA de su miniatura, como un rótulo. Abajo,
 * los integrantes. Nada más: el sistema se presenta mostrándose.
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

  /** Cuerpo tipográfico del rótulo de cada celda. */
  labelSize() { return Math.max(9, this.U * 0.0125); }

  /**
   * Geometría de la grilla. Cada fila es un bloque de dos partes:
   * el rótulo y, debajo, la celda cuadrada. El ancho manda; si el
   * conjunto no entra a lo alto, la celda se achica.
   */
  layout() {
    const topY = this.H * 0.085;                    // debajo de la hamburguesa
    // sin palabra no hay rótulos ni integrantes: todo ese aire se lo
    // queda la grilla, que es lo único que queda para leer
    const footH = Txt.on ? Math.max(48, this.U * 0.17) : this.U * 0.05;
    const availW = this.W * 0.9;
    const availH = this.H - topY - footH;
    const GAP = 0.16;                               // aire, proporcional a la celda
    const labelH = Txt.on ? this.labelSize() * 2.1 : 0;

    let cell = availW / (3 + 2 * GAP);
    const tall = () => 3 * (labelH + cell) + 2 * (cell * GAP);
    if (tall() > availH) cell = (availH - 3 * labelH) / (3 + 2 * GAP);

    const gap = cell * GAP;
    const totalW = cell * 3 + gap * 2;
    const totalH = 3 * (labelH + cell) + gap * 2;
    const x0 = this.CX - totalW / 2 + cell / 2;
    const y0 = topY + Math.max(0, (availH - totalH) / 2) + labelH + cell / 2;
    const footY = y0 - cell / 2 - labelH + totalH + footH * 0.45;
    return { cell, gap, labelH, x0, y0, footY };
  }

  /** Centro y lado de la celda i (0..8, fila por fila). */
  cellAt(i) {
    const { cell, gap, labelH, x0, y0 } = this.layout();
    const col = i % 3, row = Math.floor(i / 3);
    return {
      x: x0 + col * (cell + gap),
      y: y0 + row * (cell + labelH + gap),
      s: cell,
    };
  }

  onTap(x, y) {
    for (let i = 0; i < this.grid.length; i++) {
      const c = this.cellAt(i);
      if (Math.abs(x - c.x) < c.s / 2 && Math.abs(y - c.y) < c.s / 2) {
        // la nota de entrada dice de qué subsistema es lo que se abre
        Audio.blip(Audio.note([0, 2, 4][Math.floor(i / 3)] + 5, 50),
          { type: 'sine', dur: 0.7, gain: 0.16 });
        this.app.scenes.go(this.grid[i]);
        return;
      }
    }
  }

  /** Mantener una celda también entra: no hay tercer gesto que aprender. */
  onHoldStart(x, y) { this.onTap(x, y); }

  draw() {
    const k = this.enterK(1.1);
    const { labelH, footY } = this.layout();
    const ls = this.labelSize();
    textFont('Helvetica');
    setDash(Dash.none);

    // la grilla 3×3: el rótulo arriba, la vista previa del signo abajo
    for (let i = 0; i < this.grid.length; i++) {
      const cid = this.grid[i];
      const c = SYSTEM.concepts[cid];
      const p = this.cellAt(i);
      const appearK = this.enterK(0.6, 0.1 + i * 0.03);
      if (appearK <= 0) continue;

      fadedText(c.title, p.x, p.y - p.s / 2 - labelH * 0.44,
        ls, Palette.ink, 150 * appearK * k);

      push();
      rectMode(CENTER);
      noFill();
      stroke(Palette.inkA(46 * appearK * k));
      strokeWeight(1);
      rect(p.x, p.y, p.s, p.s);
      pop();

      drawConceptPreview(cid, p.x, p.y, p.s * 0.72, 200 * appearK * k, this.t());
    }

    // integrantes del grupo, en orden alfabético
    fittedText(MEMBERS.join('   ·   '), this.CX, footY,
      Math.max(9, this.U * 0.0125), this.W * 0.9,
      Palette.ink, 150 * this.enterK(1, 0.5));
  }
}
