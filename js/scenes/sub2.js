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
    // la nota del anillo es su color: la diana que armás es un acorde
    // que no tiene nadie más
    Audio.vinculo(Palette.circleColor(this.colIdx), { gain: 0.15, dur: 2.4 });
  }

  /** Afirmarse es sonar entero: todos los anillos a la vez. */
  onHoldStart() {
    this.holding = true;
    this.rings.forEach((rg, i) =>
      Audio.vinculo(rg.col, { gain: 0.11, dur: 2.8, delay: i * 0.035 }));
  }
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
 *
 * Yo soy un círculo con mi color y mi tamaño. El otro es otro
 * círculo: otro color, otro tamaño, otro lugar, y anda su deriva.
 * Entre los dos hay una línea, y esa línea es lo que compartimos:
 * un degradado que va de mi color al suyo.
 *
 * PULSAR   es dar y recibir: me acerco un paso Y en el mismo gesto
 *          le paso algo de mi color y me llevo algo del suyo. Los
 *          dos cambiamos, siempre a la par, y la línea que nos une
 *          se enciende con lo que acaba de pasar por ella. Nunca
 *          llegamos a ser el color del otro: compartir no es
 *          volverse el otro.
 *
 *          Y esto no queda solo: si dejo de pulsar, el color
 *          compartido se va soltando y mi lugar se corre de vuelta
 *          a donde estaba. Lo que no se sostiene se pierde: hay
 *          que volver a acercarse y volver a dar.
 *
 * MANTENER es ponerse en su lugar: mi círculo deja el suyo, viaja
 *          hasta donde está el otro y en el camino se vuelve de su
 *          tamaño y de su color, hasta quedar al lado suyo,
 *          idéntico. Por un momento no se distingue quién es cada
 *          uno: eso es comprender.
 *          De eso sí queda algo. Al soltar vuelvo a mi lugar, pero
 *          con un paso de su color que ya no se me va, ni aunque
 *          deje de tocar. Lo compartido se sostiene o se pierde;
 *          lo que aprendiste estando en su lugar, no.
 * ------------------------------------------------------------ */
class EmpatiaScene extends Scene {
  enter() {
    super.enter();
    this.myOrigin = color(Palette.circleColor(6));
    this.share = 0;        // lo que nos estamos pasando ahora
    this.keep = 0;         // lo que me quedó de estar en su lugar
    this.SHARE_MAX = 0.3;   // ni compartiendo todo se llega a la mitad
    this.KEEP_MAX = 0.24;

    this.origin = { x: this.W * 0.3, y: this.H * 0.66 };   // mi lugar de siempre
    this.home = { x: this.origin.x, y: this.origin.y };
    this.homeT = { x: this.origin.x, y: this.origin.y };
    this.me = { x: this.origin.x, y: this.origin.y };

    this.bump = 0;         // "hasta acá llego"
    this.flash = 0;        // el destello de cada intercambio
    this.colIdx = 1;
    this.other = null;
    this.newOther();
    this.noiseT = Math.random() * 100;
    this.swap = 0;         // 0..1: cuánto estoy en el lugar del otro
    this.wasThere = false;
    // durante la transición de entrada se dibuja sin haber pasado
    // todavía por update: el estado tiene que estar completo acá
    this.meR = this.myR();
    this._recolor();
    this.meCol = this.myBase;

    // Cada uno suena su color. Como el color ES la altura, todo el
    // signo se oye solo: al compartir, las dos notas se acercan; al
    // ponerme en su lugar, llegan al unísono; al soltarse, se separan.
    this.vMe = Audio.voice(Audio.hueNote(this.meCol), { type: 'sine', gain: 0.1, glide: 0.12 });
    this.vOther = Audio.voice(Audio.hueNote(this.other.col), { type: 'sine', gain: 0.1, glide: 0.12 });
  }

  myR() { return this.U * 0.072; }

  /**
   * Otro distinto: otro color, otro tamaño, otro lugar.
   * El color se elige lejos del mío en el círculo cromático y el
   * tamaño, francamente mayor o menor que el mío: si el otro se me
   * pareciera, ni el intercambio ni ponerse en su lugar se notarían.
   */
  newOther() {
    let best = 0, bestD = -1;
    for (let i = 0; i < 10; i++) {
      const d = Palette.hueDist(Palette.circleColor(i), this.myOrigin) + Math.random() * 45;
      if (d > bestD) { bestD = d; best = i; }
    }
    this.colIdx = best;
    const nx = this.W * (0.52 + Math.random() * 0.26);
    const ny = this.H * (0.3 + Math.random() * 0.16);
    const nr = this.myR() * (Math.random() < 0.5 ? 0.52 + Math.random() * 0.13
                                                 : 1.55 + Math.random() * 0.35);
    this.otherOrigin = color(Palette.circleColor(this.colIdx));
    this.other = { x: nx, y: ny, r: nr, col: this.otherOrigin, ox: nx, oy: ny };
  }

  /** Los dos colores, corridos uno hacia el otro por lo compartido. */
  _recolor() {
    this.myBase = Palette.mixHue(this.myOrigin, this.otherOrigin,
                                 Math.min(0.48, this.share + this.keep));
    this.other.col = Palette.mixHue(this.otherOrigin, this.myOrigin, this.share);
  }

  /** Dar y recibir: acercarse un paso e intercambiar color. */
  onTap() {
    const o = this.other;
    this.share = Math.min(this.SHARE_MAX, this.share + 0.09);
    this.flash = 1;
    // el intercambio suena de los dos lados a la vez
    Audio.vinculo(this.meCol, { gain: 0.13, dur: 0.9 });
    Audio.vinculo(o.col, { gain: 0.13, dur: 0.9, delay: 0.05 });

    const minGap = (this.myR() + o.r) * 1.7;   // cerca, pero sin encimarse
    const d = dist(this.homeT.x, this.homeT.y, o.x, o.y);
    if (d <= minGap + 3) { this.bump = 1; return; }
    const target = Math.max(minGap, d - (d - minGap) * 0.42);
    const ang = Math.atan2(this.homeT.y - o.y, this.homeT.x - o.x);
    this.homeT.x = o.x + Math.cos(ang) * target;
    this.homeT.y = o.y + Math.sin(ang) * target;
  }

  onHoldStart() { this.holding = true; }
  onHoldEnd() { this.holding = false; }

  update(dt) {
    this.updateHold(dt, 2.2);
    const o = this.other;
    this.bump = Math.max(0, this.bump - dt * 1.8);
    this.flash = Math.max(0, this.flash - dt * 1.7);

    // Lo compartido no queda solo: si nadie lo sostiene, se suelta,
    // y mi lugar se corre de vuelta a donde estaba. Mientras estoy
    // en su lugar, en cambio, nada se afloja.
    if (!this.holding) {
      this.share = Math.max(0, this.share - dt * 0.028);
      this.homeT.x += (this.origin.x - this.homeT.x) * Math.min(1, dt * 0.1);
      this.homeT.y += (this.origin.y - this.homeT.y) * Math.min(1, dt * 0.1);
    }

    // mi lugar se corre de a pasos, con inercia
    this.home.x += (this.homeT.x - this.home.x) * Math.min(1, dt * 3.4);
    this.home.y += (this.homeT.y - this.home.y) * Math.min(1, dt * 3.4);

    // el otro anda su deriva, lenta y continua; al ir a su lugar se aquieta
    this.noiseT += dt * 0.12 * (1 - 0.9 * this.holdK);
    const wx = o.ox + (noise(this.noiseT) - 0.5) * this.U * 0.16;
    const wy = o.oy + (noise(this.noiseT + 40) - 0.5) * this.U * 0.13;
    o.x += (clampv(wx, this.U * 0.16, this.W - this.U * 0.16) - o.x) * Math.min(1, dt * 1.8);
    o.y += (clampv(wy, this.U * 0.16, this.H * 0.72) - o.y) * Math.min(1, dt * 1.8);

    // ponerse en su lugar, y volver
    this.swap += (this.holdK - this.swap) * Math.min(1, dt * 3);
    if (this.swap > 0.9) this.wasThere = true;
    if (this.wasThere && this.swap < 0.06) {
      // de haber estado en su lugar queda un paso que ya no se suelta
      this.keep = Math.min(this.KEEP_MAX, this.keep + 0.09);
      this.wasThere = false;
    }

    this._recolor();

    // dónde estoy: en mi lugar, o al lado suyo si estoy yendo
    const s = Ease.inOutCubic(clamp01(this.swap));
    const r = lerp(this.myR(), o.r, s);
    const ang = Math.atan2(this.home.y - o.y, this.home.x - o.x);
    this.me.x = lerp(this.home.x, o.x + Math.cos(ang) * (o.r + r) * 1.14, s);
    this.me.y = lerp(this.home.y, o.y + Math.sin(ang) * (o.r + r) * 1.14, s);
    this.meR = r;
    this.meCol = Palette.mixHue(this.myBase, o.col, s);

    // las dos notas siguen a los dos colores, frame a frame
    const swell = 0.09 + 0.06 * this.flash + 0.03 * s;
    if (this.vMe) this.vMe.set(Audio.hueNote(this.meCol), swell);
    if (this.vOther) this.vOther.set(Audio.hueNote(o.col), swell);
  }

  draw() {
    const k = this.enterK(1);
    const o = this.other;
    const m = this.me;
    const s = Ease.inOutCubic(clamp01(this.swap));
    setDash(Dash.none);
    noFill();

    const d = dist(m.x, m.y, o.x, o.y);
    const gap = d - this.meR - o.r;

    /* LO COMPARTIDO — la línea entre los dos no es de un color:
     * es un degradado que va del mío al suyo. Cuanto más nos
     * pasamos, más se enciende; al soltarse, se apaga sola. */
    if (gap > 3) {
      const ang = Math.atan2(o.y - m.y, o.x - m.x);
      const ax = m.x + Math.cos(ang) * this.meR, ay = m.y + Math.sin(ang) * this.meR;
      const bx = o.x - Math.cos(ang) * o.r,      by = o.y - Math.sin(ang) * o.r;
      const near = clamp01(1 - gap / (this.U * 0.55));
      const carga = clamp01(this.share / this.SHARE_MAX);
      const segs = 14;
      for (let i = 0; i < segs; i++) {
        const t0 = i / segs, t1 = (i + 1) / segs;
        const c = Palette.mixHue(this.meCol, o.col, (t0 + t1) / 2, 1 + 0.5 * carga);
        c.setAlpha((28 + 60 * near + 90 * carga + 110 * this.flash) * k);
        stroke(c);
        strokeWeight(1 + 1.4 * carga + 2.2 * this.flash);
        line(lerp(ax, bx, t0), lerp(ay, by, t0), lerp(ax, bx, t1), lerp(ay, by, t1));
      }
    }

    // mi lugar queda marcado mientras no estoy en él
    if (s > 0.05) {
      stroke(Palette.alphaOf(this.myBase, 60 * s * k));
      strokeWeight(1);
      circle(this.home.x, this.home.y, this.myR() * 2);
    }

    // el tope: más cerca que esto no se llega estando de este lado
    if (this.bump > 0.02) {
      stroke(Palette.alphaOf(this.meCol, 190 * this.bump * k));
      strokeWeight(1.6);
      circle(m.x, m.y, this.meR * 2 * (1 + 0.5 * (1 - this.bump)));
    }

    // los dos, cada uno con el color que tiene ahora
    stroke(Palette.alphaOf(o.col, 250 * k));
    strokeWeight(3.4 + 1.2 * this.flash);
    circle(o.x, o.y, o.r * 2);

    stroke(Palette.alphaOf(this.meCol, 250 * k));
    strokeWeight(3.4 + 1.2 * this.flash);
    circle(m.x, m.y, this.meR * 2);
  }
}

/* ------------------------------------------------------------
 * COLABORACIÓN (como coexistencia de lo diverso)
 * PULSAR suma un diverso: un círculo de otro color aparece donde
 * se pulsó y deriva hasta el círculo común, donde toma su puesto
 * en la trama. Nadie se impone adentro: se llega.
 * En reposo cada uno anda por su cuenta: gira a su ritmo, para su
 * lado, y se corre de su puesto. Están todos adentro del círculo
 * común, pero no hacen nada juntos: es una nube.
 * MANTENER es ponerse de acuerdo. Cada uno vuelve a su puesto en la
 * trama, deja su ritmo propio y toma el de todos: la nube se cierra
 * en una sola figura que gira entera, en un mismo sentido y a un
 * mismo paso. Nadie cambia de color ni de tamaño: lo único que se
 * ordena —y se ve ordenarse— es el movimiento.
 * ------------------------------------------------------------ */
class ColaboracionScene extends Scene {
  enter() {
    super.enter();
    this.members = [];   // { slot, x, y, col, k, sz }
    this.free = [];      // { x, y, col, vx, vy, sz }
    this.rot = 0;
    this.beat = 0;        // el compás común, el que se toma al acordar
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
    const hk = this.holdK;
    // el paso común: existe siempre, pero recién se siente cuando
    // todos lo toman
    this.rot += (0.06 + 0.3 * hk) * dt;

    // En reposo cada uno suena cuando le toca a él, y se oye disperso.
    // Al ponerse de acuerdo dejan su compás y entran todos en uno solo:
    // lo que era goteo se vuelve un acorde repetido.
    const tt = this.t();
    if (hk > 0.55) {
      this.beat += dt;
      if (this.beat > 1.15) {
        this.beat = 0;
        this.members.forEach((mb, i) => {
          if (i % 3 === 0) Audio.vinculo(mb.col, { gain: 0.08, dur: 1.4, delay: i * 0.006 });
          mb.next = tt + 1.5 + Math.random() * 2;
        });
      }
    } else {
      for (const mb of this.members) {
        if (tt > mb.next) {
          mb.next = tt + mb.every;
          Audio.vinculo(mb.col, { gain: 0.07, dur: 1.3 });
        }
      }
    }

    for (const mb of this.members) {
      // cada uno anda a su ritmo mientras nadie los ordena…
      mb.phase += dt * mb.spd * (1 - hk);
      // …y al ponerse de acuerdo vuelve a su puesto por el arco corto
      if (hk > 0.01) {
        const d = Math.atan2(Math.sin(-mb.phase), Math.cos(-mb.phase));
        mb.phase += d * Math.min(1, dt * 1.7 * hk);
      }
    }

    for (let i = this.free.length - 1; i >= 0; i--) {
      const f = this.free[i];
      const ang = Math.atan2(this.CY - f.y, this.CX - f.x);
      f.vx += Math.cos(ang) * this.U * 0.24 * dt;
      f.vy += Math.sin(ang) * this.U * 0.24 * dt;
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (dist(f.x, f.y, this.CX, this.CY) < this.commonsR() * 1.02) {
        this.members.push({
          slot: this.members.length, col: f.col, k: 0, x: f.x, y: f.y, sz: f.sz,
          // el ritmo propio de cada uno: su velocidad, su sentido y su vaivén
          spd: (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.75),
          wob: 0.7 + Math.random() * 1.6,
          phase: 0,        // cuánto se corrió de su puesto en la trama
          // su propio compás: cada cuánto suena mientras anda solo
          every: 2.2 + Math.random() * 3.4,
          next: this.t() + 0.4 + Math.random() * 3,
        });
        Audio.vinculo(f.col, { gain: 0.13, dur: 1.2 });
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
      // el puesto que le toca, más lo que se corrió andando por su cuenta
      const ang = sl.ang + this.rot + mb.phase;
      // y el vaivén propio, que también se aquieta al ponerse de acuerdo
      const rad = sl.r + Math.sin(tt * mb.wob + mb.slot) * this.U * 0.03 * (1 - hk);
      mb.tx = this.CX + Math.cos(ang) * rad;
      mb.ty = this.CY + Math.sin(ang) * rad;
      mb.x = lerp(mb.x, mb.tx, Math.min(1, mb.k));
      mb.y = lerp(mb.y, mb.ty, Math.min(1, mb.k));
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
