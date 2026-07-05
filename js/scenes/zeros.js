"use strict";
/* ============================================================
 * zeros.js — ZeroScene: estado cero de cada subsistema
 *
 * Un continuo sobre la línea: las tres posibilidades del
 * subsistema conviven como estaciones. Se swipea/arrastra para
 * recorrerlas (en el subsistema 1 eso ES viajar en el tiempo:
 * atrás la memoria, adelante la herencia y, si se sigue, el
 * corte de la caducidad). Tap en la estación enfocada = entrar.
 * Seguir swipeando más allá del final también entra.
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
    this.dragging = false;
  }

  // las tres posibilidades conviven en el encuadre: las laterales
  // quedan visibles (apagadas) a los costados de la enfocada
  spacing() { return this.W * 0.42; }
  stationX(i) { return this.CX + (i - this.focusF) * this.spacing(); }

  update(dt) {
    if (!this.dragging) {
      this.focusF += (this.focus - this.focusF) * Math.min(1, dt * 8);
    }
  }

  /* --------- gestos --------- */

  onDragStart() { this.dragging = true; }

  onDrag(x, y, dx) {
    this.focusF = clampv(this.focusF - dx / this.spacing(), -0.35, 2.35);
  }

  onDragEnd() {
    this.dragging = false;
    this.focus = clampv(Math.round(this.focusF), 0, 2);
  }

  onSwipe(dir, vel) {
    this.dragging = false;
    if (dir === 'left') {
      if (this.focus >= 2) {
        // seguir hacia adelante más allá del final: el continuo entra solo
        this.app.scenes.go(this.sub.concepts[2]);
      } else {
        this.focus = this.focus + 1;
      }
      return true;
    }
    if (dir === 'right') {
      if (this.focus <= 0) {
        this.app.scenes.go('home'); // antes del principio está el estado 0
      } else {
        this.focus = this.focus - 1;
      }
      return true;
    }
    return false;
  }

  onTap(x, y) {
    for (let i = 0; i < 3; i++) {
      const sx = this.stationX(i);
      if (Math.abs(x - sx) < this.spacing() * 0.38 && Math.abs(y - this.CY) < this.U * 0.28) {
        if (i === this.focus && Math.abs(this.focusF - this.focus) < 0.2) {
          this.app.scenes.go(this.sub.concepts[i]);
        } else {
          this.focus = i;
        }
        return;
      }
    }
  }

  /* --------- dibujo --------- */

  draw() {
    const k = this.enterK(1);
    const u = this.U;
    textFont('Helvetica');

    // encabezado del subsistema
    trackedText(this.sub.name, this.CX, this.H * 0.12, Math.max(13, u * 0.021), 6, Palette.ink, 210 * k);
    fadedText(this.sub.rule, this.CX, this.H * 0.12 + u * 0.033, Math.max(10, u * 0.0135), Palette.ink, 110 * k);

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

      this.drawMini(cid, sx, this.CY, s, a);

      const c = SYSTEM.concepts[cid];
      const la = Math.max(0, (fk - 0.5) / 0.5) * 255 * k;
      if (la > 4) {
        trackedText(c.title, sx, this.CY + u * 0.21, Math.max(12, u * 0.019), 5, Palette.ink, la * 0.92);
        fadedText(c.gloss, sx, this.CY + u * 0.21 + u * 0.03, Math.max(10, u * 0.0135), Palette.ink, la * 0.55);
      }
    }

    fadedText('swipeá el continuo · tocá para entrar', this.CX, this.H * 0.9,
      Math.max(10, u * 0.013), Palette.ink, 70 * this.enterK(1, 0.8));
    this.drawFrame();
  }

  /**
   * Miniaturas cinéticas: cada estación anticipa, en pequeño,
   * el comportamiento de su interfaz.
   */
  drawMini(cid, cx, cy, s, a) {
    const tt = this.t();
    push();
    translate(cx, cy);
    rectMode(CENTER);

    if (cid === 'memoria') {
      // registros que se apagan hacia atrás sin borrarse
      for (let i = 0; i < 6; i++) {
        const x = -s * 0.55 + i * s * 0.22;
        const age = 5 - i;
        const al = a * (0.18 + 0.82 * Math.pow(0.62, age));
        fill(Palette.inkA(al)); noStroke();
        rect(x, -s * 0.1, s * 0.11, s * 0.11);
        stroke(Palette.inkA(al * 0.8)); strokeWeight(1.5);
        line(x, -s * 0.02, x, s * 0.02);
      }

    } else if (cid === 'herencia') {
      // árbol: el de arriba se apaga, la estructura queda
      stroke(Palette.inkA(a * 0.6)); strokeWeight(1.2); noFill();
      line(0, -s * 0.42, 0, -s * 0.18);
      line(-s * 0.26, -s * 0.18, s * 0.26, -s * 0.18);
      line(-s * 0.26, -s * 0.18, -s * 0.26, s * 0.02);
      line(s * 0.26, -s * 0.18, s * 0.26, s * 0.02);
      line(s * 0.26, s * 0.14, s * 0.26, s * 0.34);
      noStroke();
      fill(Palette.inkA(a * 0.4)); rect(0, -s * 0.48, s * 0.13, s * 0.13);       // ancestro, se apaga
      fill(Palette.inkA(a * 0.75)); rect(-s * 0.26, s * 0.08, s * 0.12, s * 0.12);
      fill(Palette.inkA(a * 0.75)); rect(s * 0.26, s * 0.08, s * 0.12, s * 0.12);
      const m = 0.85 + 0.15 * Math.sin(tt * 2);
      fill(Palette.inkA(a * m)); rect(s * 0.26, s * 0.4, s * 0.1, s * 0.1);       // el que hereda, late

    } else if (cid === 'caducidad') {
      // tránsito: lo que avanza se gasta; la línea se corta
      const cut = s * 0.55;
      stroke(Palette.inkA(a * 0.7)); strokeWeight(1.3);
      line(-s * 0.6, s * 0.12, cut * 0.45, s * 0.12);
      drawingContext.setLineDash([4, 6]);
      line(cut * 0.45, s * 0.12, cut, s * 0.12);
      drawingContext.setLineDash([]);
      for (let i = 0; i < 4; i++) {
        const p = ((tt * 0.12 + i * 0.25) % 1);
        const x = -s * 0.6 + p * (cut + s * 0.6);
        const decay = 1 - p;
        const sz = s * 0.13 * (0.4 + 0.6 * decay);
        if (p < 0.72) {
          noStroke(); fill(Palette.inkA(a * decay));
          rect(x, s * 0.12 - sz * 0.65, sz, sz);
        } else {
          noFill(); stroke(Palette.inkA(a * decay * 0.9)); strokeWeight(1);
          drawingContext.setLineDash([3, 4]);
          rect(x, s * 0.12 - sz * 0.65, sz, sz);
          drawingContext.setLineDash([]);
        }
      }

    } else if (cid === 'identidad') {
      // mini diana con anillos de color levemente excéntricos
      noFill();
      for (let i = 4; i >= 1; i--) {
        const col = color(Palette.circleColor(i * 2));
        col.setAlpha(a * 0.9);
        stroke(col); strokeWeight(2.2);
        const off = s * 0.012 * i * Math.sin(tt * 0.9 + i);
        circle(off, 0, s * 0.22 * i);
      }
      noStroke(); fill(Palette.inkA(a));
      circle(0, 0, s * 0.09);

    } else if (cid === 'empatia') {
      // dos círculos que se acercan y se tiñen mutuamente
      const d = s * (0.3 + 0.14 * Math.sin(tt * 1.1));
      const c1 = color(Palette.circleColor(3)); c1.setAlpha(a);
      const c2 = color(Palette.circleColor(4)); c2.setAlpha(a);
      const near = 1 - clamp01((d - s * 0.16) / (s * 0.28));
      stroke(Palette.inkA(a * (0.3 + 0.6 * near)));
      strokeWeight(0.8 + 2 * near);
      line(-d, 0, d, 0);
      noStroke();
      fill(c1); circle(-d, 0, s * 0.26);
      fill(c2); circle(d, 0, s * 0.26);
      const mix = lerpColor(color(Palette.circleColor(3)), color(Palette.circleColor(4)), 0.5);
      mix.setAlpha(a * near);
      fill(mix); circle(0, 0, s * 0.14 * near);

    } else if (cid === 'colaboracion') {
      // trama de puntos diversos que forman un solo círculo
      const rot = tt * 0.25;
      for (let ring = 0; ring < 4; ring++) {
        const rr = s * 0.09 + ring * s * 0.085;
        const n = 4 + ring * 5;
        for (let j = 0; j < n; j++) {
          const ang = rot * (ring % 2 ? 1 : -1) + j * TWO_PI / n;
          const col = color(Palette.circleColor(j + ring * 3));
          col.setAlpha(a * 0.95);
          noStroke(); fill(col);
          circle(Math.cos(ang) * rr, Math.sin(ang) * rr, s * 0.055);
        }
      }

    } else if (cid === 'incertidumbre') {
      // montaña: lo andado es firme, lo próximo apenas tiembla
      strokeWeight(2.4); stroke(Palette.inkA(a));
      noFill();
      line(-s * 0.6, s * 0.3, -s * 0.15, -s * 0.28);
      const flick = 0.5 + 0.5 * Math.sin(tt * 6);
      strokeWeight(0.7);
      stroke(Palette.inkA(a * 0.5 * flick));
      line(-s * 0.15, -s * 0.28, s * 0.35, s * 0.22);
      stroke(Palette.inkA(a * 0.5 * (1 - flick)));
      line(-s * 0.15, -s * 0.28, s * 0.45, -s * 0.05);

    } else if (cid === 'ansiedad') {
      // triángulo lleno que tiembla; ecos que no se van
      const j = s * 0.02;
      noFill();
      stroke(Palette.inkA(a * 0.35)); strokeWeight(1);
      drawSign('triangle', -s * 0.18, -s * 0.1, s * 0.4, { col: Palette.ink, alpha: a * 0.3, weight: 1 });
      drawSign('triangle', s * 0.2, s * 0.08, s * 0.36, { col: Palette.ink, alpha: a * 0.25, weight: 1 });
      const jx = (noise(tt * 9) - 0.5) * j * 8;
      const jy = (noise(tt * 9 + 50) - 0.5) * j * 8;
      drawSign('triangle', jx, jy, s * 0.42, { fillCol: Palette.sub1.grays[3], alpha: a });

    } else if (cid === 'expectativa') {
      // contornos que suben, siempre a punto de llegar
      for (let i = 0; i < 3; i++) {
        const p = (tt * 0.22 + i * 0.33) % 1;
        const y = s * 0.35 - p * s * 0.7;
        const al = a * Math.sin(p * Math.PI);
        drawSign('triangle', (i - 1) * s * 0.3, y, s * (0.18 + 0.1 * i / 2),
          { col: Palette.ink, alpha: al, weight: 1 + p * 1.5 });
      }
    }
    pop();
  }
}
