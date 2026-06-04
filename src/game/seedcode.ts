// Daily seeds and shareable run codes — the player-facing layer on top of
// the seeded RNG (src/game/rng.ts).
//
// A run is reproduced by a (characterId, seed) pair: the seed fixes the map,
// encounters, events, shops, rewards, and drops; the character fixes the
// starting deck / hull / relics. A "run code" packs both into a short,
// copy-pasteable string so one player can hand another the exact same run.

import { seedFromString } from './rng';

// "<characterId>-<seed-in-base36>", e.g. "pilot-3kf09a". Character ids are
// lowercase letters with no dashes, and base36 has no dashes, so a single
// separator splits cleanly. Lowercased so codes are case-insensitive.
export function encodeRunCode(characterId: string, seed: number): string {
  return `${characterId.toLowerCase()}-${(seed >>> 0).toString(36)}`;
}

export interface DecodedRun {
  characterId: string;
  seed: number;
}

// Parse a run code back into its parts, or null if it is malformed. Tolerant
// of surrounding whitespace and case. Does NOT validate that the character
// exists or is unlocked — that is the caller's call (so a shared run can warn
// "you haven't unlocked this pilot" rather than silently failing here).
export function decodeRunCode(raw: string): DecodedRun | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toLowerCase();
  const dash = code.lastIndexOf('-');
  // Need a non-empty character segment and a non-empty seed segment.
  if (dash <= 0 || dash >= code.length - 1) return null;
  const characterId = code.slice(0, dash);
  const seedStr = code.slice(dash + 1);
  // base36 seed: only 0-9a-z allowed.
  if (!/^[0-9a-z]+$/.test(seedStr)) return null;
  const seed = parseInt(seedStr, 36);
  if (!Number.isFinite(seed) || seed < 0) return null;
  return { characterId, seed: seed >>> 0 };
}

// Everyone who plays the daily on a given UTC date gets the same seed. The
// character is still the player's pick — only the run structure is fixed.
// `dateStamp` is an ISO date like "2026-06-04" (caller supplies it so this
// module stays free of `Date`, which keeps it trivially testable).
export function dailySeedFor(dateStamp: string): number {
  return seedFromString(`daily-${dateStamp}`);
}

// UTC date stamp ("YYYY-MM-DD") for today, for the daily seed. Lives here so
// callers don't re-derive the format. Uses Date — only call from runtime code
// (scenes), never from a pure/seeded context.
export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
