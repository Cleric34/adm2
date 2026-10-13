// Procedural war audio: reverb bus, layered drums, conch, metal clashes, arrow flights, elephants, wind and crowd.
class WarAudioEngine {
  constructor() { this.ctx = null; this.isMuted = false; this.vol = 0.8; this.drumTimer = null; this.amb = null; this.last = {}; }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = this.isMuted ? 0 : this.vol;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.2;
    this.master.connect(comp); comp.connect(c.destination);
    // noise buffer + synthetic hall reverb
    const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = nb;
    const len = c.sampleRate * 2.4, ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const x = ir.getChannelData(ch); for (let i = 0; i < len; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    this.verb = c.createConvolver(); this.verb.buffer = ir;
    this.wet = c.createGain(); this.wet.gain.value = 0.35; this.verb.connect(this.wet); this.wet.connect(this.master);
    this.dry = c.createGain(); this.dry.connect(this.master); this.dry.connect(this.verb);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ctx) this.master.gain.setTargetAtTime(this.isMuted ? 0 : this.vol, this.ctx.currentTime, 0.05);
    return this.isMuted;
  }

  // ---- helpers ----
  _ok(key, gap) { if (!this.ctx || this.isMuted) return false; const t = this.ctx.currentTime; if (gap && this.last[key] && t - this.last[key] < gap) return false; this.last[key] = t; return true; }
  _env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  _noise(t, dur, type, f0, f1, peak, a = 0.002, q = 1, dest) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; s.loop = true; f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    this._env(g, t, a, peak, dur); s.connect(f); f.connect(g); g.connect(dest || this.dry); s.start(t, Math.random()); s.stop(t + dur + a + 0.05);
  }
  _tone(t, type, f0, f1, dur, peak, a = 0.005, dest, detune = 0) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.detune.value = detune; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    this._env(g, t, a, peak, dur); o.connect(g); g.connect(dest || this.dry); o.start(t); o.stop(t + dur + a + 0.05); return o;
  }

  // ---- sounds ----
  // Deep dhol / war drum: pitched body + skin slap + low tail
  playWarDrum(pitch = 65, duration = 0.8, volume = 0.9) {
    if (!this._ok('drum', 0.04)) return; const t = this.ctx.currentTime;
    this._tone(t, 'sine', pitch * 2.2, pitch, 0.18, volume * 0.9, 0.002);
    this._tone(t, 'sine', pitch, pitch * 0.75, duration, volume * 0.6, 0.004);
    this._noise(t, 0.07, 'bandpass', 1800, 700, volume * 0.35, 0.001, 0.8);
  }

  // Conch (shankha): breathy, slowly swelling, with vibrato and a long tail
  playShankha() {
    if (!this._ok('conch', 0.5)) return; const c = this.ctx, t = c.currentTime, dur = 2.6;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.45); g.gain.setValueAtTime(0.5, t + dur - 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
    const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 520; f1.Q.value = 3;
    const f2 = c.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1500; f2.Q.value = 5;
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.2; lg.gain.value = 6; lfo.connect(lg);
    [0, 5, -7].forEach(dt => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(196, t); o.frequency.linearRampToValueAtTime(207, t + 0.5); o.detune.value = dt; lg.connect(o.detune); o.connect(f1); o.connect(f2); o.start(t); o.stop(t + dur + 0.6); });
    f1.connect(g); f2.connect(g); g.connect(this.dry); lfo.start(t); lfo.stop(t + dur + 0.6);
    this._noise(t, dur, 'bandpass', 900, 900, 0.07, 0.3, 2);
  }

  // Steel on steel: noise strike + inharmonic ring
  playSwordClash() {
    if (!this._ok('clash', 0.07)) return; const t = this.ctx.currentTime, r = 0.85 + Math.random() * 0.4;
    this._noise(t, 0.05, 'highpass', 3500, 6000, 0.22, 0.001, 0.7);
    [1830, 2740, 4190].forEach((f, i) => this._tone(t, 'sine', f * r, f * r * 0.995, 0.28 - i * 0.05, 0.07 / (i + 1), 0.001));
    this._tone(t, 'triangle', 220 * r, 150 * r, 0.09, 0.15, 0.001);
  }

  // Arrow volley: layered whooshes then soft impacts
  playArrowVolley() {
    if (!this._ok('volley', 0.25)) return; const t = this.ctx.currentTime;
    for (let i = 0; i < 7; i++) {
      const s = t + Math.random() * 0.35;
      this._noise(s, 0.55, 'bandpass', 1100 + Math.random() * 500, 3600, 0.07, 0.12, 1.4);
      this._noise(s + 0.52, 0.06, 'lowpass', 600, 200, 0.12, 0.001);
    }
  }

  // Elephant: roaring glide with formant and rumble
  playElephantTrumpet() {
    if (!this._ok('ele', 1.2)) return; const c = this.ctx, t = c.currentTime;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(700, t); f.frequency.linearRampToValueAtTime(1500, t + 0.5); f.Q.value = 2.5; f.connect(this.dry);
    const o = this._tone(t, 'sawtooth', 260, 620, 0.5, 0.35, 0.08, f);
    this._tone(t + 0.5, 'sawtooth', 620, 380, 0.7, 0.3, 0.02, f);
    this._tone(t, 'square', 262, 624, 0.5, 0.08, 0.08, f, 12);
    this._tone(t, 'sine', 55, 40, 1.2, 0.4, 0.05);
  }

  // Rising brass fanfare for victory
  playVictory() {
    if (!this.ctx || this.isMuted) return; const c = this.ctx, t = c.currentTime;
    [[261.6, 0, .5], [329.6, .45, .5], [392, .9, .5], [523.3, 1.35, 1.8], [659.3, 1.35, 1.8], [392, 1.35, 1.8]].forEach(([fr, o, d]) => {
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(500, t + o); f.frequency.linearRampToValueAtTime(2400, t + o + 0.25); f.connect(this.dry);
      [0, 6, -6].forEach(dt => this._tone(t + o, 'sawtooth', fr, fr, d, 0.12, 0.05, f, dt));
    });
    [0, 0.45, 0.9, 1.35].forEach(o => this.playWarDrum(70, 0.6, 0.8 - o * 0.1));
  }

  // Battle bed: marching dhol pattern, low drone, wind and distant crowd
  startBattleDrums() {
    if (!this.ctx || this.drumTimer) return; const c = this.ctx; let step = 0;
    const pat = [1, 0, .4, 0, .7, 0, .4, .5]; // accent map per eighth note
    this.drumTimer = setInterval(() => {
      if (this.isMuted) return; const a = pat[step++ % 8];
      if (a) { const t = c.currentTime; this._tone(t, 'sine', 120, 52, 0.22, 0.28 * a, 0.002); this._noise(t, 0.05, 'bandpass', 1500, 600, 0.07 * a, 0.001); }
    }, 300);
    const drone = c.createGain(); drone.gain.value = 0.0001; drone.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 3); drone.connect(this.dry);
    const df = c.createBiquadFilter(); df.type = 'lowpass'; df.frequency.value = 180; df.connect(drone);
    const os = [55, 82.4].map((fr, i) => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.detune.value = i * 4; o.connect(df); o.start(); return o; });
    const mk = (fq, q, gain, lf) => {
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain();
      s.buffer = this.noiseBuf; s.loop = true; f.type = 'bandpass'; f.frequency.value = fq; f.Q.value = q; g.gain.value = gain; l.frequency.value = lf; lg.gain.value = gain * 0.6;
      l.connect(lg); lg.connect(g.gain); s.connect(f); f.connect(g); g.connect(this.dry); s.start(); l.start(); return [s, l];
    };
    this.amb = { drone, os, beds: [...mk(450, 0.6, 0.05, 0.13), ...mk(200, 0.5, 0.04, 0.07)] };
  }

  stopBattleDrums() {
    clearInterval(this.drumTimer); this.drumTimer = null;
    if (this.amb && this.ctx) { const a = this.amb, t = this.ctx.currentTime; a.drone.gain.setTargetAtTime(0.0001, t, 0.4); setTimeout(() => { [...a.os, ...a.beds].forEach(n => { try { n.stop(); } catch (e) {} }); }, 1800); this.amb = null; }
  }
}
window.warAudio = new WarAudioEngine();
