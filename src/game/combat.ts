import { CARDS } from './cards';
import { RELICS } from './relics';
import type {
  CardInstance,
  CombatState,
  EnemyDef,
  EnemyState,
  PersistentPlayer,
  PlayerState,
  PotionDef,
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
    maxSteam: persistent.maxSteam ?? 3,
    draw: shuffle(persistent.deck.map(instance)),
    hand: [],
    discard: [],
    exhaust: [],
    firstAttackBonus: 0,
    firstCardFree: false,
    cardsPlayedThisTurn: 0,
    demonForm: 0,
    barricade: false,
    metallicize: 0,
    combust: 0
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
  // Workshop meta bonus: Tempered Frame adds permanent starting plating
  // every combat. Stacks on top of any relic-granted plating.
  const startingPlating = persistent.startingPlating ?? 0;
  if (startingPlating > 0) state.player.plating += startingPlating;
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
  // Barricade (power) suppresses the normal plating reset, so plating
  // accumulates across turns. Stacks well with Metallicize / per-turn
  // plating cards.
  if (!p.barricade) p.plating = 0;
  // Demon Form (power) grants Strength at every subsequent turn start.
  // It can't fire on the turn it was played because that turn's
  // startPlayerTurn already ran; the bump kicks in next turn.
  if (p.demonForm > 0) {
    p.strength += p.demonForm;
    logTo(state, `Demon Form: +${p.demonForm} Strength.`);
  }
  p.firstAttackBonus = 0;
  p.firstCardFree = false;
  p.cardsPlayedThisTurn = 0;
  // On turn 1, Innate cards are pulled from the draw pile into the opening
  // hand before the normal 5-card draw. Innate cards held over from a
  // previous turn (retained) don't re-trigger.
  if (state.turn === 1) {
    const innate: CardInstance[] = [];
    p.draw = p.draw.filter((c) => {
      if (c.def.innate) {
        innate.push(c);
        return false;
      }
      return true;
    });
    p.hand.push(...innate);
  }
  // Retained cards from the previous turn already occupy hand slots, so
  // only draw enough to fill back up to 5.
  const toDraw = Math.max(0, 5 - p.hand.length);
  drawCards(state, toDraw);
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
    case 'damageAll': {
      // Hit each alive enemy. Player Thorns retaliation could kill us mid-sweep;
      // bail early if we go down. firstAttackBonus only triggers on the first
      // damaging hit because dealDamageToEnemy consumes it once.
      for (let i = 0; i < state.enemies.length; i++) {
        if (!isAlive(state.enemies[i])) continue;
        dealDamageToEnemy(c, eff.amount, i);
        const phaseNow: string = state.phase;
        if (phaseNow === 'defeat') break;
      }
      break;
    }
    case 'applyVulnerableAll': {
      for (const e of state.enemies) {
        if (!isAlive(e)) continue;
        e.vulnerable += eff.amount;
      }
      logTo(state, `All foes Vulnerable (+${eff.amount}).`);
      break;
    }
    case 'applyWeakAll': {
      for (const e of state.enemies) {
        if (!isAlive(e)) continue;
        e.weak += eff.amount;
      }
      logTo(state, `All foes Weak (+${eff.amount}).`);
      break;
    }
    case 'applyBurnAll': {
      for (const e of state.enemies) {
        if (!isAlive(e)) continue;
        e.burn += eff.amount;
      }
      logTo(state, `All foes Burning (+${eff.amount}).`);
      break;
    }
    // ----- Power-card activations -----
    case 'addDemonForm': {
      state.player.demonForm += eff.amount;
      logTo(state, `Demon Form active (+${eff.amount}/turn Strength).`);
      break;
    }
    case 'setBarricade': {
      state.player.barricade = true;
      logTo(state, 'Barricade: plating no longer wears off.');
      break;
    }
    case 'addMetallicize': {
      state.player.metallicize += eff.amount;
      logTo(state, `Metallicize active (+${eff.amount} Plating end of turn).`);
      break;
    }
    case 'addCombust': {
      state.player.combust += eff.amount;
      logTo(state, `Combust active (${eff.amount} AoE end of turn).`);
      break;
    }
  }
}

// Potions reuse the card effect machinery but bypass cost/hand entirely.
// They can be used during the player turn only (StS convention).
export function canUsePotion(state: CombatState): boolean {
  return state.phase === 'playerTurn';
}

export function usePotion(state: CombatState, def: PotionDef, targetIndex?: number): boolean {
  if (!canUsePotion(state)) return false;
  state.activeTargetIndex = targetIndex;
  logTo(state, `You drink ${def.name}.`);
  // Sacred Bark: every effect resolves twice. Looping the whole effect list
  // (rather than doubling individual amounts) means draw/heal/steam scale
  // naturally, and damage hits twice (Strength applies both times, Brass
  // Knuckles' first-hit bonus consumes on the first).
  const reps = state.relicIds.includes('sacredBark') ? 2 : 1;
  for (let r = 0; r < reps; r++) {
    for (const eff of def.effects) {
      applyEffect(state, eff);
      const phaseNow: string = state.phase;
      if (phaseNow === 'victory' || phaseNow === 'defeat') break;
    }
    const phaseNow: string = state.phase;
    if (phaseNow === 'victory' || phaseNow === 'defeat') break;
  }
  // Toy Ornithopter: passive +4 heal on every potion use.
  if (state.relicIds.includes('toyOrnithopter') && state.phase === 'playerTurn') {
    const p = state.player;
    const healed = Math.min(4, p.maxHull - p.hull);
    if (healed > 0) {
      p.hull += healed;
      logTo(state, `Ornithopter repairs ${healed} hull.`);
    }
  }
  state.activeTargetIndex = undefined;
  return true;
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
  // Cards in hand at end of turn route by keyword:
  //  - retain → stay in hand
  //  - ethereal → exhaust
  //  - otherwise → discard
  // Retain wins over ethereal if a card somehow has both (retain is the
  // player-friendly outcome).
  const kept: CardInstance[] = [];
  for (const card of p.hand) {
    if (card.def.retain) kept.push(card);
    else if (card.def.ethereal) p.exhaust.push(card);
    else p.discard.push(card);
  }
  p.hand = kept;

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

  // Build ctx up front so power triggers below can call dealDamageToEnemy.
  const c = ctx(state);

  // Metallicize (power): passive end-of-turn plating. Stacks well with
  // Barricade — without it the plating is wiped at the next player turn.
  if (p.metallicize > 0) {
    p.plating += p.metallicize;
    logTo(state, `Metallicize: +${p.metallicize} Plating.`);
  }
  // Combust (power): pay 1 hull (bypasses plating), then deal damage to
  // every alive enemy. Player Strength applies to the damage. Bails if
  // the self-damage or thorns retaliation drops the player.
  if (p.combust > 0) {
    p.hull = Math.max(0, p.hull - 1);
    logTo(state, `Combust burns you for 1.`);
    if (p.hull <= 0) {
      state.phase = 'defeat';
      logTo(state, 'Your mech goes dark.');
      return;
    }
    for (let i = 0; i < state.enemies.length; i++) {
      if (!isAlive(state.enemies[i])) continue;
      dealDamageToEnemy(c, p.combust, i);
      const phaseNow: string = state.phase;
      if (phaseNow === 'defeat' || phaseNow === 'victory') break;
    }
    const phaseAfterCombust: string = state.phase;
    if (phaseAfterCombust === 'victory') {
      hooks?.afterEnemyResolve?.();
      return;
    }
  }

  state.phase = 'enemyTurn';

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
