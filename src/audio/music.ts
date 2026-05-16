// Procedural industrial-ambient music built on Web Audio. Replaces the
// 13 MB mp3 asset previously imported here — same vibe (low drone, steam
// hiss, occasional metallic clangs, distant thumps), zero download.
//
// Layers running continuously once startMusic() fires:
//   - Sub-bass drone (55 Hz sine + slow detune LFO)
//   - Mid pad (A-minor triad, detuned saws → lowpass with slow LFO)
//   - Steam hiss (looping noise → bandpass with slow center sweep)
//   - Random metallic clangs (8-16 s intervals)
//   - Random low thumps (4-7 s intervals)
//
// Public API matches the old mp3 player so TitleScene / PauseScene don't
// need to change. The `_scene` params are ignored — kept for shape parity.

import { getAudioSettings, setMusicMutedPref } from './settings';

const DEFAULT_VOLUME = 0.32;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let started = false;
let muted = getAudioSettings().musicMuted;

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
  master = ctx.createGain();
  master.gain.value = muted ? 0 : DEFAULT_VOLUME;
  master.connect(ctx.destination);
  return ctx;
}

function makeNoiseBuffer(c: AudioContext, durationSec: number): AudioBuffer {
  const len = Math.max(1, Math.floor(c.sampleRate * durationSec));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// Kept for back-compat with any caller that still imports it. The new
// synth implementation doesn't actually use a cache key.
export const AMBIENT_KEY = 'industrialAmbiance';

// No-op: nothing to preload for the synth version. Kept as an export so
// existing TitleScene preload() calls don't have to change.
export function preloadMusic(_scene: unknown): void {
  void _scene;
}

export function startMusic(_scene: unknown): void {
  void _scene;
  if (started) return;
  const c = getCtx();
  if (!c || !master) return;
  started = true;

  // Browsers suspend new AudioContexts until a user gesture. Phaser's
  // sound manager unlocks on the first input, but we manage Web Audio
  // ourselves so add a redundant resume() on pointer/keydown.
  const unlock = () => {
    if (c.state === 'suspended') void c.resume();
  };
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('keydown', unlock);

  // ----- Sub-bass drone (constant) -----
  const sub = c.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = 55; // A1
  const subGain = c.createGain();
  subGain.gain.value = 0.30;
  sub.connect(subGain).connect(master);
  sub.start();
  // Slow detune wobble so the drone breathes instead of sitting dead-flat.
  const subLFO = c.createOscillator();
  subLFO.frequency.value = 0.07;
  const subLFODepth = c.createGain();
  subLFODepth.gain.value = 4; // ±4 cents
  subLFO.connect(subLFODepth).connect(sub.detune);
  subLFO.start();

  // ----- Mid pad: A-minor triad, detuned saws → lowpass -----
  const padFreqs = [110, 131, 165]; // A2 / C3 / E3
  const padDetune = [-7, 0, 7];
  for (let i = 0; i < padFreqs.length; i++) {
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = padFreqs[i];
    osc.detune.value = padDetune[i];
    const lpf = c.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 520;
    lpf.Q.value = 0.6;
    const g = c.createGain();
    g.gain.value = 0.06;
    osc.connect(lpf).connect(g).connect(master);
    osc.start();
    // Per-voice filter LFO at slightly different rates so the pad
    // never lines up — keeps it from sounding like a single chord
    // pumping in unison.
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.05 + i * 0.02;
    const lfoDepth = c.createGain();
    lfoDepth.gain.value = 140;
    lfo.connect(lfoDepth).connect(lpf.frequency);
    lfo.start();
  }

  // ----- Steam hiss: looping noise → bandpass with slow center sweep -----
  const hissBuf = makeNoiseBuffer(c, 2);
  const hissSrc = c.createBufferSource();
  hissSrc.buffer = hissBuf;
  hissSrc.loop = true;
  const hissBP = c.createBiquadFilter();
  hissBP.type = 'bandpass';
  hissBP.frequency.value = 2400;
  hissBP.Q.value = 0.8;
  const hissGain = c.createGain();
  hissGain.gain.value = 0.05;
  hissSrc.connect(hissBP).connect(hissGain).connect(master);
  hissSrc.start();
  const hissLFO = c.createOscillator();
  hissLFO.frequency.value = 0.06;
  const hissLFODepth = c.createGain();
  hissLFODepth.gain.value = 600;
  hissLFO.connect(hissLFODepth).connect(hissBP.frequency);
  hissLFO.start();

  // ----- Random clangs every 8-16s -----
  const scheduleClang = () => {
    const delay = 8000 + Math.random() * 8000;
    setTimeout(() => {
      playClang();
      scheduleClang();
    }, delay);
  };
  scheduleClang();

  // ----- Random distant thumps every 4-7s -----
  const schedulePulse = () => {
    const delay = 4000 + Math.random() * 3000;
    setTimeout(() => {
      playPulse();
      schedulePulse();
    }, delay);
  };
  schedulePulse();
}

// Short bandpass-filtered noise burst — reads as a distant metallic clang.
function playClang() {
  const c = getCtx();
  if (!c || !master) return;
  const buf = makeNoiseBuffer(c, 0.45);
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 900 + Math.random() * 1200;
  bp.Q.value = 14;
  const g = c.createGain();
  const now = c.currentTime;
  g.gain.setValueAtTime(0.18, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
  src.connect(bp).connect(g).connect(master);
  src.start();
  src.stop(now + 0.5);
}

// Low-frequency sine bump — reads as a distant subterranean thump.
function playPulse() {
  const c = getCtx();
  if (!c || !master) return;
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 80;
  const g = c.createGain();
  const now = c.currentTime;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.15, now + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  osc.connect(g).connect(master);
  osc.start();
  osc.stop(now + 0.55);
}

export function setMusicVolume(volume: number): void {
  if (!master) return;
  const clamped = Math.max(0, Math.min(1, volume));
  master.gain.value = muted ? 0 : clamped;
}

export function setMusicMuted(m: boolean): void {
  muted = m;
  setMusicMutedPref(m);
  if (master) master.gain.value = m ? 0 : DEFAULT_VOLUME;
}

export function isMusicMuted(): boolean {
  return muted;
}
