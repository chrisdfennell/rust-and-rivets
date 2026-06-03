// Seeded pseudo-random number generation for reproducible runs.
//
// The whole point: given the same seed, a run produces the same map,
// encounters, events, shops, and reward rolls. That unblocks daily seeds /
// shareable runs, and makes the run engine deterministically testable.
//
// We use mulberry32 — a tiny, fast, well-distributed 32-bit PRNG. Its entire
// state is a single uint32, which is exactly what we want: the run can carry
// that one number in its save blob and resume the exact sequence after a
// reload. There is no global RNG instance — callers thread a draw function
// (`() => number`, same contract as `Math.random`) through the engine.
//
// SCOPE: this seeds *run-structure* randomness only. Combat shuffles and
// targeting, audio, and particle jitter deliberately stay on `Math.random`
// (see DEVLOG) — combat is transient and its draw count depends on player
// choices, so folding it into the run stream would break "same seed → same
// run."

const UINT32 = 0x1_0000_0000;

/**
 * One mulberry32 step. Pure: takes the current 32-bit state and returns the
 * float in [0, 1) plus the next state. Kept pure so it is trivial to test and
 * so callers control where the evolving state lives (we keep it on RunState
 * for persistence).
 */
export function nextFromState(state: number): { value: number; state: number } {
  let a = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / UINT32;
  return { value, state: a };
}

/**
 * A mutable RNG cursor. `draw()` is a `() => number` drop-in for `Math.random`
 * that advances `state` on every call. `state` is what gets persisted so the
 * sequence can resume after a save/load.
 */
export interface RngCursor {
  state: number;
  draw: () => number;
}

export function makeCursor(seed: number): RngCursor {
  const cursor: RngCursor = {
    state: seed >>> 0,
    draw: () => {
      const step = nextFromState(cursor.state);
      cursor.state = step.state;
      return step.value;
    }
  };
  return cursor;
}

/**
 * A fresh, unpredictable 32-bit seed for a normal run. Uses `Math.random` as
 * the entropy source for the *initial* seed only — everything downstream of it
 * is deterministic. (Daily / shared runs pass an explicit seed instead.)
 */
export function randomSeed(): number {
  return (Math.random() * UINT32) >>> 0;
}

/**
 * Deterministically derive a 32-bit seed from an arbitrary string — e.g. a
 * date stamp ("2026-06-03") for daily seeds, or a user-typed share code. FNV-1a.
 */
export function seedFromString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
