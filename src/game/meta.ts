import type { RunState } from './run';
import { RELICS, pickRelicFor } from './relics';
import { pickRandomPotionId } from './potions';

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
  { level: 5, name: 'Cracked Frame',     description: 'Start each run with -5 max Hull.' }
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

export const META_UPGRADES: UpgradeDef[] = [
  REINFORCED_HULL,
  FOUNDRY_STIPEND,
  CUSTOM_LOADOUT,
  SALVAGERS_EYE,
  TEMPERED_FRAME,
  RESERVE_TANK,
  PRE_BREW,
  BOSS_BOUNTY
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

const RUN_KEY = 'rust-and-rivets/save/v3';

interface SaveBundle {
  bundleVersion: 1;
  run: string | null;
  meta: string | null;
}

export function exportSaveString(): string {
  let runJson: string | null = null;
  let metaJson: string | null = null;
  try {
    runJson = localStorage.getItem(RUN_KEY);
    metaJson = localStorage.getItem(META_KEY);
  } catch {
    // ignore
  }
  const bundle: SaveBundle = {
    bundleVersion: 1,
    run: runJson,
    meta: metaJson
  };
  return btoa(JSON.stringify(bundle));
}

export interface ImportResult {
  ok: boolean;
  message: string;
}

export function importSaveString(encoded: string): ImportResult {
  if (!encoded) return { ok: false, message: 'Empty save string.' };
  let decoded: string;
  try {
    decoded = atob(encoded.trim());
  } catch {
    return { ok: false, message: 'Save string is not valid base64.' };
  }
  let bundle: SaveBundle;
  try {
    bundle = JSON.parse(decoded) as SaveBundle;
  } catch {
    return { ok: false, message: 'Save string contains invalid JSON.' };
  }
  if (bundle.bundleVersion !== 1) {
    return { ok: false, message: `Unknown bundle version: ${bundle.bundleVersion}` };
  }
  // Validate inner payloads parse as JSON before committing
  if (bundle.run) {
    try { JSON.parse(bundle.run); } catch {
      return { ok: false, message: 'Run payload is not valid JSON.' };
    }
  }
  if (bundle.meta) {
    try { JSON.parse(bundle.meta); } catch {
      return { ok: false, message: 'Meta payload is not valid JSON.' };
    }
  }
  try {
    if (bundle.run) localStorage.setItem(RUN_KEY, bundle.run);
    else localStorage.removeItem(RUN_KEY);
    if (bundle.meta) localStorage.setItem(META_KEY, bundle.meta);
    else localStorage.removeItem(META_KEY);
  } catch {
    return { ok: false, message: 'Could not write to localStorage.' };
  }
  cache = null; // force reload on next access
  return { ok: true, message: 'Save imported.' };
}
