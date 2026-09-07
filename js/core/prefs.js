"use strict";
/* ============================================================
 * prefs.js — las dos decisiones que se toman antes de entrar
 *
 * El sistema puede recorrerse de dos maneras, y las dos son el
 * mismo sistema:
 *
 *   SONIDO  con la voz de cada signo, o en silencio.
 *   TEXTO   con palabra, o sin ninguna.
 *
 * Apagar el texto no esconde una ayuda: es la prueba de que los
 * signos se entienden solos. No queda una letra en ningún lado
 * —ni en el estado 0, ni en los ceros, ni en el menú, ni en las
 * transiciones— y la navegación pasa a hacerse toda con signos.
 *
 * Las dos decisiones se recuerdan de una visita a la otra.
 * ============================================================ */

/**
 * El sistema arranca SIN texto y CON sonido: la propuesta es que
 * los signos se entiendan solos, y la palabra queda disponible por
 * si se la quiere. Quien la encienda, la encuentra encendida la
 * próxima vez.
 */
const Txt = { on: false };

const Prefs = {
  KEY: 'tp2-signos',

  load() {
    try {
      const p = JSON.parse(localStorage.getItem(this.KEY) || '{}');
      if (typeof p.sonido === 'boolean') Audio.on = p.sonido;
      if (typeof p.texto === 'boolean') Txt.on = p.texto;
    } catch (e) { /* sin memoria disponible: valen los valores por defecto */ }
  },

  save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify({ sonido: Audio.on, texto: Txt.on }));
    } catch (e) { /* navegación privada: se usa igual, sin recordar */ }
  },

  toggleSonido() {
    Audio.unlock();
    Audio.toggle();
    this.save();
  },

  toggleTexto() {
    Txt.on = !Txt.on;
    this.save();
  },
};
