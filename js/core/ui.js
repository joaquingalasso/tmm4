"use strict";
/* ============================================================
 * ui.js — UIManager
 *
 * Dos vías de navegación conviven:
 *  1. UI explícita: menú hamburguesa (mapa del sistema) + chevrons.
 *  2. Navegación por signos: el signo del concepto encadenado
 *     aparece en escena (trail) y conduce al próximo estado.
 * Todo pensado para tacto: zonas grandes, cero hover.
 * ============================================================ */

class UIManager {
  constructor(app) {
    this.app = app;
    this.menuOpen = false;
    this.menuT = 0;             // animación de apertura 0..1
    this.rows = [];             // filas del menú (para hit-test)

    this.subtitle = null;       // { title, sub, hint, at }
    this.trail = null;          // { to, caption, at }
  }

  /* ---------------- subtítulos ---------------- */

  showSubtitle(meta) {
    // la home, los ceros y el cierre hablan por sí mismos
    if (meta.kind !== 'concept') { this.subtitle = null; return; }
    this.subtitle = { title: meta.title, sub: meta.sub, hint: meta.hint, at: millis() };
  }

  /* ---------------- signo encadenado ---------------- */

  showTrail(toId, caption) {
    if (this.trail && this.trail.to === toId) return;
    this.trail = { to: toId, caption, at: millis() };
  }

  hideTrail() { this.trail = null; }

  /* ---------------- eventos ---------------- */

  /** Devuelve true si la UI consumió el evento. */
  onEvent(type, a, b) {
    if (this.menuOpen) {
      if (type === 'tap') this._menuTap(a, b);
      return true; // el menú captura todo
    }
    if (type !== 'tap') return false;
    const x = a, y = b;
    const u = unit();

    // hamburguesa (arriba izquierda)
    if (x < 76 && y < 76) { this.menuOpen = true; return true; }

    // chevrons laterales
    const nav = this.app.scenes.neighbors(this.app.scenes.currentId);
    if (nav && Math.abs(y - height / 2) < 70) {
      if (x < 56 && nav.prev) { this.app.scenes.go(nav.prev); return true; }
      if (x > width - 56 && nav.next) { this.app.scenes.go(nav.next); return true; }
    }

    // signo encadenado (abajo derecha)
    if (this.trail && x > width - u * 0.32 && y > height - u * 0.24) {
      const to = this.trail.to;
      this.hideTrail();
      this.app.scenes.go(to);
      return true;
    }
    return false;
  }

  _menuTap(x, y) {
    for (const r of this.rows) {
      if (y >= r.y - r.h / 2 && y <= r.y + r.h / 2 && x >= r.x0 && x <= r.x1) {
        this.menuOpen = false;
        if (r.id) this.app.scenes.go(r.id);
        return;
      }
    }
    this.menuOpen = false; // tocar fuera cierra
  }

  /* ---------------- ciclo ---------------- */

  update(dt) {
    const target = this.menuOpen ? 1 : 0;
    this.menuT += (target - this.menuT) * Math.min(1, dt * 10);
  }

  draw() {
    const sm = this.app.scenes;
    const onHome = sm.currentId === 'home';
    const inConclusion = sm.currentId === 'conclusion';

    if (!inConclusion) this._drawConstellation();
    if (!onHome && !inConclusion) this._drawChevrons();
    this._drawHamburger();
    this._drawSubtitle();
    this._drawTrail();
    if (this.menuT > 0.01) this._drawMenu();
  }

  /* ---------------- piezas ---------------- */

  _drawHamburger() {
    push();
    const open = this.menuT;
    stroke(Palette.inkA(150 + 60 * open));
    strokeWeight(1.6);
    const x = 24, y = 26, w = 22;
    if (open < 0.5) {
      // tres líneas: el signo "línea" hecho botón
      line(x, y, x + w, y);
      line(x, y + 7, x + w, y + 7);
      line(x, y + 14, x + w, y + 14);
    } else {
      const cx = x + w / 2, cy = y + 7;
      line(cx - 8, cy - 8, cx + 8, cy + 8);
      line(cx - 8, cy + 8, cx + 8, cy - 8);
    }
    pop();
  }

  _drawChevrons() {
    const nav = this.app.scenes.neighbors(this.app.scenes.currentId);
    if (!nav) return;
    push();
    stroke(Palette.inkA(70));
    strokeWeight(1.6);
    noFill();
    const cy = height / 2, s = 9;
    if (nav.prev) {
      const x = 22;
      line(x + s, cy - s, x, cy); line(x, cy, x + s, cy + s);
    }
    if (nav.next) {
      const x = width - 22;
      line(x - s, cy - s, x, cy); line(x, cy, x - s, cy + s);
    }
    pop();
  }

  _drawConstellation() {
    // nueve señas mínimas arriba a la derecha: el mapa del recorrido
    push();
    const sm = this.app.scenes;
    const s = 7, gap = 15, groupGap = 10;
    let x = width - 24;
    const y = 26;
    const groups = [...SYSTEM.order].reverse();
    for (const sid of groups) {
      const sub = SYSTEM.subs[sid];
      const ids = [...sub.concepts].reverse();
      for (const cid of ids) {
        const visited = sm.visited.has(cid);
        const current = sm.currentId === cid;
        const a = visited ? 220 : 60;
        const pulse = current ? 1 + 0.25 * Math.sin(millis() / 200) : 1;
        drawSign(sub.sign, x, y, s * pulse, visited
          ? { fillCol: Palette.ink, alpha: a }
          : { col: Palette.ink, alpha: a, weight: 1 });
        x -= gap;
      }
      x -= groupGap;
    }
    pop();
  }

  _drawSubtitle() {
    if (!this.subtitle) return;
    const age = (millis() - this.subtitle.at) / 1000;
    let a = 1;
    if (age < 0.5) a = Ease.outCubic(age / 0.5);
    else if (age > 4.2) a = Math.max(0, 1 - (age - 4.2) / 1.2);
    if (a <= 0) { this.subtitle = null; return; }
    push();
    textFont('Helvetica');
    const u = unit();
    const yBase = height - u * 0.085;
    trackedText(this.subtitle.title, width / 2, yBase, Math.max(14, u * 0.024), 5, Palette.ink, 235 * a);
    if (this.subtitle.sub) {
      fadedText(this.subtitle.sub, width / 2, yBase + u * 0.033, Math.max(11, u * 0.015), Palette.ink, 140 * a);
    }
    if (this.subtitle.hint) {
      fadedText(this.subtitle.hint, width / 2, yBase + u * 0.058, Math.max(10, u * 0.013), Palette.ink, 90 * a);
    }
    pop();
  }

  _drawTrail() {
    if (!this.trail) return;
    const age = (millis() - this.trail.at) / 1000;
    const k = Ease.outCubic(clamp01(age / 0.6));
    const u = unit();
    const meta = sceneMeta(this.trail.to);
    const sign = meta.subsystem ? SYSTEM.subs[meta.subsystem].sign : 'line';
    const x = width - u * 0.09;
    const y = height - u * 0.12;
    const pulse = 1 + 0.1 * Math.sin(millis() / 260);

    push();
    // halo de invitación
    noFill();
    stroke(Palette.inkA(40 * k));
    strokeWeight(1);
    circle(x, y, u * 0.11 * pulse);
    drawSign(sign, x, y, u * 0.045 * pulse, { col: Palette.accent, alpha: 235 * k, weight: 2 });
    textFont('Helvetica');
    textAlign(RIGHT, CENTER);
    textSize(Math.max(10, u * 0.0135));
    fill(Palette.inkA(150 * k));
    noStroke();
    text(this.trail.caption, x - u * 0.085, y - 8);
    textSize(Math.max(10, u * 0.0125));
    fill(Palette.inkA(90 * k));
    text('tocá el signo para seguir', x - u * 0.085, y + 10);
    pop();
  }

  _drawMenu() {
    const k = this.menuT;
    push();
    // velo
    noStroke();
    const veil = color(Palette.bg); veil.setAlpha(242 * k);
    fill(veil);
    rect(0, 0, width, height);

    textFont('Helvetica');
    const u = unit();
    this.rows = [];

    const items = this._menuItems();
    const rowH = Math.min(44, (height - 140) / items.length);
    const totalH = rowH * items.length;
    let y = height / 2 - totalH / 2 + rowH / 2;
    const x0 = Math.max(38, width / 2 - 240);
    const x1 = Math.min(width - 38, width / 2 + 240);

    trackedText('SISTEMA', width / 2, Math.max(44, y - rowH * 1.4), Math.max(13, u * 0.02), 8, Palette.ink, 200 * k);

    const sm = this.app.scenes;
    for (const it of items) {
      const isCurrent = sm.currentId === it.id;
      const visited = sm.visited.has(it.id);
      const baseA = it.kind === 'header' ? 235 : (visited || it.kind !== 'concept' ? 190 : 120);
      const a = baseA * k;
      const ix = x0 + 18 + (it.indent ? 26 : 0);

      if (it.sign) {
        const filled = it.kind === 'concept' && visited;
        drawSign(it.sign, ix, y, it.kind === 'header' ? 15 : 10,
          filled ? { fillCol: Palette.ink, alpha: a }
                 : { col: Palette.ink, alpha: a, weight: it.kind === 'header' ? 2 : 1.2 });
      }
      textAlign(LEFT, CENTER);
      noStroke();
      fill(Palette.inkA(a));
      textSize(it.kind === 'header' ? Math.max(13, u * 0.018) : Math.max(12, u * 0.016));
      text(it.label, ix + 30, y);
      if (it.note) {
        fill(Palette.inkA(a * 0.5));
        textSize(Math.max(10, u * 0.012));
        textAlign(RIGHT, CENTER);
        text(it.note, x1 - 12, y);
      }
      if (isCurrent) {
        noStroke();
        fill(color(Palette.accent));
        rect(x0 - 2, y - 1.5, 10, 3);
      }
      this.rows.push({ id: it.id, y, h: rowH, x0, x1 });
      y += rowH;
    }

    fadedText(`recorridos · ${sm.visited.size} / 9`, width / 2, Math.min(height - 36, y + rowH * 0.8),
      Math.max(10, u * 0.013), Palette.ink, 110 * k);
    pop();
  }

  _menuItems() {
    const sm = this.app.scenes;
    const items = [{ id: 'home', kind: 'header', sign: 'line', label: 'ESTADO 0', note: 'inicio' }];
    for (const sid of SYSTEM.order) {
      const sub = SYSTEM.subs[sid];
      items.push({ id: sub.zero, kind: 'header', sign: sub.sign, label: sub.name, note: sub.rule });
      for (const cid of sub.concepts) {
        const c = SYSTEM.concepts[cid];
        items.push({ id: cid, kind: 'concept', sign: sub.sign, label: c.title, note: c.gloss, indent: true });
      }
    }
    if (sm.visited.size >= 9) {
      items.push({ id: 'conclusion', kind: 'header', sign: 'line', label: 'CIERRE', note: 'la experiencia concluye' });
    }
    return items;
  }
}
