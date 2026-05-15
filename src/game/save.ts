import type { MapData, MapNode } from './map';
import { ENEMY_DEFS } from './enemies';
import type { RunState, ShopState, RunResult, PendingReward } from './run';
import type { PersistentPlayer } from './types';

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
    result: state.result,
    pendingEnemyIds: state.pendingEnemies ? state.pendingEnemies.map((e) => e.id) : null,
    pendingShop: state.pendingShop ? structuredClone(state.pendingShop) : null,
    pendingReward: state.pendingReward ? structuredClone(state.pendingReward) : null,
    awaitingInterAct: state.awaitingInterAct,
    pendingEventId: state.pendingEventId,
    pendingEventResult: state.pendingEventResult
  };
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
    result: saved.result,
    pendingEnemies: pendingEnemies && pendingEnemies.length > 0 ? pendingEnemies : null,
    pendingShop: saved.pendingShop,
    pendingReward: saved.pendingReward ?? null,
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
