import type { EnemyDef, PersistentPlayer } from './types';
import { SHOP_POOL, isUpgradable, upgradeCardId, pickRewardCards } from './cards';
import { generateMap, type MapData, type MapNode } from './map';
import {
  pickRegularEncounter,
  pickEliteEncounter,
  getBossEncounter,
  isFinalAct
} from './enemies';
import { RELICS, pickRelicFor, BOSS_SIGNATURE_RELICS } from './relics';
import { writeSave, readSave, hasSave, clearSave } from './save';
import {
  applyMetaToRun,
  grantMetaPoints,
  loadMeta,
  recordRunStart,
  recordActReached,
  recordBossDefeated
} from './meta';
import { getCharacter } from './characters';
import { pickEventId } from './events';
import {
  POTION_SLOT_COUNT,
  POTION_DROP_CHANCE,
  POTION_SHOP_PRICE,
  pickRandomPotionId
} from './potions';

export type RunResult = 'inProgress' | 'victory' | 'defeat';

export interface ShopOffer {
  cardId: string;
  price: number;
  sold: boolean;
}

export interface ShopState {
  offers: ShopOffer[];
  potionOffer: PotionShopOffer | null;
  removalPrice: number;
  removalUsed: boolean;
}

export interface RunStats {
  biggestHit: number;       // largest single hull-damage hit dealt to an enemy
  totalTurns: number;       // sum of player turns across every combat
  potionsUsed: number;      // total potions consumed via the belt
  combatsWon: number;       // non-boss combat victories (regular + elite)
  elitesDefeated: number;
}

export interface PendingReward {
  cards: string[];
  relicId: string | null;
  scrap: number;
  fromElite: boolean;
  // Potion auto-added before this reward was staged. Null if no drop or all slots were full.
  potionId: string | null;
}

export interface PotionShopOffer {
  potionId: string;
  price: number;
  sold: boolean;
}

export interface RunState {
  map: MapData;
  act: number;
  currentNodeId: string | null;
  visitedNodeIds: Set<string>;
  player: PersistentPlayer;
  scrap: number;
  relics: string[];
  // Fixed-length potion belt. null = empty slot. Length must equal POTION_SLOT_COUNT.
  potions: (string | null)[];
  result: RunResult;
  // Extra scrap added on boss kills, set by the Boss Bounty workshop upgrade.
  bossBonus?: number;
  // Shop-price multiplier (0..1). Quartermaster workshop sets it; default
  // is 1.0 (no discount). Applied at shop-generation time so existing
  // offers don't re-roll on save/load.
  shopDiscount?: number;
  // Field Medic workshop adds a flat heal after every non-boss combat.
  // Read at the same point as Engine Oil-style onCombatEnd relic hooks.
  postCombatHeal?: number;
  // Cumulative run stats surfaced on the post-run summary screen.
  // All optional w/ 0 defaults so pre-stats saves hydrate cleanly.
  stats?: RunStats;
  pendingEnemies: EnemyDef[] | null;
  pendingShop: ShopState | null;
  pendingReward: PendingReward | null;
  awaitingInterAct: boolean;
  pendingEventId: string | null;
  pendingEventResult: string | null;
  // Ascension tier this run was started at (snapshotted from meta at
  // startRun time). Combat init, rest heal, and startRun's own modifiers
  // read this rather than re-reading meta so mid-run changes to
  // meta.currentAscension don't apply retroactively.
  ascension?: number;
}

let state: RunState | null = null;

function persist() {
  if (state) writeSave(state);
}

export function startRun(characterId: string = 'pilot'): RunState {
  const character = getCharacter(characterId);
  // Snapshot the player's chosen ascension tier so mid-run changes to
  // meta don't retroactively apply.
  const ascension = loadMeta().currentAscension;
  // A5 (Cracked Frame): -5 max Hull at run start. A6 (Compounded Wear)
  // stacks another -5 on top, for -10 total at A6+.
  const hullPenalty = ascension >= 6 ? 10 : ascension >= 5 ? 5 : 0;
  const startingHull = Math.max(1, character.startingHull - hullPenalty);
  const fresh: RunState = {
    map: generateMap(),
    act: 1,
    currentNodeId: null,
    visitedNodeIds: new Set(),
    player: {
      hull: startingHull,
      maxHull: startingHull,
      deck: character.startingDeck.slice(),
      characterId: character.id,
      maxSteam: 3,
      startingPlating: 0
    },
    scrap: 0,
    relics: [],
    potions: Array(POTION_SLOT_COUNT).fill(null),
    result: 'inProgress',
    bossBonus: 0,
    stats: { biggestHit: 0, totalTurns: 0, potionsUsed: 0, combatsWon: 0, elitesDefeated: 0 },
    pendingEnemies: null,
    pendingShop: null,
    pendingReward: null,
    awaitingInterAct: false,
    pendingEventId: null,
    pendingEventResult: null,
    ascension
  };
  // Apply the character's signature relics (with their onPickup hooks)
  for (const id of character.startingRelics) {
    const def = RELICS[id];
    if (!def) continue;
    fresh.relics.push(id);
    def.onPickup?.(fresh);
  }
  state = fresh;
  // Slice 55 — record the run-start in the persistent history ledger
  // BEFORE meta upgrades / save persistence so even a crash during
  // upgrade application leaves the counter accurate.
  recordRunStart(character.id);
  // Apply purchased meta upgrades on top — they stack with character baseline.
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
  r.pendingEnemies = null;
  r.pendingShop = null;
  r.pendingReward = null;
  r.pendingEventId = null;
  r.pendingEventResult = null;
  if (node.kind === 'combat') {
    r.pendingEnemies = pickRegularEncounter(r.act, Math.random);
  } else if (node.kind === 'elite') {
    r.pendingEnemies = pickEliteEncounter(r.act, Math.random);
  } else if (node.kind === 'boss') {
    r.pendingEnemies = getBossEncounter(r.act, Math.random);
  } else if (node.kind === 'shop') {
    r.pendingShop = generateShop();
  } else if (node.kind === 'event') {
    r.pendingEventId = pickEventId(Math.random, r.act);
  }
  persist();
}

function generateShop(): ShopState {
  const r = getRun();
  const discount = r.shopDiscount ?? 1;
  const adjust = (n: number) => Math.max(1, Math.round(n * discount));
  const pool = SHOP_POOL.slice();
  const offers: ShopOffer[] = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const cardId = pool.splice(idx, 1)[0];
    const price = adjust(28 + Math.floor(Math.random() * 25)); // 28-52 pre-discount
    offers.push({ cardId, price, sold: false });
  }
  const potionOffer: PotionShopOffer = {
    potionId: pickRandomPotionId(),
    price: adjust(POTION_SHOP_PRICE + Math.floor(Math.random() * 11) - 5),
    sold: false
  };
  return { offers, potionOffer, removalPrice: adjust(55), removalUsed: false };
}

export function buyPotionOffer(): boolean {
  const r = getRun();
  const shop = r.pendingShop;
  if (!shop || !shop.potionOffer || shop.potionOffer.sold) return false;
  if (r.scrap < shop.potionOffer.price) return false;
  const slot = firstEmptyPotionSlot(r);
  if (slot < 0) return false; // belt full
  r.scrap -= shop.potionOffer.price;
  r.potions[slot] = shop.potionOffer.potionId;
  shop.potionOffer.sold = true;
  persist();
  return true;
}

function firstEmptyPotionSlot(r: RunState): number {
  return r.potions.findIndex((p) => p === null);
}

export function discardPotion(slotIndex: number): boolean {
  const r = getRun();
  if (slotIndex < 0 || slotIndex >= r.potions.length) return false;
  if (r.potions[slotIndex] === null) return false;
  r.potions[slotIndex] = null;
  persist();
  return true;
}

// Player consumed a potion in combat. The combat state mutation is done by
// the caller (combat.ts::usePotion) — this just clears the inventory slot.
export function clearPotionSlot(slotIndex: number): void {
  const r = getRun();
  if (slotIndex < 0 || slotIndex >= r.potions.length) return;
  r.potions[slotIndex] = null;
  persist();
}

export function hasOpenPotionSlot(): boolean {
  return firstEmptyPotionSlot(getRun()) >= 0;
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

// A2 (Reduced Recovery): rest sites heal 20% instead of 35% of max Hull.
// Base rate was bumped 30% → 35% when runs grew from 3 acts to 5 (and
// from ~12 combats per run to ~37) — the old number wasn't enough to
// keep players alive through the longer climb.
function restHealFraction(r: RunState): number {
  return (r.ascension ?? 0) >= 2 ? 0.20 : 0.35;
}

export function restHeal(): void {
  const r = getRun();
  const amount = Math.floor(r.player.maxHull * restHealFraction(r));
  r.player.hull = Math.min(r.player.maxHull, r.player.hull + amount);
  persist();
}

export function restHealAmount(): number {
  const r = getRun();
  return Math.floor(r.player.maxHull * restHealFraction(r));
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
  r.pendingEnemies = null;
  r.pendingShop = null;
  r.pendingEventId = null;
  r.pendingEventResult = null;
  persist();
}

export function resolveEvent(message: string): void {
  const r = getRun();
  r.pendingEventResult = message;
  persist();
}

// Returns the run's stats object, lazily creating one if a pre-stats
// save was loaded. All call sites should go through this helper rather
// than touching r.stats directly so the undefined case never bites us.
function ensureStats(r: RunState): RunStats {
  if (!r.stats) {
    r.stats = { biggestHit: 0, totalTurns: 0, potionsUsed: 0, combatsWon: 0, elitesDefeated: 0 };
  }
  return r.stats;
}

export interface CombatStatsPayload {
  turns: number;
  biggestHit: number;
  potionsUsed: number;
}

function mergeCombatStats(r: RunState, payload: CombatStatsPayload | undefined) {
  if (!payload) return;
  const s = ensureStats(r);
  s.totalTurns += payload.turns;
  s.potionsUsed += payload.potionsUsed;
  if (payload.biggestHit > s.biggestHit) s.biggestHit = payload.biggestHit;
}

export function completeCombat(survivingHull: number, combatStats?: CombatStatsPayload): number {
  const r = getRun();
  // Capture the boss ID before pendingEnemies is cleared — needed
  // below to look up the boss-signature relic drop.
  const slainBossId = (r.pendingEnemies && r.pendingEnemies.length > 0)
    ? r.pendingEnemies[0].id
    : null;
  r.player.hull = survivingHull;
  if (r.currentNodeId) r.visitedNodeIds.add(r.currentNodeId);
  r.pendingEnemies = null;

  mergeCombatStats(r, combatStats);

  // Engine Oil and similar onCombatEnd hooks tick before reward calc
  for (const id of r.relics) RELICS[id]?.onCombatEnd?.(r);

  const node: MapNode | undefined = r.currentNodeId ? r.map.nodes.get(r.currentNodeId) : undefined;
  // Count non-boss kills toward the run-summary "combats won" tally;
  // bosses get their own treatment (meta points / final-act flag).
  if (node && node.kind !== 'boss') {
    const s = ensureStats(r);
    s.combatsWon += 1;
    if (node.kind === 'elite') s.elitesDefeated += 1;
    // Field Medic workshop trickle-heal. Applies to regular AND elite
    // wins, but not bosses (those get their own scrap bonus instead).
    const heal = r.postCombatHeal ?? 0;
    if (heal > 0) {
      r.player.hull = Math.min(r.player.maxHull, r.player.hull + heal);
    }
  }
  if (node?.kind === 'boss') {
    // Award meta points scaled to the act being cleared:
    // act 1 boss → 1 pt, act 2 → 2 pts, etc.
    grantMetaPoints(r.act);
    // Slice 55 — bump persistent history counters. Boss kill always
    // counts; bestAct tracks the act they CLEARED, so for a non-final
    // boss kill the act-reached is r.act + 1 (they're about to start
    // the next act). For the final boss it's r.act itself.
    recordBossDefeated();
    recordActReached(isFinalAct(r.act) ? r.act : r.act + 1);
    // Boss Bounty workshop upgrade adds a flat scrap bonus to boss kills.
    const bonus = r.bossBonus ?? 0;
    if (bonus > 0) r.scrap += bonus;
    // Boss-signature relic drop (Slice 48). Each of the 9 bosses has a
    // unique relic tied to its mechanic; beating that boss is the only
    // way to own it. Granted automatically — no claim UI needed.
    if (slainBossId) {
      const sig = BOSS_SIGNATURE_RELICS[slainBossId];
      if (sig) addRelic(sig, false);
    }
    if (isFinalAct(r.act)) {
      r.result = 'victory';
    } else {
      // Non-final act boss done — transition through InterActScene rather than ending the run
      r.awaitingInterAct = true;
    }
    persist();
    return bonus;
  }

  const isElite = node?.kind === 'elite';
  const baseReward = isElite ? 25 + Math.floor(Math.random() * 11) : 12 + Math.floor(Math.random() * 8);
  const bonus =
    (r.relics.includes('salvageLoop') ? 5 : 0) +
    (r.relics.includes('salvageWreath') ? 3 : 0);
  const reward = baseReward + bonus;
  r.scrap += reward;

  // Stage a card reward (and a relic if elite)
  const cards = pickRewardCards(3, isElite);
  let relicId: string | null = null;
  if (isElite) {
    relicId = pickRelicFor(new Set(r.relics));
  }

  // Potion drop: only roll if a slot is open (auto-claim, no overflow UI).
  // Elite fights get a guaranteed drop; regular fights roll POTION_DROP_CHANCE.
  let potionId: string | null = null;
  const slot = firstEmptyPotionSlot(r);
  if (slot >= 0) {
    const drops = isElite || Math.random() < POTION_DROP_CHANCE;
    if (drops) {
      potionId = pickRandomPotionId();
      r.potions[slot] = potionId;
    }
  }

  r.pendingReward = {
    cards,
    relicId,
    scrap: reward,
    fromElite: isElite,
    potionId
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

export function failCombat(survivingHull: number, combatStats?: CombatStatsPayload): void {
  const r = getRun();
  r.player.hull = Math.max(0, survivingHull);
  r.result = 'defeat';
  r.pendingEnemies = null;
  mergeCombatStats(r, combatStats);
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
  r.pendingEnemies = null;
  r.pendingShop = null;
  r.pendingReward = null;
  r.awaitingInterAct = false;

  persist();
}
