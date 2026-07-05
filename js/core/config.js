"use strict";
/* ============================================================
 * config.js — definición declarativa del sistema
 *
 * SISTEMA: 9 estados sobre una línea.
 * La línea es el estadío que atraviesa los tres subsistemas:
 *  - sub1: la línea del tiempo (se lee de izquierda a derecha)
 *  - sub2: la línea del vínculo (une los círculos entre sí)
 *  - sub3: la línea del devenir (el camino que se dibuja al andar)
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
      rule: 'sólo triángulos — se juega con el grosor de la línea',
      concepts: ['incertidumbre', 'ansiedad', 'expectativa'],
    },
  },

  concepts: {
    memoria:      { sub: 'sub1', title: 'MEMORIA',       gloss: 'como registro',
                    hint: 'arrastrá: todo gesto queda inscripto en la línea' },
    herencia:     { sub: 'sub1', title: 'HERENCIA',      gloss: 'como legado',
                    hint: 'tocá un cuadrado: algo se transmite, algo muta' },
    caducidad:    { sub: 'sub1', title: 'CADUCIDAD',     gloss: 'como lo perdido en el tránsito',
                    hint: 'swipeá hacia adelante · retener también gasta' },
    identidad:    { sub: 'sub2', title: 'IDENTIDAD',     gloss: 'como afirmación de sí',
                    hint: 'tocá: cada anillo te afirma · mantené el centro' },
    empatia:      { sub: 'sub2', title: 'EMPATÍA',       gloss: 'como comprensión del otro',
                    hint: 'acompañá su movimiento, sin perseguirlo' },
    colaboracion: { sub: 'sub2', title: 'COLABORACIÓN',  gloss: 'como coexistencia de lo diverso',
                    hint: 'tocá para sumar diversos al círculo común' },
    incertidumbre:{ sub: 'sub3', title: 'INCERTIDUMBRE', gloss: 'como desconocimiento del devenir',
                    hint: 'swipeá para avanzar: el camino se dibuja al andar' },
    ansiedad:     { sub: 'sub3', title: 'ANSIEDAD',      gloss: 'como pre-ocupación sobre el futuro',
                    hint: 'intentá tocarlo… o quedate quieto' },
    expectativa:  { sub: 'sub3', title: 'EXPECTATIVA',   gloss: 'como anticipación',
                    hint: 'mantené presionado · soltá cuando no aguantes más' },
  },

  /* ----------------------------------------------------------
   * Cadena conceptual: un ciclo que atraviesa los 9 estados.
   * Cada concepto "conduce" a otro; el signo del destino aparece
   * en escena y encadena la navegación (ej.: la expectativa que
   * no se cumple da lugar a la ansiedad).
   * ---------------------------------------------------------- */
  chain: {
    expectativa:  { to: 'ansiedad',      caption: 'la expectativa que no se cumple se vuelve ansiedad' },
    ansiedad:     { to: 'incertidumbre', caption: 'la pre-ocupación nace de no conocer el devenir' },
    incertidumbre:{ to: 'memoria',       caption: 'ante lo incierto, volvemos al registro' },
    memoria:      { to: 'identidad',     caption: 'lo que registramos nos afirma' },
    identidad:    { to: 'empatia',       caption: 'quien se afirma puede comprender al otro' },
    empatia:      { to: 'colaboracion',  caption: 'comprender permite coexistir' },
    colaboracion: { to: 'herencia',      caption: 'lo hecho en común se vuelve legado' },
    herencia:     { to: 'caducidad',     caption: 'todo legado pierde algo en el tránsito' },
    caducidad:    { to: 'expectativa',   caption: 'ante lo perdido, volvemos a anticipar' },
  },
};

/** Metadatos de una escena cualquiera (para transiciones y menú). */
function sceneMeta(id) {
  if (SYSTEM.concepts[id]) {
    const c = SYSTEM.concepts[id];
    return { kind: 'concept', title: c.title, sub: c.gloss, hint: c.hint, subsystem: c.sub };
  }
  for (const sid of SYSTEM.order) {
    if (SYSTEM.subs[sid].zero === id) {
      const s = SYSTEM.subs[sid];
      return { kind: 'zero', title: s.name, sub: s.tagline, hint: s.rule, subsystem: sid };
    }
  }
  if (id === 'home') {
    return { kind: 'home', title: 'ESTADO 0', sub: 'un sistema · tres familias · nueve estados', hint: 'tocá una figura para entrar', subsystem: null };
  }
  if (id === 'conclusion') {
    return { kind: 'conclusion', title: 'CIERRE', sub: 'todo cabe en una línea', hint: '', subsystem: null };
  }
  return { kind: 'unknown', title: id.toUpperCase(), sub: '', hint: '', subsystem: null };
}
