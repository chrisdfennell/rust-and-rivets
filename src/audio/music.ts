// Procedural industrial-ambient music built on Web Audio.
//
// Replaces the 13 MB mp3 asset that used to live in assets/. The synth
// has six layers running together:
//
//   1. Sub-bass drone (55 Hz sine with slow detune wobble)
//   2. Chord progression — Am / F / C / G cycling every 8s, each chord
//      played as three sine voices with linear fade in/out
//   3. Sparse melody — single triangle-wave notes from A-minor pentatonic,
//      fed through a feedback delay so they echo into the pad
//   4. Steam hiss (bandpass-filtered noise, slow center sweep)
//   5. Random metallic clangs (bandpass noise bursts, 12-20s)
//   6. Random distant thumps (sub-bass sine bumps, 6-10s)
//
// The old "saw-pad with filter LFO" got swapped out because it read as a
// horn drone rather than music. Sine chord voices + an actual melody
// gives it the slow-progression feel.

import { getAudioSettings, setMusicMutedPref } from './settings';

const DEFAULT_VOLUME = 0.32;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
// Melody pipes through this delay node so each note tails into a long
// echo, which gives the ambient track depth without needing a real
// convolution reverb.
let melodyDelayIn: GainNode | null = null;
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

// Kept for back-compat with any caller that still imports it.
export const AMBIENT_KEY = 'industrialAmbiance';

export function preloadMusic(_scene: unknown): void {
  void _scene;
}

// ----- Note frequency helpers -----
// A minor chord progression at a low pad register. Each entry is one
// chord, three voices. Cycled in playChordLoop.
const CHORD_PROGRESSION: number[][] = [
  [110, 131, 165], // Am — A2 / C3 / E3
  [ 87, 110, 131], // F  — F2 / A2 / C3
  [ 98, 123, 147], // G  — G2 / B2 / D3
  [ 82, 110, 131]  // E  — E2 / A2 / C3 (Esus-ish; pulls back to Am)
];
const CHORD_DURATION_S = 8; // each chord holds for 8s, with 2s crossfades

// A minor pentatonic for the melody voice. Notes are picked randomly,
// weighted toward A and E (root + fifth) so phrases feel grounded.
const MELODY_NOTES: number[] = [
  220, // A3 (root, weighted)
  220,
  262, // C4
  294, // D4
  330, // E4 (fifth, weighted)
  330,
  392, // G4
  440  // A4
];

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

  // ----- Melody delay/feedback bus (built before melody schedules so notes
  // can route through it from their very first hit). -----
  melodyDelayIn = c.createGain();
  melodyDelayIn.gain.value = 1;
  const delay = c.createDelay(2);
  delay.delayTime.value = 0.42;
  const feedback = c.createGain();
  feedback.gain.value = 0.42;
  const delayMix = c.createGain();
  delayMix.gain.value = 0.55;
  melodyDelayIn.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(master);

  // ----- Sub-bass drone -----
  const sub = c.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = 55; // A1
  const subGain = c.createGain();
  subGain.gain.value = 0.20;
  sub.connect(subGain).connect(master);
  sub.start();
  const subLFO = c.createOscillator();
  subLFO.frequency.value = 0.07;
  const subLFODepth = c.createGain();
  subLFODepth.gain.value = 4; // ±4 cents
  subLFO.connect(subLFODepth).connect(sub.detune);
  subLFO.start();

  // ----- Chord progression: cycles through CHORD_PROGRESSION endlessly -----
  let chordIdx = 0;
  const playNextChord = () => {
    const cc = getCtx();
    if (!cc || !master) return;
    const now = cc.currentTime;
    const freqs = CHORD_PROGRESSION[chordIdx];
    for (const f of freqs) {
      const osc = cc.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = cc.createGain();
      // 2s fade in, hold, 2s fade out — overlaps the next chord's fade-in
      // so transitions feel continuous instead of pulsing.
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.055, now + 2);
      g.gain.setValueAtTime(0.055, now + CHORD_DURATION_S - 2);
      g.gain.linearRampToValueAtTime(0, now + CHORD_DURATION_S);
      osc.connect(g).connect(master);
      osc.start(now);
      osc.stop(now + CHORD_DURATION_S + 0.05);
    }
    chordIdx = (chordIdx + 1) % CHORD_PROGRESSION.length;
  };
  playNextChord();
  setInterval(playNextChord, (CHORD_DURATION_S - 2) * 1000);

  // ----- Steam hiss -----
  const hissBuf = makeNoiseBuffer(c, 2);
  const hissSrc = c.createBufferSource();
  hissSrc.buffer = hissBuf;
  hissSrc.loop = true;
  const hissBP = c.createBiquadFilter();
  hissBP.type = 'bandpass';
  hissBP.frequency.value = 2400;
  hissBP.Q.value = 0.8;
  const hissGain = c.createGain();
  hissGain.gain.value = 0.03;
  hissSrc.connect(hissBP).connect(hissGain).connect(master);
  hissSrc.start();
  const hissLFO = c.createOscillator();
  hissLFO.frequency.value = 0.06;
  const hissLFODepth = c.createGain();
  hissLFODepth.gain.value = 600;
  hissLFO.connect(hissLFODepth).connect(hissBP.frequency);
  hissLFO.start();

  // ----- Melody: sparse single notes routed through the delay bus -----
  const scheduleMelody = () => {
    // Wait 6-14s between notes; sparse and contemplative.
    const delayMs = 6000 + Math.random() * 8000;
    setTimeout(() => {
      playMelodyNote();
      scheduleMelody();
    }, delayMs);
  };
  // Kick off the first note a few seconds in so the chord pad settles first.
  setTimeout(() => {
    playMelodyNote();
    scheduleMelody();
  }, 4000);

  // ----- Random clangs every 12-20s -----
  const scheduleClang = () => {
    const delayMs = 12000 + Math.random() * 8000;
    setTimeout(() => {
      playClang();
      scheduleClang();
    }, delayMs);
  };
  scheduleClang();

  // ----- Random thumps every 6-10s -----
  const schedulePulse = () => {
    const delayMs = 6000 + Math.random() * 4000;
    setTimeout(() => {
      playPulse();
      schedulePulse();
    }, delayMs);
  };
  schedulePulse();
}

// Bell-like triangle-wave note, dry-mixed to master + wet through delay.
function playMelodyNote() {
  const c = getCtx();
  if (!c || !master || !melodyDelayIn) return;
  const note = MELODY_NOTES[Math.floor(Math.random() * MELODY_NOTES.length)];
  const osc = c.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = note;
  const g = c.createGain();
  const now = c.currentTime;
  // Fast attack, long exponential decay → soft bell.
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.09, now + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
  osc.connect(g);
  g.connect(master);          // dry signal
  g.connect(melodyDelayIn);   // echo tail
  osc.start(now);
  osc.stop(now + 2.5);
}

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
  g.gain.setValueAtTime(0.12, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
  src.connect(bp).connect(g).connect(master);
  src.start();
  src.stop(now + 0.5);
}

function playPulse() {
  const c = getCtx();
  if (!c || !master) return;
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 80;
  const g = c.createGain();
  const now = c.currentTime;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.10, now + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  osc.connect(g).connect(master);
  osc.start(now);
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
