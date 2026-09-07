"use strict";
/* ============================================================
 * ui.js — UIManager
 *
 * La capa donde vive la palabra… cuando se la quiere. El sistema
 * se puede recorrer entero sin una sola letra, así que el menú
 * tiene dos formas y las dos dicen lo mismo:
 *
 *   con texto  la lista del sistema, con nombres y glosas.
 *   sin texto  el mapa: los nueve signos vivos, en su grilla,
 *              y el signo de cada subsistema al frente de su fila.
 *
 * Las zonas sensibles son deliberadamente chicas y pegadas al
 * borde, para no robarle nunca un pulsar al signo.
 * ============================================================ */

class UIManager {
  constructor(app) {
    this.app = app;
    this.menuOpen = false;
    this.menuT = 0;             // animación de apertura 0..1
    this.hits = [];             // destinos del menú (para hit-test)
    this.toggles = [];          // los dos interruptores del pie
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
    if (this.app.scenes.currentId === 'inicio') return false;  // la portada es suya

    // hamburguesa: esquina superior izquierda
    if (x < 64 && y < 64) { this.menuOpen = true; return true; }

    // chevrones: franjas MUY angostas contra el borde y a media
    // altura. Cuanto más chicas, menos le roban un pulsar al signo.
    const nav = this.app.scenes.neighbors(this.app.scenes.currentId);
    if (nav && Math.abs(y - height / 2) < 40) {
      if (x < 27) { this.app.scenes.navPrev(); return true; }
      if (x > width - 27) { this.app.scenes.navNext(); return true; }
    }
    return false;
  }

  _menuTap(x, y) {
    // los interruptores no cierran el menú: se los usa mirando el mapa
    for (const t of this.toggles) {
      if (dist(x, y, t.x, t.y) < t.r * 1.6) {
        if (t.kind === 'sonido') Prefs.toggleSonido(); else Prefs.toggleTexto();
        Audio.blip(Audio.note(t.kind === 'sonido' ? 5 : 7, 50),
          { type: 'sine', dur: 0.35, gain: 0.14 });
        return;
      }
    }
    for (const h of this.hits) {
      if (Math.abs(x - h.x) <= h.w / 2 && Math.abs(y - h.y) <= h.h / 2) {
        this.menuOpen = false;
        if (h.id) this.app.scenes.go(h.id);
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
    // la portada y el cierre se miran sin nada encima
    const bare = id === 'inicio' || id === 'cierre';
    if (!bare) {
      this._drawConstellation();
      if (id !== 'home') this._drawChevrons();
    }
    if (id !== 'inicio') this._drawHamburger();
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

  /* ---------------- el menú ---------------- */

  _drawMenu() {
    const k = this.menuT;
    const u = unit();
    push();
    noStroke();
    const veil = color(Palette.bg); veil.setAlpha(255 * k);
    fill(veil);
    rect(0, 0, width, height);
    textFont('Helvetica');

    this.hits = [];
    this.toggles = [];

    /* El pie se arma de abajo hacia arriba, con el MISMO aire entre
     * cada bloque y el mismo margen contra el borde. Cada bloque
     * declara su alto —los integrantes pueden ocupar una línea o
     * dos— y el reparto sale solo, con texto y sin él. */
    const gs = Math.max(9, u * 0.0115);        // cuerpo de la línea de gestos
    const ls = Math.max(9, u * 0.0125);        // cuerpo de los integrantes
    const tr = Math.max(17, u * 0.04);         // radio de los interruptores
    const aire = Math.max(20, u * 0.052);      // el aire, siempre el mismo
    const margen = Math.max(24, u * 0.062);    // contra el borde de abajo

    const nombres = MEMBERS.join('   ·   ');
    const nLines = fittedLines(nombres, ls, width * 0.9);
    const altoNombres = nLines * ls * 1.5;
    const altoToggles = tr * 2;
    const altoGestos = Txt.on ? gs * 1.5 : 0;

    let y0 = height - margen;
    const namesY = y0 - altoNombres / 2;
    if (altoNombres) y0 -= altoNombres + aire;
    const togY = y0 - altoToggles / 2;
    y0 -= altoToggles + aire;
    const gestY = y0 - altoGestos / 2;
    if (altoGestos) y0 -= altoGestos + aire;
    const bodyBottom = y0;

    if (Txt.on) this._menuList(k, u, bodyBottom);
    else this._menuMap(k, u, bodyBottom);

    fadedText('pulsar y mantener operan el signo · las flechas cambian de signo',
      width / 2, gestY, gs, Palette.ink, 95 * k);

    // los dos interruptores, siempre
    [['sonido', Audio.on], ['texto', Txt.on]].forEach(([kind, on], i) => {
      const tx = width / 2 + (i === 0 ? -1 : 1) * tr * 1.8;
      drawToggle(kind, tx, togY, tr, on, 220 * k);
      this.toggles.push({ kind, x: tx, y: togY, r: tr });
    });

    fittedText(nombres, width / 2, namesY, ls, width * 0.9, Palette.ink, 130 * k);
    pop();
  }

  /** Con palabra: la lista del sistema, con nombres y glosas. */
  _menuList(k, u, bottom) {
    const items = this._menuItems();
    const top = 78;
    // Las filas reparten toda la banda disponible, con un tope por si
    // la pantalla es larguísima. Lo que sobre, si sobra, queda arriba
    // —donde está el título— y nunca abriendo un hueco contra el pie:
    // así el aire del pie es el mismo entre todos sus bloques.
    const rowH = Math.min(48, (bottom - top) / items.length);
    const blockTop = bottom - rowH * items.length;
    let y = blockTop + rowH / 2;
    const x0 = Math.max(30, width / 2 - 250);
    const x1 = Math.min(width - 30, width / 2 + 250);

    trackedText('SISTEMA', width / 2, Math.max(42, blockTop - 34),
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
      this.hits.push({ id: it.id, x: (x0 + x1) / 2, y, w: x1 - x0, h: rowH });
      y += rowH;
    }
  }

  /**
   * Sin palabra: el mapa. Arriba la línea —el estado 0—, y debajo
   * una fila por subsistema: su signo al frente y, al lado, los tres
   * signos vivos, cada uno moviéndose como se mueve de verdad. No
   * hace falta leer nada para saber a dónde se va.
   */
  _menuMap(k, u, bottom) {
    const sm = this.app.scenes;
    const tt = millis() / 1000;

    /* En pantallas angostas el tamaño de celda lo manda el ancho, así
     * que sobra alto. En vez de pinchar el mapa arriba y dejar un
     * hueco muerto contra el pie, se arma el grupo entero —la línea
     * del estado 0 más las tres filas— y se lo centra: el aire queda
     * repartido igual arriba y abajo. */
    const top = 62;
    const lineBand = Math.max(40, u * 0.1);
    // el ancho manda el tamaño de celda…
    let cell = (width * 0.92 - u * 0.1) / 3.35;
    let rowGap = cell * 0.3;
    if (lineBand + cell * 3 + rowGap * 2 > bottom - top) {
      cell = (bottom - top - lineBand) / 3.6;
      rowGap = cell * 0.3;
    } else {
      // …y el alto que sobra se reparte como aire entre las filas,
      // hasta cierto punto: el resto queda centrado
      const libre = (bottom - top - lineBand - cell * 3) / 2;
      rowGap = clampv(libre, rowGap, cell * 0.85);
    }
    const gap = cell * 0.17;
    const groupH = lineBand + cell * 3 + rowGap * 2;
    const groupTop = top + Math.max(0, (bottom - top - groupH) / 2);

    // el estado 0: la línea, encabezando el mapa
    const lineY = groupTop + lineBand * 0.42;
    const homeOn = sm.currentId === 'home';
    drawSign('line', width / 2, lineY, u * 0.13,
      { col: Palette.ink, alpha: (homeOn ? 245 : 150) * k, weight: homeOn ? 3 : 1.8 });
    this.hits.push({ id: 'home', x: width / 2, y: lineY, w: u * 0.2, h: lineBand * 0.8 });

    const blockTop = groupTop + lineBand;
    const signX = width / 2 - (cell * 1.5 + gap) - u * 0.045;

    SYSTEM.order.forEach((sid, r) => {
      const sub = SYSTEM.subs[sid];
      const cy = blockTop + cell / 2 + r * (cell + rowGap);
      const zeroOn = sm.currentId === sub.zero;

      // el signo del subsistema abre la fila y lleva a su cero
      drawSign(sub.sign, signX, cy, u * 0.052,
        { col: Palette.ink, alpha: (zeroOn ? 245 : 165) * k, weight: zeroOn ? 2.6 : 1.8 });
      this.hits.push({ id: sub.zero, x: signX, y: cy, w: u * 0.1, h: cell });

      sub.concepts.forEach((cid, c) => {
        const cx = width / 2 + (c - 1) * (cell + gap) + u * 0.02;
        const on = sm.currentId === cid;
        const visited = sm.visited.has(cid);
        push();
        rectMode(CENTER);
        noFill();
        stroke(Palette.inkA((on ? 130 : 46) * k));
        strokeWeight(on ? 1.6 : 1);
        rect(cx, cy, cell, cell);
        pop();
        drawConceptPreview(cid, cx, cy, cell * 0.72, (visited || on ? 215 : 155) * k, tt);
        this.hits.push({ id: cid, x: cx, y: cy, w: cell, h: cell });
      });
    });
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
