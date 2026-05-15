// Lightweight procedural SFX library built directly on Web Audio.
// All sounds are short bursts (oscillators + noise) shaped with simple
// gain envelopes. No assets, no Phaser loader — just a single shared
// AudioContext lazily created on first use.

import { getAudioSettings, setSfxMutedPref } from './settings';

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = getAudioSettings().sfxMuted;

interface ExtAudioCtor {
  new (): AudioContext;
}

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: ExtAudioCtor; webkitAudioContext?: ExtAudioCtor };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.6;
  masterGain.connect(ctx.destination);
  return ctx;
}

function dest(): AudioNode | null {
  const c = getCtx();
  if (!c) return null;
  return masterGain ?? c.destination;
}

function noiseBuffer(c: AudioContext, durationSec: number): AudioBuffer {
  const len = Math.max(1, Math.floor(c.sampleRate * durationSec));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

interface OscOpts {
  type: OscillatorType;
  freq: number;
  freqEnd?: number;
  vol: number;
  attack?: number;
  decay: number;
}

function playOsc(opts: OscOpts) {
  if (muted) return;
  const c = getCtx();
  const out = dest();
  if (!c || !out) return;
  const now = c.currentTime;
  const attack = opts.attack ?? 0.005;
  const osc = c.createOscillator();
  osc.type = opts.type;
  osc.frequency.setValueAtTime(opts.freq, now);
  if (opts.freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(0.001, opts.freqEnd),
      now + attack + opts.decay
    );
  }
  const g = c.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(opts.vol, now + attack);
  g.gain.exponentialRampToValueAtTime(0.001, now + attack + opts.decay);
  osc.connect(g).connect(out);
  osc.start(now);
  osc.stop(now + attack + opts.decay + 0.02);
}

interface NoiseOpts {
  duration: number;
  vol: number;
  filterType?: BiquadFilterType;
  filterFreq?: number;
  filterQ?: number;
}

function playNoise(opts: NoiseOpts) {
  if (muted) return;
  const c = getCtx();
  const out = dest();
  if (!c || !out) return;
  const now = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, opts.duration);

  let last: AudioNode = src;
  if (opts.filterType) {
    const filter = c.createBiquadFilter();
    filter.type = opts.filterType;
    filter.frequency.value = opts.filterFreq ?? 1000;
    filter.Q.value = opts.filterQ ?? 1;
    src.connect(filter);
    last = filter;
  }
  const g = c.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(opts.vol, now + 0.005);
  g.gain.exponentialRampToValueAtTime(0.001, now + opts.duration);
  last.connect(g).connect(out);
  src.start(now);
  src.stop(now + opts.duration + 0.02);
}

export const sfx = {
  click() {
    playOsc({ type: 'square', freq: 1100, freqEnd: 700, vol: 0.06, decay: 0.04 });
  },
  cardPlay() {
    playNoise({ duration: 0.18, vol: 0.05, filterType: 'bandpass', filterFreq: 900, filterQ: 1.5 });
    playOsc({ type: 'sine', freq: 540, freqEnd: 200, vol: 0.05, decay: 0.18 });
  },
  hit() {
    // Heavy thump: low sine + lowpass noise
    playOsc({ type: 'sine', freq: 90, freqEnd: 30, vol: 0.18, decay: 0.22 });
    playNoise({ duration: 0.16, vol: 0.1, filterType: 'lowpass', filterFreq: 450 });
  },
  platingAbsorb() {
    // Metallic clink: triangle + sine high
    playOsc({ type: 'triangle', freq: 1700, freqEnd: 1400, vol: 0.06, decay: 0.12 });
    playOsc({ type: 'sine', freq: 2800, vol: 0.04, decay: 0.08 });
  },
  heal() {
    // Rising arpeggio C-E-G
    playOsc({ type: 'sine', freq: 523, vol: 0.06, decay: 0.18 });
    setTimeout(() => playOsc({ type: 'sine', freq: 659, vol: 0.06, decay: 0.18 }), 70);
    setTimeout(() => playOsc({ type: 'sine', freq: 784, vol: 0.07, decay: 0.24 }), 140);
  },
  endTurn() {
    // Mechanical ratchet: 3 short noise pops descending
    playNoise({ duration: 0.05, vol: 0.09, filterType: 'highpass', filterFreq: 1500 });
    setTimeout(() => playNoise({ duration: 0.05, vol: 0.07, filterType: 'highpass', filterFreq: 1300 }), 70);
    setTimeout(() => playNoise({ duration: 0.06, vol: 0.06, filterType: 'highpass', filterFreq: 1100 }), 140);
  },
  victory() {
    // Major triad arpeggio rising — square for triumphant edge
    playOsc({ type: 'square', freq: 523, vol: 0.05, decay: 0.18 });
    setTimeout(() => playOsc({ type: 'square', freq: 659, vol: 0.05, decay: 0.18 }), 110);
    setTimeout(() => playOsc({ type: 'square', freq: 784, vol: 0.06, decay: 0.34 }), 220);
  },
  defeat() {
    // Slow descending sawtooth
    playOsc({ type: 'sawtooth', freq: 220, freqEnd: 70, vol: 0.1, decay: 0.7 });
  },
  enemyAttack() {
    playOsc({ type: 'sawtooth', freq: 220, freqEnd: 60, vol: 0.08, decay: 0.18 });
    playNoise({ duration: 0.1, vol: 0.05, filterType: 'lowpass', filterFreq: 700 });
  },
  steamSpend() {
    playNoise({ duration: 0.06, vol: 0.05, filterType: 'highpass', filterFreq: 4000 });
  }
};

export function setSfxMuted(m: boolean): void {
  muted = m;
  setSfxMutedPref(m);
}

export function isSfxMuted(): boolean {
  return muted;
}
