import type { EnemyDef, PersistentPlayer } from './types';
import { SHOP_POOL, STARTER_DECK, isUpgradable, upgradeCardId } from './cards';
import { generateMap, type MapData, type MapNode } from './map';
import { pickAct1Enemy, FOUNDRY_TYRANT } from './enemies';
import { writeSave, readSave, hasSave, clearSave } from './save';

export type RunResult = 'inProgress' | 'victory' | 'defeat';

export interface ShopOffer {
  cardId: string;
  price: number;
  sold: boolean;
}

export interface ShopState {
  offers: ShopOffer[];
  removalPrice: number;
  removalUsed: boolean;
}

export interface RunState {
  map: MapData;
  currentNodeId: string | null;
  visitedNodeIds: Set<string>;
  player: PersistentPlayer;
  scrap: number;
  result: RunResult;
  pendingEnemy: EnemyDef | null;
  pendingShop: ShopState | null;
}

let state: RunState | null = null;

function persist() {
  if (state) writeSave(state);
}

export function startRun(): RunState {
  state = {
    map: generateMap(),
    currentNodeId: null,
    visitedNodeIds: new Set(),
    player: { hull: 70, maxHull: 70, deck: STARTER_DECK.slice() },
    scrap: 0,
    result: 'inProgress',
    pendingEnemy: null,
    pendingShop: null
  };
  persist();
  return state;
}

export function getRun(): RunState {
  if (!state) return startRun();
  return state;
}

export function hasSavedRun(): boolean {
  return hasSave();
}

export function loadSavedRun(): RunState | null {
  const loaded = readSave();
  if (!loaded) return null;
  state = loaded;
  return state;
}

export function clearSavedRun(): void {
  clearSave();
  state = null;
}

export function isReachable(nodeId: string): boolean {
  const r = getRun();
  if (r.result !== 'inProgress') return false;
  if (r.visitedNodeIds.has(nodeId)) return false;
  if (r.currentNodeId === null) return r.map.entryNodeIds.includes(nodeId);
  const cur = r.map.nodes.get(r.currentNodeId);
  return !!cur && cur.next.includes(nodeId);
}

export function enterNode(nodeId: string): void {
  const r = getRun();
  if (!isReachable(nodeId)) throw new Error(`Node ${nodeId} is not reachable`);
  const node = r.map.nodes.get(nodeId)!;
  r.currentNodeId = nodeId;
  r.pendingEnemy = null;
  r.pendingShop = null;
  if (node.kind === 'combat') {
    r.pendingEnemy = pickAct1Enemy(Math.random);
  } else if (node.kind === 'boss') {
    r.pendingEnemy = FOUNDRY_TYRANT;
  } else if (node.kind === 'shop') {
    r.pendingShop = generateShop();
  }
  persist();
}

function generateShop(): ShopState {
  const pool = SHOP_POOL.slice();
  const offers: ShopOffer[] = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const cardId = pool.splice(idx, 1)[0];
    const price = 28 + Math.floor(Math.random() * 25); // 28-52
    offers.push({ cardId, price, sold: false });
  }
  return { offers, removalPrice: 55, removalUsed: false };
}

export function buyOffer(offerIndex: number): boolean {
  const r = getRun();
  if (!r.pendingShop) return false;
  const offer = r.pendingShop.offers[offerIndex];
  if (!offer || offer.sold) return false;
  if (r.scrap < offer.price) return false;
  r.scrap -= offer.price;
  r.player.deck.push(offer.cardId);
  offer.sold = true;
  persist();
  return true;
}

export function removeCardFromDeck(deckIndex: number): boolean {
  const r = getRun();
  if (!r.pendingShop || r.pendingShop.removalUsed) return false;
  if (r.scrap < r.pendingShop.removalPrice) return false;
  if (deckIndex < 0 || deckIndex >= r.player.deck.length) return false;
  if (r.player.deck.length <= 1) return false; // can't empty deck
  r.scrap -= r.pendingShop.removalPrice;
  r.player.deck.splice(deckIndex, 1);
  r.pendingShop.removalUsed = true;
  persist();
  return true;
}

export function restHeal(): void {
  const r = getRun();
  const amount = Math.floor(r.player.maxHull * 0.3);
  r.player.hull = Math.min(r.player.maxHull, r.player.hull + amount);
  persist();
}

export function restHealAmount(): number {
  const r = getRun();
  return Math.floor(r.player.maxHull * 0.3);
}

export function upgradeDeckCard(deckIndex: number): boolean {
  const r = getRun();
  if (deckIndex < 0 || deckIndex >= r.player.deck.length) return false;
  const cardId = r.player.deck[deckIndex];
  if (!isUpgradable(cardId)) return false;
  r.player.deck[deckIndex] = upgradeCardId(cardId);
  persist();
  return true;
}

export function completeNode(): void {
  const r = getRun();
  if (r.currentNodeId) r.visitedNodeIds.add(r.currentNodeId);
  r.pendingEnemy = null;
  r.pendingShop = null;
  persist();
}

export function completeCombat(survivingHull: number): number {
  const r = getRun();
  r.player.hull = survivingHull;
  if (r.currentNodeId) r.visitedNodeIds.add(r.currentNodeId);
  r.pendingEnemy = null;
  const node: MapNode | undefined = r.currentNodeId ? r.map.nodes.get(r.currentNodeId) : undefined;
  if (node?.kind === 'boss') {
    r.result = 'victory';
    persist();
    return 0;
  }
  const reward = 12 + Math.floor(Math.random() * 8); // 12-19
  r.scrap += reward;
  persist();
  return reward;
}

export function failCombat(survivingHull: number): void {
  const r = getRun();
  r.player.hull = Math.max(0, survivingHull);
  r.result = 'defeat';
  r.pendingEnemy = null;
  persist();
}
