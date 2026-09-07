"use strict";
/* ============================================================
 * sub3.js — SUBSISTEMA 3 · EL DEVENIR
 * Sólo triángulos. Se juega con el GROSOR DE LÍNEA.
 *
 * Hay una sola regla de trazo, y vale para los tres signos:
 *
 *   LÍNEA CONTINUA     el sujeto: lo que está siendo ahora
 *   LÍNEA DISCONTINUA  todo lo que el sujeto deja: el camino
 *                      andado, los ecos de cada intento, las
 *                      proyecciones de lo que todavía no es
 *
 * El patrón discontinuo es siempre el mismo (Dash.marca). Lo que
 * distingue una marca de otra es el GROSOR y la opacidad: cuanto
 * más fina y más apagada, menos real.
 *
 * Referencia: la montaña del boceto, la inestabilidad de Le Parc,
 * el triángulo como tensión ascendente (Kandinsky).
 * ============================================================ */

/* ------------------------------------------------------------
 * INCERTIDUMBRE (como desconocimiento del devenir)
 * Un caminante recorre un perfil de montaña. Él es línea continua;
 * el camino que va dejando atrás, discontinuo. Adelante no hay
 * nada dibujado.
 *
 * PULSAR   da un paso: se insinúan tres futuros posibles y, sin
 *          que uno pueda elegir, el devenir se queda con uno.
 *          Recién al pisarlo el camino existe.
 * MANTENER es querer ver adelante: se abre el abanico completo de
 *          lo que podría pasar, ramas y ramas de ramas, cada nivel
 *          más fino y más apagado. Mirar no decide nada: al soltar
 *          el abanico se borra y el camino sigue donde estaba.
 * ------------------------------------------------------------ */
class IncertidumbreScene extends Scene {
  enter() {
    super.enter();
    this.baseY = this.H * 0.58;
    this.verts = [{ x: 0, y: this.baseY }];
    this.stepX = this.W * 0.16;
    this.pushVert(); this.pushVert();
    this.ghosts = null;
    this.ghostT = 0;
    this.sliding = false;
    this.slideT = 0;
    this.offsetX = 0;
    this.offsetTarget = 0;
    this.fan = null;          // abanico de futuros, sólo mientras se mantiene
    this.fanVoices = [];
    // el sujeto va en línea continua: su sonido también. La altura del
    // tono es la altura del camino — subir la montaña es subir la nota.
    this.vWalk = Audio.voice(Audio.note(this.degOf(this.baseY), 45),
      { type: 'sawtooth', gain: 0.07, cut: 1200, glide: 0.25 });
  }

  /** La altura en pantalla, hecha grado de la escala. */
  degOf(y) { return Math.round(clampv((this.H * 0.78 - y) / (this.H * 0.06), 0, 11)); }

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

  advance() {
    if (this.sliding || this.ghosts) return;
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
    // los tres futuros apenas se insinúan: suenan flojos y sin decidirse
    opts.forEach((g, i) => Audio.devenir(this.degOf(g.y),
      { gain: 0.05, dur: 0.9, delay: i * 0.12, cut: 1100 }));
  }

  /** Ramifica desde un punto: el árbol de lo que todavía no es. */
  branch(from, depth, seed) {
    if (depth === 0) return [];
    const rng = mulberry32(seed);
    const out = [];
    const n = depth === 3 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const node = {
        x: from.x + this.stepX * (0.7 + rng() * 0.55),
        y: clampv(from.y + (rng() - 0.5) * this.H * 0.28, this.H * 0.2, this.H * 0.76),
        seed: seed + i * 977,
        from,
      };
      out.push(node);
      out.push(...this.branch(node, depth - 1, seed + i * 977));
    }
    return out;
  }

  onTap() { this.advance(); }

  onHoldStart() {
    this.holding = true;
    const last = this.verts[this.verts.length - 1];
    this.fan = this.branch(last, 3, 1234 + this.verts.length * 31);
    // todo lo que podría pasar, sonando a la vez y muy bajo: un
    // racimo sin resolver, porque ninguno de esos futuros existe
    for (let i = 0; i < 4; i++) {
      const nd = this.fan[Math.floor(Math.random() * this.fan.length)];
      this.fanVoices.push(Audio.voice(Audio.note(this.degOf(nd.y), 45),
        { type: 'sawtooth', gain: 0.022, cut: 800, glide: 0.4,
          vibRate: 4 + Math.random() * 3, vibDepth: 3 }));
    }
  }

  onHoldEnd() {
    this.holding = false;
    this.fan = null;   // mirar no decide nada
    for (const v of this.fanVoices) v.stop(0.3);
    this.fanVoices = [];
  }

  update(dt) {
    this.updateHold(dt, 4.5);

    if (this.ghosts) {
      this.ghostT += dt;
      if (this.ghostT > 1.2) {
        // el devenir elige uno: recién ahí existe
        const pick = this.ghosts[Math.floor(Math.random() * this.ghosts.length)];
        this.verts.push({ x: pick.x, y: pick.y });
        this.ghosts = null;
        this.sliding = true;
        this.slideT = 0;
        // recién al pisarlo suena de verdad: lo posible no sonaba
        Audio.devenir(this.degOf(pick.y), { gain: 0.16, dur: 0.6 });
      }
    }
    if (this.sliding) {
      this.slideT += dt * 1.7;
      if (this.slideT >= 1) {
        this.slideT = 1;
        this.sliding = false;
        const last = this.verts[this.verts.length - 1];
        this.offsetTarget = Math.max(0, last.x - this.W * 0.42);
      }
    }
    this.offsetX += (this.offsetTarget - this.offsetX) * Math.min(1, dt * 3);
    if (this.vWalk) this.vWalk.set(Audio.note(this.degOf(this.walkerPos().y), 45), 0.07);
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
    const hk = this.holdK;
    push();
    translate(-this.offsetX, 0);
    noFill();

    // EL CAMINO ANDADO — marca. Cuanto más viejo el tramo, más
    // grueso y más opaco: lo lejano ya no se discute.
    setDash(Dash.marca);
    const n = this.verts.length;
    for (let i = 1; i < n; i++) {
      const isLast = i === n - 1;
      const age = n - 1 - i;
      const w = isLast && this.sliding ? 1.6 : clampv(1.8 + age * 0.55, 1.8, 6);
      const a = clampv(235 - age * 14, 90, 235) * k;
      stroke(Palette.triA(i, a));
      strokeWeight(w);
      const A = this.verts[i - 1], B = this.verts[i];
      if (isLast && this.sliding) {
        const e = Ease.inOutCubic(this.slideT);
        line(A.x, A.y, lerp(A.x, B.x, e), lerp(A.y, B.y, e));
      } else {
        line(A.x, A.y, B.x, B.y);
      }
    }

    // EL ABANICO DE LO QUE PODRÍA PASAR — marca, cada nivel más fino
    if (this.fan && hk > 0.01) {
      for (const nd of this.fan) {
        const depth = dist(nd.x, nd.y, this.verts[n - 1].x, this.verts[n - 1].y) / this.stepX;
        const flick = 0.5 + 0.5 * noise(nd.seed, tt * 9);
        stroke(Palette.triA(Math.floor(nd.seed) % 8, (245 - depth * 24) * hk * flick * k));
        strokeWeight(Math.max(0.8, 1.7 - depth * 0.28));
        line(nd.from.x, nd.from.y,
             nd.x + (flick - 0.5) * 7, nd.y + (flick - 0.5) * 10);
      }
    }

    // LOS TRES FUTUROS DEL PASO EN CURSO — marca finísima, temblando
    if (this.ghosts) {
      const last = this.verts[n - 1];
      for (let gi = 0; gi < this.ghosts.length; gi++) {
        const g = this.ghosts[gi];
        const flick = noise(g.seed, tt * 14);
        stroke(Palette.triA(gi + 5, (90 + 140 * flick) * k));
        strokeWeight(1.2);
        line(last.x, last.y, g.x + (flick - 0.5) * 8, g.y + (flick - 0.5) * 12);
      }
    }

    // EL CAMINANTE — el sujeto: línea continua
    setDash(Dash.none);
    const wp = this.walkerPos();
    const prev = this.verts[Math.max(0, n - 2)];
    const ang = Math.atan2(wp.y - prev.y, wp.x - prev.x);
    push();
    translate(wp.x, wp.y - 10);
    rotate(ang * 0.35);
    drawSign('triangle', 0, 0, 17, { col: Palette.triColor(7), alpha: 250 * k, weight: 2.6 });
    pop();
    pop();
    setDash(Dash.none);

    // niebla del futuro: el borde derecho no existe todavía
    // (al mirar el abanico, la niebla se retira)
    const fogFrom = this.W * (0.55 + 0.4 * hk);
    const grad = drawingContext.createLinearGradient(fogFrom, 0, this.W, 0);
    grad.addColorStop(0, 'rgba(10,10,12,0)');
    grad.addColorStop(1, `rgba(10,10,12,${0.94 - 0.74 * hk})`);
    drawingContext.fillStyle = grad;
    noStroke();
    drawingContext.fillRect(fogFrom, 0, this.W - fogFrom, this.H);
  }
}

/* ------------------------------------------------------------
 * ANSIEDAD (como pre-ocupación sobre el futuro)
 * Un triángulo que no se deja tocar. Él es línea continua; cada
 * intento fallido queda como un eco discontinuo que no se va.
 *
 * PULSAR   sólo cuenta SOBRE el triángulo: hay que acertarle. Se
 *          escapa justo antes del contacto y deja su eco. Tocar al
 *          lado no hace nada: la ansiedad no reacciona a cualquier
 *          cosa, reacciona a que la persigas. Y no huye en línea
 *          recta: busca siempre por dónde le queda aire, así nunca
 *          termina trabado contra un borde.
 * MANTENER es no soltar, y entonces se desmadra: el triángulo se
 *          sacude, los ecos se multiplican solos por todas partes,
 *          la escena entera tiembla y se cierra encima. Sostener
 *          la pre-ocupación no la resuelve, la desborda. Al soltar
 *          baja de a poco, pero lo que uno provocó queda.
 * ------------------------------------------------------------ */
class AnsiedadScene extends Scene {
  enter() {
    super.enter();
    this.tri = { x: this.CX, y: this.CY, tx: this.CX, ty: this.CY };
    this.jit = 0;                 // nerviosismo 0..1
    this.echoes = [];             // { x, y, s, a, seed, temp }
    this.spawnT = 0;
    this.shake = 0;               // el temblor de toda la escena
    // el que se escapa: línea continua, tono continuo, y un temblor
    // que crece con el nervio
    this.vTri = Audio.voice(Audio.note(5, 52),
      { type: 'sawtooth', gain: 0.075, cut: 1500, glide: 0.05,
        vibRate: 5, vibDepth: 0 });
    // y el fondo de todo lo que quedó de perseguirlo: cuantos más
    // ecos, más espeso y más desafinado
    this.vEcho = Audio.voice(Audio.note(4, 45),
      { type: 'sawtooth', gain: 0, cut: 700, glide: 0.5 });
  }

  size() { return this.U * 0.12; }

  /** El radio en que se considera que le acertaste. */
  hitR() { return this.size() * 0.75; }

  /** Los límites dentro de los que puede moverse. */
  bounds() {
    const mx = this.size() * 0.9, my = this.size() * 0.9;
    return { x0: mx, x1: this.W - mx, y0: my + this.U * 0.06, y1: this.H - my - this.U * 0.06 };
  }

  /**
   * Busca a dónde escapar: entre varias salidas posibles se queda
   * con la que combina estar lejos del dedo y tener aire alrededor.
   * El término del aire es el que impide que quede arrinconado.
   */
  escapeFrom(fx, fy) {
    const b = this.bounds();
    let best = { x: this.tri.x, y: this.tri.y }, bestScore = -Infinity;
    for (let i = 0; i < 16; i++) {
      const ang = Math.random() * TWO_PI;
      const r = this.U * (0.15 + Math.random() * 0.18);
      const cx = clampv(this.tri.x + Math.cos(ang) * r, b.x0, b.x1);
      const cy = clampv(this.tri.y + Math.sin(ang) * r, b.y0, b.y1);
      const air = Math.min(cx - b.x0, b.x1 - cx, cy - b.y0, b.y1 - cy);
      const travel = dist(cx, cy, this.tri.x, this.tri.y);
      // lejos del dedo + con aire + que efectivamente se haya movido
      const score = dist(cx, cy, fx, fy) + air * 1.8 + Math.min(travel, this.U * 0.2);
      if (score > bestScore) { bestScore = score; best = { x: cx, y: cy }; }
    }
    return best;
  }

  onTap(x, y) {
    if (dist(x, y, this.tri.x, this.tri.y) > this.hitR()) return;  // le erraste
    this.echoes.push({
      x: this.tri.x, y: this.tri.y, s: this.size(),
      a: 155, seed: Math.random() * 100, temp: false,
    });
    if (this.echoes.length > 16) this.echoes.shift();

    // No huye en línea recta desde el dedo: eso lo terminaba
    // acorralando en una esquina y parecía un error. Elige entre
    // varias salidas la que más lo aleja del dedo Y más aire le
    // deja alrededor, así siempre tiene a dónde seguir escapando.
    const dest = this.escapeFrom(x, y);
    this.tri.tx = dest.x;
    this.tri.ty = dest.y;
    this.jit = Math.min(1, this.jit + 0.18);
    // el escape: un salto de altura que no termina de resolverse
    Audio.devenir(4 + Math.floor(Math.random() * 6), { gain: 0.17, dur: 0.28, cut: 2400 });
  }

  onHoldStart() { this.holding = true; }
  onHoldEnd() { this.holding = false; }

  update(dt) {
    this.updateHold(dt, 3.5);
    const hk = this.holdK;

    if (this.holding) {
      this.jit = Math.min(1, this.jit + dt * 1.5);
      this.shake = Math.min(1, this.shake + dt * 1.8);

      // los ecos se multiplican solos, por todas partes
      this.spawnT += dt;
      if (this.spawnT > 0.1 && this.echoes.length < 34) {
        this.spawnT = 0;
        this.echoes.push({
          x: this.CX + (Math.random() - 0.5) * this.W * 0.84,
          y: this.CY + (Math.random() - 0.5) * this.H * 0.6,
          s: this.size() * (0.45 + Math.random() * 0.95),
          a: 90 + Math.random() * 110,
          seed: Math.random() * 100,
          temp: true,
        });
      }

      // y el triángulo no para quieto
      if (Math.random() < dt * 5) {
        const b = this.bounds();
        this.tri.tx = clampv(this.CX + (Math.random() - 0.5) * this.W * 0.55, b.x0, b.x1);
        this.tri.ty = clampv(this.CY + (Math.random() - 0.5) * this.H * 0.45, b.y0, b.y1);
      }
    } else {
      // baja de a poco; los ecos del desborde se van, los de cada
      // intento fallido quedan: eso sí lo provocaste vos
      this.jit = Math.max(0, this.jit - dt * 0.12);   // el nervio de cada intento tarda en bajar
      this.shake = Math.max(0, this.shake - dt * 1.6);
      for (let i = this.echoes.length - 1; i >= 0; i--) {
        const e = this.echoes[i];
        if (!e.temp) continue;
        e.a -= dt * 150;
        if (e.a <= 2) this.echoes.splice(i, 1);
      }
    }

    const chase = 9 + 14 * hk;
    this.tri.x += (this.tri.tx - this.tri.x) * Math.min(1, dt * chase);
    this.tri.y += (this.tri.ty - this.tri.y) * Math.min(1, dt * chase);

    // el nervio se oye: cuanto más alto, más rápido y más ancho el
    // temblor de la nota, y más espeso el fondo de los ecos
    const j = this.jit;
    if (this.vTri) {
      this.vTri.vib(4 + 13 * j, 1 + 26 * j);
      this.vTri.set(Audio.note(5, 52), 0.06 + 0.05 * j);
      this.vTri.cutoff(1100 + 2200 * j);
    }
    if (this.vEcho) {
      const carga = clamp01(this.echoes.length / 14);
      this.vEcho.set(Audio.note(4, 45) * (1 + 0.02 * j), 0.075 * carga * (0.4 + 0.6 * j));
      this.vEcho.vib(2 + 9 * j, 2 + 18 * j);
    }
  }

  draw() {
    const k = this.enterK(1);
    const tt = this.t();
    const j = this.jit;
    const sh = this.shake;

    push();
    // la escena entera tiembla cuando no se suelta
    if (sh > 0.01) {
      translate((noise(11, tt * 13) - 0.5) * 22 * sh,
                (noise(29, tt * 13) - 0.5) * 22 * sh);
    }

    // se cierra encima con el nerviosismo
    if (j > 0.02) {
      const g = drawingContext.createRadialGradient(
        this.CX, this.CY, this.U * (0.22 - 0.12 * sh),
        this.CX, this.CY, this.U * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(0,0,0,${0.55 * j})`);
      drawingContext.fillStyle = g;
      drawingContext.fillRect(-40, -40, this.W + 80, this.H + 80);
    }

    // LOS ECOS — marca: lo que quedó de perseguirlo
    setDash(Dash.marca);
    for (let ei = 0; ei < this.echoes.length; ei++) {
      const e = this.echoes[ei];
      const amp = 12 * j * (1 + 2.2 * sh);
      const jx = (noise(e.seed, tt * 8) - 0.5) * amp;
      const jy = (noise(e.seed + 9, tt * 8) - 0.5) * amp;
      const recency = (ei + 1) / this.echoes.length;
      drawSign('triangle', e.x + jx, e.y + jy, e.s * (0.82 + 0.18 * recency),
        { col: Palette.triColor(ei), alpha: e.a * (0.35 + 0.65 * recency) * k,
          weight: 0.8 + j * 1.3, rot: (noise(e.seed + 3, tt * 4) - 0.5) * 0.9 * sh });
    }

    // EL TRIÁNGULO — el sujeto: línea continua, siempre
    setDash(Dash.none);
    const amp = 16 * j * (1 + 1.6 * sh);
    const jx = (noise(1, tt * 10) - 0.5) * amp;
    const jy = (noise(9, tt * 10) - 0.5) * amp;
    drawSign('triangle', this.tri.x + jx, this.tri.y + jy, this.size(),
      { col: Palette.triColor(4), alpha: 252 * k, weight: 3.2 + 1.2 * sh,
        rot: (noise(5, tt * 6) - 0.5) * 0.5 * sh });
    pop();
    setDash(Dash.none);
  }
}

/* ------------------------------------------------------------
 * EXPECTATIVA (como anticipación)
 * La expectativa no es una meta que se alcanza: es un contorno
 * dibujado SIEMPRE un poco más adelante que lo real. Acá eso es
 * literal, y la regla de trazo lo dice sola: lo real es línea
 * continua, lo anticipado es marca.
 *
 * PULSAR   hace saltar lo real hacia su anticipación… y en el
 *          mismo movimiento la anticipación se proyecta más
 *          arriba. Se sube de verdad, pero la distancia nunca se
 *          cierra: siempre falta lo mismo.
 * MANTENER es anticipar: la proyección corre sola hacia adelante,
 *          apilando contornos cada vez más altos y más finos. Al
 *          soltar se desploma: lo real quedó donde estaba.
 * ------------------------------------------------------------ */
class ExpectativaScene extends Scene {
  enter() {
    super.enter();
    this.real = 0;            // altura real alcanzada (en pasos)
    this.realShown = 0;
    this.exp = 1;             // altura de la anticipación
    this.expShown = 1;
    this.proj = 0;            // cuánto corrió la anticipación al mantener
    this.camY = 0;
    this.snap = 0;
    // lo real suena lleno; lo anticipado, más agudo y más flaco. Lo que
    // se oye todo el tiempo es el intervalo entre los dos: eso es la
    // expectativa, y no se cierra nunca.
    this.vReal = Audio.voice(Audio.note(0, 45),
      { type: 'sawtooth', gain: 0.085, cut: 1300, glide: 0.18 });
    this.vExp = Audio.voice(Audio.note(3, 45),
      { type: 'triangle', gain: 0.04, cut: 2400, glide: 0.3 });
  }

  stepY() { return this.U * 0.17; }
  yOf(level) { return this.H * 0.56 - level * this.stepY() + this.camY; }

  onTap() {
    // lo real sube hacia lo anticipado, pero no llega; y en el mismo
    // acto la anticipación se corre más arriba
    this.real += (this.exp - this.real) * 0.62;
    this.exp = this.real + 0.85 + Math.random() * 0.5;
    Audio.devenir(Math.round(this.real * 1.6), { gain: 0.15, dur: 0.4 });
  }

  onHoldStart() { this.holding = true; }
  onHoldEnd() { this.holding = false; this.snap = 1; }

  update(dt) {
    this.updateHold(dt, 3);

    if (this.holding) this.proj = Math.min(6, this.proj + dt * 1.7);
    else this.proj *= Math.exp(-dt * 5);
    this.snap = Math.max(0, this.snap - dt * 2);

    this.realShown += (this.real - this.realShown) * Math.min(1, dt * 4);
    this.expShown += (this.exp + this.proj - this.expShown) * Math.min(1, dt * 3.4);

    // la cámara sigue a lo real, no a lo esperado: el encuadre nunca
    // se va a lo que todavía no pasó. Lo real queda siempre a la
    // misma altura y lo que se mueve alrededor es el resto.
    const target = this.realShown * this.stepY();
    this.camY += (target - this.camY) * Math.min(1, dt * 2.2);

    // las dos alturas siguen a las dos figuras
    if (this.vReal) this.vReal.set(Audio.note(Math.round(this.realShown * 1.6), 45), 0.085);
    if (this.vExp) {
      this.vExp.set(Audio.note(Math.round(this.expShown * 1.6), 45),
                    0.032 + 0.03 * this.holdK);
      this.vExp.cutoff(2600 - 900 * clamp01(this.proj / 6));
    }
  }

  draw() {
    const k = this.enterK(1);
    const tt = this.t();
    const hk = this.holdK;
    const x = this.CX;
    const base = this.U * 0.13;
    const yReal = this.yOf(this.realShown);
    const yExp = this.yOf(this.expShown);

    // EL EJE — marca: es el rastro del ascenso, no el sujeto.
    // Grueso lo recorrido, fino lo que falta.
    setDash(Dash.marca);
    stroke(Palette.triA(1, 120 * k));
    strokeWeight(2);
    line(x, this.H + 20, x, yReal);
    stroke(Palette.triA(1, (70 + 90 * hk) * k));
    strokeWeight(1);
    line(x, yReal, x, yExp);

    // LA ANTICIPACIÓN QUE CORRE — marca, cada vez más fina
    if (hk > 0.01 && this.proj > 0.05) {
      const layers = Math.ceil(this.proj);
      for (let i = 1; i <= layers; i++) {
        const lvl = this.exp + i;
        const far = i / Math.max(1, layers);
        drawSign('triangle', x, this.yOf(lvl), base * (1 + lvl * 0.06),
          { col: Palette.triColor(6 + i), alpha: (150 * (1 - far * 0.75)) * hk * k,
            weight: Math.max(0.5, 1.4 - i * 0.22) });
      }
    }

    // LO ANTICIPADO — marca, más grande y más fino que lo real
    const trem = this.holding ? 0 : (noise(3, tt * 5) - 0.5) * 4;
    drawSign('triangle', x + trem, yExp, base * (1 + this.expShown * 0.06),
      { col: Palette.triColor(6), alpha: 215 * k, weight: 1.4 + 0.8 * hk });

    // la distancia entre lo real y lo esperado: la expectativa misma
    if (Math.abs(yExp - yReal) > 6) {
      stroke(Palette.triA(3, (90 + 80 * hk) * k));
      strokeWeight(1);
      const gw = base * 0.5;
      line(x - gw, yExp, x + gw, yExp);
      line(x - gw, yReal, x + gw, yReal);
    }

    // el desplome de la proyección al soltar
    if (this.snap > 0.02) {
      stroke(Palette.triA(2, 140 * this.snap * k));
      strokeWeight(1);
      const sy = yExp - this.snap * this.U * 0.2;
      line(x - base, sy, x + base, sy);
    }

    // LO REAL — el sujeto: línea continua, gruesa, siempre más abajo
    setDash(Dash.none);
    drawSign('triangle', x, yReal, base * (1 + this.realShown * 0.05),
      { col: Palette.triColor(0), alpha: 252 * k, weight: 3.2 });
    setDash(Dash.none);
  }
}
