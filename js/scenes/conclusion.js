"use strict";
/* ============================================================
 * conclusion.js — CIERRE del sistema
 *
 * Sólo se llega habiendo habitado los nueve estados. Los nueve
 * signos vuelven como en el panel del sistema (3 × 3); cada
 * familia se reconoce y colapsa en un solo signo; los tres
 * signos se acuestan sobre la línea; la línea se contrae a un
 * punto; el punto se apaga. Todo lo que fue, lo que somos y lo
 * que viene cabe en una línea. Tap: volver a empezar.
 * ============================================================ */

class ConclusionScene extends Scene {
  enter() {
    super.enter();
    this.done = false;
  }

  /** Progreso 0..1 de una fase [a, b] (en segundos de escena). */
  phase(a, b) { return clamp01((this.t() - a) / (b - a)); }

  onTap() {
    if (this.t() > 10.5) {
      this.app.scenes.reset();
      this.app.scenes.go('home');
    }
  }

  draw() {
    const u = this.U;
    const cy = this.CY;
    textFont('Helvetica');

    const p0 = Ease.outCubic(this.phase(0.3, 2.3));    // aparecen los 9
    const p1 = Ease.inOutCubic(this.phase(3.0, 4.8));  // cada fila se vuelve una
    const p2 = Ease.inOutCubic(this.phase(5.4, 7.2));  // los tres se acuestan en la línea
    const p3 = Ease.inOutCubic(this.phase(7.8, 9.2));  // la línea se contrae a un punto
    const p4 = this.phase(9.6, 10.6);                  // palabras finales

    const rows = [
      { sid: 'sub1', y: cy - u * 0.22 },
      { sid: 'sub2', y: cy },
      { sid: 'sub3', y: cy + u * 0.22 },
    ];

    if (p3 < 1) {
      for (let r = 0; r < 3; r++) {
        const { sid, y } = rows[r];
        const sub = SYSTEM.subs[sid];
        const rowY = lerp(y, cy, p2);           // las filas caen a la línea
        for (let i = 0; i < 3; i++) {
          const x0 = this.CX + (i - 1) * u * 0.24;
          const x = lerp(x0, this.CX, p1);      // la familia se reconoce en el centro
          const s = u * 0.075 * p0 * (1 - p3);  // y todo se contrae al final
          const appear = Ease.outCubic(clamp01((this.t() - 0.3 - (r * 3 + i) * 0.12) / 0.6));
          const alpha = 235 * appear * (i === 1 ? 1 : 1 - p1); // los laterales se funden en el del medio
          if (alpha < 3 || s < 0.5) continue;

          if (sid === 'sub1') {
            const g = Palette.sub1.grays[1 + i];
            drawSign('square', x, rowY, s, { fillCol: g, alpha });
          } else if (sid === 'sub2') {
            drawSign('circle', x, rowY, s, { col: Palette.circleColor(i * 3 + 1), alpha, weight: 2.5 });
          } else {
            drawSign('triangle', x, rowY, s, { col: Palette.ink, alpha, weight: 1 + i * 2 });
          }
        }
        // etiqueta de familia mientras están separadas
        const la = 120 * p0 * (1 - p1);
        if (la > 3) {
          fadedText(sub.name.toLowerCase(), this.CX + u * 0.36, y, Math.max(10, u * 0.013), Palette.ink, la);
        }
      }
    }

    // la línea madre: sostiene todo y luego se contrae
    const lineA = 60 + 160 * p2;
    const lw = this.W * 0.7 * (1 - p3) + u * 0.002;
    if (p3 < 1) {
      stroke(Palette.inkA(lineA * (1 - p3 * 0.3)));
      strokeWeight(1.4 + p2);
      line(this.CX - lw / 2, cy, this.CX + lw / 2, cy);
    }

    // el punto final: late una vez y se apaga
    if (p3 >= 1 && p4 < 1) {
      const blink = 1 - p4;
      noStroke();
      fill(Palette.inkA(255 * blink));
      circle(this.CX, cy, u * 0.014 * (1 + Math.sin(this.t() * 6) * 0.3));
    }

    // palabras finales
    if (p4 > 0) {
      const a = Ease.outCubic(p4);
      fadedText('todo lo que fue, lo que somos y lo que viene', this.CX, cy - u * 0.05,
        Math.max(12, u * 0.018), Palette.ink, 220 * a);
      fadedText('cabe en una línea', this.CX, cy, Math.max(12, u * 0.018), Palette.ink, 220 * a);
      const pulse = 0.6 + 0.4 * Math.sin(this.t() * 2);
      fadedText('tocá para volver a empezar', this.CX, cy + u * 0.12,
        Math.max(10, u * 0.014), Palette.ink, 120 * a * pulse);
    }

    this.drawFrame();
  }
}
