"use strict";
/* ============================================================
 * sub3.js — SUBSISTEMA 3 · EL DEVENIR
 * Sólo triángulos. Se juega con el GROSOR DE LÍNEA.
 * La línea es el camino: firme lo andado, apenas insinuado lo
 * que viene. Referencia: la montaña del boceto, la inestabilidad
 * de Le Parc, el triángulo como tensión ascendente (Kandinsky).
 * ============================================================ */

/* ------------------------------------------------------------
 * INCERTIDUMBRE (como desconocimiento del devenir)
 * Un caminante recorre un perfil de montaña. El tramo andado es
 * grueso y firme; delante no hay nada. Al avanzar, el futuro se
 * insinúa como varios caminos fantasma temblorosos, y recién al
 * pisarlo uno se vuelve real. Nunca se ve más allá del próximo
 * vértice.
 * ------------------------------------------------------------ */
class IncertidumbreScene extends Scene {
  enter() {
    super.enter();
    this.baseY = this.H * 0.58;
    this.verts = [{ x: 0, y: this.baseY }];
    this.stepX = this.W * 0.16;
    // un par de tramos ya andados
    this.pushVert(); this.pushVert();
    this.walker = { i: this.verts.length - 1, prog: 1 };
    this.ghosts = null;      // candidatos al próximo tramo
    this.ghostT = 0;
    this.sliding = false;
    this.slideT = 0;
    this.offsetX = 0;
    this.offsetTarget = 0;
  }

  pushVert() {
    // perfil de montaña: casi siempre se invierte la pendiente anterior
    const n = this.verts.length;
    const last = this.verts[n - 1];
    const prev = this.verts[n - 2] || { y: last.y + 1 };
    const dirPrev = Math.sign(last.y - prev.y) || -1;
    const dir = Math.random() < 0.8 ? -dirPrev : dirPrev;
    const range = this.H * 0.26;
    const y = clampv(last.y + dir * (0.45 + Math.random() * 0.55) * range,
                     this.H * 0.22, this.H * 0.72);
    this.verts.push({ x: last.x + this.stepX * (0.75 + Math.random() * 0.5), y });
  }

  makeGhosts() {
    const last = this.verts[this.verts.length - 1];
    const opts = [];
    for (let i = 0; i < 3; i++) {
      opts.push({
        x: last.x + this.stepX * (0.75 + Math.random() * 0.5),
        y: clampv(last.y + (Math.random() - 0.5) * this.H * 0.42, this.H * 0.24, this.H * 0.72),
        seed: Math.random() * 100,
      });
    }
    this.ghosts = opts;
    this.ghostT = 0;
  }

  advance() {
    if (this.sliding || this.ghosts) return;
    this.makeGhosts();
  }

  onSwipe(dir) {
    if (dir === 'left') { this.advance(); return true; }
    if (dir === 'right') return true; // lo andado no se desanda mirando
    return false;
  }

  onTap(x) { if (x > this.W * 0.4) this.advance(); }

  update(dt) {
    if (this.ghosts) {
      this.ghostT += dt;
      if (this.ghostT > 0.55) {
        // el devenir elige uno: recién ahí existe
        const pick = this.ghosts[Math.floor(Math.random() * this.ghosts.length)];
        this.verts.push({ x: pick.x, y: pick.y });
        this.ghosts = null;
        this.sliding = true;
        this.slideT = 0;
      }
    }
    if (this.sliding) {
      this.slideT += dt * 1.7;
      if (this.slideT >= 1) {
        this.slideT = 1;
        this.sliding = false;
        this.walker = { i: this.verts.length - 1, prog: 1 };
        const last = this.verts[this.verts.length - 1];
        this.offsetTarget = Math.max(0, last.x - this.W * 0.42);
      }
    }
    this.offsetX += (this.offsetTarget - this.offsetX) * Math.min(1, dt * 3);
  }

  walkerPos() {
    const n = this.verts.length;
    if (this.sliding && n >= 2) {
      const a = this.verts[n - 2], b = this.verts[n - 1];
      const e = Ease.inOutCubic(this.slideT);
      return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e) };
    }
    const v = this.verts[n - 1];
    return { x: v.x, y: v.y };
  }

  draw() {
    const k = this.enterK(1);
    const tt = this.t();
    push();
    translate(-this.offsetX, 0);

    // lo andado: cada tramo más viejo es más cierto (más grueso)
    noFill();
    const n = this.verts.length;
    for (let i = 1; i < n; i++) {
      const isLast = i === n - 1;
      const age = n - 1 - i;
      const w = isLast && this.sliding ? 1.6 : clampv(1.8 + age * 0.55, 1.8, 6);
      const a = clampv(235 - age * 14, 90, 235) * k;
      stroke(Palette.inkA(a));
      strokeWeight(w);
      const A = this.verts[i - 1], B = this.verts[i];
      if (isLast && this.sliding) {
        const e = Ease.inOutCubic(this.slideT);
        line(A.x, A.y, lerp(A.x, B.x, e), lerp(A.y, B.y, e));
      } else {
        line(A.x, A.y, B.x, B.y);
      }
    }

    // los futuros posibles: hilos que tiemblan y no pesan nada
    if (this.ghosts) {
      const last = this.verts[n - 1];
      for (const g of this.ghosts) {
        const flick = noise(g.seed, tt * 14);
        stroke(Palette.inkA(120 * flick * k));
        strokeWeight(0.6);
        line(last.x, last.y, g.x + (flick - 0.5) * 8, g.y + (flick - 0.5) * 12);
      }
    }

    // el caminante: un pequeño triángulo orientado a lo que viene
    const wp = this.walkerPos();
    const prev = this.verts[Math.max(0, n - 2)];
    const ang = Math.atan2(wp.y - prev.y, wp.x - prev.x);
    push();
    translate(wp.x, wp.y - 9);
    rotate(ang * 0.35);
    drawSign('triangle', 0, 0, 15, { fillCol: Palette.ink, alpha: 245 * k });
    pop();
    pop();

    // niebla del futuro: el borde derecho no existe todavía
    const grad = drawingContext.createLinearGradient(this.W * 0.55, 0, this.W, 0);
    grad.addColorStop(0, 'rgba(10,10,12,0)');
    grad.addColorStop(1, 'rgba(10,10,12,0.94)');
    drawingContext.fillStyle = grad;
    noStroke();
    drawingContext.fillRect(this.W * 0.55, 0, this.W * 0.45, this.H);

    this.drawFrame();
  }
}

/* ------------------------------------------------------------
 * ANSIEDAD (como pre-ocupación sobre el futuro)
 * Un triángulo que no se deja tocar: se escapa justo antes del
 * contacto y cada intento deja un eco tembloroso. Cuanto más se
 * lo persigue, más gruesos y nerviosos los trazos, más cerrada
 * la escena. La única salida es dejar de intentar: la quietud
 * lo calma, lo abre y deja pasar.
 * ------------------------------------------------------------ */
class AnsiedadScene extends Scene {
  enter() {
    super.enter();
    this.tri = { x: this.CX, y: this.CY, tx: this.CX, ty: this.CY };
    this.jit = 0;                 // nerviosismo 0..1
    this.echoes = [];             // { x, y, s, a }
    this.dodges = 0;
    this.calmSince = millis();
    this.open = false;
    this.exhausted = false;
  }

  size() { return this.U * 0.12; }

  onDown(x, y) {
    if (this.open) return;
    this.calmSince = millis();
    const d = dist(x, y, this.tri.x, this.tri.y);
    if (d < this.size() * 1.9) {
      // se escapa ANTES del contacto y deja un eco
      this.echoes.push({ x: this.tri.x, y: this.tri.y, s: this.size(), a: 170 });
      const away = Math.atan2(this.tri.y - y, this.tri.x - x) + (Math.random() - 0.5) * 1.2;
      const r = this.U * (0.2 + Math.random() * 0.14);
      this.tri.tx = clampv(this.tri.x + Math.cos(away) * r, this.W * 0.16, this.W * 0.84);
      this.tri.ty = clampv(this.tri.y + Math.sin(away) * r, this.H * 0.2, this.H * 0.78);
      this.jit = Math.min(1, this.jit + 0.2);
      this.dodges++;
      if (this.dodges >= 10 && !this.exhausted) {
        // sobrecarga: la ansiedad se agota sola
        this.exhausted = true;
        for (let i = 0; i < 8; i++) {
          this.echoes.push({
            x: this.CX + (Math.random() - 0.5) * this.W * 0.5,
            y: this.CY + (Math.random() - 0.5) * this.H * 0.4,
            s: this.size() * (0.6 + Math.random() * 0.8), a: 120,
          });
        }
        this.jit = 1;
      }
    } else {
      this.jit = Math.min(1, this.jit + 0.05);
    }
  }

  update(dt) {
    this.tri.x += (this.tri.tx - this.tri.x) * Math.min(1, dt * 9);
    this.tri.y += (this.tri.ty - this.tri.y) * Math.min(1, dt * 9);

    const still = millis() - this.calmSince > (this.exhausted ? 1500 : 3200);
    if (still) {
      this.jit = Math.max(0, this.jit - dt * (this.exhausted ? 0.5 : 0.3));
      for (const e of this.echoes) e.a -= dt * 60;
      this.echoes = this.echoes.filter(e => e.a > 3);
      if (!this.open && this.jit < 0.04 && this.echoes.length === 0 && this.dodges > 0) {
        this.open = true;
        this.tri.tx = this.CX; this.tri.ty = this.CY;
        this.app.scenes.offerNext();   // calma → el devenir se deja mirar
      }
    } else {
      for (const e of this.echoes) e.a -= dt * 9;
      this.echoes = this.echoes.filter(e => e.a > 3);
    }
  }

  draw() {
    const k = this.enterK(1);
    const tt = this.t();
    const j = this.jit;

    // la escena se cierra con el nerviosismo (viñeta)
    if (j > 0.02) {
      const g = drawingContext.createRadialGradient(
        this.CX, this.CY, this.U * 0.2, this.CX, this.CY, this.U * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(0,0,0,${0.55 * j})`);
      drawingContext.fillStyle = g;
      drawingContext.fillRect(0, 0, this.W, this.H);
    }

    // ecos de cada intento: la pre-ocupación acumulada
    for (const e of this.echoes) {
      const jx = (noise(e.x, tt * 8) - 0.5) * 10 * j;
      const jy = (noise(e.y, tt * 8 + 9) - 0.5) * 10 * j;
      drawSign('triangle', e.x + jx, e.y + jy, e.s,
        { col: Palette.ink, alpha: e.a * k, weight: 1 + j * 2.6 });
    }

    // el futuro que no se deja agarrar
    const jx = (noise(1, tt * 10) - 0.5) * 16 * j;
    const jy = (noise(9, tt * 10) - 0.5) * 16 * j;
    if (this.open) {
      const breathe = 1 + 0.03 * Math.sin(tt * 1.6);
      drawSign('triangle', this.tri.x, this.tri.y, this.size() * breathe,
        { col: Palette.ink, alpha: 235 * k, weight: 2 });
    } else {
      drawSign('triangle', this.tri.x + jx, this.tri.y + jy, this.size(),
        { fillCol: Palette.sub1.grays[2], alpha: 240 * k });
    }

    if (this.open) {
      fadedText('quieto, el futuro deja de morder', this.CX, this.H * 0.8,
        Math.max(11, this.U * 0.0145), Palette.ink, 130 * k);
    } else if (this.dodges >= 3) {
      fadedText('…o quedate quieto', this.CX, this.H * 0.85,
        Math.max(10, this.U * 0.0135), Palette.ink, 80 * Math.min(1, (this.dodges - 2) / 3));
    }
    this.drawFrame();
  }
}

/* ------------------------------------------------------------
 * EXPECTATIVA (como anticipación)
 * Contornos livianos, a punto de subir. Mantener presionado
 * carga la anticipación: los triángulos se tensan y engrosan.
 * Al soltar, el devenir decide: a veces se cumple (suben en
 * bandada), a veces no — y la expectativa incumplida llama,
 * ahí mismo, al signo de la ansiedad. Cuanto más larga la
 * espera, más frágil la promesa.
 * ------------------------------------------------------------ */
class ExpectativaScene extends Scene {
  enter() {
    super.enter();
    const rng = mulberry32(21);
    this.tris = [];
    for (let i = 0; i < 12; i++) {
      this.tris.push({
        x: 0.12 + rng() * 0.76,           // fracciones: sobreviven al resize
        y: 0.3 + rng() * 0.45,
        s: 0.05 + rng() * 0.07,
        rot: (rng() - 0.5) * 0.5,
        ph: rng() * TWO_PI,
        lift: 0, vy: 0,
      });
    }
    this.charge = 0;
    this.charging = false;
    this.outcome = null;      // 'up' | 'down'
    this.outcomeT = 0;
    this.msg = '';
  }

  onHoldStart() {
    if (this.outcome) return;
    this.charging = true;
  }

  onHoldEnd() {
    if (!this.charging) return;
    this.charging = false;
    // cuanto más se inflÓ la espera, más frágil la promesa
    const p = this.charge < 0.5 ? 0.85 : lerp(0.85, 0.12, (this.charge - 0.5) / 0.5);
    this.outcome = Math.random() < p ? 'up' : 'down';
    this.outcomeT = 0;
    if (this.outcome === 'down') {
      this.msg = 'no se cumplió';
      this.app.scenes.offerNext();   // → ansiedad, por la cadena del sistema
    } else {
      this.msg = 'esta vez sí';
    }
    for (const tr of this.tris) {
      tr.vy = this.outcome === 'up'
        ? -(0.35 + Math.random() * 0.5) * (0.5 + this.charge)
        : (0.12 + Math.random() * 0.2);
    }
  }

  onTap() {
    // un toque corto: apenas un respingo de anticipación
    for (const tr of this.tris) tr.vy = -0.05 - Math.random() * 0.05;
  }

  update(dt) {
    if (this.charging) this.charge = Math.min(1, this.charge + dt / 3.2);

    if (this.outcome) {
      this.outcomeT += dt;
      for (const tr of this.tris) {
        tr.lift += tr.vy * dt;
        tr.vy += (this.outcome === 'up' ? 0.5 : 0.3) * dt; // la gravedad siempre vuelve
        if (this.outcome === 'up' && tr.lift > 0) { tr.lift = 0; tr.vy = 0; }
        if (this.outcome === 'down') tr.lift = Math.min(tr.lift, 0.12);
      }
      if (this.outcomeT > 2.6) {
        this.outcome = null;
        this.charge = 0;
        this.msg = '';
        for (const tr of this.tris) { tr.lift = 0; tr.vy = 0; }
      }
    } else if (!this.charging) {
      this.charge = Math.max(0, this.charge - dt * 0.5);
    }

    for (const tr of this.tris) {
      if (!this.outcome) tr.lift = -this.charge * 0.1;
    }
  }

  draw() {
    const k = this.enterK(1);
    const tt = this.t();
    const ch = this.charge;

    // el horizonte de lo que viene: sube con la carga
    const hy = this.H * (0.86 - ch * 0.06);
    stroke(Palette.inkA((70 + 120 * ch) * k));
    strokeWeight(1 + ch * 2);
    line(this.W * 0.08, hy, this.W * 0.92, hy);

    for (const tr of this.tris) {
      const idle = this.outcome ? 0 : Math.sin(tt * 1.3 + tr.ph) * 0.004 * (1 - ch);
      const x = tr.x * this.W;
      const y = (tr.y + tr.lift + idle) * this.H;
      const w = 1 + ch * 4.2 + (this.outcome === 'down' ? -0.5 : 0);
      const trem = this.outcome === 'down' && this.outcomeT < 1.2
        ? (noise(tr.ph, tt * 12) - 0.5) * 7 : 0;
      const rot = lerp(tr.rot, 0, ch);
      const a = this.outcome === 'down' ? 160 : 220;
      const col = this.outcome === 'up' && this.outcomeT < 0.9 ? Palette.accent : Palette.ink;
      drawSign('triangle', x + trem, y, tr.s * this.U * (1 + ch * 0.15),
        { col, alpha: a * k, weight: Math.max(0.6, w), rot });
    }

    if (this.charging) {
      fadedText('…', this.CX, this.H * 0.14, Math.max(16, this.U * 0.03), Palette.ink, 150);
    }
    if (this.msg) {
      const a = this.outcomeT < 0.4 ? this.outcomeT / 0.4 : Math.max(0, 1 - (this.outcomeT - 1.6) / 1);
      fadedText(this.msg, this.CX, this.H * 0.18,
        Math.max(13, this.U * 0.019), this.outcome === 'up' ? Palette.accent : Palette.ink, 200 * a);
    }
    this.drawFrame();
  }
}
