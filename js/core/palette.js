"use strict";
/* ============================================================
 * palette.js — clave tonal y paleta cromática del sistema
 *
 * Clave tonal baja (fondo casi negro) para que la luz sea de las
 * figuras, como en las salas de Le Parc.
 *  - Subsistema 1 (cuadrados): escala de grises, se juega con la OPACIDAD.
 *  - Subsistema 2 (círculos):  paleta saturada, se juega con el COLOR.
 *  - Subsistema 3 (triángulos): se juega con el GROSOR y el TIPO
 *    de línea discontinua.
 * ============================================================ */

const Palette = {
  bg:  '#0a0a0c',
  ink: '#f4f2ec',

  // acento único, usado con muchísima moderación (pulsos, cumplimiento)
  accent: '#f4a261',

  sub1: {
    grays: ['#f4f2ec', '#cfcdc7', '#a9a7a1', '#83817c', '#5d5c58', '#3a3936'],
  },

  sub2: {
    colors: ['#f6b6bb', '#f8d4ad', '#f1e0ad', '#a8d9d1', '#aecdf5',
             '#e3b8db', '#f7b8d3', '#c8e0a0', '#ffcfa3', '#a9e0f0'],
  },

  sub3: {
    colors: ['#ff2e63', '#08d9d6', '#f9c80e', '#ff9f1c',
             '#7209b7', '#00f5d4', '#f72585', '#4cc9f0'],
  },

  /**
   * Copia de un color con otro alpha. Imprescindible cuando el
   * color viene guardado en una escena: color() devuelve la MISMA
   * instancia si le pasás un p5.Color, y setAlpha lo mutaría.
   */
  alphaOf(c, a) {
    const s = color(c);
    return color(red(s), green(s), blue(s), a);
  },

  /** Color de tinta con alpha (0..255). */
  inkA(alpha) {
    const c = color(Palette.ink);
    c.setAlpha(alpha);
    return c;
  },

  /** Un color pastel del subsistema 2 (el vínculo), estable por índice. */
  circleColor(i) {
    const list = Palette.sub2.colors;
    return list[((i % list.length) + list.length) % list.length];
  },

  /** Un color vibrante del subsistema 3 (el devenir), estable por índice. */
  triColor(i) {
    const list = Palette.sub3.colors;
    return list[((i % list.length) + list.length) % list.length];
  },

  /** Color vibrante del subsistema 3 con alpha (0..255). */
  triA(i, alpha) {
    const c = color(Palette.triColor(i));
    c.setAlpha(alpha);
    return c;
  },

  /* ----------------------------------------------------------
   * Mezcla por TONO (arco corto del círculo cromático).
   * Promediar dos colores en RGB da un gris sucio; recorrer el
   * tono da un color nuevo, que no es de ninguno de los dos.
   * Es la operación central del signo de EMPATÍA: comprender al
   * otro produce un tercer color que antes no existía.
   * ---------------------------------------------------------- */
  mixHue(a, b, t, satBoost = 1, litShift = 0) {
    const A = Palette._hsl(a), B = Palette._hsl(b);
    let dh = B.h - A.h;
    if (dh > 180) dh -= 360;
    if (dh < -180) dh += 360;
    const h = (A.h + dh * t + 360) % 360;
    const s = clampv((A.s + (B.s - A.s) * t) * satBoost, 0, 1);
    const l = clampv(A.l + (B.l - A.l) * t + litShift, 0, 1);
    const [r, g, bl] = Palette._rgb(h, s, l);
    return color(r, g, bl);
  },

  _hsl(c) {
    const col = color(c);
    const r = red(col) / 255, g = green(col) / 255, b = blue(col) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const l = (mx + mn) / 2;
    let h = 0, s = 0;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h, s, l };
  },

  _rgb(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = h / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r = 0, g = 0, b = 0;
    if (hp < 1)      { r = c; g = x; }
    else if (hp < 2) { r = x; g = c; }
    else if (hp < 3) { g = c; b = x; }
    else if (hp < 4) { g = x; b = c; }
    else if (hp < 5) { r = x; b = c; }
    else             { r = c; b = x; }
    const m = l - c / 2;
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  },
};
