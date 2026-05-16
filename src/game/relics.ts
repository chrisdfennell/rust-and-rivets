import type { CardDef, CombatState } from './types';
import type { RunState } from './run';
import { drawCards, dealDamageToEnemy, aliveEnemies } from './combat';

export interface Relic {
  id: string;
  name: string;
  description: string;
  onCombatStart?: (state: CombatState) => void;
  onCombatEnd?: (run: RunState) => void;
  onPickup?: (run: RunState) => void;
  onTurnStart?: (state: CombatState) => void;
  // Fires at the end of the player's turn, after Metallicize / Combust,
  // before the phase flips to 'enemyTurn'. Used by Auto-Mortar /
  // Bristle Plate style relics that emit a passive effect each turn.
  onTurnEnd?: (state: CombatState) => void;
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
  description: 'Start each combat by applying 1 Vulnerable to every enemy.',
  onCombatStart: (state) => {
    for (const e of state.enemies) {
      if (e.hull > 0) e.vulnerable += 1;
    }
    state.log.push('Targets primed: every enemy is Vulnerable.');
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

const POWER_CELL: Relic = {
  id: 'powerCell',
  name: 'Power Cell',
  description: 'Start each combat with 1 Strength.',
  onCombatStart: (state) => {
    state.player.strength += 1;
    state.log.push('Power Cell: +1 Strength.');
  }
};

const BUFFER_COIL: Relic = {
  id: 'bufferCoil',
  name: 'Buffer Coil',
  description: 'Start each combat with 1 Dexterity.',
  onCombatStart: (state) => {
    state.player.dexterity += 1;
    state.log.push('Buffer Coil: +1 Dexterity.');
  }
};

const SPIKE_MANTLE: Relic = {
  id: 'spikeMantle',
  name: 'Spike Mantle',
  description: 'Start each combat with 3 Thorns.',
  onCombatStart: (state) => {
    state.player.thorns += 3;
    state.log.push('Spike Mantle: +3 Thorns.');
  }
};

// Pads the potion belt with an extra empty slot on pickup. Combat reads
// potions.length as the authoritative slot count, so the belt grows
// naturally with no UI changes.
const POTION_BELT: Relic = {
  id: 'potionBelt',
  name: 'Potion Belt',
  description: 'Gain 1 additional potion slot.',
  onPickup: (run) => {
    run.potions.push(null);
  }
};

// Sacred Bark and Toy Ornithopter are checked directly in combat.usePotion
// — no hooks needed since the relic interface doesn't (yet) include
// onPotionUsed. Adding two relics doesn't justify the abstraction.
const SACRED_BARK: Relic = {
  id: 'sacredBark',
  name: 'Sacred Bark',
  description: 'Potion effects are applied twice.'
};

const TOY_ORNITHOPTER: Relic = {
  id: 'toyOrnithopter',
  name: 'Toy Ornithopter',
  description: 'Heal 4 Hull every time you use a potion.'
};

// ===== Slice 38 relic batch =====

// Backup Capacitor — exhaust synergy. Every exhausting card play refunds
// 1 Steam, so cards like Battle Forge / Iron Will / Cinder Round / power
// cards (which all exhaust) effectively cost one less.
const BACKUP_CAPACITOR: Relic = {
  id: 'backupCapacitor',
  name: 'Backup Capacitor',
  description: 'Whenever you play a card that exhausts, gain 1 Steam.',
  onCardPlayed: (state, card) => {
    if (!card.exhaust) return;
    state.player.steam += 1;
    state.log.push('Backup Capacitor: +1 Steam.');
  }
};

// Retained Bracer — retain-keyword synergy. Each card in hand with the
// Retain flag at turn start adds +2 plating. Pairs hard with Hold Position
// since it stays in hand turn after turn.
const RETAINED_BRACER: Relic = {
  id: 'retainedBracer',
  name: 'Retained Bracer',
  description: 'At the start of each turn, gain 2 Plating for each card in your hand with Retain.',
  onTurnStart: (state) => {
    const count = state.player.hand.filter((c) => c.def.retain).length;
    if (count <= 0) return;
    const gained = 2 * count;
    state.player.plating += gained;
    state.log.push(`Retained Bracer: +${gained} Plating.`);
  }
};

// Coal Coil — risk/reward boss-relic style. Strong combat bonus with a
// permanent max-hull cost. Stacks with Power Cell for +3 Strength every
// fight.
const COAL_COIL: Relic = {
  id: 'coalCoil',
  name: 'Coal Coil',
  description: 'Gain 2 Strength each combat. -3 max Hull on pickup.',
  onPickup: (run) => {
    run.player.maxHull = Math.max(1, run.player.maxHull - 3);
    run.player.hull = Math.min(run.player.hull, run.player.maxHull);
  },
  onCombatStart: (state) => {
    state.player.strength += 2;
    state.log.push('Coal Coil: +2 Strength.');
  }
};

// Battle Cap — rewards clean combats. Pairs well with defensive builds
// that already aim to take no damage (Barricade + Metallicize, Spike
// Mantle thorns turtles, etc.).
const BATTLE_CAP: Relic = {
  id: 'battleCap',
  name: 'Battle Cap',
  description: 'Gain 8 Scrap after any combat you end at full Hull.',
  onCombatEnd: (run) => {
    if (run.player.hull >= run.player.maxHull) {
      run.scrap += 8;
    }
  }
};

// Auto-Mortar — passive end-of-turn damage. Picks a random alive enemy
// each turn. Modest amount that adds up over a long fight.
const AUTO_MORTAR: Relic = {
  id: 'autoMortar',
  name: 'Auto-Mortar',
  description: 'At the end of each turn, deal 5 damage to a random enemy.',
  onTurnEnd: (state) => {
    const alive = aliveEnemies(state);
    if (alive.length === 0) return;
    // Pick a random alive enemy, then resolve damage at its real index.
    const target = alive[Math.floor(Math.random() * alive.length)];
    const idx = state.enemies.indexOf(target);
    dealDamageToEnemy({ state, log: (m) => state.log.push(m) }, 5, idx);
  }
};

// Bristle Plate — defensive top-off. Compensates for the turn's incoming
// hit if you came up short on plating cards. Less strong than Iron Plating
// (combat start) but fires every turn.
const BRISTLE_PLATE: Relic = {
  id: 'bristlePlate',
  name: 'Bristle Plate',
  description: 'At the end of each turn, gain 3 Plating if you have less than 5 Plating.',
  onTurnEnd: (state) => {
    if (state.player.plating < 5) {
      state.player.plating += 3;
      state.log.push('Bristle Plate: +3 Plating.');
    }
  }
};

// Furnace Heart — The Stoker's signature relic (Slice 44). Burn-stacker
// snowball: every enemy that's Burning at end of turn adds +1 Strength
// permanently this combat (capped at 3 per turn). Pyro Charge / Acid Mist /
// Cinder Round all become ramp tools instead of pure damage cards.
const FURNACE_HEART: Relic = {
  id: 'furnaceHeart',
  name: 'Furnace Heart',
  description: 'At the end of each turn, gain 1 Strength for each Burning enemy (max 3).',
  onTurnEnd: (state) => {
    const burning = state.enemies.filter((e) => e.hull > 0 && e.burn > 0).length;
    const gain = Math.min(3, burning);
    if (gain > 0) {
      state.player.strength += gain;
      state.log.push(`Furnace Heart: +${gain} Strength.`);
    }
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
  [SLAG_WRENCH.id]: SLAG_WRENCH,
  [POWER_CELL.id]: POWER_CELL,
  [BUFFER_COIL.id]: BUFFER_COIL,
  [SPIKE_MANTLE.id]: SPIKE_MANTLE,
  [POTION_BELT.id]: POTION_BELT,
  [SACRED_BARK.id]: SACRED_BARK,
  [TOY_ORNITHOPTER.id]: TOY_ORNITHOPTER,
  [BACKUP_CAPACITOR.id]: BACKUP_CAPACITOR,
  [RETAINED_BRACER.id]: RETAINED_BRACER,
  [COAL_COIL.id]: COAL_COIL,
  [BATTLE_CAP.id]: BATTLE_CAP,
  [AUTO_MORTAR.id]: AUTO_MORTAR,
  [BRISTLE_PLATE.id]: BRISTLE_PLATE,
  [FURNACE_HEART.id]: FURNACE_HEART
};

export const ALL_RELIC_IDS: string[] = Object.keys(RELICS);

export function pickRelicFor(owned: Set<string>, rng: () => number = Math.random): string | null {
  const available = ALL_RELIC_IDS.filter((id) => !owned.has(id));
  if (available.length === 0) return null;
  return available[Math.floor(rng() * available.length)];
}
