import { useRef, useState, useCallback, useEffect } from "react";

type MusicMode = "intro" | "dashboard";

/**
 * GTA 4 Loading Screen style dark ambient music.
 * Deep bass drones, menacing filtered synths, dark evolving pads.
 * Loops continuously with mode-based variations.
 */
export function useAmbientMusic() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);
  const sourceNodesRef = useRef<(OscillatorNode | AudioBufferSourceNode)[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [mode, setMode] = useState<MusicMode>("intro");
  const loopTimerRef = useRef<number>(0);

  const stopAllNodes = useCallback(() => {
    sourceNodesRef.current.forEach(n => { try { n.stop(); } catch {} });
    sourceNodesRef.current = [];
    nodesRef.current = [];
    clearInterval(loopTimerRef.current);
  }, []);

  const createGTA4Ambient = useCallback((ctx: AudioContext, master: GainNode, currentMode: MusicMode) => {
    stopAllNodes();

    const now = ctx.currentTime;

    // ── Compressor for punchy GTA feel ──
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 10;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.2;
    compressor.connect(master);

    // ── Reverb ──
    const convolver = ctx.createConvolver();
    const reverbLen = ctx.sampleRate * 3.5;
    const impulse = ctx.createBuffer(2, reverbLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = impulse.getChannelData(ch);
      for (let i = 0; i < reverbLen; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 2.2);
      }
    }
    convolver.buffer = impulse;
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.35;
    convolver.connect(reverbGain);
    reverbGain.connect(compressor);

    const dry = ctx.createGain();
    dry.gain.value = 0.7;
    dry.connect(compressor);
    nodesRef.current.push(compressor, convolver, reverbGain, dry);

    // Intro: deeper, darker | Dashboard: slightly brighter but still dark
    const baseNote = currentMode === "intro" ? 27.5 : 36.71; // A0 vs D1
    const filterCutoff = currentMode === "intro" ? 250 : 400;
    const padVolume = currentMode === "intro" ? 0.09 : 0.07;
    const eerieVol = currentMode === "intro" ? 0.05 : 0.03;

    // ═══ 1. SUB BASS DRONE — Foundation ═══
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = "sine";
    sub.frequency.value = baseNote;
    // Slow pitch wobble
    const subLfo = ctx.createOscillator();
    const subLfoGain = ctx.createGain();
    subLfo.type = "sine";
    subLfo.frequency.value = 0.08;
    subLfoGain.gain.value = 2;
    subLfo.connect(subLfoGain);
    subLfoGain.connect(sub.frequency);
    subGain.gain.value = 0.45;
    sub.connect(subGain);
    subGain.connect(dry);
    sub.start(now);
    subLfo.start(now);
    sourceNodesRef.current.push(sub, subLfo);

    // ═══ 2. DARK SAWTOOTH PAD — Menacing chord ═══
    // A minor: A, C, E (dark)  |  D minor: D, F, A (brooding)
    const padFreqs = currentMode === "intro"
      ? [55, 65.41, 82.41, 110] // A1, C2, E2, A2
      : [73.42, 87.31, 110, 146.83]; // D2, F2, A2, D3

    padFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "sawtooth";
      osc.frequency.value = freq;
      osc.detune.value = (i - 1.5) * 6 + (Math.random() - 0.5) * 4;

      filter.type = "lowpass";
      filter.frequency.value = filterCutoff;
      filter.Q.value = 2.5;

      // Slow filter sweep LFO
      const fLfo = ctx.createOscillator();
      const fLfoGain = ctx.createGain();
      fLfo.type = "sine";
      fLfo.frequency.value = 0.03 + i * 0.01;
      fLfoGain.gain.value = filterCutoff * 0.6;
      fLfo.connect(fLfoGain);
      fLfoGain.connect(filter.frequency);

      oscGain.gain.value = padVolume / (i + 1);

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(dry);
      oscGain.connect(convolver);
      osc.start(now);
      fLfo.start(now);
      sourceNodesRef.current.push(osc, fLfo);
      nodesRef.current.push(filter, oscGain);
    });

    // ═══ 3. EERIE HIGH TONE — Creepy vibrato ═══
    const eerie = ctx.createOscillator();
    const eerieGain = ctx.createGain();
    const eerieFilter = ctx.createBiquadFilter();
    const eLfo = ctx.createOscillator();
    const eLfoGain = ctx.createGain();

    eerie.type = "sine";
    eerie.frequency.value = currentMode === "intro" ? 440 : 392;

    eLfo.type = "sine";
    eLfo.frequency.value = 3.5;
    eLfoGain.gain.value = 10;
    eLfo.connect(eLfoGain);
    eLfoGain.connect(eerie.frequency);

    eerieFilter.type = "bandpass";
    eerieFilter.frequency.value = 600;
    eerieFilter.Q.value = 4;

    // Slow volume swell
    const eerieVolLfo = ctx.createOscillator();
    const eerieVolLfoGain = ctx.createGain();
    eerieVolLfo.type = "sine";
    eerieVolLfo.frequency.value = 0.06;
    eerieVolLfoGain.gain.value = eerieVol * 0.5;
    eerieVolLfo.connect(eerieVolLfoGain);

    eerieGain.gain.value = eerieVol;
    eerieVolLfoGain.connect(eerieGain.gain);

    eerie.connect(eerieFilter);
    eerieFilter.connect(eerieGain);
    eerieGain.connect(dry);
    eerieGain.connect(convolver);
    eLfo.start(now);
    eerieVolLfo.start(now);
    eerie.start(now);
    sourceNodesRef.current.push(eerie, eLfo, eerieVolLfo);
    nodesRef.current.push(eerieFilter, eerieGain);

    // ═══ 4. DARK NOISE TEXTURE — Gritty atmosphere ═══
    const texLen = ctx.sampleRate * 4;
    const texBuf = ctx.createBuffer(2, texLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = texBuf.getChannelData(ch);
      for (let i = 0; i < texLen; i++) {
        d[i] = (Math.random() * 2 - 1) * 0.12;
      }
    }
    const texSrc = ctx.createBufferSource();
    texSrc.buffer = texBuf;
    texSrc.loop = true;
    const texFilter = ctx.createBiquadFilter();
    texFilter.type = "bandpass";
    texFilter.frequency.value = 300;
    texFilter.Q.value = 1;
    // Sweep the noise filter
    const texLfo = ctx.createOscillator();
    const texLfoGain = ctx.createGain();
    texLfo.type = "sine";
    texLfo.frequency.value = 0.04;
    texLfoGain.gain.value = 200;
    texLfo.connect(texLfoGain);
    texLfoGain.connect(texFilter.frequency);

    const texGain = ctx.createGain();
    texGain.gain.value = 0.2;
    texSrc.connect(texFilter);
    texFilter.connect(texGain);
    texGain.connect(dry);
    texGain.connect(convolver);
    texSrc.start(now);
    texLfo.start(now);
    sourceNodesRef.current.push(texSrc, texLfo);
    nodesRef.current.push(texFilter, texGain);

    // ═══ 5. SLOW KICK PULSE — Heartbeat of the city ═══
    const scheduleKicks = () => {
      const kickInterval = currentMode === "intro" ? 3000 : 4000;
      loopTimerRef.current = window.setInterval(() => {
        if (!ctxRef.current) return;
        const t = ctxRef.current.currentTime;

        const kick = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kick.type = "sine";
        kick.frequency.setValueAtTime(100, t);
        kick.frequency.exponentialRampToValueAtTime(25, t + 0.5);
        kickGain.gain.setValueAtTime(0.35, t);
        kickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
        kick.connect(kickGain);
        kickGain.connect(dry);
        kickGain.connect(convolver);
        kick.start(t);
        kick.stop(t + 0.7);
      }, kickInterval);
    };
    scheduleKicks();

  }, [stopAllNodes]);

  const play = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    if (!masterGainRef.current) {
      masterGainRef.current = ctx.createGain();
      masterGainRef.current.connect(ctx.destination);
    }

    // Fade in
    masterGainRef.current.gain.setValueAtTime(0, ctx.currentTime);
    masterGainRef.current.gain.linearRampToValueAtTime(volume, ctx.currentTime + 2.5);

    createGTA4Ambient(ctx, masterGainRef.current, mode);
    setIsPlaying(true);
  }, [mode, volume, createGTA4Ambient]);

  const pause = useCallback(() => {
    if (ctxRef.current && masterGainRef.current) {
      masterGainRef.current.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 1.5);
      setTimeout(() => stopAllNodes(), 1600);
    }
    setIsPlaying(false);
  }, [stopAllNodes]);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const changeMode = useCallback((newMode: MusicMode) => {
    setMode(newMode);
    if (isPlaying && ctxRef.current && masterGainRef.current) {
      const ctx = ctxRef.current;
      masterGainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
      setTimeout(() => {
        if (masterGainRef.current && ctxRef.current) {
          createGTA4Ambient(ctxRef.current, masterGainRef.current, newMode);
          masterGainRef.current.gain.linearRampToValueAtTime(volume, ctxRef.current.currentTime + 2);
        }
      }, 1700);
    }
  }, [isPlaying, volume, createGTA4Ambient]);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    if (masterGainRef.current && ctxRef.current) {
      masterGainRef.current.gain.linearRampToValueAtTime(v, ctxRef.current.currentTime + 0.3);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAllNodes();
      if (ctxRef.current) ctxRef.current.close();
    };
  }, [stopAllNodes]);

  return { isPlaying, volume, mode, toggle, play, pause, changeMode, changeVolume };
}
