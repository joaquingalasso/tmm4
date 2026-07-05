"use strict";
/* ============================================================
 * sceneManager.js — SceneManager
 *
 * Registro de escenas, navegación (vecinos, retorno, cadena
 * conceptual) y estado del recorrido (visitados → cierre).
 * ============================================================ */

class SceneManager {
  constructor(app) {
    this.app = app;
    this.scenes = {};
    this.currentId = null;
    this.visited = new Set();
    this.concluded = false;
    this.enterAt = 0;
    this.chainShown = false;
  }

  register(id, scene) { this.scenes[id] = scene; }

  get current() { return this.scenes[this.currentId] || null; }

  start(id) {
    this.currentId = id;
    this.enterAt = millis();
    this.chainShown = false;
    this.current.enter();
    this.app.ui.showSubtitle(sceneMeta(id));
  }

  go(id) {
    if (!this.scenes[id] || id === this.currentId) return;
    const meta = sceneMeta(id);
    this.app.transition.run(meta.title, meta.sub, () => {
      if (this.current) this.current.exit();
      this.currentId = id;
      this.enterAt = millis();
      this.chainShown = false;
      this.app.ui.hideTrail();
      this.current.enter();
      this.app.ui.showSubtitle(meta);
      if (meta.kind === 'concept') this.visited.add(id);
      if (meta.kind === 'conclusion') this.concluded = true;
    });
  }

  /* ------- navegación estructural ------- */

  orderFor(subId) {
    const sub = SYSTEM.subs[subId];
    return [sub.zero, ...sub.concepts];
  }

  /** Vecinos para chevrons y swipes: recorre [cero, a, b, c] del subsistema. */
  neighbors(id) {
    const meta = sceneMeta(id);
    if (!meta.subsystem) return null;
    const arr = this.orderFor(meta.subsystem);
    const i = arr.indexOf(id);
    return {
      prev: i > 0 ? arr[i - 1] : 'home',
      next: i < arr.length - 1 ? arr[i + 1] : arr[0], // el final vuelve al cero
    };
  }

  /** Nivel superior: concepto → cero del subsistema → estado 0. */
  backOf(id) {
    const meta = sceneMeta(id);
    if (meta.kind === 'concept') return SYSTEM.subs[meta.subsystem].zero;
    if (meta.kind === 'zero') return 'home';
    if (meta.kind === 'conclusion') return 'home';
    return null;
  }

  navNext() { const n = this.neighbors(this.currentId); if (n && n.next) this.go(n.next); }
  navPrev() { const n = this.neighbors(this.currentId); if (n && n.prev) this.go(n.prev); }
  navBack() { const b = this.backOf(this.currentId); if (b) this.go(b); }

  /* ------- cadena conceptual ------- */

  /**
   * Ofrece el próximo signo: si el recorrido está completo invita
   * al cierre; si no, sigue la cadena conceptual del estado actual.
   * Las escenas pueden forzarlo en momentos dramáticos (p. ej.
   * expectativa incumplida → ansiedad).
   */
  offerNext(captionOverride) {
    const meta = sceneMeta(this.currentId);
    if (meta.kind !== 'concept') return;
    if (this.visited.size >= 9 && !this.concluded) {
      this.app.ui.showTrail('conclusion', 'las nueve señas se reconocen · el sistema puede cerrarse');
    } else {
      const link = SYSTEM.chain[this.currentId];
      if (link) this.app.ui.showTrail(link.to, captionOverride || link.caption);
    }
    this.chainShown = true;
  }

  reset() {
    this.visited.clear();
    this.concluded = false;
  }

  /* ------- ciclo ------- */

  update(dt) {
    const cur = this.current;
    if (!cur) return;
    cur.update(dt);
    // pasado un tiempo de habitar un concepto, el signo siguiente aparece solo
    if (!this.chainShown && millis() - this.enterAt > 12000) {
      this.offerNext();
    }
  }

  draw() {
    const cur = this.current;
    if (cur) cur.draw();
  }
}
