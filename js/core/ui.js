"use strict";
/* ============================================================
 * ui.js — UIManager
 *
 * La única capa del sistema donde vive la palabra. Dentro de los
 * nueve signos no hay ni un texto: se entienden por sí mismos.
 * Acá están el menú (mapa del sistema y créditos), la constelación
 * de progreso y los chevrones de navegación.
 *
 * Las zonas sensibles de la UI son deliberadamente chicas y
 * pegadas al borde, para no robarle nunca un pulsar al signo.
 * ============================================================ */

class UIManager {
  constructor(app) {
    this.app = app;
    this.menuOpen = false;
    this.menuT = 0;             // animación de apertura 0..1
    this.rows = [];             // filas del menú (para hit-test)
  }

  /* ---------------- eventos ---------------- */

  /** Devuelve true si la UI consumió el evento. */
  onEvent(type, a, b) {
    if (this.menuOpen) {
      if (type === 'tap') this._menuTap(a, b);
      return true; // el menú captura todo
    }
    if (type !== 'tap') return false;
    const x = a, y = b;

    // hamburguesa: esquina superior izquierda
    if (x < 64 && y < 64) { this.menuOpen = true; return true; }

    // chevrones: franjas MUY angostas contra el borde y a media
    // altura. Cuanto más chicas, menos le roban un pulsar al signo:
    // para navegar están además el deslizamiento y el menú.
    const nav = this.app.scenes.neighbors(this.app.scenes.currentId);
    if (nav && Math.abs(y - height / 2) < 40) {
      if (x < 27) { this.app.scenes.navPrev(); return true; }
      if (x > width - 27) { this.app.scenes.navNext(); return true; }
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
    const id = this.app.scenes.currentId;
    // el cierre se mira sin nada encima; sólo queda la salida
    if (id !== 'cierre') {
      this._drawConstellation();
      if (id !== 'home') this._drawChevrons();
    }
    this._drawHamburger();
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
    const cy = height / 2, s = 8;
    const xl = 13;
    line(xl + s, cy - s, xl, cy); line(xl, cy, xl + s, cy + s);
    const xr = width - 13;
    line(xr - s, cy - s, xr, cy); line(xr, cy, xr - s, cy + s);
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

  _drawMenu() {
    const k = this.menuT;
    push();
    noStroke();
    const veil = color(Palette.bg); veil.setAlpha(251 * k);
    fill(veil);
    rect(0, 0, width, height);

    textFont('Helvetica');
    const u = unit();
    this.rows = [];

    const items = this._menuItems();
    // deja aire arriba (título) y abajo (créditos)
    const rowH = Math.min(40, (height - 210) / items.length);
    const totalH = rowH * items.length;
    let y = height / 2 - totalH / 2 + rowH / 2;
    const x0 = Math.max(30, width / 2 - 250);
    const x1 = Math.min(width - 30, width / 2 + 250);

    trackedText('SISTEMA', width / 2, Math.max(40, y - rowH * 1.5),
      Math.max(13, u * 0.02), 8, Palette.ink, 200 * k);

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
      textSize(it.kind === 'header' ? Math.max(12, u * 0.017) : Math.max(11, u * 0.015));
      const labelX = ix + 28;
      text(it.label, labelX, y);
      if (it.note) {
        // la glosa se achica hasta no tocar al nombre; si ni así entra,
        // se calla: el nombre es lo que hay que poder leer
        const room = (x1 - 12) - (labelX + textWidth(it.label) + 12);
        fill(Palette.inkA(a * 0.5));
        textAlign(RIGHT, CENTER);
        let ns = Math.max(9, u * 0.0115);
        textSize(ns);
        while (textWidth(it.note) > room && ns > 7.5) { ns -= 0.5; textSize(ns); }
        if (textWidth(it.note) <= room) text(it.note, x1 - 12, y);
      }
      if (isCurrent) {
        noStroke();
        fill(color(Palette.accent));
        rect(x0 - 2, y - 1.5, 10, 3);
      }
      this.rows.push({ id: it.id, y, h: rowH, x0, x1 });
      y += rowH;
    }

    // gestos y créditos: el pie del mapa
    const footY = Math.min(height - 58, y + rowH * 0.7);
    fadedText('pulsar y mantener operan el signo · deslizar navega',
      width / 2, footY, Math.max(9, u * 0.0115), Palette.ink, 95 * k);
    fittedText(MEMBERS.join('   ·   '),
      width / 2, Math.min(height - 26, footY + 28),
      Math.max(9, u * 0.0125), width * 0.9, Palette.ink, 130 * k);
    pop();
  }

  _menuItems() {
    const items = [{ id: 'home', kind: 'header', sign: 'line', label: 'ESTADO 0', note: 'inicio' }];
    for (const sid of SYSTEM.order) {
      const sub = SYSTEM.subs[sid];
      items.push({ id: sub.zero, kind: 'header', sign: sub.sign, label: sub.name, note: sub.rule });
      for (const cid of sub.concepts) {
        const c = SYSTEM.concepts[cid];
        items.push({ id: cid, kind: 'concept', sign: sub.sign, label: c.title, note: c.gloss, indent: true });
      }
    }
    return items;
  }
}
