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
  },
  // ===== Slice 54 — Card / relic SFX layers =====
  // Each fires on top of the base cardPlay click. Layered, not replacing,
  // so the existing "card resolved" cue still anchors every play.
  attackLight() {
    playOsc({ type: 'square', freq: 720, freqEnd: 380, vol: 0.06, decay: 0.10 });
  },
  attackHeavy() {
    // Heavier kick — longer low oscillator + brief mid-thwack.
    playOsc({ type: 'square', freq: 380, freqEnd: 110, vol: 0.10, decay: 0.18 });
    playNoise({ duration: 0.10, vol: 0.07, filterType: 'bandpass', filterFreq: 600, filterQ: 2 });
  },
  defendCard() {
    // Brass-shield clank — short bright triangle ring.
    playOsc({ type: 'triangle', freq: 1100, freqEnd: 1450, vol: 0.07, decay: 0.14 });
    playOsc({ type: 'sine', freq: 2200, vol: 0.04, decay: 0.06 });
  },
  burnApply() {
    // Sizzling cinder hiss — highpass noise with descending highlight.
    playNoise({ duration: 0.22, vol: 0.06, filterType: 'highpass', filterFreq: 3200 });
    playOsc({ type: 'sawtooth', freq: 880, freqEnd: 320, vol: 0.04, decay: 0.18 });
  },
  aoe() {
    // Wide whoosh — bandpass noise sweep.
    playNoise({ duration: 0.32, vol: 0.08, filterType: 'bandpass', filterFreq: 1100, filterQ: 0.7 });
    playOsc({ type: 'sine', freq: 220, freqEnd: 60, vol: 0.06, decay: 0.30 });
  },
  powerCast() {
    // Mystical rising arpeggio — sine triad with short ramp.
    playOsc({ type: 'sine', freq: 392, vol: 0.05, decay: 0.20 });
    setTimeout(() => playOsc({ type: 'sine', freq: 523, vol: 0.05, decay: 0.20 }), 70);
    setTimeout(() => playOsc({ type: 'triangle', freq: 784, freqEnd: 990, vol: 0.07, decay: 0.30 }), 140);
  },
  echoTrigger() {
    // Short rapid double-tap, second tap pitched higher (echoes "twice").
    playOsc({ type: 'triangle', freq: 880, vol: 0.05, decay: 0.06 });
    setTimeout(() => playOsc({ type: 'triangle', freq: 1100, vol: 0.05, decay: 0.10 }), 90);
  },
  volatileFuse() {
    // Short fuse hiss + click. Plays when a Volatile card cooks off.
    playNoise({ duration: 0.14, vol: 0.06, filterType: 'highpass', filterFreq: 5000 });
    playOsc({ type: 'square', freq: 640, freqEnd: 180, vol: 0.07, decay: 0.14 });
  },
  relicTrigger() {
    // Soft brass bell ding — used for relic activations (Steam Whistle,
    // Forge Bell, etc.). Quiet enough not to step on combat SFX.
    playOsc({ type: 'sine', freq: 1320, vol: 0.04, decay: 0.18 });
    playOsc({ type: 'triangle', freq: 1980, vol: 0.025, decay: 0.10 });
  },
  drawCards() {
    // Quick paper rustle for skill cards that just draw.
    playNoise({ duration: 0.10, vol: 0.04, filterType: 'highpass', filterFreq: 6000 });
  }
};

// Dispatches a flavor-appropriate SFX layer for a card. Receives the
// card's CardDef-ish shape (only the fields we read), the total raw
// damage embedded in its effects list (for picking heavy vs light
// attack), and whether the card is targeting all enemies. The caller
// in CombatScene composes these by inspecting the def + effects.
interface CardSfxInfo {
  type?: 'attack' | 'skill' | 'power';
  target: 'enemy' | 'self' | 'none' | 'allEnemies';
  echo?: boolean;
  appliesBurn: boolean;
  rawDamage: number;
}

export function playCardLayer(info: CardSfxInfo) {
  if (info.type === 'power') {
    sfx.powerCast();
    return;
  }
  if (info.target === 'allEnemies') {
    sfx.aoe();
    if (info.appliesBurn) sfx.burnApply();
    return;
  }
  if (info.target === 'self') {
    // Skill cards: defend-ish on plating cards, paper-rustle on draw.
    sfx.defendCard();
    return;
  }
  if (info.target === 'enemy') {
    if (info.rawDamage >= 12) sfx.attackHeavy();
    else sfx.attackLight();
    if (info.appliesBurn) sfx.burnApply();
    if (info.echo) sfx.echoTrigger();
    return;
  }
  if (info.target === 'none') {
    // Bare draw / steam cards.
    sfx.drawCards();
  }
}

export function setSfxMuted(m: boolean): void {
  muted = m;
  setSfxMutedPref(m);
}

export function isSfxMuted(): boolean {
  return muted;
}
