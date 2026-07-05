"use strict";
/* ============================================================
 * home.js — ESTADO 0 del sistema
 *
 * Una línea respira en el centro; sobre ella viven los tres
 * signos-familia. Cada signo adelanta su juego: el cuadrado
 * respira opacidad, el círculo respira color, el triángulo
 * respira grosor. Swipe para recorrerlos, tap para entrar.
 * ============================================================ */

class HomeScene extends Scene {
  enter() {
    super.enter();
    this.focus = 1;      // arranca en el centro
    this.focusF = 1;
    this.dragX0 = null;
  }

  stationX(i) {
    return this.CX + (i - this.focusF) * this.W * 0.3;
  }

  update(dt) {
    this.focusF += (this.focus - this.focusF) * Math.min(1, dt * 8);
  }

  onTap(x, y) {
    for (let i = 0; i < 3; i++) {
      const sx = this.stationX(i);
      if (dist(x, y, sx, this.CY) < this.U * 0.16) {
        if (i === this.focus) {
          const sid = SYSTEM.order[i];
          this.app.scenes.go(SYSTEM.subs[sid].zero);
        } else {
          this.focus = i;
        }
        return;
      }
    }
  }

  onSwipe(dir) {
    if (dir === 'left') { this.focus = Math.min(2, this.focus + 1); return true; }
    if (dir === 'right') { this.focus = Math.max(0, this.focus - 1); return true; }
    return false;
  }

  draw() {
    const k = this.enterK(1.2);
    const tt = this.t();
    const u = this.U;
    textFont('Helvetica');

    // título del sistema
    trackedText('SISTEMA DE SEÑAS', this.CX, this.H * 0.14, Math.max(15, u * 0.026), 7, Palette.ink, 220 * this.enterK(1, 0.2));
    fadedText('nueve estados sobre una línea', this.CX, this.H * 0.14 + u * 0.04, Math.max(11, u * 0.015), Palette.ink, 120 * this.enterK(1, 0.5));

    // la línea madre: se dibuja a sí misma y respira
    const lw = this.W * 0.86 * k;
    const breathe = 1 + 0.002 * Math.sin(tt * 1.4);
    stroke(Palette.inkA(110));
    strokeWeight(1.3);
    line(this.CX - lw / 2 * breathe, this.CY, this.CX + lw / 2 * breathe, this.CY);

    // los tres signos-familia sobre la línea
    for (let i = 0; i < 3; i++) {
      const sid = SYSTEM.order[i];
      const sub = SYSTEM.subs[sid];
      const fk = 1 - Math.min(1, Math.abs(i - this.focusF));
      const sx = this.stationX(i);
      const appearK = this.enterK(0.7, 0.4 + i * 0.25);
      const s = u * (0.085 + 0.055 * fk) * appearK;
      const bob = Math.sin(tt * 1.2 + i * 2.1) * u * 0.006;
      const y = this.CY + bob;
      const alpha = (90 + 165 * fk) * appearK;

      push();
      if (sub.sign === 'square') {
        // el cuadrado respira OPACIDAD
        const op = alpha * (0.6 + 0.4 * Math.sin(tt * 0.9 + 1));
        drawSign('square', sx, y, s, { fillCol: Palette.sub1.grays[1], alpha: op });
        drawSign('square', sx, y, s, { col: Palette.ink, alpha: alpha * 0.8, weight: 1.4 });
      } else if (sub.sign === 'circle') {
        // el círculo respira COLOR: dos contornos de color desfasados
        const c1 = Palette.circleColor(Math.floor(tt * 0.35) % 10);
        const c2 = Palette.circleColor((Math.floor(tt * 0.35) + 3) % 10);
        const off = u * 0.006 * (0.5 + 0.5 * Math.sin(tt * 1.7));
        drawSign('circle', sx - off, y, s, { col: c1, alpha, weight: 2.2 });
        drawSign('circle', sx + off, y, s, { col: c2, alpha: alpha * 0.85, weight: 2.2 });
      } else {
        // el triángulo respira GROSOR DE LÍNEA
        const wgt = 1 + 3.4 * (0.5 + 0.5 * Math.sin(tt * 1.1 + 2));
        drawSign('triangle', sx, y + s * 0.08, s, { col: Palette.ink, alpha, weight: wgt });
      }
      pop();

      // etiquetas de la familia enfocada
      if (fk > 0.55) {
        const la = (fk - 0.55) / 0.45 * 255 * appearK;
        trackedText(sub.name, sx, this.CY + u * 0.135, Math.max(12, u * 0.019), 5, Palette.ink, la * 0.9);
        fadedText(sub.tagline, sx, this.CY + u * 0.135 + u * 0.03, Math.max(10, u * 0.0135), Palette.ink, la * 0.55);
        fadedText(sub.rule, sx, this.CY + u * 0.135 + u * 0.055, Math.max(9, u * 0.0115), Palette.ink, la * 0.35);
      }
    }

    // ayuda mínima, abajo
    fadedText('swipeá para recorrer · tocá una figura para entrar', this.CX, this.H * 0.9,
      Math.max(10, u * 0.013), Palette.ink, 80 * this.enterK(1, 1.2));

    this.drawFrame();
  }
}
