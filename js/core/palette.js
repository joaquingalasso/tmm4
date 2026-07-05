"use strict";
/* ============================================================
 * palette.js — clave tonal y paleta cromática del sistema
 *
 * Clave tonal baja (fondo casi negro) para que la luz sea de las
 * figuras, como en las salas de Le Parc.
 *  - Subsistema 1 (cuadrados): escala de grises, se juega con la OPACIDAD.
 *  - Subsistema 2 (círculos):  paleta saturada, se juega con el COLOR.
 *  - Subsistema 3 (triángulos): monocromo, se juega con el GROSOR DE LÍNEA.
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
    // paleta a lo Le Parc: 10 colores francos que coexisten sin fundirse
    colors: ['#e63946', '#f4a261', '#e9c46a', '#2a9d8f', '#4895ef',
             '#b5179e', '#f72585', '#80b918', '#ff6d00', '#48bfe3'],
  },

  sub3: {
    ink: '#f4f2ec',
  },

  /** Color de tinta con alpha (0..255). */
  inkA(alpha) {
    const c = color(Palette.ink);
    c.setAlpha(alpha);
    return c;
  },

  /** Un color del subsistema 2, estable por índice. */
  circleColor(i) {
    const list = Palette.sub2.colors;
    return list[((i % list.length) + list.length) % list.length];
  },
};
