"use strict";
/* ============================================================
 * inicio.js — la portada
 *
 * Antes de entrar, dos decisiones y nada más: sonido sí o no,
 * palabra sí o no. Los dos interruptores son signos, no palabras,
 * porque tienen que servir también cuando se apaga la palabra.
 *
 * Y mientras tanto se ve de qué está hecho el sistema: la línea,
 * y sobre ella los tres signos que la atraviesan. Tocar en
 * cualquier otro lado entra.
 * ============================================================ */

class InicioScene extends Scene {
  enter() {
    super.enter();
    this.entering = false;
  }

  btnR() { return Math.max(21, this.U * 0.05); }
  btnY() { return this.H * 0.7; }
  btnX(i) { return this.CX + (i === 0 ? -1 : 1) * this.U * 0.1; }

  /** El grupo de signos late: eso es lo que se toca para entrar. */
  signY() { return this.H * 0.42; }

  onTap(x, y) {
    for (let i = 0; i < 2; i++) {
      if (dist(x, y, this.btnX(i), this.btnY()) < this.btnR() * 1.6) {
        if (i === 0) Prefs.toggleSonido(); else Prefs.toggleTexto();
        Audio.blip(Audio.note(i === 0 ? 5 : 7, 50), { type: 'sine', dur: 0.35, gain: 0.14 });
        return;
      }
    }
    this.enter0();
  }

  onHoldStart(x, y) { this.onTap(x, y); }

  onSwipe(dir) {
    if (dir === 'up') { this.enter0(); return true; }
    return false;
  }

  enter0() {
    if (this.entering) return;
    this.entering = true;
    Audio.blip(Audio.note(9, 50), { type: 'sine', dur: 0.9, gain: 0.16 });
    this.app.scenes.go('home');
  }

  draw() {
    const u = this.U;
    const k = this.enterK(1.2);
    const tt = this.t();
    textFont('Helvetica');
    setDash(Dash.none);

    // la línea: el estadío que atraviesa los tres subsistemas
    const lw = this.W * 0.62 * Ease.outCubic(clamp01(tt / 1.1));
    stroke(Palette.inkA(110 * k));
    strokeWeight(1.3);
    line(this.CX - lw / 2, this.signY(), this.CX + lw / 2, this.signY());

    // los tres signos, apareciendo en orden sobre la línea
    const gap = u * 0.16;
    const signs = ['square', 'circle', 'triangle'];
    for (let i = 0; i < 3; i++) {
      const a = 235 * Ease.outCubic(clamp01((tt - 0.35 - i * 0.22) / 0.7));
      if (a < 3) continue;
      const br = 1 + 0.04 * Math.sin(tt * 1.6 + i * 1.1);
      drawSign(signs[i], this.CX + (i - 1) * gap, this.signY(), u * 0.075 * br,
        { col: Palette.ink, alpha: a, weight: 2 });
    }

    // el halo que invita a entrar: el mismo gesto que en el cierre
    const inv = Ease.outCubic(clamp01((tt - 1.4) / 0.9));
    if (inv > 0.01) {
      noFill();
      stroke(Palette.inkA((36 + 26 * Math.sin(tt * 2)) * inv));
      strokeWeight(1);
      circle(this.CX, this.signY(), u * 0.62 * (1 + 0.012 * Math.sin(tt * 2)));
    }

    // las dos decisiones
    const ba = 235 * Ease.outCubic(clamp01((tt - 1.1) / 0.8));
    if (ba > 3) {
      drawToggle('sonido', this.btnX(0), this.btnY(), this.btnR(), Audio.on, ba);
      drawToggle('texto', this.btnX(1), this.btnY(), this.btnR(), Txt.on, ba);
    }

    // la palabra, si se la quiso: título, cátedra e integrantes
    const ta = 210 * Ease.outCubic(clamp01((tt - 0.6) / 1));
    fittedText('Sistema de signos de representación geométrica, cinética y reactiva',
      this.CX, this.H * 0.13, Math.max(12, u * 0.019), this.W * 0.86,
      Palette.ink, ta, ' ');
    fadedText('Taller de Diseño Multimedial 4 · Facultad de Artes · UNLP · 2026',
      this.CX, this.H * 0.13 + u * 0.075, Math.max(9, u * 0.0125), Palette.ink, ta * 0.6);
    fittedText(MEMBERS.join('   ·   '), this.CX, this.H * 0.88,
      Math.max(9, u * 0.0125), this.W * 0.9, Palette.ink, ta * 0.7);
  }
}
