"use strict";
/* ============================================================
 * sceneManager.js — SceneManager
 *
 * Registro de escenas y navegación. El modelo es un árbol de
 * tres niveles y se recorre siempre igual, sin excepciones:
 *
 *   ← →   hermanos del mismo nivel (nunca cambia de nivel)
 *   ↓     salir un nivel (concepto → cero → estado 0)
 *   ↑     entrar (sólo desde un cero, a la estación enfocada)
 *   menú  ir a cualquier estado del sistema
 *
 * Deslizar NUNCA entra solo a un signo ni salta al estado 0:
 * entrar es siempre una decisión explícita (pulsar, ↑ o menú).
 * ============================================================ */

class SceneManager {
  constructor(app) {
    this.app = app;
    this.scenes = {};
    this.currentId = null;
    this.visited = new Set();
    this.enterAt = 0;
  }

  register(id, scene) { this.scenes[id] = scene; }

  get current() { return this.scenes[this.currentId] || null; }

  start(id) {
    this.currentId = id;
    this.enterAt = millis();
    this.current.enter();
  }

  go(id) {
    if (!this.scenes[id] || id === this.currentId) return;
    const meta = sceneMeta(id);
    this.app.transition.run(meta.title, meta.sub, () => {
      Audio.stopScene();          // ninguna voz sobrevive al cambio de signo
      if (this.current) this.current.exit();
      this.currentId = id;
      this.enterAt = millis();
      this.current.enter();
      if (meta.kind === 'concept') this.visited.add(id);
    });
  }

  /* ------- navegación estructural ------- */

  /** Los nueve signos en un solo recorrido: sub1 → sub2 → sub3. */
  allConcepts() {
    const out = [];
    for (const sid of SYSTEM.order) out.push(...SYSTEM.subs[sid].concepts);
    return out;
  }

  /**
   * Qué sigue después del signo i del recorrido. Al pasar el tercer
   * signo de un subsistema se entra al primero del siguiente: los
   * nueve son una sola línea. Y después del noveno está el cierre,
   * si es que se habitaron los nueve; si no, se vuelve al principio.
   */
  nextConcept(i) {
    const arr = this.allConcepts();
    if (i < arr.length - 1) return arr[i + 1];
    return this.visited.size >= arr.length ? 'cierre' : arr[0];
  }

  /**
   * Hermanos del nivel actual:
   *  · concepto → el recorrido completo de los nueve, en ciclo
   *  · cero     → los otros dos ceros
   * Nunca devuelve 'home' ni cruza de nivel por su cuenta.
   */
  neighbors(id) {
    const meta = sceneMeta(id);
    if (meta.kind === 'concept') {
      const arr = this.allConcepts();
      const i = arr.indexOf(id);
      return { prev: arr[(i + arr.length - 1) % arr.length], next: this.nextConcept(i) };
    }
    if (meta.kind === 'zero') {
      const arr = SYSTEM.order;
      const i = arr.indexOf(meta.subsystem);
      return { prev: SYSTEM.subs[arr[(i + arr.length - 1) % arr.length]].zero,
               next: SYSTEM.subs[arr[(i + 1) % arr.length]].zero };
    }
    return null;
  }

  /** Nivel superior: concepto → cero del subsistema → estado 0. */
  backOf(id) {
    const meta = sceneMeta(id);
    if (meta.kind === 'concept') return SYSTEM.subs[meta.subsystem].zero;
    if (meta.kind === 'zero') return 'home';
    if (meta.kind === 'cierre') return 'home';
    if (meta.kind === 'home') return 'inicio';   // salir del todo: la portada
    return null;
  }

  /* Las escenas pueden resolver el movimiento por su cuenta
   * (el cero mueve su foco en vez de cambiar de pantalla). */
  navNext() {
    const s = this.current;
    if (s && s.onSwipe('left')) return;
    const n = this.neighbors(this.currentId);
    if (n) this.go(n.next);
  }

  navPrev() {
    const s = this.current;
    if (s && s.onSwipe('right')) return;
    const n = this.neighbors(this.currentId);
    if (n) this.go(n.prev);
  }

  navBack() {
    const s = this.current;
    if (s && s.onSwipe('down')) return;
    const b = this.backOf(this.currentId);
    if (b) this.go(b);
  }

  navEnter() {
    const s = this.current;
    if (s && s.onSwipe('up')) return;
  }

  reset() { this.visited.clear(); }

  /* ------- ciclo ------- */

  update(dt) { if (this.current) this.current.update(dt); }
  draw() { if (this.current) this.current.draw(); }
}
