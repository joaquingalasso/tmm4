"use strict";
/* ============================================================
 * sub1.js — SUBSISTEMA 1 · EL TIEMPO
 * Sólo cuadrados. Se juega con la OPACIDAD.
 * La línea es la línea del tiempo (se lee de izquierda a derecha;
 * la herencia se lee de arriba hacia abajo).
 * Referencia: Vera Molnár — orden con 1% de desorden.
 * ============================================================ */

/* ------------------------------------------------------------
 * MEMORIA (como registro)
 * Todo gesto queda inscripto: arrastrar estampa cuadrados que
 * envejecen perdiendo opacidad pero NUNCA se borran del todo;
 * cada marca deja su muesca en la línea. En el reposo, un pulso
 * recorre la línea y las marcas se reencienden: la memoria relee.
 * ------------------------------------------------------------ */
class MemoriaScene extends Scene {
  enter() {
    super.enter();
    this.marks = [];        // { x, y, s, g, born, glow }
    this.lastStamp = null;
    this.lastInteract = millis();
    this.pulseX = null;
    const rng = mulberry32(7);
    this.grid = [];
    for (let i = 0; i < 90; i++) {
      this.grid.push({ x: rng(), y: rng(), j: rng() });
    }
  }

  lineY() { return this.H * 0.55; }

  stamp(x, y, big = false) {
    const d = Math.abs(y - this.lineY());
    const s = clampv((big ? 26 : 10) + d * 0.06, 8, this.U * 0.05);
    const g = 255 - clampv(d * 0.3, 0, 130);
    this.marks.push({ x, y, s, g, born: millis(), glow: 0 });
    if (this.marks.length > 400) this.marks.shift();
    this.lastStamp = { x, y };
    this.lastInteract = millis();
    this.pulseX = null;
  }

  onTap(x, y) { this.stamp(x, y, true); }
  onDragStart(x, y) { this.stamp(x, y); }
  onDrag(x, y) {
    if (!this.lastStamp || dist(x, y, this.lastStamp.x, this.lastStamp.y) > 18) {
      this.stamp(x, y);
    }
  }
  onSwipe(dir) { return dir === 'left' || dir === 'right'; } // el gesto es registro, no navegación

  update(dt) {
    // marcas: envejecen y se asientan lentísimamente sobre la línea
    const ly = this.lineY();
    for (const m of this.marks) {
      m.y += (ly - m.y) * dt * 0.018;
      m.glow = Math.max(0, m.glow - dt * 2.2);
    }
    // pulso de relectura cuando nadie toca
    if (this.pulseX === null && millis() - this.lastInteract > 5000 && this.marks.length > 0) {
      this.pulseX = -20;
    }
    if (this.pulseX !== null) {
      this.pulseX += this.W * dt / 3.2;
      for (const m of this.marks) {
        if (Math.abs(m.x - this.pulseX) < 14) m.glow = 1;
      }
      if (this.pulseX > this.W + 20) {
        this.pulseX = null;
        this.lastInteract = millis();
      }
    }
  }

  draw() {
    const k = this.enterK(1);
    const u = this.U;
    rectMode(CENTER);

    // retícula Molnár apenas visible
    noStroke();
    for (const c of this.grid) {
      fill(Palette.inkA(9 * k));
      rect(c.x * this.W + (c.j - 0.5) * 6, c.y * this.H + (c.j - 0.5) * 6, 4, 4);
    }

    // la línea del tiempo, con un temblor de mano
    const ly = this.lineY();
    stroke(Palette.inkA(120 * k));
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
      const a = Math.max(22, 235 * Math.exp(-age / 30)) + m.glow * 120;
      noStroke();
      fill(m.g, m.g, m.g, Math.min(255, a * k));
      rect(m.x, m.y, m.s, m.s);
      // muesca en la línea: el índice del registro
      stroke(Palette.inkA(Math.min(255, (40 + a * 0.5) * k)));
      strokeWeight(1.4);
      line(m.x, ly - 5, m.x, ly + 5);
    }

    // pulso de relectura: un cuadradito brillante recorre la línea
    if (this.pulseX !== null) {
      noStroke();
      fill(Palette.inkA(230));
      rect(this.pulseX, ly, 7, 7);
    }

    this.drawFrame();
  }
}

/* ------------------------------------------------------------
 * HERENCIA (como legado)
 * Árbol genealógico que se lee de arriba hacia abajo. Tocar un
 * cuadrado lo hace transmitir: los hijos heredan tamaño y gris
 * con mutación (1% de desorden) y el ancestro CEDE opacidad al
 * transmitir. Más allá de la multiplicación: los nodos se apagan,
 * pero las líneas del parentesco quedan — el legado es la
 * estructura, no el individuo.
 * ------------------------------------------------------------ */
class HerenciaScene extends Scene {
  enter() {
    super.enter();
    const root = {
      x: this.CX, y: this.H * 0.2, s: this.U * 0.075,
      g: 240, alpha: 255, gen: 0, children: [], parent: null,
      seed: Math.random() * 100, pulse: 0,
    };
    this.nodes = [root];
    this.camY = 0;
    this.camTarget = 0;
  }

  wobX(n) {
    return n.x + (noise(n.seed, millis() / 3000) - 0.5) * this.U * 0.012 * n.gen;
  }

  onTap(x, y) {
    const yw = y + this.camY;
    let hit = null;
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const n = this.nodes[i];
      if (dist(x, yw, this.wobX(n), n.y) < Math.max(24, n.s * 0.9)) { hit = n; break; }
    }
    if (!hit) return;

    if (hit.alpha < 70 || hit.children.length > 0) {
      // un ancestro ya dado: ilumina su descendencia (el legado responde)
      const mark = (n) => { n.pulse = 1; n.children.forEach(mark); };
      mark(hit);
      return;
    }
    // transmitir: 1 a 3 hijos con herencia mutada
    const count = 1 + Math.floor(Math.random() * 3);
    const gap = this.U * 0.14;
    const spread = this.U * (0.09 + 0.05 * count);
    for (let i = 0; i < count; i++) {
      const child = {
        x: clampv(hit.x + (i - (count - 1) / 2) * spread + (Math.random() - 0.5) * this.U * 0.03,
                  this.W * 0.1, this.W * 0.9),
        y: hit.y + gap,
        s: hit.s * (0.72 + Math.random() * 0.3),
        g: clampv(hit.g + (Math.random() - 0.5) * 70, 60, 250),
        alpha: 255, gen: hit.gen + 1, children: [], parent: hit,
        seed: Math.random() * 100, born: millis(), pulse: 0,
      };
      hit.children.push(child);
      this.nodes.push(child);
    }
    hit.alpha *= 0.55; // transmitir cuesta: el ancestro cede su opacidad
    this.camTarget = Math.max(0, hit.y + gap - this.H * 0.62);
  }

  update(dt) {
    this.camY += (this.camTarget - this.camY) * Math.min(1, dt * 3);
    for (const n of this.nodes) {
      n.pulse = Math.max(0, n.pulse - dt * 1.4);
      // los muy antiguos siguen apagándose hacia un piso: nunca a cero
      if (n.children.length > 0) n.alpha = Math.max(28, n.alpha - dt * 6);
    }
  }

  draw() {
    const k = this.enterK(1);
    rectMode(CENTER);
    push();
    translate(0, -this.camY);

    // la línea del linaje cae desde fuera del cuadro
    stroke(Palette.inkA(90 * k));
    strokeWeight(1.2);
    const root = this.nodes[0];
    line(this.wobX(root), this.camY - 10, this.wobX(root), root.y - root.s / 2);

    // parentescos en codo (como el boceto): la estructura no se apaga
    for (const n of this.nodes) {
      for (const c of n.children) {
        const midY = (n.y + c.y) / 2;
        const nx = this.wobX(n), cx2 = this.wobX(c);
        const a = (70 + 100 * c.pulse) * k;
        stroke(Palette.inkA(a));
        strokeWeight(1.1 + c.pulse * 1.2);
        line(nx, n.y + n.s / 2, nx, midY);
        line(nx, midY, cx2, midY);
        line(cx2, midY, cx2, c.y - c.s / 2);
      }
    }

    // los cuadrados: la opacidad cuenta cuánto dieron
    for (const n of this.nodes) {
      const bornK = n.born ? Ease.outBack(clamp01((millis() - n.born) / 500)) : 1;
      const a = Math.min(255, (n.alpha + n.pulse * 150) * k);
      noStroke();
      fill(n.g, n.g, n.g, a);
      rect(this.wobX(n), n.y, n.s * bornK, n.s * bornK);
    }
    pop();

    if (this.nodes.length === 1) {
      fadedText('tocá el primer cuadrado', this.CX, this.H * 0.36,
        Math.max(11, this.U * 0.015), Palette.ink, 90 * this.enterK(1, 1.5));
    }
    this.drawFrame();
  }
}

/* ------------------------------------------------------------
 * CADUCIDAD (como lo perdido en el tránsito)
 * Un convoy de cuadrados avanza por la línea del tiempo y se
 * gasta al andar: pierde opacidad, se vuelve contorno punteado
 * y se deshace donde la línea se corta. Swipear hacia adelante
 * apura el tránsito (se pierde más). Retener uno con el dedo
 * también lo gasta. No hay regreso. Lo perdido deja su muesca.
 * ------------------------------------------------------------ */
class CaducidadScene extends Scene {
  enter() {
    super.enter();
    this.convoy = [];      // { p 0..1, s, held }
    this.shards = [];      // { x, y, vx, vy, life }
    this.lostTicks = 0;
    this.spawnT = 0;
    this.boost = 0;
    this.held = null;
    this.refuseA = 0;      // "no hay regreso"
    this.spawn(0.06); this.spawn(0.3); this.spawn(0.52);
  }

  lineY() { return this.H * 0.52; }
  cutX() { return this.W * 0.82; }
  solidX() { return this.W * 0.6; }

  spawn(p = 0) {
    this.convoy.push({ p, s: this.U * (0.06 + Math.random() * 0.035), held: false });
  }

  sqX(sq) { return lerp(-this.U * 0.05, this.cutX(), sq.p); }

  onSwipe(dir) {
    if (dir === 'left') { this.boost += 1.7; return true; }
    if (dir === 'right') { this.refuseA = 1; return true; } // no hay regreso
    return false;
  }

  onHoldStart(x, y) {
    for (const sq of this.convoy) {
      if (dist(x, y, this.sqX(sq), this.lineY() - sq.s * 0.6) < Math.max(30, sq.s)) {
        sq.held = true;
        this.held = sq;
        return;
      }
    }
  }
  onHoldEnd() { if (this.held) { this.held.held = false; this.held = null; } }
  onDragEnd() { this.onHoldEnd(); }

  update(dt) {
    this.spawnT += dt;
    const interval = 2.4 / (1 + this.boost * 0.5);
    if (this.spawnT > interval) { this.spawnT = 0; this.spawn(); }
    this.boost *= Math.exp(-dt * 1.4);
    this.refuseA = Math.max(0, this.refuseA - dt * 0.8);

    for (let i = this.convoy.length - 1; i >= 0; i--) {
      const sq = this.convoy[i];
      const spd = 0.035 * (1 + this.boost);
      // retener no detiene el tránsito: lo vuelve desgaste puro
      sq.p += sq.held ? spd * dt * 0.25 : spd * dt;
      if (sq.held) sq.s *= Math.exp(-dt * 0.35);
      if (sq.p >= 1 || sq.s < 4) {
        // se deshace en esquirlas (pequeños trazos, nunca otra figura)
        const x = this.sqX(sq), y = this.lineY() - sq.s * 0.6;
        for (let j = 0; j < 7; j++) {
          this.shards.push({
            x, y, life: 1,
            vx: 20 + Math.random() * 50,
            vy: (Math.random() - 0.2) * 60,
          });
        }
        this.lostTicks++;
        if (this.held === sq) this.held = null;
        this.convoy.splice(i, 1);
      }
    }

    for (let i = this.shards.length - 1; i >= 0; i--) {
      const sh = this.shards[i];
      sh.x += sh.vx * (deltaTime / 1000);
      sh.y += sh.vy * (deltaTime / 1000);
      sh.vy += 40 * (deltaTime / 1000);
      sh.life -= (deltaTime / 1000) * 0.7;
      if (sh.life <= 0) this.shards.splice(i, 1);
    }
  }

  draw() {
    const k = this.enterK(1);
    const ly = this.lineY();
    rectMode(CENTER);

    // la línea del tránsito: sólida, luego punteada, luego nada
    stroke(Palette.inkA(130 * k));
    strokeWeight(1.6);
    line(0, ly, this.solidX(), ly);
    drawingContext.setLineDash([5, 9]);
    stroke(Palette.inkA(90 * k));
    line(this.solidX(), ly, this.cutX(), ly);
    drawingContext.setLineDash([]);
    // el tope del corte
    stroke(Palette.inkA(150 * k));
    strokeWeight(2);
    line(this.cutX(), ly - 8, this.cutX(), ly + 8);

    // el convoy que se gasta
    for (const sq of this.convoy) {
      const x = this.sqX(sq);
      const decay = 1 - sq.p;
      const sz = sq.s * (0.45 + 0.55 * decay);
      const a = 235 * Math.pow(decay, 1.2) * k;
      const y = ly - sz * 0.62;
      const tremble = sq.held ? (noise(x, millis() / 60) - 0.5) * 5 : 0;
      if (sq.p < 0.55) {
        noStroke();
        fill(Palette.inkA(Math.max(30, a)));
        rect(x + tremble, y, sz, sz);
      } else {
        noFill();
        stroke(Palette.inkA(Math.max(24, a)));
        strokeWeight(1.2);
        drawingContext.setLineDash([4, 5]);
        rect(x + tremble, y, sz, sz);
        drawingContext.setLineDash([]);
      }
    }

    // esquirlas del deshacerse
    for (const sh of this.shards) {
      stroke(Palette.inkA(160 * sh.life * k));
      strokeWeight(1.2);
      line(sh.x, sh.y, sh.x + 5, sh.y);
    }

    // lo perdido deja marca: muescas acumuladas bajo la línea
    stroke(Palette.inkA(70 * k));
    strokeWeight(1.2);
    for (let i = 0; i < this.lostTicks; i++) {
      const x = this.W * 0.06 + (i % 40) * this.W * 0.022;
      const y = this.H * 0.8 + Math.floor(i / 40) * 12;
      line(x, y - 4, x, y + 4);
    }

    if (this.refuseA > 0.02) {
      fadedText('no hay regreso', this.CX, this.H * 0.3,
        Math.max(12, this.U * 0.017), Palette.ink, 170 * this.refuseA);
    }
    this.drawFrame();
  }
}
