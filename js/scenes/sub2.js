"use strict";
/* ============================================================
 * sub2.js — SUBSISTEMA 2 · EL VÍNCULO
 * Sólo círculos, sin relleno. Se juega con el COLOR.
 * La línea es la línea del vínculo: une, se tensa, se tiñe.
 * Referencias: la diana (Kandinsky, círculos concéntricos),
 * las tramas vibrátiles de color de Julio Le Parc.
 *
 * Interacción de los tres signos:
 *   PULSAR   suma color al vínculo (un anillo, un envío, un otro)
 *   MANTENER hace visible qué hace el color cuando dos se
 *            encuentran: alinea, mezcla, teje.
 * ============================================================ */

/* ------------------------------------------------------------
 * IDENTIDAD (como afirmación de sí)
 * PULSAR agrega un anillo de color: la afirmación crece desde el
 * centro hacia afuera y la combinación resultante no la tiene
 * nadie más. Los anillos viven excéntricos, cada uno a su ritmo:
 * la identidad no es rígida.
 * MANTENER es decir "yo soy": los anillos dejan de vagar, se
 * alinean en una sola diana concéntrica y laten al mismo tiempo.
 * Eran, desde siempre, una sola figura.
 * ------------------------------------------------------------ */
class IdentidadScene extends Scene {
  enter() {
    super.enter();
    this.rings = [];     // { r, col, w, ecc, spd, phase, born }
    this.colIdx = Math.floor(Math.random() * 10);
  }

  maxR() { return this.U * 0.36; }

  onTap() {
    if (this.rings.length >= 14) return;
    const n = this.rings.length;
    this.colIdx = (this.colIdx + 1 + Math.floor(Math.random() * 3)) % 10;
    this.rings.push({
      r: this.U * 0.045 * (n + 1),
      col: Palette.circleColor(this.colIdx),
      w: 2 + Math.random() * 3.5,
      ecc: this.U * (0.006 + Math.random() * 0.016),
      spd: (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.9),
      phase: Math.random() * TWO_PI,
      born: millis(),
    });
  }

  onHoldStart() { this.holding = true; }
  onHoldEnd() { this.holding = false; }

  update(dt) { this.updateHold(dt, 4); }

  draw() {
    const k = this.enterK(1);
    const tt = this.t();
    const hk = this.holdK;
    setDash(Dash.none);

    // al afirmarse, la diana entera respira al mismo tiempo
    const breathe = 1 + 0.045 * hk * Math.sin(tt * 6.5);

    for (let i = this.rings.length - 1; i >= 0; i--) {
      const rg = this.rings[i];
      const bornK = Ease.outBack(clamp01((millis() - rg.born) / 600));
      // mantener anula la excentricidad: los anillos se centran
      const ecc = rg.ecc * (1 - hk);
      const ox = Math.cos(tt * rg.spd + rg.phase) * ecc;
      const oy = Math.sin(tt * rg.spd * 0.8 + rg.phase) * ecc;
      const col = color(rg.col);
      col.setAlpha(235 * k);
      noFill();
      stroke(col);
      strokeWeight((rg.w + hk * 1.8) * bornK);
      circle(this.CX + ox, this.CY + oy, rg.r * 2 * bornK * breathe);
    }

    // el centro: el punto en que se es
    noFill();
    stroke(Palette.inkA(250 * k));
    strokeWeight(2.4);
    circle(this.CX, this.CY, this.U * 0.022 * (1 + hk * 0.5));
  }
}

/* ------------------------------------------------------------
 * EMPATÍA (como comprensión del otro)
 * Dos círculos, cada uno con su color. El otro anda su deriva
 * lenta; yo estoy donde estoy. Todo el signo es una operación de
 * color, y sólo pasan dos cosas:
 *
 * PULSAR envía: una pelotita de mi color viaja hasta el otro,
 *        que la devuelve con el suyo. En cada ida y vuelta cada
 *        uno se corre un paso hacia el tono del otro —dar color
 *        es recibirlo— pero nunca lo alcanza: teñirse del otro
 *        no es volverse el otro.
 * MANTENER es comprender: alrededor de los dos se cierra un
 *        círculo que los toma juntos, del tercer color que sale
 *        de mezclar los dos y que no es de ninguno. Mientras
 *        dura, se acercan y andan quietos.
 *        Al soltar, todo vuelve a como estaba: la comprensión no
 *        se guarda, se sostiene. Lo único que queda es el color
 *        que se intercambiaron.
 * ------------------------------------------------------------ */
class EmpatiaScene extends Scene {
  enter() {
    super.enter();
    // dos tonos separados ~113° del círculo cromático: ni iguales
    // ni opuestos, para que el tono intermedio sea un color nuevo
    // y reconocible (rosa + verde dan naranja)
    this.myBase = Palette.circleColor(6);      // rosa
    this.otherBase = Palette.circleColor(7);   // verde
    this.tint = 0;              // cuánto se tiñó cada uno del otro
    this.TINT_MAX = 0.26;       // nunca 0.5
    this.pulses = [];           // { p 0..1, col, back }
    this.noiseT = Math.random() * 100;
    this.home = { x: this.W * 0.32, y: this.H * 0.5 };
    this.me = { x: this.W * 0.32, y: this.H * 0.5 };
    this.other = { x: this.W * 0.68, y: this.H * 0.5 };
    this._recolor();
  }

  /** Cada uno es su tono corrido hacia el del otro, nunca más allá. */
  _recolor() {
    this.myCol = Palette.mixHue(this.myBase, this.otherBase, this.tint);
    this.otherCol = Palette.mixHue(this.otherBase, this.myBase, this.tint);
  }

  /** El tercer color: el que sale de los dos y no es de ninguno. */
  thirdCol() { return Palette.mixHue(this.myCol, this.otherCol, 0.5, 1.75, -0.03); }

  onTap() {
    if (this.pulses.length > 3) return;
    this.pulses.push({ p: 0, col: this.myCol, back: false });
  }

  onHoldStart() { this.holding = true; }
  onHoldEnd() { this.holding = false; }

  update(dt) {
    this.updateHold(dt, 2.4);
    const hk = this.holdK;
    const o = this.other, m = this.me;

    // la deriva del otro: lenta y continua, nunca un rebote.
    // mientras se lo comprende, se aquieta.
    this.noiseT += dt * 0.13 * (1 - 0.85 * hk);
    const dx = this.W * (0.5 + 0.2 * (noise(this.noiseT) - 0.5) * 2);
    const dy = this.H * (0.5 + 0.17 * (noise(this.noiseT + 40) - 0.5) * 2);

    // al comprenderse se acercan y se acomodan en el centro del
    // encuadre, para que el círculo que los toma juntos entre entero
    const near = this.U * 0.17;
    const otx = lerp(dx, this.CX + near, hk);
    const oty = lerp(dy, this.CY, hk);
    const mtx = lerp(this.home.x, this.CX - near, hk);
    const mty = lerp(this.home.y, this.CY, hk);

    o.x += (otx - o.x) * Math.min(1, dt * 2.2);
    o.y += (oty - o.y) * Math.min(1, dt * 2.2);
    m.x += (mtx - m.x) * Math.min(1, dt * 2.2);
    m.y += (mty - m.y) * Math.min(1, dt * 2.2);

    // los envíos van y vuelven; cada vuelta corre un paso el color
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.p += dt * 0.85;
      if (p.p >= 1) {
        if (!p.back) {
          this.pulses.push({ p: 0, col: this.otherCol, back: true });
        } else {
          this.tint = Math.min(this.TINT_MAX, this.tint + 0.055);
          this._recolor();
        }
        this.pulses.splice(i, 1);
      }
    }
  }

  draw() {
    const k = this.enterK(1);
    const hk = this.holdK;
    const o = this.other, m = this.me;
    setDash(Dash.none);
    noFill();

    const rMe = this.U * 0.09;
    const rOther = this.U * 0.11;

    // la línea del vínculo: siempre está, y se afirma al comprender
    const link = Palette.alphaOf(this.thirdCol(), (55 + 150 * hk) * k);
    stroke(link);
    strokeWeight(1 + 2 * hk);
    // de borde a borde: la línea une, no atraviesa
    const la = Math.atan2(o.y - m.y, o.x - m.x);
    line(m.x + Math.cos(la) * rMe, m.y + Math.sin(la) * rMe,
         o.x - Math.cos(la) * rOther, o.y - Math.sin(la) * rOther);

    // EL CÍRCULO QUE LOS TOMA JUNTOS: sólo mientras se mantiene
    if (hk > 0.01) {
      const cx = (m.x + o.x) / 2, cy = (m.y + o.y) / 2;
      const d = dist(m.x, m.y, o.x, o.y);
      const r = (d / 2 + Math.max(rMe, rOther) + this.U * 0.055);
      stroke(Palette.alphaOf(this.thirdCol(), 225 * hk * k));
      strokeWeight(2.6 * hk);
      circle(cx, cy, r * 2 * (0.86 + 0.14 * hk));
    }

    // la pelotita que se devuelven
    for (const p of this.pulses) {
      const from = p.back ? o : m, to = p.back ? m : o;
      const e = Ease.inOutCubic(p.p);
      stroke(Palette.alphaOf(p.col, 240 * k));
      strokeWeight(2.2);
      circle(lerp(from.x, to.x, e), lerp(from.y, to.y, e), this.U * 0.036);
    }

    // los dos, cada uno con su color
    stroke(Palette.alphaOf(this.otherCol, 250 * k));
    strokeWeight(3.4);
    circle(o.x, o.y, rOther * 2);

    stroke(Palette.alphaOf(this.myCol, 250 * k));
    strokeWeight(3.4);
    circle(m.x, m.y, rMe * 2);
  }
}

/* ------------------------------------------------------------
 * COLABORACIÓN (como coexistencia de lo diverso)
 * PULSAR suma un diverso: un círculo de otro color aparece donde
 * se pulsó y deriva hasta el círculo común, donde toma su puesto
 * en la trama. Nadie se impone adentro: se llega.
 * MANTENER es ponerse de acuerdo: se apaga el desfase entre los
 * anillos y el pulso propio de cada uno. Todos giran en el mismo
 * sentido y a la misma velocidad, y laten a la vez, como un solo
 * cuerpo; entre vecinos se tienden las cuerdas. Nadie cambia de
 * color ni de tamaño: lo que se ordena es el movimiento.
 * ------------------------------------------------------------ */
class ColaboracionScene extends Scene {
  enter() {
    super.enter();
    this.members = [];   // { slot, x, y, col, k, sz }
    this.free = [];      // { x, y, col, vx, vy, sz }
    this.rot = 0;
    this.colIdx = Math.floor(Math.random() * 10);
    // trama concéntrica: anillos de puestos
    this.slots = [];
    const d = this.U * 0.052;
    for (let ring = 0; ring * d <= this.commonsR(); ring++) {
      const rr = ring === 0 ? 0 : ring * d;
      const n = ring === 0 ? 1 : Math.floor(TWO_PI * rr / d);
      for (let j = 0; j < n; j++) {
        this.slots.push({ r: rr, ang: j * TWO_PI / Math.max(1, n) + ring * 0.7 });
      }
    }
  }

  commonsR() { return this.U * 0.3; }

  onTap(x, y) {
    if (this.members.length + this.free.length >= this.slots.length) return;
    if (dist(x, y, this.CX, this.CY) < this.commonsR()) return; // adentro no se impone: se llega
    this.colIdx = (this.colIdx + 1 + Math.floor(Math.random() * 4)) % 10;
    this.free.push({
      x, y, col: Palette.circleColor(this.colIdx),
      vx: 0, vy: 0, sz: 0.6 + Math.random() * 0.9,
    });
  }

  onHoldStart() { this.holding = true; }
  onHoldEnd() { this.holding = false; }

  update(dt) {
    this.updateHold(dt, 2);
    // la obra común gira despacio, y al ponerse de acuerdo apenas
    // toma cuerpo: colaborar no es acelerar, es ir a un mismo paso
    this.rot += (0.05 + 0.13 * this.holdK) * dt;

    for (let i = this.free.length - 1; i >= 0; i--) {
      const f = this.free[i];
      const ang = Math.atan2(this.CY - f.y, this.CX - f.x);
      f.vx += Math.cos(ang) * this.U * 0.24 * dt;
      f.vy += Math.sin(ang) * this.U * 0.24 * dt;
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (dist(f.x, f.y, this.CX, this.CY) < this.commonsR() * 1.02) {
        this.members.push({ slot: this.members.length, col: f.col, k: 0, x: f.x, y: f.y, sz: f.sz });
        this.free.splice(i, 1);
      }
    }
    for (const mb of this.members) mb.k = Math.min(1, mb.k + dt * 1.6);
  }

  draw() {
    const k = this.enterK(1);
    const tt = this.t();
    const hk = this.holdK;
    setDash(Dash.none);
    noFill();

    // el círculo común: una línea curva que espera
    stroke(Palette.inkA((50 + 40 * Math.sin(tt * 1.2)) * k));
    strokeWeight(1.2);
    circle(this.CX, this.CY, this.commonsR() * 2);

    // la trama de los diversos (vibración Le Parc)
    for (const mb of this.members) {
      const sl = this.slots[mb.slot];
      // el anillo de afuera va más rápido que el de adentro… hasta que
      // se ponen de acuerdo: entonces la trama gira como una sola pieza
      const ang = sl.ang + this.rot * (1 + (sl.r / this.commonsR()) * 0.15 * (1 - hk));
      // y cada uno deja su pulso propio para latir con los demás
      const phase = lerp(mb.slot * 1.7, 0, hk);
      const vib = Math.sin(tt * 3.4 + phase) * this.U * (0.0022 + 0.0026 * hk);
      mb.tx = this.CX + Math.cos(ang) * (sl.r + vib);
      mb.ty = this.CY + Math.sin(ang) * (sl.r + vib);
      mb.x = lerp(mb.x, mb.tx, Math.min(1, mb.k));
      mb.y = lerp(mb.y, mb.ty, Math.min(1, mb.k));
    }

    // las cuerdas: al mantener se ve la figura que hacen entre todos
    if (hk > 0.02 && this.members.length > 1) {
      strokeWeight(1.3);
      for (let i = 0; i < this.members.length; i++) {
        const a = this.members[i];
        for (let j = i + 1; j < this.members.length; j++) {
          const b = this.members[j];
          const d = dist(a.x, a.y, b.x, b.y);
          if (d > this.U * 0.1) continue;
          // la cuerda es la mezcla de los dos colores: nadie se funde,
          // pero entre los dos hay algo
          const c = Palette.mixHue(a.col, b.col, 0.5, 1.1);
          c.setAlpha(200 * hk * k * (1 - d / (this.U * 0.1)));
          stroke(c);
          line(a.x, a.y, b.x, b.y);
        }
      }
    }

    // cada uno, con su color
    for (const mb of this.members) {
      const col = color(mb.col);
      col.setAlpha(240 * k);
      noFill();
      stroke(col);
      strokeWeight(2 + hk * 0.8);
      circle(mb.x, mb.y, this.U * 0.032 * mb.sz);
    }

    // los que todavía llegan
    for (const f of this.free) {
      const col = color(f.col);
      col.setAlpha(220 * k);
      noFill();
      stroke(col);
      strokeWeight(2);
      circle(f.x, f.y, this.U * 0.032 * f.sz);
    }
  }
}
