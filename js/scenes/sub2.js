"use strict";
/* ============================================================
 * sub2.js — SUBSISTEMA 2 · EL VÍNCULO
 * Sólo círculos. Se juega con el COLOR.
 * La línea es la línea del vínculo: une, se tensa, se afirma.
 * Referencias: la diana (Kandinsky, círculos concéntricos),
 * las tramas vibrátiles de color de Julio Le Parc.
 * ============================================================ */

/* ------------------------------------------------------------
 * IDENTIDAD (como afirmación de sí)
 * Una diana propia: cada tap agrega un anillo de color — la
 * afirmación crece desde el centro hacia afuera. Los anillos
 * viven levemente excéntricos (la identidad no es rígida);
 * mantener el centro presionado los alinea: "yo soy".
 * Al fondo, dianas grises de otros que no podemos tocar.
 * ------------------------------------------------------------ */
class IdentidadScene extends Scene {
  enter() {
    super.enter();
    this.rings = [];     // { r, col, w, ecc, spd, phase, born }
    this.holdOn = false;
    this.alignK = 0;
    this.colIdx = Math.floor(Math.random() * 10);
  }

  maxR() { return this.U * 0.36; }

  onTap(x, y) {
    if (this.rings.length >= 14) return;
    const n = this.rings.length;
    this.colIdx = (this.colIdx + 1 + Math.floor(Math.random() * 3)) % 10;
    this.rings.push({
      r: this.U * 0.05 * (n + 1),
      col: Palette.circleColor(this.colIdx),
      w: 2 + Math.random() * 3.5,
      ecc: this.U * (0.004 + Math.random() * 0.012),
      spd: (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.9),
      phase: Math.random() * TWO_PI,
      born: millis(),
    });
  }

  onHoldStart(x, y) {
    if (dist(x, y, this.CX, this.CY) < this.maxR()) this.holdOn = true;
  }
  onHoldEnd() { this.holdOn = false; }

  update(dt) {
    const target = this.holdOn ? 1 : 0;
    this.alignK += (target - this.alignK) * Math.min(1, dt * 4);
  }

  draw() {
    const k = this.enterK(1);
    const tt = this.t();

    // los otros: dianas grises, lejanas, intocables
    for (const [ox, oy] of [[0.14, 0.2], [0.87, 0.26], [0.16, 0.82], [0.85, 0.8]]) {
      noFill();
      for (let i = 1; i <= 3; i++) {
        stroke(Palette.inkA(26 * k));
        strokeWeight(1);
        circle(this.W * ox, this.H * oy, this.U * 0.028 * i);
      }
    }

    // la diana propia
    const breathe = this.holdOn ? 1 + 0.04 * Math.sin(tt * 7) : 1;
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const rg = this.rings[i];
      const bornK = Ease.outBack(clamp01((millis() - rg.born) / 600));
      // excentricidad leve: la identidad vibra pero sigue siendo una diana
      const ecc = rg.ecc * (1 - this.alignK);
      const ox = Math.cos(tt * rg.spd + rg.phase) * ecc;
      const oy = Math.sin(tt * rg.spd * 0.8 + rg.phase) * ecc;
      const col = color(rg.col);
      col.setAlpha(235 * k);
      noFill();
      stroke(col);
      strokeWeight((rg.w + this.alignK * 1.5) * bornK);
      circle(this.CX + ox, this.CY + oy, rg.r * 2 * bornK * breathe);
    }

    // el centro: el punto en que se es
    noStroke();
    fill(Palette.inkA(250 * k));
    circle(this.CX, this.CY, this.U * 0.022 * (1 + this.alignK * 0.4));

    if (this.rings.length === 0) {
      fadedText('tocá: cada anillo sos vos', this.CX, this.CY + this.U * 0.1,
        Math.max(11, this.U * 0.015), Palette.ink, 90 * this.enterK(1, 1.2));
    } else if (this.rings.length >= 6 && !this.holdOn) {
      fadedText('nadie más tiene esta diana', this.CX, this.H * 0.86,
        Math.max(10, this.U * 0.0135), Palette.ink, 70);
    }
    this.drawFrame();
  }
}

/* ------------------------------------------------------------
 * EMPATÍA (como comprensión del otro)
 * El otro es un círculo de color que anda a su ritmo. Comprender
 * no es alcanzarlo: es acompañar su movimiento. La línea que los
 * une —punteada al principio— se va volviendo continua a medida
 * que crece la comprensión. Perseguirlo lo espanta; acompañarlo
 * intercambia los colores. Al comprenderse, orbitan juntos.
 * ------------------------------------------------------------ */
class EmpatiaScene extends Scene {
  enter() {
    super.enter();
    // colores francos y opuestos: que el intercambio se note
    this.other = { x: this.W * 0.62, y: this.H * 0.5, px: 0, py: 0, col: Palette.circleColor(4), startle: { x: 0, y: 0 } };
    this.me = { x: this.W * 0.32, y: this.H * 0.55, px: 0, py: 0, tx: this.W * 0.32, ty: this.H * 0.55, col: Palette.circleColor(0) };
    this.u = 0;               // comprensión 0..1
    this.dragging = false;
    this.bondAng = 0;
    this.noiseT = Math.random() * 100;
  }

  onDragStart(x, y) { this.dragging = true; this.me.tx = x; this.me.ty = y; }
  onDrag(x, y) { this.me.tx = x; this.me.ty = y; }
  onDragEnd() { this.dragging = false; }
  onSwipe(dir) { this.dragging = false; return dir === 'left' || dir === 'right'; }

  update(dt) {
    const o = this.other, m = this.me;
    this.noiseT += dt * 0.18;

    // el otro anda a su propio ritmo (con memoria del susto)
    o.px = o.x; o.py = o.y;
    const bonded = this.u >= 0.98;
    if (bonded) {
      this.bondAng += dt * 0.7;
      const mx = (o.x + m.x) / 2, my = (o.y + m.y) / 2;
      const r = this.U * 0.11;
      o.x += ((mx + Math.cos(this.bondAng) * r) - o.x) * dt * 3;
      o.y += ((my + Math.sin(this.bondAng) * r) - o.y) * dt * 3;
      if (!this.dragging) {
        m.tx = mx + Math.cos(this.bondAng + PI) * r;
        m.ty = my + Math.sin(this.bondAng + PI) * r;
      }
    } else {
      o.x = this.W * (0.5 + 0.3 * (noise(this.noiseT) - 0.5) * 2);
      o.y = this.H * (0.5 + 0.24 * (noise(this.noiseT + 40) - 0.5) * 2);
      o.x += o.startle.x * dt; o.y += o.startle.y * dt;
      o.startle.x *= Math.exp(-dt * 2.5);
      o.startle.y *= Math.exp(-dt * 2.5);
    }

    // yo sigo al dedo con inercia
    m.px = m.x; m.py = m.y;
    m.x += (m.tx - m.x) * Math.min(1, dt * 5);
    m.y += (m.ty - m.y) * Math.min(1, dt * 5);

    // comprensión: cerca Y a ritmo parecido
    const d = dist(m.x, m.y, o.x, o.y);
    const vm = dist(m.x, m.y, m.px, m.py) / Math.max(dt, 1e-4);
    const vo = dist(o.x, o.y, o.px, o.py) / Math.max(dt, 1e-4);
    const rr = this.U * 0.055 + this.U * 0.042;
    const near = d < this.U * 0.34;
    const similar = Math.abs(vm - vo) < this.U * 0.25;

    if (!bonded) {
      if (near && d > rr * 0.75 && similar && this.dragging) {
        this.u = Math.min(1, this.u + dt * 0.14);
      } else if (!near) {
        this.u = Math.max(0, this.u - dt * 0.045);
      }
      // perseguirlo lo espanta
      const approach = (dist(m.px, m.py, o.x, o.y) - d) / Math.max(dt, 1e-4);
      if (d < rr * 1.15 && approach > this.U * 0.5) {
        const ang = Math.atan2(o.y - m.y, o.x - m.x);
        o.startle.x = Math.cos(ang) * this.U * 1.1;
        o.startle.y = Math.sin(ang) * this.U * 1.1;
        this.u = Math.max(0, this.u - 0.16);
      }
    }
  }

  draw() {
    const k = this.enterK(1);
    const o = this.other, m = this.me;
    const u01 = this.u;

    // la línea del vínculo: de punteada a continua, de fina a firme
    const c1 = color(m.col), c2 = color(o.col);
    const lc = lerpColor(c1, c2, 0.5);
    lc.setAlpha((60 + 180 * u01) * k);
    stroke(lc);
    strokeWeight(0.8 + 3 * u01);
    if (u01 < 0.85) drawingContext.setLineDash([4, 14 - 10 * u01]);
    line(m.x, m.y, o.x, o.y);
    drawingContext.setLineDash([]);

    // el otro y yo: cada uno se tiñe un poco del otro (hasta u)
    const oc = lerpColor(c2, c1, u01 * 0.4); oc.setAlpha(235 * k);
    const mc = lerpColor(c1, c2, u01 * 0.4); mc.setAlpha(235 * k);
    noStroke();
    fill(oc); circle(o.x, o.y, this.U * 0.11);
    fill(mc); circle(m.x, m.y, this.U * 0.084);

    // halo compartido al comprenderse
    if (u01 > 0.6) {
      const ha = (u01 - 0.6) / 0.4;
      noFill();
      const hc = lerpColor(c1, c2, 0.5); hc.setAlpha(70 * ha * k);
      stroke(hc);
      strokeWeight(1.5);
      circle((m.x + o.x) / 2, (m.y + o.y) / 2, dist(m.x, m.y, o.x, o.y) + this.U * 0.16);
    }

    if (u01 >= 0.98) {
      fadedText('comprender no es alcanzar: es moverse con', this.CX, this.H * 0.86,
        Math.max(11, this.U * 0.0145), Palette.ink, 130 * k);
    }
    this.drawFrame();
  }
}

/* ------------------------------------------------------------
 * COLABORACIÓN (como coexistencia de lo diverso)
 * Cada tap suma un círculo de un color distinto. Los diversos
 * derivan hacia el círculo común y se organizan en una trama
 * vibrátil a lo Le Parc: forman UNA figura sin dejar de ser
 * cada uno de su color. Swipe = girar la obra común.
 * ------------------------------------------------------------ */
class ColaboracionScene extends Scene {
  enter() {
    super.enter();
    this.members = [];   // { slot, x, y, col, k }
    this.free = [];      // { x, y, col, vx, vy }
    this.rot = 0;
    this.rotVel = 0.05;
    this.colIdx = Math.floor(Math.random() * 10);
    // trama concéntrica: anillos de puestos
    this.slots = [];
    const d = this.U * 0.052;
    for (let ring = 0; this.slots.length < 80; ring++) {
      const rr = ring === 0 ? 0 : ring * d;
      const n = ring === 0 ? 1 : Math.floor(TWO_PI * rr / d);
      for (let j = 0; j < n && this.slots.length < 80; j++) {
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
      vx: 0, vy: 0,
    });
  }

  onSwipe(dir, vel) {
    if (dir === 'left') { this.rotVel -= vel * 0.9; return true; }
    if (dir === 'right') { this.rotVel += vel * 0.9; return true; }
    return false;
  }

  update(dt) {
    this.rot += this.rotVel * dt;
    // la obra común nunca se detiene del todo
    this.rotVel += (0.05 - this.rotVel) * Math.min(1, dt * 0.7);

    for (let i = this.free.length - 1; i >= 0; i--) {
      const f = this.free[i];
      const ang = Math.atan2(this.CY - f.y, this.CX - f.x);
      f.vx += Math.cos(ang) * this.U * 0.24 * dt;
      f.vy += Math.sin(ang) * this.U * 0.24 * dt;
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (dist(f.x, f.y, this.CX, this.CY) < this.commonsR() * 1.02) {
        this.members.push({ slot: this.members.length, col: f.col, k: 0, x: f.x, y: f.y });
        this.free.splice(i, 1);
      }
    }
    for (const mb of this.members) {
      mb.k = Math.min(1, mb.k + dt * 1.6);
    }
  }

  draw() {
    const k = this.enterK(1);
    const tt = this.t();

    // el círculo común: una línea curva que espera
    noFill();
    stroke(Palette.inkA((50 + 40 * Math.sin(tt * 1.2)) * k));
    strokeWeight(1.2);
    circle(this.CX, this.CY, this.commonsR() * 2);

    // la trama de los diversos (vibración Le Parc)
    for (const mb of this.members) {
      const sl = this.slots[mb.slot];
      const ang = sl.ang + this.rot * (1 + sl.r / this.commonsR() * 0.15);
      const vib = Math.sin(tt * 5 + mb.slot * 1.7) * this.U * 0.0022;
      const tx = this.CX + Math.cos(ang) * (sl.r + vib);
      const ty = this.CY + Math.sin(ang) * (sl.r + vib);
      mb.x = lerp(mb.x, tx, Math.min(1, mb.k));
      mb.y = lerp(mb.y, ty, Math.min(1, mb.k));
      const col = color(mb.col);
      col.setAlpha(240 * k);
      noStroke();
      fill(col);
      circle(mb.x, mb.y, this.U * 0.032);
    }

    // los que todavía llegan
    for (const f of this.free) {
      const col = color(f.col);
      col.setAlpha(220 * k);
      noStroke();
      fill(col);
      circle(f.x, f.y, this.U * 0.032);
    }

    if (this.members.length === 0 && this.free.length === 0) {
      fadedText('tocá afuera del círculo: cada color es alguien', this.CX, this.H * 0.8,
        Math.max(11, this.U * 0.0145), Palette.ink, 90 * this.enterK(1, 1.2));
    } else if (this.members.length >= 30) {
      fadedText('una sola figura, sin fundir los colores', this.CX, this.H * 0.88,
        Math.max(10, this.U * 0.0135), Palette.ink, 90);
      if (this.members.length >= 40 && !this.app.scenes.chainShown) {
        this.app.scenes.offerNext();
      }
    }
    this.drawFrame();
  }
}
