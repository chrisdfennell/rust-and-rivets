import type { EnemyDef, PersistentPlayer } from './types';
import { SHOP_POOL, STARTER_DECK, isUpgradable, upgradeCardId, pickRewardCards } from './cards';
import { generateMap, type MapData, type MapNode } from './map';
import { pickRegularEnemy, pickEliteEnemy, getActBoss } from './enemies';
import { RELICS, pickRelicFor } from './relics';
import { writeSave, readSave, hasSave, clearSave } from './save';
import { applyMetaToRun, grantMetaPoints } from './meta';

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

export interface PendingReward {
  cards: string[];
  relicId: string | null;
  scrap: number;
  fromElite: boolean;
}

export interface RunState {
  map: MapData;
  act: number;
  currentNodeId: string | null;
  visitedNodeIds: Set<string>;
  player: PersistentPlayer;
  scrap: number;
  relics: string[];
  result: RunResult;
  pendingEnemy: EnemyDef | null;
  pendingShop: ShopState | null;
  pendingReward: PendingReward | null;
  awaitingInterAct: boolean;
}

let state: RunState | null = null;

function persist() {
  if (state) writeSave(state);
}

export function startRun(): RunState {
  state = {
    map: generateMap(),
    act: 1,
    currentNodeId: null,
    visitedNodeIds: new Set(),
    player: { hull: 65, maxHull: 65, deck: STARTER_DECK.slice() },
    scrap: 0,
    relics: [],
    result: 'inProgress',
    pendingEnemy: null,
    pendingShop: null,
    pendingReward: null,
    awaitingInterAct: false
  };
  // Apply any purchased meta upgrades before saving — they affect starting hull,
  // scrap, deck, and relics.
  applyMetaToRun(state);
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
  r.pendingReward = null;
  if (node.kind === 'combat') {
    r.pendingEnemy = pickRegularEnemy(r.act, Math.random);
  } else if (node.kind === 'elite') {
    r.pendingEnemy = pickEliteEnemy(r.act, Math.random);
  } else if (node.kind === 'boss') {
    r.pendingEnemy = getActBoss(r.act);
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

  // Engine Oil and similar onCombatEnd hooks tick before reward calc
  for (const id of r.relics) RELICS[id]?.onCombatEnd?.(r);

  const node: MapNode | undefined = r.currentNodeId ? r.map.nodes.get(r.currentNodeId) : undefined;
  if (node?.kind === 'boss') {
    // Award meta points scaled to the act being cleared:
    // act 1 boss → 1 pt, act 2 → 2 pts, etc.
    grantMetaPoints(r.act);
    if (r.act >= 2) {
      r.result = 'victory';
    } else {
      // Act 1 boss done — transition through InterActScene rather than ending the run
      r.awaitingInterAct = true;
    }
    persist();
    return 0;
  }

  const isElite = node?.kind === 'elite';
  const baseReward = isElite ? 25 + Math.floor(Math.random() * 11) : 12 + Math.floor(Math.random() * 8);
  const bonus = r.relics.includes('salvageLoop') ? 5 : 0;
  const reward = baseReward + bonus;
  r.scrap += reward;

  // Stage a card reward (and a relic if elite)
  const cards = pickRewardCards(3, isElite);
  let relicId: string | null = null;
  if (isElite) {
    relicId = pickRelicFor(new Set(r.relics));
  }
  r.pendingReward = {
    cards,
    relicId,
    scrap: reward,
    fromElite: isElite
  };

  persist();
  return reward;
}

export function takeRewardCard(cardId: string): boolean {
  const r = getRun();
  const rew = r.pendingReward;
  if (!rew) return false;
  if (!rew.cards.includes(cardId)) return false;
  r.player.deck.push(cardId);
  finalizeReward();
  return true;
}

export function skipRewardCards(): void {
  finalizeReward();
}

function finalizeReward() {
  const r = getRun();
  if (!r.pendingReward) return;
  // Auto-grant the staged relic if any (player can't decline elite drops)
  if (r.pendingReward.relicId) {
    addRelic(r.pendingReward.relicId, false);
  }
  r.pendingReward = null;
  persist();
}

export function addRelic(relicId: string, doPersist = true): boolean {
  const r = getRun();
  if (r.relics.includes(relicId)) return false;
  const def = RELICS[relicId];
  if (!def) return false;
  r.relics.push(relicId);
  def.onPickup?.(r);
  if (doPersist) persist();
  return true;
}

export function failCombat(survivingHull: number): void {
  const r = getRun();
  r.player.hull = Math.max(0, survivingHull);
  r.result = 'defeat';
  r.pendingEnemy = null;
  persist();
}

export type InterActBoon = 'repair' | 'refit' | 'salvage';

export function advanceAct(boon: InterActBoon): void {
  const r = getRun();
  if (!r.awaitingInterAct) return;

  // Apply the boon
  if (boon === 'repair') {
    r.player.hull = r.player.maxHull;
  } else if (boon === 'refit') {
    r.player.maxHull += 15;
    r.player.hull += 15;
  } else if (boon === 'salvage') {
    const offers = pickRewardCards(1, true);
    if (offers[0]) r.player.deck.push(offers[0]);
  }

  // Advance to act 2 with a fresh map but persistent everything else
  r.act += 1;
  r.map = generateMap();
  r.currentNodeId = null;
  r.visitedNodeIds = new Set();
  r.pendingEnemy = null;
  r.pendingShop = null;
  r.pendingReward = null;
  r.awaitingInterAct = false;

  persist();
}
