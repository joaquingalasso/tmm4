"use strict";
/* ============================================================
 * previews.js — miniaturas cinéticas compartidas
 *
 * Anticipan, en pequeño, el comportamiento de cada signo. Se usan
 * en la grilla 3×3 del estado 0 y en las pantallas "cero" de cada
 * subsistema, para que la vista previa sea siempre fiel al signo.
 *
 * Cada subsistema respeta su propio lenguaje visual:
 *  - sub1 (el tiempo):    sólo cuadrados, monocromático, opacidad.
 *  - sub2 (el vínculo):   sólo círculos, sin relleno, línea llena,
 *                         el color como materia.
 *  - sub3 (el devenir):   sólo triángulos, sin relleno; el sujeto
 *                         en línea continua y sus marcas en la
 *                         única línea discontinua del sistema.
 * ============================================================ */

function drawConceptPreview(cid, cx, cy, s, a, tt) {
  push();
  translate(cx, cy);
  rectMode(CENTER);
  setDash(Dash.none);

  if (cid === 'memoria') {
    // registros que se apagan hacia atrás sin borrarse nunca
    for (let i = 0; i < 6; i++) {
      const x = -s * 0.55 + i * s * 0.22;
      const age = 5 - i;
      const al = a * (0.18 + 0.82 * Math.pow(0.62, age));
      fill(Palette.inkA(al)); noStroke();
      rect(x, -s * 0.1, s * 0.11, s * 0.11);
      stroke(Palette.inkA(al * 0.8)); strokeWeight(1.5);
      line(x, -s * 0.02, x, s * 0.02);
    }

  } else if (cid === 'herencia') {
    // el linaje avanza a la derecha: una generación se apaga
    // mientras engendra la columna siguiente (video de referencia)
    noStroke();
    const cyc = (tt * 0.55) % 4.6;
    for (let g = 0; g < 4; g++) {
      const x = -s * 0.5 + g * s * 0.33;
      // cada generación se enciende cuando le toca y se apaga al
      // engendrar: las vecinas se solapan, como en la referencia
      const al = clampv(1.45 - Math.abs(cyc - g) * 1.15, 0, 1);
      if (al <= 0.02) continue;
      const n = g === 0 ? 1 : (g === 1 ? 2 : 3);
      const gray = 224 - g * 36;
      const w = s * 0.15, h = s * 0.1;
      for (let j = 0; j < n; j++) {
        const y = (j - (n - 1) / 2) * s * 0.17;
        fill(gray, gray, gray, a * al);
        rect(x, y, w, h);
      }
    }

  } else if (cid === 'caducidad') {
    // tránsito: lo que avanza se gasta; la línea se corta
    const cut = s * 0.55;
    stroke(Palette.inkA(a * 0.7)); strokeWeight(1.3);
    line(-s * 0.6, s * 0.12, cut * 0.45, s * 0.12);
    setDash(Dash.marca);
    line(cut * 0.45, s * 0.12, cut, s * 0.12);
    setDash(Dash.none);
    for (let i = 0; i < 4; i++) {
      const p = ((tt * 0.12 + i * 0.25) % 1);
      const x = -s * 0.6 + p * (cut + s * 0.6);
      const decay = 1 - p;
      const sz = s * 0.13 * (0.4 + 0.6 * decay);
      if (p < 0.72) {
        noStroke(); fill(Palette.inkA(a * decay));
        rect(x, s * 0.12 - sz * 0.65, sz, sz);
      } else {
        noFill(); stroke(Palette.inkA(a * decay * 0.9)); strokeWeight(1);
        setDash(Dash.marca);
        rect(x, s * 0.12 - sz * 0.65, sz, sz);
        setDash(Dash.none);
      }
    }

  } else if (cid === 'identidad') {
    // diana de anillos, sin relleno, cada uno a su ritmo
    noFill();
    for (let i = 4; i >= 1; i--) {
      const col = color(Palette.circleColor(i * 2));
      col.setAlpha(a * 0.9);
      stroke(col); strokeWeight(2.2);
      const off = s * 0.012 * i * Math.sin(tt * 0.9 + i);
      circle(off, 0, s * 0.22 * i);
    }
    stroke(Palette.inkA(a)); strokeWeight(2); noFill();
    circle(0, 0, s * 0.09);

  } else if (cid === 'empatia') {
    // ponerse en el lugar del otro: mi círculo deja el suyo, viaja
    // hasta el otro y en el camino toma su tamaño y su color, hasta
    // quedar al lado, idéntico. Después vuelve.
    const A = Palette.circleColor(6);      // yo
    const B = Palette.circleColor(3);      // el otro
    const cyc = (tt * 0.34) % 2;
    const go = clampv(cyc < 1 ? cyc * 1.6 : (2 - cyc) * 1.6, 0, 1);
    const e = Ease.inOutCubic(go);

    const oX = s * 0.26, oY = -s * 0.1, oR = s * 0.15;   // el otro
    const hX = -s * 0.3, hY = s * 0.16, hR = s * 0.1;    // mi lugar
    const r = lerp(hR, oR, e);
    const ang = Math.atan2(hY - oY, hX - oX);
    const mX = lerp(hX, oX + Math.cos(ang) * (oR + r) * 1.14, e);
    const mY = lerp(hY, oY + Math.sin(ang) * (oR + r) * 1.14, e);
    noFill();

    // mi lugar, marcado mientras no estoy en él
    if (e > 0.05) {
      stroke(Palette.alphaOf(A, a * 0.28 * e));
      strokeWeight(1);
      circle(hX, hY, hR * 2);
    }

    // el vínculo, de borde a borde
    const d = dist(mX, mY, oX, oY) - r - oR;
    if (d > 2) {
      const la = Math.atan2(oY - mY, oX - mX);
      stroke(Palette.alphaOf(Palette.mixHue(A, B, e * 0.5 + 0.25), a * (0.25 + 0.4 * e)));
      strokeWeight(1 + e);
      line(mX + Math.cos(la) * r, mY + Math.sin(la) * r,
           oX - Math.cos(la) * oR, oY - Math.sin(la) * oR);
    }

    stroke(Palette.alphaOf(B, a)); strokeWeight(2.6); circle(oX, oY, oR * 2);
    stroke(Palette.alphaOf(Palette.mixHue(A, B, e), a)); strokeWeight(2.6); circle(mX, mY, r * 2);

  } else if (cid === 'colaboracion') {
    // trama de diversos que forman un solo círculo, sin fundirse
    const rot = tt * 0.25;
    noFill();
    for (let ring = 0; ring < 4; ring++) {
      const rr = s * 0.09 + ring * s * 0.085;
      const n = 4 + ring * 5;
      for (let j = 0; j < n; j++) {
        const ang = rot * (ring % 2 ? 1 : -1) + j * TWO_PI / n;
        const col = color(Palette.circleColor(j + ring * 3));
        col.setAlpha(a * 0.95);
        stroke(col); strokeWeight(1.6);
        circle(Math.cos(ang) * rr, Math.sin(ang) * rr, s * 0.055);
      }
    }

  } else if (cid === 'incertidumbre') {
    // el camino andado es marca gruesa; lo próximo, marca finísima;
    // el caminante, línea continua
    noFill();
    setDash(Dash.marca);
    strokeWeight(2.6); stroke(Palette.triA(0, a));
    line(-s * 0.6, s * 0.3, -s * 0.15, -s * 0.28);
    const flick = 0.5 + 0.5 * Math.sin(tt * 6);
    strokeWeight(0.9);
    stroke(Palette.triA(1, a * 0.55 * flick));
    line(-s * 0.15, -s * 0.28, s * 0.35, s * 0.22);
    stroke(Palette.triA(2, a * 0.5 * (1 - flick)));
    line(-s * 0.15, -s * 0.28, s * 0.45, -s * 0.05);
    setDash(Dash.none);
    drawSign('triangle', -s * 0.15, -s * 0.33, s * 0.13,
      { col: Palette.triColor(7), alpha: a, weight: 2 });

  } else if (cid === 'ansiedad') {
    // los ecos de cada intento son marca; el que se escapa, continua
    setDash(Dash.marca);
    drawSign('triangle', -s * 0.2, -s * 0.1, s * 0.4,
      { col: Palette.triColor(3), alpha: a * 0.3, weight: 1 });
    drawSign('triangle', s * 0.2, s * 0.08, s * 0.36,
      { col: Palette.triColor(0), alpha: a * 0.25, weight: 1 });
    setDash(Dash.none);
    const jx = (noise(tt * 9) - 0.5) * s * 0.14;
    const jy = (noise(tt * 9 + 50) - 0.5) * s * 0.14;
    drawSign('triangle', jx, jy, s * 0.42,
      { col: Palette.triColor(4), alpha: a, weight: 2.6 });

  } else if (cid === 'expectativa') {
    // lo real, lleno y grueso, abajo; lo anticipado, de punto y
    // fino, siempre un poco más arriba; entre los dos, la distancia
    const osc = 0.5 + 0.5 * Math.sin(tt * 0.9);
    const yReal = s * 0.3 - osc * s * 0.1;
    const yExp = yReal - s * (0.3 + 0.12 * osc);

    // lo anticipado y el eje son marca; lo real, línea continua
    setDash(Dash.marca);
    stroke(Palette.triA(1, a * 0.5)); strokeWeight(1);
    line(0, yReal, 0, yExp);
    drawSign('triangle', 0, yExp - s * 0.26, s * 0.34,
      { col: Palette.triColor(5), alpha: a * 0.3, weight: 0.8 });
    drawSign('triangle', 0, yExp, s * 0.38,
      { col: Palette.triColor(6), alpha: a * 0.85, weight: 1.2 });

    setDash(Dash.none);
    drawSign('triangle', 0, yReal, s * 0.3,
      { col: Palette.triColor(0), alpha: a, weight: 3 });
  }

  setDash(Dash.none);
  pop();
}
