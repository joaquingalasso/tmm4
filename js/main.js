"use strict";
/* ============================================================
 * main.js — arranque y cableado del sistema
 *
 * App compone los módulos (gestos → UI → escena) y p5 sólo
 * conoce a App: setup/draw y el puntero crudo.
 * ============================================================ */

class App {
  constructor() {
    this.input = new GestureManager(this);
    this.transition = new TransitionManager(this);
    this.ui = new UIManager(this);
    this.scenes = new SceneManager(this);
    this._registerScenes();
    this.scenes.start('home');
  }

  _registerScenes() {
    const S = this.scenes;
    S.register('home', new HomeScene(this, 'home'));
    S.register('zero1', new ZeroScene(this, 'zero1', 'sub1'));
    S.register('zero2', new ZeroScene(this, 'zero2', 'sub2'));
    S.register('zero3', new ZeroScene(this, 'zero3', 'sub3'));
    S.register('memoria', new MemoriaScene(this, 'memoria'));
    S.register('herencia', new HerenciaScene(this, 'herencia'));
    S.register('caducidad', new CaducidadScene(this, 'caducidad'));
    S.register('identidad', new IdentidadScene(this, 'identidad'));
    S.register('empatia', new EmpatiaScene(this, 'empatia'));
    S.register('colaboracion', new ColaboracionScene(this, 'colaboracion'));
    S.register('incertidumbre', new IncertidumbreScene(this, 'incertidumbre'));
    S.register('ansiedad', new AnsiedadScene(this, 'ansiedad'));
    S.register('expectativa', new ExpectativaScene(this, 'expectativa'));
    S.register('cierre', new CierreScene(this, 'cierre'));
  }

  /**
   * Un solo punto de entrada para todos los gestos.
   * Prioridad: transición (bloquea) → UI → escena → navegación.
   * Pulsar y mantener son del signo; deslizar es del sistema.
   */
  dispatch(type, a, b) {
    if (this.transition.active) return;
    if (this.ui.onEvent(type, a, b)) return;

    const scene = this.scenes.current;
    if (!scene) return;

    switch (type) {
      case 'down':      scene.onDown(a, b); break;
      case 'tap':       scene.onTap(a, b); break;
      case 'holdStart': scene.onHoldStart(a, b); break;
      case 'holdMove':  scene.onHoldMove(a, b); break;
      case 'holdEnd':   scene.onHoldEnd(a); break;
      case 'swipe':
        // Deslizar de costado NO cambia de signo: cambiar de signo es
        // sólo de las flechas laterales. Acá el movimiento se le pasa
        // a la escena por si lo usa para lo suyo (el cero mueve el
        // foco entre sus tres estaciones, sin entrar a ninguna).
        if (a === 'left' || a === 'right') { scene.onSwipe(a, b); return; }
        if (a === 'down') this.scenes.navBack();
        else if (a === 'up') this.scenes.navEnter();
        break;
    }
  }

  update() {
    const dt = Math.min(deltaTime, 50) / 1000;
    this.input.update();
    this.transition.update(dt);
    this.ui.update(dt);
    if (!this.transition.active || this.transition.phase === 'close') {
      this.scenes.update(dt);
    }
  }

  draw() {
    background(Palette.bg);
    this.scenes.draw();
    rectMode(CORNER); // higiene: la UI no hereda el modo de la escena
    setDash(Dash.none);
    this.ui.draw();
    this.transition.draw();
  }
}

/* ---------------- p5 ---------------- */

let app;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('Helvetica');
  app = new App();
  window.__app = app; // consola / depuración
}

function draw() {
  // El navegador no siempre avisa cuando cambia el tamaño (rotar el
  // teléfono, volver de segundo plano, mostrar la barra de la app):
  // si el lienzo quedó desfasado, se corrige acá mismo.
  if (windowWidth > 0 && windowHeight > 0 &&
      (width !== windowWidth || height !== windowHeight)) {
    resizeCanvas(windowWidth, windowHeight);
  }
  app.update();
  app.draw();
}

function windowResized() {
  if (windowWidth > 0 && windowHeight > 0) resizeCanvas(windowWidth, windowHeight);
}

/* puntero: touch primero (return false = sin gestos del navegador) */

function touchStarted() { app.input.down(mouseX, mouseY); return false; }
function touchMoved()   { app.input.move(mouseX, mouseY); return false; }
function touchEnded()   { app.input.up(mouseX, mouseY);   return false; }

function mousePressed()  { if (touches.length === 0) app.input.down(mouseX, mouseY); }
function mouseDragged()  { if (touches.length === 0) app.input.move(mouseX, mouseY); }
function mouseReleased() { if (touches.length === 0) app.input.up(mouseX, mouseY); }
