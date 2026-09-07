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
 *
 * El sonido hace el mismo recorrido: primero las nueve voces, cada
 * una en la materia de su subsistema; después las tres familias
 * reconociéndose en un acorde; después las tres materias juntas
 * sobre la línea; y al final una sola nota grave que se contrae
 * con ella y queda latiendo en el punto.
 * ============================================================ */

class CierreScene extends Scene {
  enter() {
    super.enter();
    this.done = new Set();   // señales ya disparadas
    this.vPunto = null;      // la nota que queda en el punto
  }

  /** Dispara una sola vez, al pasar el segundo indicado. */
  cue(name, at, fn) {
    if (this.done.has(name) || this.t() < at) return;
    this.done.add(name);
    fn();
  }

  /** La voz de cada subsistema, en su materia. */
  voz(sid, i, gain, delay) {
    if (sid === 'sub1') Audio.tiempo(2 + i * 3, { gain, delay });
    else if (sid === 'sub2') Audio.vinculo(Palette.circleColor(i * 3 + 1), { gain, delay, dur: 2 });
    else Audio.devenir(2 + i * 2, { gain, delay, dur: 1.1 });
  }

  update(dt) {
    // las nueve, una por una, en el orden en que aparecen
    SYSTEM.order.forEach((sid, r) => {
      for (let i = 0; i < 3; i++) {
        this.cue('n' + r + i, 0.3 + (r * 3 + i) * 0.12,
          () => this.voz(sid, i, 0.16, 0));
      }
    });
    // cada familia se reconoce: un acorde por subsistema
    SYSTEM.order.forEach((sid, r) => {
      this.cue('fam' + r, 3.0 + r * 0.55, () => {
        for (let i = 0; i < 3; i++) this.voz(sid, i, 0.11, i * 0.03);
      });
    });
    // los tres se acuestan sobre la línea: las tres materias a la vez
    this.cue('linea', 5.4, () => {
      Audio.tiempo(0, { gain: 0.16, dur: 1.4 });
      Audio.vinculo(Palette.circleColor(4), { gain: 0.13, dur: 3.2 });
      Audio.devenir(0, { gain: 0.12, dur: 2.2 });
    });
    // la línea se contrae: una nota que baja y se cierra en el punto
    this.cue('punto', 7.8, () => {
      Audio.blip(Audio.note(5, 38), { type: 'triangle', dur: 1.6, gain: 0.2, cut: 900, glide: 0.5 });
      this.vPunto = Audio.voice(Audio.note(0, 38),
        { type: 'sine', gain: 0.055, cut: 700, glide: 0.4 });
    });
    // y el punto late
    if (this.vPunto) {
      this.vPunto.set(Audio.note(0, 38), 0.04 + 0.025 * (0.5 + 0.5 * Math.sin(this.t() * 2.4)));
    }
  }

  /** Progreso 0..1 de una fase [a, b], en segundos de escena. */
  phase(a, b) { return clamp01((this.t() - a) / (b - a)); }

  /** Cuándo el punto ya está solo y admite el gesto de volver. */
  restarted() { return this.t() > 9.4; }

  onTap() {
    if (!this.restarted()) return;
    Audio.blip(Audio.note(9, 50), { type: 'sine', dur: 0.9, gain: 0.16 });
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
