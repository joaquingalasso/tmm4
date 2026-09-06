"use strict";
/* ============================================================
 * config.js — definición declarativa del sistema
 *
 * SISTEMA: 9 estados sobre una línea.
 * La línea es el estadío que atraviesa los tres subsistemas:
 *  - sub1: la línea del tiempo (se lee de izquierda a derecha)
 *  - sub2: la línea del vínculo (une los círculos entre sí)
 *  - sub3: la línea del devenir (el camino que se dibuja al andar)
 *
 * INTERACCIÓN: los nueve signos aceptan sólo dos gestos.
 *  - PULSAR:  opera el signo (inscribe, transmite, afirma, suma…)
 *  - MANTENER: anima y resalta la cualidad que el signo describe.
 * Todo lo demás (deslizar, menú) es navegación, nunca interacción.
 * ============================================================ */

const SYSTEM = {

  order: ['sub1', 'sub2', 'sub3'],

  subs: {
    sub1: {
      name: 'EL TIEMPO',
      sign: 'square',
      zero: 'zero1',
      tagline: 'memoria · herencia · caducidad',
      rule: 'sólo cuadrados — se juega con la opacidad',
      concepts: ['memoria', 'herencia', 'caducidad'],
    },
    sub2: {
      name: 'EL VÍNCULO',
      sign: 'circle',
      zero: 'zero2',
      tagline: 'identidad · empatía · colaboración',
      rule: 'sólo círculos — se juega con el color',
      concepts: ['identidad', 'empatia', 'colaboracion'],
    },
    sub3: {
      name: 'EL DEVENIR',
      sign: 'triangle',
      zero: 'zero3',
      tagline: 'incertidumbre · ansiedad · expectativa',
      rule: 'sólo triángulos — grosor y tipo de línea discontinua',
      concepts: ['incertidumbre', 'ansiedad', 'expectativa'],
    },
  },

  concepts: {
    memoria:      { sub: 'sub1', title: 'MEMORIA',       gloss: 'como registro' },
    herencia:     { sub: 'sub1', title: 'HERENCIA',      gloss: 'como legado' },
    caducidad:    { sub: 'sub1', title: 'CADUCIDAD',     gloss: 'como lo perdido en el tránsito' },
    identidad:    { sub: 'sub2', title: 'IDENTIDAD',     gloss: 'como afirmación de sí' },
    empatia:      { sub: 'sub2', title: 'EMPATÍA',       gloss: 'como comprensión del otro' },
    colaboracion: { sub: 'sub2', title: 'COLABORACIÓN',  gloss: 'como coexistencia de lo diverso' },
    incertidumbre:{ sub: 'sub3', title: 'INCERTIDUMBRE', gloss: 'como desconocimiento del devenir' },
    ansiedad:     { sub: 'sub3', title: 'ANSIEDAD',      gloss: 'como pre-ocupación sobre el futuro' },
    expectativa:  { sub: 'sub3', title: 'EXPECTATIVA',   gloss: 'como anticipación' },
  },
};

/** Integrantes del grupo, en orden alfabético. */
const MEMBERS = [
  'IVÁN SALDAÑA',
  'JOAQUÍN GALASSO',
  'MATHILDA ESTEBAN',
  'MAURO SCAFFIDI',
  'ZOE ULLUA',
];

/** Metadatos de una escena cualquiera (para transiciones y menú). */
function sceneMeta(id) {
  if (SYSTEM.concepts[id]) {
    const c = SYSTEM.concepts[id];
    return { kind: 'concept', title: c.title, sub: c.gloss, subsystem: c.sub };
  }
  for (const sid of SYSTEM.order) {
    if (SYSTEM.subs[sid].zero === id) {
      const s = SYSTEM.subs[sid];
      return { kind: 'zero', title: s.name, sub: s.tagline, subsystem: sid };
    }
  }
  if (id === 'cierre') {
    // sin título: el cierre no se anuncia, se ve
    return { kind: 'cierre', title: '', sub: '', subsystem: null };
  }
  if (id === 'home') {
    return { kind: 'home', title: 'ESTADO 0', sub: 'un sistema · tres familias · nueve estados', subsystem: null };
  }
  return { kind: 'unknown', title: id.toUpperCase(), sub: '', subsystem: null };
}
