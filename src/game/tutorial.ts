// Persisted tutorial prefs. Lives in its own localStorage key (like
// audio/settings.ts) so it survives across runs and isn't bundled with
// the save. Tracks a master on/off toggle plus a per-tour "seen" set so
// each guided tour fires exactly once.

import { hasSavedRun } from './run';
import { loadMeta } from './meta';

const KEY = 'rust-and-rivets/tutorial/v1';

// Every guided tour the game can run. Listed centrally so resetTutorials()
// can re-arm all of them and the veteran-suppression seed can mark them all
// as seen in one pass. Keep these keys in sync with the runTutorial(id) calls
// scattered across the scenes.
export const TUTORIAL_IDS = [
  'combat',
  'map',
  'shop',
  'rest',
  'event',
  'reward',
  'workshop',
  'characterSelect',
  'runSummary',
  'interAct',
  'library'
] as const;

export type TutorialId = (typeof TUTORIAL_IDS)[number];

interface TutorialState {
  enabled: boolean;
  seen: Record<string, boolean>;
}

const DEFAULTS: TutorialState = { enabled: true, seen: {} };

let cache: TutorialState | null = null;

// Existing players shouldn't get ambushed by tours the first time they load
// a build that has them. If there's no stored tutorial state yet AND the
// player already has run/meta progress, they're a veteran — seed every tour
// as already-seen so only genuinely new players get the guided tour.
function isVeteran(): boolean {
  try {
    if (hasSavedRun()) return true;
    const m = loadMeta();
    if (m.points > 0) return true;
    if (Object.keys(m.levels).length > 0) return true;
    if (m.history && m.history.runsStarted > 0) return true;
  } catch {
    // If progress can't be read, treat as a new player.
  }
  return false;
}

function seedSeen(): Record<string, boolean> {
  const seen: Record<string, boolean> = {};
  for (const id of TUTORIAL_IDS) seen[id] = true;
  return seen;
}

function read(): TutorialState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw) as Partial<TutorialState>;
      cache = {
        enabled: data.enabled ?? DEFAULTS.enabled,
        seen: data.seen ?? {}
      };
      return cache;
    }
  } catch {
    // ignore — fall through to first-run initialization
  }
  // No stored state — first load of a tutorial-aware build. New players get
  // a clean slate; veterans get every tour pre-marked as seen.
  cache = {
    enabled: true,
    seen: isVeteran() ? seedSeen() : {}
  };
  write(cache);
  return cache;
}

function write(s: TutorialState): void {
  cache = s;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // localStorage unavailable — silently drop
  }
}

export function tutorialsEnabled(): boolean {
  return read().enabled;
}

export function setTutorialsEnabled(enabled: boolean): void {
  const cur = read();
  write({ ...cur, enabled });
}

export function hasSeenTutorial(id: string): boolean {
  return read().seen[id] === true;
}

export function markTutorialSeen(id: string): void {
  const cur = read();
  if (cur.seen[id]) return;
  write({ ...cur, seen: { ...cur.seen, [id]: true } });
}

// Re-arm every tour so the player can watch them again. Leaves the master
// enabled flag untouched (replaying is pointless if tutorials are off, but
// the caller — HowToPlayScene — flips enabled on alongside this).
export function resetTutorials(): void {
  const cur = read();
  write({ ...cur, seen: {} });
}
