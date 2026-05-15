import { CARDS } from './cards';
import { RELICS } from './relics';
import type {
  CardInstance,
  CombatState,
  EnemyDef,
  EnemyState,
  PersistentPlayer,
  PlayerState,
  ResolveCtx,
  CardEffect
} from './types';

let nextUid = 1;

function rng(): number {
  return Math.random();
}

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function instance(cardId: string): CardInstance {
  const def = CARDS[cardId];
  if (!def) throw new Error(`Unknown card ${cardId}`);
  return { uid: nextUid++, def };
}

export function createCombatState(
  enemyDefs: EnemyDef[],
  persistent: PersistentPlayer,
  relicIds: string[] = []
): CombatState {
  const player: PlayerState = {
    hull: persistent.hull,
    maxHull: persistent.maxHull,
    plating: 0,
    vulnerable: 0,
    weak: 0,
    strength: 0,
    dexterity: 0,
    burn: 0,
    thorns: 0,
    steam: 0,
    maxSteam: 3,
    draw: shuffle(persistent.deck.map(instance)),
    hand: [],
    discard: [],
    exhaust: [],
    firstAttackBonus: 0,
    firstCardFree: false,
    cardsPlayedThisTurn: 0
  };

  // Multi-enemy fights scale each enemy's hull down so a 2v1 doesn't drag.
  // 1 enemy → 1.0x (unchanged), 2 → 0.7x each, 3+ → 0.6x each.
  const hullScale = enemyDefs.length <= 1 ? 1 : enemyDefs.length === 2 ? 0.7 : 0.6;
  const enemies = enemyDefs.map((def) => makeEnemy(def, 1, hullScale));

  const introLine =
    enemies.length === 1
      ? `A ${enemies[0].def.name} blocks the road.`
      : `${enemies.length} foes block the road: ${enemies.map((e) => e.def.name).join(', ')}.`;

  const state: CombatState = {
    phase: 'playerTurn',
    turn: 1,
    player,
    enemies,
    log: [introLine],
    relicIds: relicIds.slice()
  };

  startPlayerTurn(state);
  // Relic onCombatStart hooks run AFTER startPlayerTurn so they can stack
  // plating, steam, etc. on top of the freshly-initialized turn state.
  for (const id of relicIds) RELICS[id]?.onCombatStart?.(state);
  return state;
}

function makeEnemy(def: EnemyDef, turn: number, hullScale: number = 1): EnemyState {
  const memory: Record<string, unknown> = {};
  const action = def.pickAction({ turn, rng, memory });
  const scaled = Math.max(1, Math.round(def.maxHull * hullScale));
  return {
    def,
    hull: scaled,
    maxHull: scaled,
    plating: 0,
    vulnerable: 0,
    weak: 0,
    strength: 0,
    dexterity: 0,
    burn: 0,
    thorns: 0,
    nextAction: action,
    memory
  };
}

function logTo(state: CombatState, msg: string) {
  state.log.push(msg);
  if (state.log.length > 8) state.log.shift();
}

function ctx(state: CombatState): ResolveCtx {
  return { state, log: (m) => logTo(state, m) };
}

function isAlive(e: EnemyState): boolean {
  return e.hull > 0;
}

export function aliveEnemies(state: CombatState): EnemyState[] {
  return state.enemies.filter(isAlive);
}

export function firstAliveIndex(state: CombatState): number {
  return state.enemies.findIndex(isAlive);
}

function currentTargetIndex(state: CombatState): number {
  // Honor the card's chosen target if it's still alive; otherwise fall back
  // to the first alive enemy (e.g. relic damage, multi-effect cards where
  // the original target died mid-resolution).
  const idx = state.activeTargetIndex;
  if (idx !== undefined && idx >= 0 && idx < state.enemies.length && isAlive(state.enemies[idx])) {
    return idx;
  }
  return firstAliveIndex(state);
}

function checkVictory(state: CombatState): boolean {
  if (state.enemies.every((e) => !isAlive(e))) {
    state.phase = 'victory';
    return true;
  }
  return false;
}

export function drawCards(state: CombatState, n: number) {
  const p = state.player;
  for (let i = 0; i < n; i++) {
    if (p.draw.length === 0) {
      if (p.discard.length === 0) return;
      p.draw = shuffle(p.discard);
      p.discard = [];
    }
    const card = p.draw.pop();
    if (card) p.hand.push(card);
  }
}

function startPlayerTurn(state: CombatState) {
  const p = state.player;
  p.steam = p.maxSteam;
  p.plating = 0;
  p.firstAttackBonus = 0;
  p.firstCardFree = false;
  p.cardsPlayedThisTurn = 0;
  drawCards(state, 5);
  state.phase = 'playerTurn';
  logTo(state, `— Turn ${state.turn} —`);
  // Relic onTurnStart hooks may grant first-attack bonus, free first card, draw extra cards, heal, etc.
  for (const id of state.relicIds) RELICS[id]?.onTurnStart?.(state);
}

export function dealDamageToEnemy(c: ResolveCtx, raw: number, targetIndex?: number) {
  const state = c.state;
  const p = state.player;
  let idx: number;
  if (targetIndex !== undefined && targetIndex >= 0 && targetIndex < state.enemies.length && isAlive(state.enemies[targetIndex])) {
    idx = targetIndex;
  } else {
    idx = currentTargetIndex(state);
  }
  if (idx < 0) return;
  const e = state.enemies[idx];
  let dmg = raw + (p.strength > 0 ? p.strength : 0);
  // Brass Knuckles / first-attack bonus applies to the first damaging hit each turn
  if (p.firstAttackBonus > 0) {
    dmg += p.firstAttackBonus;
    p.firstAttackBonus = 0;
  }
  if (e.vulnerable > 0) dmg = Math.floor(dmg * 1.5);
  if (p.weak > 0) dmg = Math.floor(dmg * 0.75);
  const absorbed = Math.min(e.plating, dmg);
  e.plating -= absorbed;
  const through = dmg - absorbed;
  e.hull = Math.max(0, e.hull - through);
  if (through > 0) c.log(`Hit ${e.def.name} for ${through}.`);
  else c.log(`${e.def.name}'s plating absorbs ${absorbed}.`);
  if (e.hull <= 0) {
    c.log(`${e.def.name} collapses into scrap.`);
    if (checkVictory(state)) return;
    return;
  }
  // Thorns: every attack against an enemy with thorns lashes back at the player
  // (bypasses player plating, classic Slay-the-Spire convention).
  if (e.thorns > 0) {
    const back = e.thorns;
    p.hull = Math.max(0, p.hull - back);
    c.log(`Thorns lash back for ${back}.`);
    if (p.hull <= 0) {
      state.phase = 'defeat';
      c.log('Your mech goes dark.');
    }
  }
}

export function dealDamageToPlayer(c: ResolveCtx, raw: number, attackerIndex?: number) {
  const state = c.state;
  const p = state.player;
  // The attacking enemy's stats (strength, weak) modify outgoing damage and
  // are also the target of player Thorns. Prefer the explicit arg, then the
  // active-attacker index set by endTurn while resolving an enemy action,
  // and finally fall back to the first alive enemy.
  let attackerIdx = attackerIndex;
  if (attackerIdx === undefined) attackerIdx = state.activeAttackerIndex;
  if (attackerIdx === undefined) attackerIdx = firstAliveIndex(state);
  const attacker = attackerIdx >= 0 ? state.enemies[attackerIdx] : null;
  let dmg = raw + (attacker?.strength ?? 0);
  if (p.vulnerable > 0) dmg = Math.floor(dmg * 1.5);
  if ((attacker?.weak ?? 0) > 0) dmg = Math.floor(dmg * 0.75);
  const absorbed = Math.min(p.plating, dmg);
  p.plating -= absorbed;
  const through = dmg - absorbed;
  p.hull = Math.max(0, p.hull - through);
  if (through > 0) c.log(`You take ${through} hull damage.`);
  else c.log(`Plating absorbs ${absorbed}.`);
  if (p.hull <= 0) {
    state.phase = 'defeat';
    c.log('Your mech goes dark.');
    return;
  }
  // Thorns on the player retaliate against the attacking enemy (bypasses plating).
  if (p.thorns > 0 && attacker && isAlive(attacker)) {
    const back = p.thorns;
    attacker.hull = Math.max(0, attacker.hull - back);
    c.log(`Spikes punish ${attacker.def.name} for ${back}.`);
    if (attacker.hull <= 0) {
      c.log(`${attacker.def.name} collapses into scrap.`);
      checkVictory(state);
    }
  }
}

export function gainEnemyPlating(c: ResolveCtx, n: number, targetIndex?: number) {
  const state = c.state;
  let idx = targetIndex;
  if (idx === undefined) idx = firstAliveIndex(state);
  if (idx < 0) return;
  const e = state.enemies[idx];
  e.plating += n;
  c.log(`${e.def.name} braces (+${n}).`);
}

export function applyVulnerableToPlayer(c: ResolveCtx, n: number) {
  c.state.player.vulnerable += n;
  c.log(`You are Vulnerable (${n}).`);
}

export function applyWeakToPlayer(c: ResolveCtx, n: number) {
  c.state.player.weak += n;
  c.log(`You are Weak (${n}).`);
}

export function applyBurnToPlayer(c: ResolveCtx, n: number) {
  c.state.player.burn += n;
  c.log(`You are Burning (${c.state.player.burn}).`);
}

function applyEffect(state: CombatState, eff: CardEffect) {
  const c = ctx(state);
  const targetIdx = currentTargetIndex(state);
  const target = targetIdx >= 0 ? state.enemies[targetIdx] : null;
  switch (eff.kind) {
    case 'damage':
      dealDamageToEnemy(c, eff.amount);
      break;
    case 'plating': {
      const bonus = state.player.dexterity > 0 ? state.player.dexterity : 0;
      const gained = eff.amount + bonus;
      state.player.plating += gained;
      logTo(state, `Reinforce plating (+${gained}).`);
      break;
    }
    case 'draw':
      drawCards(state, eff.amount);
      break;
    case 'gainSteam':
      state.player.steam += eff.amount;
      logTo(state, `Vent: +${eff.amount} steam.`);
      break;
    case 'applyVulnerable':
      if (target) {
        target.vulnerable += eff.amount;
        logTo(state, `${target.def.name} is Vulnerable (${target.vulnerable}).`);
      }
      break;
    case 'applyWeak':
      if (target) {
        target.weak += eff.amount;
        logTo(state, `${target.def.name} is Weak (${target.weak}).`);
      }
      break;
    case 'heal': {
      const p = state.player;
      const healed = Math.min(eff.amount, p.maxHull - p.hull);
      p.hull += healed;
      if (healed > 0) logTo(state, `Repair systems restore ${healed} hull.`);
      break;
    }
    case 'loseHull': {
      // Self-damage bypasses plating
      const p = state.player;
      p.hull = Math.max(0, p.hull - eff.amount);
      logTo(state, `You strain the mech for ${eff.amount} hull.`);
      if (p.hull <= 0) {
        state.phase = 'defeat';
        logTo(state, 'Your mech goes dark.');
      }
      break;
    }
    case 'damageIfEnemyPlated': {
      if (target && target.plating > 0) {
        dealDamageToEnemy(c, eff.amount);
      }
      break;
    }
    case 'damageEqualToPlating': {
      const dmg = state.player.plating + eff.bonus;
      dealDamageToEnemy(c, dmg);
      break;
    }
    case 'losePlating': {
      const lost = state.player.plating;
      state.player.plating = 0;
      if (lost > 0) logTo(state, `Vented ${lost} plating.`);
      break;
    }
    case 'gainStrength': {
      state.player.strength += eff.amount;
      logTo(state, `Gain ${eff.amount} Strength.`);
      break;
    }
    case 'gainDexterity': {
      state.player.dexterity += eff.amount;
      logTo(state, `Gain ${eff.amount} Dexterity.`);
      break;
    }
    case 'gainThorns': {
      state.player.thorns += eff.amount;
      logTo(state, `Gain ${eff.amount} Thorns.`);
      break;
    }
    case 'applyBurn': {
      if (target) {
        target.burn += eff.amount;
        logTo(state, `${target.def.name} is Burning (${target.burn}).`);
      }
      break;
    }
  }
}

function effectiveCost(state: CombatState, baseCost: number): number {
  const p = state.player;
  if (p.firstCardFree && p.cardsPlayedThisTurn === 0) return 0;
  return baseCost;
}

export function canPlay(state: CombatState, uid: number): boolean {
  if (state.phase !== 'playerTurn') return false;
  const card = state.player.hand.find((c) => c.uid === uid);
  if (!card) return false;
  return state.player.steam >= effectiveCost(state, card.def.cost);
}

export function playCard(state: CombatState, uid: number, targetIndex?: number): boolean {
  if (!canPlay(state, uid)) return false;
  const p = state.player;
  const idx = p.hand.findIndex((c) => c.uid === uid);
  if (idx < 0) return false;
  const card = p.hand[idx];
  const cost = effectiveCost(state, card.def.cost);
  p.steam -= cost;
  if (p.firstCardFree && p.cardsPlayedThisTurn === 0) p.firstCardFree = false;
  p.hand.splice(idx, 1);

  // Set the active target so per-target effect handlers know who to hit.
  // For non-enemy-target cards (target: 'self' | 'none') the index is unused.
  state.activeTargetIndex = targetIndex;

  for (const eff of card.def.effects) {
    applyEffect(state, eff);
    if (state.phase === 'victory' || state.phase === 'defeat') break;
  }

  const indexInTurn = p.cardsPlayedThisTurn;
  p.cardsPlayedThisTurn += 1;
  // Relic onCardPlayed hooks run after effects so they can react to the played
  // card. The active target stays set so relics that deal damage (e.g. Pneumatic
  // Strike) hit the same enemy the card just hit when it's still alive.
  if (state.phase === 'playerTurn') {
    for (const id of state.relicIds) RELICS[id]?.onCardPlayed?.(state, card.def, indexInTurn);
  }

  state.activeTargetIndex = undefined;

  if (card.def.exhaust) p.exhaust.push(card);
  else p.discard.push(card);
  return true;
}

export interface EndTurnHooks {
  // Fires after enemy resolves but before plating is reset, so the scene can
  // snapshot deltas and emit hit visuals without conflating "absorbed damage"
  // with "end-of-turn plating decay".
  afterEnemyResolve?: () => void;
}

export function endTurn(state: CombatState, hooks?: EndTurnHooks) {
  if (state.phase !== 'playerTurn') return;
  const p = state.player;
  while (p.hand.length > 0) p.discard.push(p.hand.pop()!);

  // Burn ticks at the end of the owner's turn, before debuff decay. Bypasses plating.
  if (p.burn > 0) {
    const tick = p.burn;
    p.hull = Math.max(0, p.hull - tick);
    logTo(state, `Burn sears you for ${tick}.`);
    p.burn--;
    if (p.hull <= 0) {
      state.phase = 'defeat';
      logTo(state, 'Your mech goes dark.');
      return;
    }
  }
  // Decay player debuffs at end of player's own turn
  if (p.vulnerable > 0) p.vulnerable--;
  if (p.weak > 0) p.weak--;

  state.phase = 'enemyTurn';
  const c = ctx(state);

  // Each alive enemy resolves its action in order. Capture indices up front so
  // mid-turn deaths don't reshuffle the iteration.
  const enemyOrder = state.enemies
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => isAlive(e));
  for (const { e, i } of enemyOrder) {
    if (!isAlive(e)) continue; // killed earlier this turn (e.g. by thorns from a prior attacker)
    // Use the closure'd index so dealDamageToPlayer can attribute damage to the
    // correct attacker (matters for player Thorns retaliating).
    runEnemyAction(c, e, i);
    const phaseNow: string = state.phase;
    if (phaseNow === 'defeat') break;
  }

  // Tick burn on every still-alive enemy
  const phaseBeforeBurn: string = state.phase;
  if (phaseBeforeBurn !== 'defeat') {
    for (const e of state.enemies) {
      if (!isAlive(e) || e.burn <= 0) continue;
      const tick = e.burn;
      e.hull = Math.max(0, e.hull - tick);
      logTo(state, `Burn sears ${e.def.name} for ${tick}.`);
      e.burn--;
      if (e.hull <= 0) logTo(state, `${e.def.name} collapses into scrap.`);
    }
    checkVictory(state);
  }

  hooks?.afterEnemyResolve?.();
  const phase: string = state.phase;
  if (phase === 'defeat' || phase === 'victory') return;

  // Decay enemy debuffs at end of enemy's own turn + queue next intent
  for (const e of state.enemies) {
    if (!isAlive(e)) continue;
    if (e.vulnerable > 0) e.vulnerable--;
    if (e.weak > 0) e.weak--;
    e.lastIntent = e.nextAction.intent;
    e.nextAction = e.def.pickAction({
      turn: state.turn + 1,
      rng,
      memory: e.memory,
      lastIntent: e.lastIntent
    });
  }
  state.turn++;
  startPlayerTurn(state);
}

// Wraps an enemy's action resolve so dealDamageToPlayer can know which enemy
// is attacking (for player Thorns attribution). The enemy's own resolve()
// closure calls our public helpers, which pull from state.activeAttackerIndex.
function runEnemyAction(c: ResolveCtx, e: EnemyState, idx: number) {
  c.state.activeAttackerIndex = idx;
  try {
    e.nextAction.resolve(c);
  } finally {
    c.state.activeAttackerIndex = undefined;
  }
}
