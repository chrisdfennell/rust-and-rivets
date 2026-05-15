import type { MapData, MapNode } from './map';
import { ENEMY_DEFS } from './enemies';
import type { RunState, ShopState, RunResult, PendingReward } from './run';
import type { PersistentPlayer } from './types';

const KEY = 'rust-and-rivets/save/v2';
const SCHEMA_VERSION = 2;

interface SavedMap {
  floors: number;
  width: number;
  nodes: MapNode[];
  entryNodeIds: string[];
  bossNodeId: string;
}

interface SavedRun {
  version: number;
  map: SavedMap;
  currentNodeId: string | null;
  visitedNodeIds: string[];
  player: PersistentPlayer;
  scrap: number;
  relics: string[];
  result: RunResult;
  pendingEnemyId: string | null;
  pendingShop: ShopState | null;
  pendingReward: PendingReward | null;
}

function snapshot(state: RunState): SavedRun {
  return {
    version: SCHEMA_VERSION,
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
    pendingEnemyId: state.pendingEnemy?.id ?? null,
    pendingShop: state.pendingShop ? structuredClone(state.pendingShop) : null,
    pendingReward: state.pendingReward ? structuredClone(state.pendingReward) : null
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
  const pendingEnemy = saved.pendingEnemyId ? ENEMY_DEFS[saved.pendingEnemyId] ?? null : null;
  return {
    map,
    currentNodeId: saved.currentNodeId,
    visitedNodeIds: new Set(saved.visitedNodeIds),
    player: saved.player,
    scrap: saved.scrap,
    relics: saved.relics ?? [],
    result: saved.result,
    pendingEnemy,
    pendingShop: saved.pendingShop,
    pendingReward: saved.pendingReward ?? null
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
