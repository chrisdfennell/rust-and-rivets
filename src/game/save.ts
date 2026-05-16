import type { MapData, MapNode } from './map';
import { ENEMY_DEFS } from './enemies';
import type { RunState, ShopState, RunResult, PendingReward } from './run';
import type { PersistentPlayer } from './types';
import { POTION_SLOT_COUNT } from './potions';

const KEY = 'rust-and-rivets/save/v4';
const SCHEMA_VERSION = 4;

interface SavedMap {
  floors: number;
  width: number;
  nodes: MapNode[];
  entryNodeIds: string[];
  bossNodeId: string;
}

interface SavedRun {
  version: number;
  act: number;
  map: SavedMap;
  currentNodeId: string | null;
  visitedNodeIds: string[];
  player: PersistentPlayer;
  scrap: number;
  relics: string[];
  potions: (string | null)[];
  result: RunResult;
  pendingEnemyIds: string[] | null;
  pendingShop: ShopState | null;
  pendingReward: PendingReward | null;
  awaitingInterAct: boolean;
  pendingEventId: string | null;
  pendingEventResult: string | null;
}

function snapshot(state: RunState): SavedRun {
  return {
    version: SCHEMA_VERSION,
    act: state.act,
    map: {
      floors: state.map.floors,
      width: state.map.width,
      nodes: Array.from(state.map.nodes.values()),
      entryNodeIds: state.map.entryNodeIds,
      bossNodeId: state.map.bossNodeId
    },
    currentNodeId: state.currentNodeId,
    visitedNodeIds: Array.from(state.visitedNodeIds),
    player: { ...state.player, deck: state.player.deck.slice() },
    scrap: state.scrap,
    relics: state.relics.slice(),
    potions: state.potions.slice(),
    result: state.result,
    pendingEnemyIds: state.pendingEnemies ? state.pendingEnemies.map((e) => e.id) : null,
    pendingShop: state.pendingShop ? structuredClone(state.pendingShop) : null,
    pendingReward: state.pendingReward ? structuredClone(state.pendingReward) : null,
    awaitingInterAct: state.awaitingInterAct,
    pendingEventId: state.pendingEventId,
    pendingEventResult: state.pendingEventResult
  };
}

// Pre-potion saves lack the staged-reward potionId and the shop's potionOffer;
// fill in safe defaults so the rest of the code can treat them as required.
function normalizeReward(raw: PendingReward | null | undefined): PendingReward | null {
  if (!raw) return null;
  return { ...raw, potionId: raw.potionId ?? null };
}

function normalizeShop(raw: ShopState | null | undefined): ShopState | null {
  if (!raw) return null;
  return { ...raw, potionOffer: raw.potionOffer ?? null };
}

// Pre-potion saves lack the field; pad to at least POTION_SLOT_COUNT. The
// Potion Belt relic grows the array past 3, so preserve any longer length
// the save came in with rather than truncating.
function normalizePotions(raw: unknown): (string | null)[] {
  const arr = Array.isArray(raw) ? raw : [];
  const targetLen = Math.max(POTION_SLOT_COUNT, arr.length);
  const out: (string | null)[] = Array(targetLen).fill(null);
  for (let i = 0; i < targetLen; i++) {
    const v = arr[i];
    if (typeof v === 'string') out[i] = v;
  }
  return out;
}

function hydrate(saved: SavedRun): RunState {
  const nodes = new Map<string, MapNode>();
  for (const n of saved.map.nodes) nodes.set(n.id, n);
  const map: MapData = {
    floors: saved.map.floors,
    width: saved.map.width,
    nodes,
    entryNodeIds: saved.map.entryNodeIds,
    bossNodeId: saved.map.bossNodeId
  };
  const pendingEnemies = saved.pendingEnemyIds
    ? (saved.pendingEnemyIds
        .map((id) => ENEMY_DEFS[id])
        .filter((def): def is NonNullable<typeof def> => !!def))
    : null;
  // Pre-character saves lack characterId — default to 'pilot' for back-compat.
  const player: PersistentPlayer = saved.player.characterId
    ? saved.player
    : { ...saved.player, characterId: 'pilot' };
  return {
    map,
    act: saved.act ?? 1,
    currentNodeId: saved.currentNodeId,
    visitedNodeIds: new Set(saved.visitedNodeIds),
    player,
    scrap: saved.scrap,
    relics: saved.relics ?? [],
    potions: normalizePotions(saved.potions),
    result: saved.result,
    pendingEnemies: pendingEnemies && pendingEnemies.length > 0 ? pendingEnemies : null,
    pendingShop: normalizeShop(saved.pendingShop),
    pendingReward: normalizeReward(saved.pendingReward),
    awaitingInterAct: saved.awaitingInterAct ?? false,
    pendingEventId: saved.pendingEventId ?? null,
    pendingEventResult: saved.pendingEventResult ?? null
  };
}

export function writeSave(state: RunState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot(state)));
  } catch {
    // localStorage may be disabled or full — silently drop
  }
}

export function readSave(): RunState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedRun;
    if (data.version !== SCHEMA_VERSION) {
      localStorage.removeItem(KEY);
      return null;
    }
    return hydrate(data);
  } catch {
    localStorage.removeItem(KEY);
    return null;
  }
}

export function hasSave(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return data?.version === SCHEMA_VERSION;
  } catch {
    return false;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
