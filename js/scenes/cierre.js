"use strict";
/* ============================================================
 * cierre.js — CIERRE del sistema
 *
 * Sólo se llega habiendo habitado los nueve signos, siguiendo el
 * recorrido hasta pasar el último. Los nueve vuelven como en la
 * grilla del estado 0; cada familia se reconoce y colapsa en un
 * solo signo; los tres signos se acuestan sobre la línea; la
 * línea se contrae a un punto; el punto queda latiendo.
 *
 * Todo lo que fue, lo que somos y lo que viene cabe en una línea.
 * No hace falta decirlo: se ve.
 *
 * Pulsar el punto vuelve a empezar.
 * ============================================================ */

class CierreScene extends Scene {
  enter() {
    super.enter();
  }

  /** Progreso 0..1 de una fase [a, b], en segundos de escena. */
  phase(a, b) { return clamp01((this.t() - a) / (b - a)); }

  /** Cuándo el punto ya está solo y admite el gesto de volver. */
  restarted() { return this.t() > 9.4; }

  onTap() {
    if (!this.restarted()) return;
    this.app.scenes.reset();
    this.app.scenes.go('home');
  }

  onHoldStart() { this.holding = true; this.onTap(); }
  onHoldEnd() { this.holding = false; }

  draw() {
    const u = this.U;
    const cy = this.CY;
    setDash(Dash.none);

    const p0 = Ease.outCubic(this.phase(0.3, 2.3));    // aparecen los nueve
    const p1 = Ease.inOutCubic(this.phase(3.0, 4.8));  // cada familia se reconoce
    const p2 = Ease.inOutCubic(this.phase(5.4, 7.2));  // los tres se acuestan
    const p3 = Ease.inOutCubic(this.phase(7.8, 9.2));  // la línea se contrae

    const rows = [
      { sid: 'sub1', y: cy - u * 0.22 },
      { sid: 'sub2', y: cy },
      { sid: 'sub3', y: cy + u * 0.22 },
    ];

    if (p3 < 1) {
      for (let r = 0; r < 3; r++) {
        const { sid, y } = rows[r];
        const rowY = lerp(y, cy, p2);          // las filas caen a la línea
        for (let i = 0; i < 3; i++) {
          const x0 = this.CX + (i - 1) * u * 0.24;
          const x = lerp(x0, this.CX, p1);     // la familia se reconoce en el centro
          const s = u * 0.075 * p0 * (1 - p3); // y todo se contrae al final
          const appear = Ease.outCubic(clamp01((this.t() - 0.3 - (r * 3 + i) * 0.12) / 0.6));
          // los laterales se funden en el del medio
          const alpha = 240 * appear * (i === 1 ? 1 : 1 - p1);
          if (alpha < 3 || s < 0.5) continue;

          if (sid === 'sub1') {
            // el tiempo: cuadrados, la opacidad
            drawSign('square', x, rowY, s, { fillCol: Palette.sub1.grays[1 + i], alpha });
          } else if (sid === 'sub2') {
            // el vínculo: círculos, el color
            drawSign('circle', x, rowY, s, { col: Palette.circleColor(i * 3 + 1), alpha, weight: 2.6 });
          } else {
            // el devenir: triángulos, el grosor de línea
            drawSign('triangle', x, rowY, s, { col: Palette.triColor(i * 3), alpha, weight: 1.2 + i * 1.6 });
          }
        }
      }
    }

    // la línea madre: sostiene todo y después se contrae
    if (p3 < 1) {
      const lw = this.W * 0.72 * (1 - p3) + u * 0.002;
      stroke(Palette.inkA((60 + 170 * p2) * (1 - p3 * 0.3)));
      strokeWeight(1.4 + p2);
      line(this.CX - lw / 2, cy, this.CX + lw / 2, cy);
    }

    // el punto: todo cabe acá, y late esperando que se vuelva a empezar
    if (p3 >= 1) {
      const b = 1 + 0.28 * Math.sin(this.t() * 2.4);
      noStroke();
      fill(Palette.inkA(255));
      circle(this.CX, cy, u * 0.016 * b);
      if (this.restarted()) {
        noFill();
        stroke(Palette.inkA(70 + 50 * Math.sin(this.t() * 2.4)));
        strokeWeight(1);
        circle(this.CX, cy, u * 0.075 * b);
      }
    }
  }
}
