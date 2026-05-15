import { CARDS } from './cards';
import { RELICS } from './relics';
import type {
  CardInstance,
  CombatState,
  EnemyDef,
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
  enemyDef: EnemyDef,
  persistent: PersistentPlayer,
  relicIds: string[] = []
): CombatState {
  const player: PlayerState = {
    hull: persistent.hull,
    maxHull: persistent.maxHull,
    plating: 0,
    vulnerable: 0,
    weak: 0,
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

  const enemy = makeEnemy(enemyDef, 1);

  const state: CombatState = {
    phase: 'playerTurn',
    turn: 1,
    player,
    enemy,
    log: [`A ${enemy.def.name} blocks the road.`],
    relicIds: relicIds.slice()
  };

  startPlayerTurn(state);
  // Relic onCombatStart hooks run AFTER startPlayerTurn so they can stack
  // plating, steam, etc. on top of the freshly-initialized turn state.
  for (const id of relicIds) RELICS[id]?.onCombatStart?.(state);
  return state;
}

function makeEnemy(def: EnemyDef, turn: number) {
  const memory: Record<string, unknown> = {};
  const action = def.pickAction({ turn, rng, memory });
  return {
    def,
    hull: def.maxHull,
    maxHull: def.maxHull,
    plating: 0,
    vulnerable: 0,
    weak: 0,
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

export function dealDamageToEnemy(c: ResolveCtx, raw: number) {
  const e = c.state.enemy;
  const p = c.state.player;
  let dmg = raw;
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
    c.state.phase = 'victory';
    c.log(`${e.def.name} collapses into scrap.`);
  }
}

export function dealDamageToPlayer(c: ResolveCtx, raw: number) {
  const p = c.state.player;
  let dmg = raw;
  if (p.vulnerable > 0) dmg = Math.floor(dmg * 1.5);
  const absorbed = Math.min(p.plating, dmg);
  p.plating -= absorbed;
  const through = dmg - absorbed;
  p.hull = Math.max(0, p.hull - through);
  if (through > 0) c.log(`You take ${through} hull damage.`);
  else c.log(`Plating absorbs ${absorbed}.`);
  if (p.hull <= 0) {
    c.state.phase = 'defeat';
    c.log('Your mech goes dark.');
  }
}

export function gainEnemyPlating(c: ResolveCtx, n: number) {
  c.state.enemy.plating += n;
  c.log(`${c.state.enemy.def.name} braces (+${n}).`);
}

export function applyVulnerableToPlayer(c: ResolveCtx, n: number) {
  c.state.player.vulnerable += n;
  c.log(`You are Vulnerable (${n}).`);
}

export function applyWeakToPlayer(c: ResolveCtx, n: number) {
  c.state.player.weak += n;
  c.log(`You are Weak (${n}).`);
}

function applyEffect(state: CombatState, eff: CardEffect) {
  const c = ctx(state);
  switch (eff.kind) {
    case 'damage':
      dealDamageToEnemy(c, eff.amount);
      break;
    case 'plating':
      state.player.plating += eff.amount;
      logTo(state, `Reinforce plating (+${eff.amount}).`);
      break;
    case 'draw':
      drawCards(state, eff.amount);
      break;
    case 'gainSteam':
      state.player.steam += eff.amount;
      logTo(state, `Vent: +${eff.amount} steam.`);
      break;
    case 'applyVulnerable':
      state.enemy.vulnerable += eff.amount;
      logTo(state, `${state.enemy.def.name} is Vulnerable (${eff.amount}).`);
      break;
    case 'applyWeak':
      state.enemy.weak += eff.amount;
      logTo(state, `${state.enemy.def.name} is Weak (${eff.amount}).`);
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
      if (state.enemy.plating > 0) {
        dealDamageToEnemy(ctx(state), eff.amount);
      }
      break;
    }
    case 'damageEqualToPlating': {
      const dmg = state.player.plating + eff.bonus;
      dealDamageToEnemy(ctx(state), dmg);
      break;
    }
    case 'losePlating': {
      const lost = state.player.plating;
      state.player.plating = 0;
      if (lost > 0) logTo(state, `Vented ${lost} plating.`);
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

export function playCard(state: CombatState, uid: number): boolean {
  if (!canPlay(state, uid)) return false;
  const p = state.player;
  const idx = p.hand.findIndex((c) => c.uid === uid);
  if (idx < 0) return false;
  const card = p.hand[idx];
  const cost = effectiveCost(state, card.def.cost);
  p.steam -= cost;
  if (p.firstCardFree && p.cardsPlayedThisTurn === 0) p.firstCardFree = false;
  p.hand.splice(idx, 1);

  for (const eff of card.def.effects) {
    applyEffect(state, eff);
    if (state.phase === 'victory' || state.phase === 'defeat') break;
  }

  const indexInTurn = p.cardsPlayedThisTurn;
  p.cardsPlayedThisTurn += 1;
  // Relic onCardPlayed hooks run after effects so they can react to the played card
  if (state.phase === 'playerTurn') {
    for (const id of state.relicIds) RELICS[id]?.onCardPlayed?.(state, card.def, indexInTurn);
  }

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

  // Decay player debuffs at end of player's own turn
  if (p.vulnerable > 0) p.vulnerable--;
  if (p.weak > 0) p.weak--;

  state.phase = 'enemyTurn';
  const c = ctx(state);
  state.enemy.nextAction.resolve(c);
  hooks?.afterEnemyResolve?.();
  const phase: string = state.phase;
  if (phase === 'defeat' || phase === 'victory') return;

  // Decay enemy debuffs at end of enemy's own turn
  const e = state.enemy;
  if (e.vulnerable > 0) e.vulnerable--;
  if (e.weak > 0) e.weak--;

  e.lastIntent = e.nextAction.intent;
  e.nextAction = e.def.pickAction({
    turn: state.turn + 1,
    rng,
    memory: e.memory,
    lastIntent: e.lastIntent
  });
  state.turn++;
  startPlayerTurn(state);
}
