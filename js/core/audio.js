"use strict";
/* ============================================================
 * audio.js — la voz del sistema
 *
 * El sonido se genera, no se reproduce: no hay archivos ni
 * librerías, hay osciladores. Y sigue exactamente la misma
 * partición que la imagen — cada subsistema tiene su materia
 * sonora, igual que tiene su figura y su variable:
 *
 *   EL TIEMPO   pulsos secos y cortos, graves. La OPACIDAD es el
 *               volumen: lo que se ve más apagado suena más bajo.
 *   EL VÍNCULO  tonos sostenidos y cálidos. El COLOR es la altura:
 *               el tono de cada círculo es su nota, y compartir
 *               color es acercar las notas.
 *   EL DEVENIR  la línea continua es un tono continuo; lo
 *               discontinuo, sonido interrumpido. El GROSOR es el
 *               cuerpo del sonido.
 *
 * Todo cae en una escala pentatónica, así que cualquier cosa que
 * arme quien toca suena junta: no hay manera de desafinar el
 * sistema.
 *
 * Los navegadores no dejan sonar hasta que hay un gesto: el primer
 * contacto con la pantalla abre el audio (unlock).
 * ============================================================ */

const Audio = {
  ctx: null,
  master: null,
  on: true,
  ready: false,
  voices: [],          // voces sostenidas de la escena en curso

  /* ---------------- arranque ---------------- */

  /** Se llama con el primer contacto: sin gesto, no hay sonido. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      // un limitador suave: por más voces que se acumulen, no satura
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 12;
      comp.attack.value = 0.004;
      comp.release.value = 0.25;
      this.master = this.ctx.createGain();
      this.master.gain.value = this.on ? 0.5 : 0;
      this.master.connect(comp);
      comp.connect(this.ctx.destination);
      this.ready = true;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  setOn(v) {
    this.on = v;
    if (this.master) {
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(v ? 0.5 : 0, t, 0.05);
    }
    if (!v) this.stopScene();
  },

  toggle() { this.setOn(!this.on); },

  get t() { return this.ctx ? this.ctx.currentTime : 0; },

  /* ---------------- altura ---------------- */

  /**
   * Grado de la escala pentatónica → frecuencia.
   * i sube por la escala y sigue de largo octava tras octava.
   */
  note(i, root = 50) {
    const s = [0, 2, 4, 7, 9];
    const oct = Math.floor(i / 5);
    const d = ((i % 5) + 5) % 5;
    const midi = root + oct * 12 + s[d];
    return 440 * Math.pow(2, (midi - 69) / 12);
  },

  /** Un color → una nota. El tono del círculo ES su altura. */
  hueNote(c, root = 50, span = 12) {
    const h = Palette._hsl(c).h;
    return this.note(Math.round(h / 360 * span), root);
  },

  /* ---------------- primitivas ---------------- */

  /**
   * Pulso: una nota que aparece y se apaga sola.
   * type/cut definen la materia; gain, el peso.
   */
  blip(freq, opt = {}) {
    if (!this.ready || !this.on || !freq) return;
    const {
      dur = 0.3, gain = 0.3, type = 'triangle',
      cut = 2200, attack = 0.004, delay = 0, glide = 0,
    } = opt;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * glide), t + dur);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(cut, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(f); f.connect(g); g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  },

  /** Ruido corto: lo que se deshace, lo que raspa. */
  noise(opt = {}) {
    if (!this.ready || !this.on) return;
    const { dur = 0.18, gain = 0.16, freq = 1400, q = 1.2, delay = 0 } = opt;
    const t = this.ctx.currentTime + delay;
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t);
  },

  /**
   * Voz sostenida: se enciende y queda sonando hasta que se la
   * apaga. Devuelve un mando para moverle altura y volumen frame
   * a frame — así el sonido puede seguir al dibujo.
   */
  voice(freq, opt = {}) {
    if (!this.ready) return this._silentHandle();
    const {
      type = 'sine', gain = 0.12, cut = 2600,
      vibRate = 0, vibDepth = 0, glide = 0.06,
    } = opt;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    osc.type = type;
    osc.frequency.setValueAtTime(freq || 220, t);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(cut, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.setTargetAtTime(gain, t, 0.08);
    osc.connect(f); f.connect(g); g.connect(this.master);
    osc.start(t);

    let lfo = null, lfoGain = null;
    if (vibRate > 0) {
      lfo = ctx.createOscillator();
      lfoGain = ctx.createGain();
      lfo.frequency.value = vibRate;
      lfoGain.gain.value = vibDepth;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      lfo.start(t);
    }

    const h = {
      dead: false,
      set(f2, g2) {
        if (h.dead) return;
        const now = ctx.currentTime;
        if (f2) osc.frequency.setTargetAtTime(f2, now, glide);
        if (g2 !== undefined) g.gain.setTargetAtTime(Math.max(0, g2), now, 0.06);
      },
      /** Temblor: cuánto y qué tan rápido vibra la nota. */
      vib(rate, depth) {
        if (h.dead || !lfo) return;
        const now = ctx.currentTime;
        lfo.frequency.setTargetAtTime(Math.max(0.01, rate), now, 0.06);
        lfoGain.gain.setTargetAtTime(depth, now, 0.06);
      },
      cutoff(hz) {
        if (h.dead) return;
        f.frequency.setTargetAtTime(hz, ctx.currentTime, 0.08);
      },
      stop(rel = 0.25) {
        if (h.dead) return;
        h.dead = true;
        const now = ctx.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setTargetAtTime(0.0001, now, rel / 3);
        osc.stop(now + rel + 0.1);
        if (lfo) lfo.stop(now + rel + 0.1);
      },
    };
    // las apagadas no se guardan: el registro no crece de gusto
    this.voices = this.voices.filter(v => !v.dead);
    this.voices.push(h);
    return h;
  },

  _silentHandle() {
    return { dead: true, set() {}, vib() {}, cutoff() {}, stop() {} };
  },

  /** Al cambiar de escena, las voces sostenidas de la anterior se van. */
  stopScene() {
    for (const v of this.voices) v.stop(0.2);
    this.voices = [];
  },

  /* ---------------- materias de cada subsistema ---------------- */

  /** EL TIEMPO: pulso seco y grave. El volumen es la opacidad. */
  tiempo(i, opt = {}) {
    this.blip(this.note(i, 38), Object.assign({
      type: 'triangle', dur: 0.34, gain: 0.28, cut: 1100, attack: 0.003,
    }, opt));
  },

  /** EL VÍNCULO: nota cálida y larga. La altura es el color. */
  vinculo(c, opt = {}) {
    this.blip(this.hueNote(c, 50), Object.assign({
      type: 'sine', dur: 1.6, gain: 0.16, cut: 3000, attack: 0.05,
    }, opt));
  },

  /** EL DEVENIR: trazo fino y claro. */
  devenir(i, opt = {}) {
    this.blip(this.note(i, 57), Object.assign({
      type: 'sawtooth', dur: 0.5, gain: 0.17, cut: 2100, attack: 0.006,
    }, opt));
  },
};
