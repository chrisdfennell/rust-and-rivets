import type { RunState } from './run';
import { RELICS, pickRelicFor } from './relics';
import { pickRandomPotionId } from './potions';
import { SAVE_KEY } from './save';

const META_KEY = 'rust-and-rivets/meta/v1';
const META_SCHEMA = 1;

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  costPerLevel: number;
  maxLevel: number;
  apply: (run: RunState, level: number) => void;
}

export interface MetaState {
  version: number;
  points: number;
  levels: Record<string, number>;
  // Ascension ladder — escalating run-difficulty tiers unlocked by clearing
  // the run at the previous tier. `currentAscension` is the tier the player
  // has selected for the next NEW RUN; `highestAscension` is the highest
  // they've unlocked (always >= currentAscension).
  currentAscension: number;
  highestAscension: number;
}

export interface AscensionTier {
  level: number;
  name: string;
  description: string;
}

// Each tier ADDS to the previous tiers — they stack. A5 has all five
// modifiers active. Game logic reads `ascension >= N` to gate each effect.
export const ASCENSION_TIERS: AscensionTier[] = [
  { level: 1, name: 'Tough Mooks',       description: 'Regular enemies have +25% Hull and +15% damage.' },
  { level: 2, name: 'Reduced Recovery',  description: 'Rest sites heal 20% of max Hull (down from 30%).' },
  { level: 3, name: 'Hard Elites',       description: 'Elite enemies have +30% Hull and +20% damage.' },
  { level: 4, name: 'Resilient Bosses',  description: 'Bosses have +30% Hull and +20% damage.' },
  { level: 5, name: 'Cracked Frame',     description: 'Start each run with -5 max Hull.' },
  { level: 6, name: 'Compounded Wear',   description: 'Start each run with an additional -5 max Hull (-10 total).' },
  { level: 7, name: 'Persistent Foes',   description: 'ALL enemies (regular / elite / boss) gain +10% Hull and +10% damage.' }
];

export const MAX_ASCENSION = ASCENSION_TIERS.length;

const REINFORCED_HULL: UpgradeDef = {
  id: 'reinforcedHull',
  name: 'Reinforced Hull',
  description: '+5 max Hull per level.',
  costPerLevel: 1,
  maxLevel: 5,
  apply: (run, level) => {
    if (level <= 0) return;
    run.player.maxHull += 5 * level;
    run.player.hull += 5 * level;
  }
};

const FOUNDRY_STIPEND: UpgradeDef = {
  id: 'foundryStipend',
  name: 'Foundry Stipend',
  description: 'Start each run with 30 extra Scrap.',
  costPerLevel: 1,
  maxLevel: 1,
  apply: (run, level) => {
    if (level <= 0) return;
    run.scrap += 30;
  }
};

const CUSTOM_LOADOUT: UpgradeDef = {
  id: 'customLoadout',
  name: 'Custom Loadout',
  description: 'Begin with an Iron Hail bolted to your deck.',
  costPerLevel: 1,
  maxLevel: 1,
  apply: (run, level) => {
    if (level <= 0) return;
    run.player.deck.push('ironHail');
  }
};

const SALVAGERS_EYE: UpgradeDef = {
  id: 'salvagersEye',
  name: "Salvager's Eye",
  description: 'Start each run with a random Relic already installed.',
  costPerLevel: 2,
  maxLevel: 1,
  apply: (run, level) => {
    if (level <= 0) return;
    const id = pickRelicFor(new Set(run.relics));
    if (!id) return;
    run.relics.push(id);
    RELICS[id]?.onPickup?.(run);
  }
};

// Tempered Frame stacks plating per level — combat reads startingPlating
// off the persistent player after onCombatStart relic hooks fire.
const TEMPERED_FRAME: UpgradeDef = {
  id: 'temperedFrame',
  name: 'Tempered Frame',
  description: 'Start each combat with +2 Plating per level.',
  costPerLevel: 1,
  maxLevel: 3,
  apply: (run, level) => {
    if (level <= 0) return;
    run.player.startingPlating = (run.player.startingPlating ?? 0) + 2 * level;
  }
};

const RESERVE_TANK: UpgradeDef = {
  id: 'reserveTank',
  name: 'Reserve Tank',
  description: '+1 max Steam every combat.',
  costPerLevel: 2,
  maxLevel: 1,
  apply: (run, level) => {
    if (level <= 0) return;
    run.player.maxSteam = (run.player.maxSteam ?? 3) + 1;
  }
};

// Pre-Brew fills empty potion slots at run start with random potions, up to
// `level` total. Will not push past the belt's current capacity (so it
// stacks reasonably with the Potion Belt relic if granted by Salvager's Eye).
const PRE_BREW: UpgradeDef = {
  id: 'preBrew',
  name: 'Pre-Brew',
  description: 'Start each run with 1 random potion per level.',
  costPerLevel: 1,
  maxLevel: 3,
  apply: (run, level) => {
    if (level <= 0) return;
    let placed = 0;
    for (let i = 0; i < run.potions.length && placed < level; i++) {
      if (run.potions[i] === null) {
        run.potions[i] = pickRandomPotionId();
        placed++;
      }
    }
  }
};

const BOSS_BOUNTY: UpgradeDef = {
  id: 'bossBounty',
  name: 'Boss Bounty',
  description: '+10 Scrap from every boss kill.',
  costPerLevel: 1,
  maxLevel: 1,
  apply: (run, level) => {
    if (level <= 0) return;
    run.bossBonus = (run.bossBonus ?? 0) + 10;
  }
};

// ===== Slice 51 — Workshop expansion =====

// Field Medic — trickle heal after every regular/elite combat. Read by
// completeCombat() right after onCombatEnd hooks fire so it stacks with
// Engine Oil for a meaty regen build.
const FIELD_MEDIC: UpgradeDef = {
  id: 'fieldMedic',
  name: 'Field Medic',
  description: 'Heal 4 Hull after each non-boss combat win.',
  costPerLevel: 2,
  maxLevel: 1,
  apply: (run, level) => {
    if (level <= 0) return;
    run.postCombatHeal = (run.postCombatHeal ?? 0) + 4;
  }
};

// Quartermaster — flat shop-price discount. Applied at shop-generation
// time so prices lock at first visit; saves don't re-roll cheaper.
const QUARTERMASTER: UpgradeDef = {
  id: 'quartermaster',
  name: 'Quartermaster',
  description: 'Shop prices reduced by 15%.',
  costPerLevel: 2,
  maxLevel: 1,
  apply: (run, level) => {
    if (level <= 0) return;
    run.shopDiscount = (run.shopDiscount ?? 1) * 0.85;
  }
};

// Sharpened Edge — start each run with one Auto-Cannon already at +.
// Looks for the first un-upgraded autocannon in the starter deck and
// swaps it for autocannon+. Silent no-op if no autocannon is present
// (e.g., future character with a different starter loadout).
const SHARPENED_EDGE: UpgradeDef = {
  id: 'sharpenedEdge',
  name: 'Sharpened Edge',
  description: 'Begin each run with one starter Auto-Cannon upgraded.',
  costPerLevel: 2,
  maxLevel: 1,
  apply: (run, level) => {
    if (level <= 0) return;
    const idx = run.player.deck.indexOf('autocannon');
    if (idx >= 0) run.player.deck[idx] = 'autocannon+';
  }
};

// Heavy Toolkit — drops a Hydraulic Punch into the starter deck. Pairs
// well with Custom Loadout (Iron Hail) for a beefier opening hand.
const HEAVY_TOOLKIT: UpgradeDef = {
  id: 'heavyToolkit',
  name: 'Heavy Toolkit',
  description: 'Begin each run with a Hydraulic Punch in your deck.',
  costPerLevel: 1,
  maxLevel: 1,
  apply: (run, level) => {
    if (level <= 0) return;
    run.player.deck.push('hydraulicPunch');
  }
};

// Heavy Mantle — passive thorns every combat. Stacks with Spike Mantle
// (the relic) so a thorns-focused run can pile up early-fight Thorns.
const HEAVY_MANTLE: UpgradeDef = {
  id: 'heavyMantle',
  name: 'Heavy Mantle',
  description: 'Start each combat with 3 Thorns.',
  costPerLevel: 1,
  maxLevel: 1,
  apply: (run, level) => {
    if (level <= 0) return;
    run.player.startingThorns = (run.player.startingThorns ?? 0) + 3;
  }
};

// Brass Grip — install the Brass Knuckles relic at run start. Salvager's
// Eye grants a random relic; Brass Grip guarantees this specific one,
// so deck-builds that hinge on first-attack bonuses can plan for it.
const BRASS_GRIP: UpgradeDef = {
  id: 'brassGrip',
  name: 'Brass Grip',
  description: 'Start each run with the Brass Knuckles relic installed.',
  costPerLevel: 2,
  maxLevel: 1,
  apply: (run, level) => {
    if (level <= 0) return;
    if (!run.relics.includes('brassKnuckles')) {
      run.relics.push('brassKnuckles');
      RELICS['brassKnuckles']?.onPickup?.(run);
    }
  }
};

export const META_UPGRADES: UpgradeDef[] = [
  REINFORCED_HULL,
  FOUNDRY_STIPEND,
  CUSTOM_LOADOUT,
  SALVAGERS_EYE,
  TEMPERED_FRAME,
  RESERVE_TANK,
  PRE_BREW,
  BOSS_BOUNTY,
  // Slice 51 — Workshop expansion
  FIELD_MEDIC,
  QUARTERMASTER,
  SHARPENED_EDGE,
  HEAVY_TOOLKIT,
  HEAVY_MANTLE,
  BRASS_GRIP
];

const UPGRADE_BY_ID: Record<string, UpgradeDef> = Object.fromEntries(
  META_UPGRADES.map((u) => [u.id, u])
);

function emptyMeta(): MetaState {
  return { version: META_SCHEMA, points: 0, levels: {}, currentAscension: 0, highestAscension: 0 };
}

let cache: MetaState | null = null;

export function loadMeta(): MetaState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) {
      cache = emptyMeta();
      return cache;
    }
    const data = JSON.parse(raw) as MetaState;
    if (data.version !== META_SCHEMA) {
      cache = emptyMeta();
      return cache;
    }
    cache = {
      version: data.version,
      points: data.points ?? 0,
      levels: data.levels ?? {},
      currentAscension: clampAscension(data.currentAscension ?? 0, data.highestAscension ?? 0),
      highestAscension: Math.max(0, Math.min(MAX_ASCENSION, data.highestAscension ?? 0))
    };
    return cache;
  } catch {
    cache = emptyMeta();
    return cache;
  }
}

export function saveMeta(meta: MetaState): void {
  cache = meta;
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // localStorage unavailable — silently drop
  }
}

export function grantMetaPoints(amount: number): MetaState {
  const m = loadMeta();
  m.points += amount;
  saveMeta(m);
  return m;
}

function clampAscension(value: number, highestUnlocked: number): number {
  return Math.max(0, Math.min(value, highestUnlocked, MAX_ASCENSION));
}

export function setCurrentAscension(level: number): MetaState {
  const m = loadMeta();
  m.currentAscension = clampAscension(level, m.highestAscension);
  saveMeta(m);
  return m;
}

// Called from RunSummaryScene when the player clears the run. If they
// cleared at their highest unlocked tier, bump the cap by one (capped at
// MAX_ASCENSION). Returns the new highest so the UI can show "X unlocked".
export function unlockNextAscensionIfApplicable(clearedAscension: number): number {
  const m = loadMeta();
  if (clearedAscension >= m.highestAscension && m.highestAscension < MAX_ASCENSION) {
    m.highestAscension = clearedAscension + 1;
    saveMeta(m);
  }
  return m.highestAscension;
}

export function buyUpgrade(id: string): boolean {
  const m = loadMeta();
  const def = UPGRADE_BY_ID[id];
  if (!def) return false;
  const currentLevel = m.levels[id] ?? 0;
  if (currentLevel >= def.maxLevel) return false;
  if (m.points < def.costPerLevel) return false;
  m.points -= def.costPerLevel;
  m.levels[id] = currentLevel + 1;
  saveMeta(m);
  return true;
}

export function applyMetaToRun(run: RunState): void {
  const m = loadMeta();
  for (const def of META_UPGRADES) {
    const level = m.levels[def.id] ?? 0;
    def.apply(run, level);
  }
}

export function clearMeta(): void {
  cache = null;
  try {
    localStorage.removeItem(META_KEY);
  } catch {
    // ignore
  }
}

// ---- Export / Import bundle ----

interface SaveBundle {
  bundleVersion: 1;
  run: string | null;
  meta: string | null;
}

export interface ImportResult {
  ok: boolean;
  message: string;
}

function buildBundle(): SaveBundle {
  let runJson: string | null = null;
  let metaJson: string | null = null;
  try {
    runJson = localStorage.getItem(SAVE_KEY);
    metaJson = localStorage.getItem(META_KEY);
  } catch {
    // ignore — buildBundle still returns a valid empty bundle
  }
  return {
    bundleVersion: 1,
    run: runJson,
    meta: metaJson
  };
}

// Pretty-printed JSON bundle for file download. Players can open the
// file, peek at it, share it, or restore a run from any device.
export function exportSaveJson(): string {
  return JSON.stringify(buildBundle(), null, 2);
}

// Accepts either the new pretty-JSON bundle or a legacy base64-wrapped
// bundle (from older versions where exportSaveString returned base64).
// The base64 fallback keeps old clipboard exports working after the
// switch to file-based saves.
export function importSaveJson(text: string): ImportResult {
  if (!text || !text.trim()) return { ok: false, message: 'Empty save.' };
  const trimmed = text.trim();
  let bundle: SaveBundle | null = null;
  // Try raw JSON first (the new format)
  try {
    bundle = JSON.parse(trimmed) as SaveBundle;
  } catch {
    // Not JSON — try base64-wrapped JSON for back-compat
    try {
      bundle = JSON.parse(atob(trimmed)) as SaveBundle;
    } catch {
      return { ok: false, message: 'File is not a valid save.' };
    }
  }
  if (!bundle || bundle.bundleVersion !== 1) {
    return { ok: false, message: `Unknown bundle version: ${bundle?.bundleVersion ?? '?'}` };
  }
  // Validate inner payloads parse as JSON before committing
  if (bundle.run) {
    try { JSON.parse(bundle.run); } catch {
      return { ok: false, message: 'Run payload is corrupted.' };
    }
  }
  if (bundle.meta) {
    try { JSON.parse(bundle.meta); } catch {
      return { ok: false, message: 'Meta payload is corrupted.' };
    }
  }
  try {
    if (bundle.run) localStorage.setItem(SAVE_KEY, bundle.run);
    else localStorage.removeItem(SAVE_KEY);
    if (bundle.meta) localStorage.setItem(META_KEY, bundle.meta);
    else localStorage.removeItem(META_KEY);
  } catch {
    return { ok: false, message: 'Could not write to localStorage.' };
  }
  cache = null; // force reload on next access
  return { ok: true, message: 'Save imported.' };
}
