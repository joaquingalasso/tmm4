"use strict";
/* ============================================================
 * utils.js — funciones de apoyo compartidas por todo el sistema
 * (easing, azar determinista, dibujo de signos, texto trackeado)
 * ============================================================ */

const Ease = {
  linear:     t => t,
  inCubic:    t => t * t * t,
  outCubic:   t => 1 - Math.pow(1 - t, 3),
  inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuint:   t => 1 - Math.pow(1 - t, 5),
  outExpo:    t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outBack:    t => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function clampv(v, a, b) { return Math.max(a, Math.min(b, v)); }

/** Azar determinista (Vera Molnár: el desorden controlado se puede repetir). */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Dibuja uno de los cuatro signos del sistema (línea, cuadrado,
 * círculo, triángulo) centrado en (x, y). Es el vocabulario visual
 * común de menúes, constelación de progreso y transiciones.
 */
function drawSign(type, x, y, s, opt = {}) {
  const {
    weight = 2, col = Palette.ink, fillCol = null,
    alpha = 255, rot = 0,
  } = opt;
  push();
  translate(x, y);
  rotate(rot);
  const sc = color(col); sc.setAlpha(alpha);
  if (fillCol) {
    const fc = color(fillCol); fc.setAlpha(alpha);
    fill(fc); noStroke();
  } else {
    noFill(); stroke(sc); strokeWeight(weight);
  }
  if (type === 'line') {
    stroke(sc); strokeWeight(weight);
    line(-s / 2, 0, s / 2, 0);
  } else if (type === 'square') {
    rectMode(CENTER);
    rect(0, 0, s, s);
  } else if (type === 'circle') {
    circle(0, 0, s);
  } else if (type === 'triangle') {
    const h = s * 0.866;
    triangle(-s / 2, h / 2, s / 2, h / 2, 0, -h / 2);
  }
  pop();
}

/** Texto centrado con tracking manual (tipografía del sistema). */
function trackedText(str, x, y, size, spacing, col, alpha = 255) {
  push();
  textSize(size);
  textAlign(LEFT, CENTER);
  const chars = [...str];
  const widths = chars.map(ch => textWidth(ch));
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let px = x - total / 2;
  const c = color(col); c.setAlpha(alpha);
  fill(c); noStroke();
  for (let i = 0; i < chars.length; i++) {
    text(chars[i], px, y);
    px += widths[i] + spacing;
  }
  pop();
}

/** Texto simple centrado con alpha. */
function fadedText(str, x, y, size, col, alpha = 255) {
  push();
  textSize(size);
  textAlign(CENTER, CENTER);
  const c = color(col); c.setAlpha(alpha);
  fill(c); noStroke();
  text(str, x, y);
  pop();
}

/** Unidad de escala compartida: lado menor de la pantalla. */
function unit() { return Math.min(width, height); }
