import type { RunState } from './run';
import { RELICS, pickRelicFor } from './relics';

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
}

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

export const META_UPGRADES: UpgradeDef[] = [
  REINFORCED_HULL,
  FOUNDRY_STIPEND,
  CUSTOM_LOADOUT,
  SALVAGERS_EYE
];

const UPGRADE_BY_ID: Record<string, UpgradeDef> = Object.fromEntries(
  META_UPGRADES.map((u) => [u.id, u])
);

function emptyMeta(): MetaState {
  return { version: META_SCHEMA, points: 0, levels: {} };
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
    cache = { version: data.version, points: data.points ?? 0, levels: data.levels ?? {} };
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
