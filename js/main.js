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
    S.register('conclusion', new ConclusionScene(this, 'conclusion'));
  }

  /**
   * Un solo punto de entrada para todos los gestos.
   * Prioridad: transición (bloquea) → UI → escena → navegación.
   */
  dispatch(type, a, b, c, d) {
    if (this.transition.active) return;
    if (this.ui.onEvent(type, a, b)) return;

    const scene = this.scenes.current;
    if (!scene) return;

    switch (type) {
      case 'down':      scene.onDown(a, b); break;
      case 'tap':       scene.onTap(a, b); break;
      case 'dragStart': scene.onDragStart(a, b); break;
      case 'drag':      scene.onDrag(a, b, c, d); break;
      case 'dragEnd':   scene.onDragEnd(a, b); break;
      case 'holdStart': scene.onHoldStart(a, b); break;
      case 'holdEnd':   scene.onHoldEnd(a); break;
      case 'swipe':
        if (scene.onSwipe(a, b)) return;
        // navegación por defecto: el sistema entero se recorre swipeando
        if (a === 'left') this.scenes.navNext();
        else if (a === 'right') this.scenes.navPrev();
        else if (a === 'down') this.scenes.navBack();
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
  app.update();
  app.draw();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

/* puntero: touch primero (return false = sin gestos del navegador) */

function touchStarted() { app.input.down(mouseX, mouseY); return false; }
function touchMoved()   { app.input.move(mouseX, mouseY); return false; }
function touchEnded()   { app.input.up(mouseX, mouseY);   return false; }

function mousePressed()  { if (touches.length === 0) app.input.down(mouseX, mouseY); }
function mouseDragged()  { if (touches.length === 0) app.input.move(mouseX, mouseY); }
function mouseReleased() { if (touches.length === 0) app.input.up(mouseX, mouseY); }
