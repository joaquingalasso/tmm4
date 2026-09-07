"use strict";
/* ============================================================
 * sub1.js — SUBSISTEMA 1 · EL TIEMPO
 * Sólo cuadrados. Se juega con la OPACIDAD.
 * La línea es la línea del tiempo: se lee de izquierda a derecha.
 * Referencia: Vera Molnár — orden con 1% de desorden.
 *
 * Interacción de los tres signos:
 *   PULSAR   opera el tiempo (inscribe, transmite, larga al tránsito)
 *   MANTENER lo relee: la opacidad, que es la materia de este
 *            subsistema, se vuelve visible como profundidad.
 * ============================================================ */

/* ------------------------------------------------------------
 * MEMORIA (como registro)
 * PULSAR inscribe un cuadrado: queda para siempre en la línea,
 * perdiendo opacidad con los años pero nunca hasta cero.
 * MANTENER es releer: una cabeza lectora recorre la línea una y
 * otra vez devolviéndole a cada marca su opacidad original, en
 * orden, y cada marca tiende un hilo hasta el eje. Se ve, de
 * golpe, todo lo que estaba inscripto y ya casi no se veía.
 * ------------------------------------------------------------ */
class MemoriaScene extends Scene {
  enter() {
    super.enter();
    this.marks = [];        // { x, y, s, g, born, glow }
    this.readX = -40;
  }

  lineY() { return this.H * 0.55; }

  onTap(x, y) {
    const d = Math.abs(y - this.lineY());
    const s = clampv(20 + d * 0.05, 10, this.U * 0.055);
    const g = 255 - clampv(d * 0.28, 0, 130);
    this.marks.push({ x, y, s, g, born: millis(), glow: 0 });
    if (this.marks.length > 400) this.marks.shift();
  }

  onHoldStart() { this.holding = true; this.readX = -40; }
  onHoldEnd() { this.holding = false; }

  update(dt) {
    this.updateHold(dt, 4);
    const ly = this.lineY();
    for (const m of this.marks) {
      // las marcas se asientan lentísimamente sobre la línea
      m.y += (ly - m.y) * dt * 0.018;
      m.glow = Math.max(0, m.glow - dt * (this.holding ? 0.9 : 2.2));
    }
    // la cabeza lectora sólo existe mientras se mantiene
    if (this.holding && this.marks.length > 0) {
      this.readX += this.W * dt / 1.15;
      for (const m of this.marks) {
        if (Math.abs(m.x - this.readX) < 16) m.glow = 1;
      }
      if (this.readX > this.W + 40) this.readX = -40;
    }
  }

  draw() {
    const k = this.enterK(1);
    const hk = this.holdK;
    rectMode(CENTER);
    setDash(Dash.none);

    // la línea del tiempo, con un temblor de mano
    const ly = this.lineY();
    stroke(Palette.inkA((120 + 70 * hk) * k));
    strokeWeight(1.4);
    let px = 0, py = ly + (noise(0, millis() / 4000) - 0.5) * 3;
    for (let x = 14; x <= this.W; x += 14) {
      const y = ly + (noise(x * 0.01, millis() / 4000) - 0.5) * 3;
      line(px, py, x, y);
      px = x; py = y;
    }

    // marcas: la opacidad ES el tiempo (piso 22: nada se borra del todo)
    for (const m of this.marks) {
      const age = (millis() - m.born) / 1000;
      const a = Math.max(22, 235 * Math.exp(-age / 30)) + m.glow * 150;

      // al mantener, cada marca tiende un hilo hasta la línea:
      // la distancia al eje se lee como profundidad del archivo
      if (hk > 0.02) {
        stroke(Palette.inkA(Math.min(120, a * 0.45) * hk * k));
        strokeWeight(1);
        line(m.x, m.y, m.x, ly);
      }

      noStroke();
      fill(m.g, m.g, m.g, Math.min(255, a * k));
      rect(m.x, m.y, m.s, m.s);
      // muesca en la línea: el índice del registro
      stroke(Palette.inkA(Math.min(255, (40 + a * 0.5) * k)));
      strokeWeight(1.4);
      line(m.x, ly - 5, m.x, ly + 5);
    }

    // la cabeza lectora
    if (hk > 0.02 && this.marks.length > 0) {
      noStroke();
      fill(Palette.inkA(235 * hk * k));
      rect(this.readX, ly, 7, 7);
      stroke(Palette.inkA(70 * hk * k));
      strokeWeight(1);
      line(this.readX, ly - this.U * 0.12, this.readX, ly + this.U * 0.12);
    }
  }
}

/* ------------------------------------------------------------
 * HERENCIA (como legado)
 * Reescrito según el video de referencia: el linaje avanza de
 * izquierda a derecha sobre la línea del tiempo. Una generación
 * SE APAGA mientras engendra, a su derecha, una columna de
 * descendientes que heredan su gris con una mutación mínima.
 * El individuo se extingue; la serie continúa.
 *
 * PULSAR   transmite: la generación viva cede su opacidad y nace
 *          la siguiente. El linaje no avanza solo: sin quien lo
 *          continúe, se queda donde está.
 * MANTENER es el legado: todos los antepasados apagados vuelven
 *          a encenderse a la vez, con el gris exacto que
 *          transmitieron. No hace falta dibujar el parentesco:
 *          la serie de grises alineada en el tiempo ya lo dice.
 * ------------------------------------------------------------ */
class HerenciaScene extends Scene {
  enter() {
    super.enter();
    this.rng = mulberry32(31);
    this.gens = [];
    this.camX = 0;
    this.camTarget = 0;
    this.lastStep = millis();
    this.gens.push({
      i: 0,
      nodes: [{ y: 0, g: 236, s: this.cellW() }],
      alpha: 0, target: 1, born: millis(),
    });
  }

  stepX() { return this.U * 0.235; }
  cellW() { return this.U * 0.075; }

  /** Nace la generación siguiente; la actual empieza a apagarse. */
  transmit() {
    const last = this.gens[this.gens.length - 1];
    if (millis() - last.born < 260) return;      // no se atropella
    const rng = this.rng;
    const count = 2 + Math.floor(rng() * 2.4);   // 2 a 4 descendientes
    const gap = this.cellW() * 1.38;
    const nodes = [];
    // el gris de la generación es lo que se transmite
    const pg = last.nodes.reduce((a, n) => a + n.g, 0) / last.nodes.length;
    for (let j = 0; j < count; j++) {
      nodes.push({
        y: (j - (count - 1) / 2) * gap,
        // 1% de desorden de Molnár: la herencia nunca es idéntica.
        // El leve tirón hacia el gris medio evita que el linaje se
        // vaya a un extremo y deje de leerse: siempre hay familia.
        g: clampv(pg + (rng() - 0.5) * 74 + (154 - pg) * 0.2, 62, 246),
        s: this.cellW() * (0.88 + rng() * 0.24),
      });
    }
    last.target = 0;                             // transmitir es apagarse
    this.gens.push({ i: last.i + 1, nodes, alpha: 0, target: 1, born: millis() });
    if (this.gens.length > 26) this.gens.shift();
    this.camTarget = Math.max(0, (last.i + 1) * this.stepX() - this.W * 0.55);
    this.lastStep = millis();
  }

  onTap() { this.transmit(); }
  onHoldStart() { this.holding = true; }
  onHoldEnd() { this.holding = false; }

  update(dt) {
    this.updateHold(dt, 3);
    for (const g of this.gens) {
      const spd = g.target > g.alpha ? 2.6 : 1.15;
      g.alpha += (g.target - g.alpha) * Math.min(1, dt * spd);
    }
    this.camX += (this.camTarget - this.camX) * Math.min(1, dt * 2.4);
  }

  draw() {
    const k = this.enterK(1);
    const hk = this.holdK;
    const cy = this.CY;
    rectMode(CENTER);
    setDash(Dash.none);

    push();
    translate(this.W * 0.17 - this.camX, 0);
    const sx = this.stepX();

    // las generaciones: la opacidad cuenta quién está vivo
    for (const g of this.gens) {
      const x = g.i * sx;
      if (x - this.camX < -this.W * 0.5 || x - this.camX > this.W * 1.2) continue;
      // apagado = 0; al mantener, el antepasado vuelve como memoria del gris
      const a = Math.max(g.alpha, hk * 0.52) * 255 * k;
      const bornK = Ease.outCubic(clamp01((millis() - g.born) / 420));
      for (const n of g.nodes) {
        noStroke();
        fill(n.g, n.g, n.g, a);
        rect(x, cy + n.y, n.s * bornK, n.s * bornK);
      }
    }
    pop();
  }
}


/* ------------------------------------------------------------
 * CADUCIDAD (como lo perdido en el tránsito)
 * Un convoy de cuadrados atraviesa la línea del tiempo, siempre
 * al mismo paso y siempre a la misma distancia uno de otro. Al
 * andar se gasta: pierde opacidad, se vuelve contorno y se
 * deshace donde la línea se corta. Nadie lo lanza y nadie lo
 * detiene: el tránsito ya estaba ocurriendo.
 *
 * Lo único que se puede hacer con lo que caduca es discutirle
 * el ritmo, y perder esa discusión:
 *
 * PULSAR   frena: el tránsito se resiste un instante y la parte
 *          entera de la línea se recupera un poco. La resistencia
 *          se afloja sola —hay que insistir— y nunca alcanza.
 * MANTENER apura: todo se acelera, la línea entera se come a sí
 *          misma y lo que quedaba se deshace más rápido.
 * ------------------------------------------------------------ */
class CaducidadScene extends Scene {
  enter() {
    super.enter();
    this.convoy = [];      // { p 0..1, s }
    this.shards = [];      // { x, y, vx, vy, life }
    this.resist = 0;       // cuánto se está frenando ahora mismo, 0..1
    this.flash = 0;        // el golpe visible de cada frenada
    // el convoy ya venía andando antes de que llegáramos
    for (let i = 0; i < 5; i++) this.convoy.push(this.make(0.9 - i * this.GAP));
  }

  get GAP() { return 0.17; }        // distancia fija entre cuadrados
  lineY() { return this.H * 0.52; }
  cutX() { return this.W * 0.84; }

  make(p) {
    const rng = mulberry32(Math.floor(p * 10000) + this.convoy.length * 37);
    return { p, s: this.U * (0.075 + rng() * 0.035) };
  }

  sqX(sq) { return lerp(-this.U * 0.1, this.cutX(), sq.p); }

  /** Frenar: se puede, un poco, por un rato. */
  onTap() {
    this.resist = Math.min(1, this.resist + 0.42);
    this.flash = 1;
  }

  onHoldStart() { this.holding = true; }
  onHoldEnd() { this.holding = false; }

  update(dt) {
    this.updateHold(dt, 4);
    const hk = this.holdK;

    // la resistencia se afloja sola: frenar nunca es definitivo
    this.resist = Math.max(0, this.resist - dt * 0.55);
    this.flash = Math.max(0, this.flash - dt * 2.4);

    // el paso del tránsito: frenado por el pulso, apurado por el sostén
    const speed = 0.038 * (1 - 0.8 * this.resist) * (1 + 2.6 * hk);

    for (let i = this.convoy.length - 1; i >= 0; i--) {
      const sq = this.convoy[i];
      sq.p += speed * dt;
      if (sq.p >= 1) {
        // se deshace en esquirlas (pequeños trazos, nunca otra figura)
        const x = this.sqX(sq), y = this.lineY() - sq.s * 0.6;
        for (let j = 0; j < 7; j++) {
          this.shards.push({
            x, y, life: 1,
            vx: 20 + Math.random() * 50,
            vy: (Math.random() - 0.2) * 60,
          });
        }
        this.convoy.splice(i, 1);
      }
    }

    // el relevo entra por distancia, no por tiempo: nunca se amontonan
    const last = this.convoy[this.convoy.length - 1];
    if (!last) this.convoy.push(this.make(0));
    else if (last.p >= this.GAP) this.convoy.push(this.make(last.p - this.GAP));

    for (let i = this.shards.length - 1; i >= 0; i--) {
      const sh = this.shards[i];
      sh.x += sh.vx * dt;
      sh.y += sh.vy * dt;
      sh.vy += 40 * dt;
      sh.life -= dt * 0.7;
      if (sh.life <= 0) this.shards.splice(i, 1);
    }
  }

  draw() {
    const k = this.enterK(1);
    const hk = this.holdK;
    const ly = this.lineY();
    rectMode(CENTER);

    // La línea del tránsito: entera hasta donde todavía alcanza,
    // marcada después. Frenar la recupera un poco; apurar se la come.
    const solidX = this.W * (0.58 + 0.2 * this.resist - 0.42 * hk);
    setDash(Dash.none);
    stroke(Palette.inkA((130 + 90 * this.flash) * k));
    strokeWeight(1.6);
    line(0, ly, solidX, ly);
    setDash(Dash.marca);
    stroke(Palette.inkA(90 * k));
    strokeWeight(1.4);
    line(solidX, ly, this.cutX(), ly);
    setDash(Dash.none);
    stroke(Palette.inkA(150 * k));
    strokeWeight(2);
    line(this.cutX(), ly - 8, this.cutX(), ly + 8);

    // el convoy que se gasta: entero mientras dura, marcado cuando ya no
    for (const sq of this.convoy) {
      const x = this.sqX(sq);
      const decay = 1 - sq.p;
      const sz = sq.s * (0.45 + 0.55 * decay);
      const a = 235 * Math.pow(decay, 1.2) * k;
      const y = ly - sz * 0.62;
      const tremble = hk * (noise(x, millis() / 60) - 0.5) * 6;
      if (sq.p < 0.55) {
        setDash(Dash.none);
        noStroke();
        fill(Palette.inkA(Math.max(30, a)));
        rect(x + tremble, y, sz, sz);
      } else {
        noFill();
        stroke(Palette.inkA(Math.max(26, a)));
        strokeWeight(1.3);
        setDash(Dash.marca);
        rect(x + tremble, y, sz, sz);
        setDash(Dash.none);
      }
    }

    // esquirlas del deshacerse
    setDash(Dash.none);
    for (const sh of this.shards) {
      stroke(Palette.inkA(160 * sh.life * k));
      strokeWeight(1.2);
      line(sh.x, sh.y, sh.x + 5, sh.y);
    }
  }
}
