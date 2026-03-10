/**
 * GTA 4-style dark ambient cinematic intro sound.
 * Heavy bass, dark synths, slow brooding atmosphere with reverb.
 * Plays for ~6 seconds during intro sequence.
 */
export function playIntroSound() {
  const ctx = new AudioContext();
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.55;
  masterGain.connect(ctx.destination);

  // Compressor for that punchy GTA feel
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 12;
  compressor.ratio.value = 8;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.15;
  compressor.connect(masterGain);

  // Reverb
  const convolver = ctx.createConvolver();
  const reverbLen = ctx.sampleRate * 4;
  const impulse = ctx.createBuffer(2, reverbLen, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = impulse.getChannelData(ch);
    for (let i = 0; i < reverbLen; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 2);
    }
  }
  convolver.buffer = impulse;
  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.4;
  convolver.connect(reverbGain);
  reverbGain.connect(compressor);

  const dry = ctx.createGain();
  dry.gain.value = 0.75;
  dry.connect(compressor);

  const now = ctx.currentTime;

  // ═══ 1. SUB BASS DRONE — Deep dark foundation ═══
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = "sine";
  sub.frequency.setValueAtTime(32, now);
  sub.frequency.linearRampToValueAtTime(28, now + 6);
  subGain.gain.setValueAtTime(0, now);
  subGain.gain.linearRampToValueAtTime(0.6, now + 0.8);
  subGain.gain.setValueAtTime(0.6, now + 4);
  subGain.gain.linearRampToValueAtTime(0, now + 6);
  sub.connect(subGain);
  subGain.connect(dry);
  sub.start(now);
  sub.stop(now + 6.5);

  // ═══ 2. DARK PAD — Menacing filtered sawtooth ═══
  const padFreqs = [55, 82.41, 110]; // A1, E2, A2 — dark minor
  padFreqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.value = freq;
    osc.detune.value = (i - 1) * 8 + Math.random() * 5;

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(150, now);
    filter.frequency.linearRampToValueAtTime(600, now + 2.5);
    filter.frequency.linearRampToValueAtTime(200, now + 5);
    filter.Q.value = 3;

    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(0.08 / (i + 1), now + 1.5);
    oscGain.gain.setValueAtTime(0.08 / (i + 1), now + 3.5);
    oscGain.gain.linearRampToValueAtTime(0, now + 5.5);

    osc.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(dry);
    oscGain.connect(convolver);
    osc.start(now + 0.2);
    osc.stop(now + 6);
  });

  // ═══ 3. SLOW KICK HITS — GTA pulse ═══
  const kickTimes = [0.5, 2.0, 3.5];
  kickTimes.forEach((t) => {
    const kick = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kick.type = "sine";
    kick.frequency.setValueAtTime(120, now + t);
    kick.frequency.exponentialRampToValueAtTime(25, now + t + 0.5);
    kickGain.gain.setValueAtTime(0.7, now + t);
    kickGain.gain.exponentialRampToValueAtTime(0.01, now + t + 0.6);
    kick.connect(kickGain);
    kickGain.connect(dry);
    kickGain.connect(convolver);
    kick.start(now + t);
    kick.stop(now + t + 0.7);

    // Layered noise hit
    const nBuf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
    const nData = nBuf.getChannelData(0);
    for (let i = 0; i < nData.length; i++) {
      nData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / nData.length, 4);
    }
    const nSrc = ctx.createBufferSource();
    nSrc.buffer = nBuf;
    const nGain = ctx.createGain();
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = "lowpass";
    nFilter.frequency.value = 400;
    nGain.gain.setValueAtTime(0.3, now + t);
    nGain.gain.exponentialRampToValueAtTime(0.01, now + t + 0.3);
    nSrc.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(dry);
    nSrc.start(now + t);
  });

  // ═══ 4. EERIE HIGH SYNTH — Alien/menacing tone ═══
  const eerie = ctx.createOscillator();
  const eerieGain = ctx.createGain();
  const eerieFilter = ctx.createBiquadFilter();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();

  eerie.type = "sine";
  eerie.frequency.setValueAtTime(440, now + 1);
  eerie.frequency.linearRampToValueAtTime(523.25, now + 3);
  eerie.frequency.linearRampToValueAtTime(392, now + 5);

  // Vibrato LFO
  lfo.type = "sine";
  lfo.frequency.value = 4;
  lfoGain.gain.value = 8;
  lfo.connect(lfoGain);
  lfoGain.connect(eerie.frequency);

  eerieFilter.type = "bandpass";
  eerieFilter.frequency.value = 500;
  eerieFilter.Q.value = 5;

  eerieGain.gain.setValueAtTime(0, now + 1);
  eerieGain.gain.linearRampToValueAtTime(0.06, now + 2);
  eerieGain.gain.setValueAtTime(0.06, now + 3.5);
  eerieGain.gain.linearRampToValueAtTime(0, now + 5);

  eerie.connect(eerieFilter);
  eerieFilter.connect(eerieGain);
  eerieGain.connect(dry);
  eerieGain.connect(convolver);
  lfo.start(now + 1);
  eerie.start(now + 1);
  lfo.stop(now + 5.5);
  eerie.stop(now + 5.5);

  // ═══ 5. DARK AMBIENT TEXTURE — Filtered noise sweep ═══
  const texBuf = ctx.createBuffer(2, ctx.sampleRate * 5, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = texBuf.getChannelData(ch);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * 0.15;
    }
  }
  const texSrc = ctx.createBufferSource();
  texSrc.buffer = texBuf;
  const texFilter = ctx.createBiquadFilter();
  texFilter.type = "bandpass";
  texFilter.frequency.setValueAtTime(200, now);
  texFilter.frequency.linearRampToValueAtTime(800, now + 2.5);
  texFilter.frequency.linearRampToValueAtTime(150, now + 5);
  texFilter.Q.value = 1.5;
  const texGain = ctx.createGain();
  texGain.gain.setValueAtTime(0, now);
  texGain.gain.linearRampToValueAtTime(0.25, now + 1);
  texGain.gain.setValueAtTime(0.25, now + 3.5);
  texGain.gain.linearRampToValueAtTime(0, now + 5.5);
  texSrc.connect(texFilter);
  texFilter.connect(texGain);
  texGain.connect(dry);
  texGain.connect(convolver);
  texSrc.start(now);

  // ═══ 6. FINAL IMPACT — Big dark hit at 4.5s ═══
  const finalBoom = ctx.createOscillator();
  const finalGain = ctx.createGain();
  finalBoom.type = "sine";
  finalBoom.frequency.setValueAtTime(100, now + 4.5);
  finalBoom.frequency.exponentialRampToValueAtTime(20, now + 6);
  finalGain.gain.setValueAtTime(0.9, now + 4.5);
  finalGain.gain.exponentialRampToValueAtTime(0.01, now + 6);
  finalBoom.connect(finalGain);
  finalGain.connect(dry);
  finalGain.connect(convolver);
  finalBoom.start(now + 4.5);
  finalBoom.stop(now + 6.5);

  // Master fade out
  masterGain.gain.setValueAtTime(0.55, now + 5);
  masterGain.gain.linearRampToValueAtTime(0, now + 6.5);

  setTimeout(() => ctx.close(), 7500);
}
