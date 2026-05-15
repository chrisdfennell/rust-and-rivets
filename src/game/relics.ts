import type { CardDef, CombatState } from './types';
import type { RunState } from './run';
import { drawCards, dealDamageToEnemy } from './combat';

export interface Relic {
  id: string;
  name: string;
  description: string;
  onCombatStart?: (state: CombatState) => void;
  onCombatEnd?: (run: RunState) => void;
  onPickup?: (run: RunState) => void;
  onTurnStart?: (state: CombatState) => void;
  onCardPlayed?: (state: CombatState, card: CardDef, indexInTurn: number) => void;
}

const PRESSURE_GAUGE: Relic = {
  id: 'pressureGauge',
  name: 'Pressure Gauge',
  description: 'Gain +1 max Steam each combat.',
  onCombatStart: (state) => {
    state.player.maxSteam += 1;
    state.player.steam += 1;
  }
};

const IRON_PLATING: Relic = {
  id: 'ironPlating',
  name: 'Iron Plating',
  description: 'Start each combat with 4 Plating.',
  onCombatStart: (state) => {
    state.player.plating += 4;
    state.log.push('Iron Plating: +4 plating.');
  }
};

const ENGINE_OIL: Relic = {
  id: 'engineOil',
  name: 'Engine Oil',
  description: 'Heal 4 Hull after each non-boss combat.',
  onCombatEnd: (run) => {
    run.player.hull = Math.min(run.player.maxHull, run.player.hull + 4);
  }
};

const HEAVY_FRAME: Relic = {
  id: 'heavyFrame',
  name: 'Heavy Frame',
  description: 'Increase max Hull by 10.',
  onPickup: (run) => {
    run.player.maxHull += 10;
    run.player.hull += 10;
  }
};

const SALVAGE_LOOP: Relic = {
  id: 'salvageLoop',
  name: 'Salvage Loop',
  description: 'Earn +5 Scrap from each combat win.'
  // Reward bonus is applied in completeCombat() — passive.
};

const CALIBRATION_SPIKE: Relic = {
  id: 'calibrationSpike',
  name: 'Calibration Spike',
  description: 'Start each combat by applying 1 Vulnerable to the enemy.',
  onCombatStart: (state) => {
    state.enemy.vulnerable += 1;
    state.log.push(`${state.enemy.def.name} starts Vulnerable.`);
  }
};

const BRASS_KNUCKLES: Relic = {
  id: 'brassKnuckles',
  name: 'Brass Knuckles',
  description: 'First attack each turn deals +3 damage.',
  onTurnStart: (state) => {
    state.player.firstAttackBonus = 3;
  }
};

const BOILER_VENT: Relic = {
  id: 'boilerVent',
  name: 'Boiler Vent',
  description: 'First card each turn costs 0 Steam.',
  onTurnStart: (state) => {
    state.player.firstCardFree = true;
  }
};

const QUICKDRAW_SPRING: Relic = {
  id: 'quickdrawSpring',
  name: 'Quickdraw Spring',
  description: 'Draw 1 additional card at the start of each turn.',
  onTurnStart: (state) => {
    drawCards(state, 1);
  }
};

const IRON_RESOLVE: Relic = {
  id: 'ironResolve',
  name: 'Iron Resolve',
  description: 'Heal 3 Hull at the start of each turn.',
  onTurnStart: (state) => {
    const p = state.player;
    p.hull = Math.min(p.maxHull, p.hull + 3);
  }
};

const PNEUMATIC_STRIKE: Relic = {
  id: 'pneumaticStrike',
  name: 'Pneumatic Strike',
  description: 'Every 3rd card played deals 5 damage to the enemy.',
  onCardPlayed: (state, _card, indexInTurn) => {
    if ((indexInTurn + 1) % 3 === 0) {
      dealDamageToEnemy({ state, log: (m) => state.log.push(m) }, 5);
    }
  }
};

const SLAG_WRENCH: Relic = {
  id: 'slagWrench',
  name: 'Slag Wrench',
  description: 'Gain 2 max Hull after each non-boss combat.',
  onCombatEnd: (run) => {
    run.player.maxHull += 2;
    run.player.hull += 2;
  }
};

export const RELICS: Record<string, Relic> = {
  [PRESSURE_GAUGE.id]: PRESSURE_GAUGE,
  [IRON_PLATING.id]: IRON_PLATING,
  [ENGINE_OIL.id]: ENGINE_OIL,
  [HEAVY_FRAME.id]: HEAVY_FRAME,
  [SALVAGE_LOOP.id]: SALVAGE_LOOP,
  [CALIBRATION_SPIKE.id]: CALIBRATION_SPIKE,
  [BRASS_KNUCKLES.id]: BRASS_KNUCKLES,
  [BOILER_VENT.id]: BOILER_VENT,
  [QUICKDRAW_SPRING.id]: QUICKDRAW_SPRING,
  [IRON_RESOLVE.id]: IRON_RESOLVE,
  [PNEUMATIC_STRIKE.id]: PNEUMATIC_STRIKE,
  [SLAG_WRENCH.id]: SLAG_WRENCH
};

export const ALL_RELIC_IDS: string[] = Object.keys(RELICS);

export function pickRelicFor(owned: Set<string>, rng: () => number = Math.random): string | null {
  const available = ALL_RELIC_IDS.filter((id) => !owned.has(id));
  if (available.length === 0) return null;
  return available[Math.floor(rng() * available.length)];
}
