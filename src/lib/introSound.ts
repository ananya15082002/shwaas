/**
 * Cinematic intro sound — Netflix-style dramatic boom + atmospheric rise
 * using Web Audio API. No external files needed.
 */
export function playIntroSound() {
  const ctx = new AudioContext();
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.6;
  masterGain.connect(ctx.destination);

  // Reverb via convolver (synthetic impulse response)
  const convolver = ctx.createConvolver();
  const reverbLength = ctx.sampleRate * 3;
  const impulse = ctx.createBuffer(2, reverbLength, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < reverbLength; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLength, 2.5);
    }
  }
  convolver.buffer = impulse;

  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.35;
  convolver.connect(reverbGain);
  reverbGain.connect(masterGain);

  const dryGain = ctx.createGain();
  dryGain.gain.value = 0.7;
  dryGain.connect(masterGain);

  const now = ctx.currentTime;

  // ── PHASE 1: Deep space rumble (0s - 1.5s) ──
  const rumble = ctx.createOscillator();
  const rumbleGain = ctx.createGain();
  rumble.type = "sine";
  rumble.frequency.setValueAtTime(30, now);
  rumble.frequency.exponentialRampToValueAtTime(55, now + 1.5);
  rumbleGain.gain.setValueAtTime(0, now);
  rumbleGain.gain.linearRampToValueAtTime(0.5, now + 0.3);
  rumbleGain.gain.linearRampToValueAtTime(0.3, now + 1.5);
  rumbleGain.gain.linearRampToValueAtTime(0, now + 2.5);
  rumble.connect(rumbleGain);
  rumbleGain.connect(dryGain);
  rumbleGain.connect(convolver);
  rumble.start(now);
  rumble.stop(now + 2.5);

  // ── PHASE 2: Rising atmospheric sweep (0.5s - 3s) ──
  const sweep = ctx.createOscillator();
  const sweepGain = ctx.createGain();
  const sweepFilter = ctx.createBiquadFilter();
  sweep.type = "sawtooth";
  sweep.frequency.setValueAtTime(80, now + 0.5);
  sweep.frequency.exponentialRampToValueAtTime(400, now + 2.5);
  sweepFilter.type = "lowpass";
  sweepFilter.frequency.setValueAtTime(200, now + 0.5);
  sweepFilter.frequency.exponentialRampToValueAtTime(2000, now + 2.5);
  sweepFilter.Q.value = 2;
  sweepGain.gain.setValueAtTime(0, now + 0.5);
  sweepGain.gain.linearRampToValueAtTime(0.12, now + 1.5);
  sweepGain.gain.linearRampToValueAtTime(0, now + 3);
  sweep.connect(sweepFilter);
  sweepFilter.connect(sweepGain);
  sweepGain.connect(dryGain);
  sweepGain.connect(convolver);
  sweep.start(now + 0.5);
  sweep.stop(now + 3);

  // ── PHASE 3: The "TA-DUM" impact (1.8s) ──
  // Deep boom
  const boom = ctx.createOscillator();
  const boomGain = ctx.createGain();
  boom.type = "sine";
  boom.frequency.setValueAtTime(80, now + 1.8);
  boom.frequency.exponentialRampToValueAtTime(35, now + 3.5);
  boomGain.gain.setValueAtTime(0.7, now + 1.8);
  boomGain.gain.exponentialRampToValueAtTime(0.01, now + 3.5);
  boom.connect(boomGain);
  boomGain.connect(dryGain);
  boomGain.connect(convolver);
  boom.start(now + 1.8);
  boom.stop(now + 3.5);

  // Impact noise burst
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseData.length, 3);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseGain = ctx.createGain();
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 500;
  noiseGain.gain.setValueAtTime(0.4, now + 1.8);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 2.5);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(dryGain);
  noiseGain.connect(convolver);
  noise.start(now + 1.8);

  // ── PHASE 4: Harmonic chord ring-out (2s - 5s) ──
  const chordFreqs = [110, 164.81, 220, 329.63]; // A2, E3, A3, E4
  chordFreqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = i < 2 ? "sine" : "triangle";
    osc.frequency.value = freq;
    osc.detune.value = (i - 1.5) * 3;
    oscGain.gain.setValueAtTime(0, now + 2);
    oscGain.gain.linearRampToValueAtTime(0.15 / (i + 1), now + 2.3);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 5);
    osc.connect(oscGain);
    oscGain.connect(dryGain);
    oscGain.connect(convolver);
    osc.start(now + 2);
    osc.stop(now + 5.5);
  });

  // ── PHASE 5: Second impact "DUM" (2.5s) ──
  const boom2 = ctx.createOscillator();
  const boom2Gain = ctx.createGain();
  boom2.type = "sine";
  boom2.frequency.setValueAtTime(65, now + 2.5);
  boom2.frequency.exponentialRampToValueAtTime(30, now + 4.5);
  boom2Gain.gain.setValueAtTime(0.8, now + 2.5);
  boom2Gain.gain.exponentialRampToValueAtTime(0.01, now + 4.5);
  boom2.connect(boom2Gain);
  boom2Gain.connect(dryGain);
  boom2Gain.connect(convolver);
  boom2.start(now + 2.5);
  boom2.stop(now + 4.5);

  // Fade out master
  masterGain.gain.setValueAtTime(0.6, now + 4);
  masterGain.gain.linearRampToValueAtTime(0, now + 5.5);

  // Cleanup
  setTimeout(() => {
    ctx.close();
  }, 6000);
}
