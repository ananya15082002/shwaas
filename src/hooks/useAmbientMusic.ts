import { useRef, useState, useCallback, useEffect } from "react";

type MusicMode = "intro" | "dashboard";

/**
 * Generative ambient music using Web Audio API.
 * Creates a calm, evolving drone with layered oscillators and filters.
 */
export function useAmbientMusic() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<OscillatorNode[]>([]);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [mode, setMode] = useState<MusicMode>("intro");
  const animFrameRef = useRef<number>(0);

  const INTRO_FREQS = [55, 82.5, 110, 165]; // A1, E2, A2, E3 — deep, cinematic
  const DASHBOARD_FREQS = [130.81, 196, 261.63, 329.63]; // C3, G3, C4, E4 — brighter, calm

  const createAmbient = useCallback((ctx: AudioContext, gain: GainNode, freqs: number[]) => {
    // Clean up previous
    nodesRef.current.forEach(n => { try { n.stop(); } catch {} });
    nodesRef.current = [];
    if (lfoRef.current) { try { lfoRef.current.stop(); } catch {} }

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;
    filter.Q.value = 0.5;
    filter.connect(gain);

    // LFO for filter sweep
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.05; // very slow sweep
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    lfoRef.current = lfo;

    // Create layered oscillators
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      
      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = freq;
      
      // Slight detuning for richness
      osc.detune.value = (i - 1.5) * 4;
      
      oscGain.gain.value = 0.15 / (i + 1); // quieter for higher harmonics
      
      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start();
      
      nodesRef.current.push(osc);
    });

    // Add subtle noise layer for texture
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.02;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 400;
    noiseFilter.Q.value = 0.3;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.4;
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gain);
    noise.start();
  }, []);

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
    masterGainRef.current.gain.linearRampToValueAtTime(volume, ctx.currentTime + 2);

    const freqs = mode === "intro" ? INTRO_FREQS : DASHBOARD_FREQS;
    createAmbient(ctx, masterGainRef.current, freqs);
    
    setIsPlaying(true);
  }, [mode, volume, createAmbient]);

  const pause = useCallback(() => {
    if (ctxRef.current && masterGainRef.current) {
      const ctx = ctxRef.current;
      masterGainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
      setTimeout(() => {
        nodesRef.current.forEach(n => { try { n.stop(); } catch {} });
        nodesRef.current = [];
        if (lfoRef.current) { try { lfoRef.current.stop(); } catch {} }
      }, 1100);
    }
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const changeMode = useCallback((newMode: MusicMode) => {
    setMode(newMode);
    if (isPlaying && ctxRef.current && masterGainRef.current) {
      const ctx = ctxRef.current;
      // Crossfade to new mode
      masterGainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
      setTimeout(() => {
        const freqs = newMode === "intro" ? INTRO_FREQS : DASHBOARD_FREQS;
        if (masterGainRef.current && ctxRef.current) {
          createAmbient(ctxRef.current, masterGainRef.current, freqs);
          masterGainRef.current.gain.linearRampToValueAtTime(volume, ctxRef.current.currentTime + 2);
        }
      }, 1600);
    }
  }, [isPlaying, volume, createAmbient]);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    if (masterGainRef.current && ctxRef.current) {
      masterGainRef.current.gain.linearRampToValueAtTime(v, ctxRef.current.currentTime + 0.3);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      nodesRef.current.forEach(n => { try { n.stop(); } catch {} });
      if (lfoRef.current) { try { lfoRef.current.stop(); } catch {} }
      if (ctxRef.current) ctxRef.current.close();
    };
  }, []);

  return { isPlaying, volume, mode, toggle, play, pause, changeMode, changeVolume };
}
