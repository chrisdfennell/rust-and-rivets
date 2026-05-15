import type { CombatState } from './types';
import type { RunState } from './run';

export interface Relic {
  id: string;
  name: string;
  description: string;
  onCombatStart?: (state: CombatState) => void;
  onCombatEnd?: (run: RunState) => void;
  onPickup?: (run: RunState) => void;
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

export const RELICS: Record<string, Relic> = {
  [PRESSURE_GAUGE.id]: PRESSURE_GAUGE,
  [IRON_PLATING.id]: IRON_PLATING,
  [ENGINE_OIL.id]: ENGINE_OIL,
  [HEAVY_FRAME.id]: HEAVY_FRAME,
  [SALVAGE_LOOP.id]: SALVAGE_LOOP,
  [CALIBRATION_SPIKE.id]: CALIBRATION_SPIKE
};

export const ALL_RELIC_IDS: string[] = Object.keys(RELICS);

export function pickRelicFor(owned: Set<string>, rng: () => number = Math.random): string | null {
  const available = ALL_RELIC_IDS.filter((id) => !owned.has(id));
  if (available.length === 0) return null;
  return available[Math.floor(rng() * available.length)];
}
