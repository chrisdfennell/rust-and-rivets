import type { CardDef, CombatState } from './types';
import type { RunState } from './run';
import { drawCards, dealDamageToEnemy, aliveEnemies } from './combat';

export interface Relic {
  id: string;
  name: string;
  description: string;
  // Signature relics only drop from a specific boss kill. They're
  // excluded from random rolls (elite drops, events, workshop unlocks)
  // so picking up "Tyrant's Bellows" can only happen by beating
  // Foundry Tyrant — gives players a reason to want a specific boss.
  signature?: boolean;
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
  description: 'Heal 5 Hull after each non-boss combat.',
  onCombatEnd: (run) => {
    run.player.hull = Math.min(run.player.maxHull, run.player.hull + 5);
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
  description: 'Gain 12 Scrap after any combat you end at full Hull.',
  onCombatEnd: (run) => {
    if (run.player.hull >= run.player.maxHull) {
      run.scrap += 12;
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

// Steam Whistle — The Conductor's signature relic. Rewards rapid card
// cycling: every third card played in a turn grants +1 Strength for the
// rest of combat. Stacks turn over turn — the longer a fight runs, the
// harder the Conductor hits. indexInTurn is 0-based, so the 3rd card has
// indexInTurn === 2, hence `(indexInTurn + 1) % 3 === 0`.
const STEAM_WHISTLE: Relic = {
  id: 'steamWhistle',
  name: 'Steam Whistle',
  description: 'Every 3rd card played each turn grants +1 Strength this combat.',
  onCardPlayed: (state, _card, indexInTurn) => {
    if ((indexInTurn + 1) % 3 === 0) {
      state.player.strength += 1;
      state.log.push('Steam Whistle: +1 Strength.');
    }
  }
};

// ===== Slice 52 — Relic expansion pack =====
// Eight new relics, each using a different hook. None are pure stat
// boosts — every one ties to a specific combat verb (Burn-apply, power
// cards, status cards, full-Hull turns, etc.) so picks feel build-defining.

// Hot Coil — Burn-deck damage rider. The chip damage is small but it
// kicks in on every Burn application, including AoE ones, so a Stoker
// deck can crank 5-8 extra dpt through it. Resolved inline in the
// applyBurn / applyBurnAll effect handlers.
const HOT_COIL: Relic = {
  id: 'hotCoil',
  name: 'Hot Coil',
  description: 'Whenever you apply Burn to an enemy, deal 2 damage to it.'
};

// Reactor Lens — power-deck enabler. Demon Form 3 → 2, Barricade 3 → 2,
// Metallicize 1 → 0. effectiveCost reads relicIds directly so this
// works for upgraded Powers too (xCost / firstCardFree paths bypass it,
// which is intended).
const REACTOR_LENS: Relic = {
  id: 'reactorLens',
  name: 'Reactor Lens',
  description: 'Power cards cost 1 less Steam (min 0).'
};

// Salvage Wreath — flat scrap bonus on every non-boss win. Stacks with
// Salvage Loop, so a full economy build can pull +8 scrap per fight.
const SALVAGE_WREATH: Relic = {
  id: 'salvageWreath',
  name: 'Salvage Wreath',
  description: '+3 Scrap on every non-boss combat win.'
};

// Mechanic's Loop — trickle heal tied to card cadence. Pairs with the
// Conductor's Steam Whistle and other combo cards; even casual decks
// see 2-3 hull per turn back.
const MECHANICS_LOOP: Relic = {
  id: 'mechanicsLoop',
  name: "Mechanic's Loop",
  description: 'Every 3rd card played each turn, heal 1 Hull.',
  onCardPlayed: (state, _card, indexInTurn) => {
    if ((indexInTurn + 1) % 3 !== 0) return;
    const p = state.player;
    if (p.hull >= p.maxHull) return;
    p.hull = Math.min(p.maxHull, p.hull + 1);
    state.log.push("Mechanic's Loop: +1 Hull.");
  }
};

// Forge Bell — slow boss-stretch payoff. Turn 4 / 8 / 12 each add 1
// Strength permanently this combat. Long fights benefit most.
const FORGE_BELL: Relic = {
  id: 'forgeBell',
  name: 'Forge Bell',
  description: 'Every 4th turn, gain 1 Strength this combat.',
  onTurnStart: (state) => {
    if (state.turn % 4 !== 0) return;
    state.player.strength += 1;
    state.log.push('Forge Bell tolls: +1 Strength.');
  }
};

// Slag Filter — anti-deck-pollution. Routes status cards (Slag Glob,
// Shrapnel, Heat Damage, Old Rust) to the exhaust pile instead of the
// discard pile when an enemy / event tries to jam one in. addCardToDiscard
// reads `relicIds` directly.
const SLAG_FILTER: Relic = {
  id: 'slagFilter',
  name: 'Slag Filter',
  description: 'Status / curse cards added by enemies exhaust immediately.'
};

// Twin Boiler — one-time +1 Steam at the start of every combat. Not max
// Steam (that's Pressure Gauge / Reserve Tank); just a turn-1 burst that
// lets you slam a 4-cost card on the opener.
const TWIN_BOILER: Relic = {
  id: 'twinBoiler',
  name: 'Twin Boiler',
  description: 'Start each combat with +1 Steam this turn.',
  onCombatStart: (state) => {
    state.player.steam += 1;
    state.log.push('Twin Boiler: +1 Steam.');
  }
};

// Iron Heart — full-Hull defensive ramp. Rewards keeping plating up so
// no damage leaks through; pairs hard with Battle Cap (full-Hull scrap)
// and Barricade (plating doesn't wear off).
const IRON_HEART: Relic = {
  id: 'ironHeart',
  name: 'Iron Heart',
  description: 'At the end of each turn, if at full Hull, gain 5 Plating.',
  onTurnEnd: (state) => {
    const p = state.player;
    if (p.hull >= p.maxHull) {
      p.plating += 5;
      state.log.push('Iron Heart: +5 Plating.');
    }
  }
};

// ===== Boss-signature relics (Slice 48) =====
//
// Each of the 9 bosses drops a unique relic on kill. They're tagged
// `signature: true` so `pickRelicFor` skips them — the only path to
// owning one is beating that specific boss. Effects mirror the boss's
// own mechanic (Tyrant's Bellows applies Burn, Reclaimer Spike grants
// Thorns, etc.) so the trophy reads as "I learned this boss's trick."

const TYRANTS_BELLOWS: Relic = {
  id: 'tyrantsBellows',
  name: "Tyrant's Bellows",
  description: 'Start each combat by applying 3 Burn to ALL enemies.',
  signature: true,
  onCombatStart: (state) => {
    let any = false;
    for (const e of state.enemies) {
      if (e.hull > 0) { e.burn += 3; any = true; }
    }
    if (any) state.log.push("Tyrant's Bellows: every enemy is Burning.");
  }
};

const COLOSSUS_ARM: Relic = {
  id: 'colossusArm',
  name: 'Colossus Arm',
  description: 'Start each combat with +2 Strength.',
  signature: true,
  onCombatStart: (state) => {
    state.player.strength += 2;
    state.log.push('Colossus Arm: +2 Strength.');
  }
};

const RECLAIMER_SPIKE: Relic = {
  id: 'reclaimerSpike',
  name: 'Reclaimer Spike',
  description: 'Start each combat with 4 Thorns.',
  signature: true,
  onCombatStart: (state) => {
    state.player.thorns += 4;
    state.log.push('Reclaimer Spike: +4 Thorns.');
  }
};

const SOVEREIGN_PLATING: Relic = {
  id: 'sovereignPlating',
  name: 'Sovereign Plating',
  description: 'Start each combat with +8 Plating.',
  signature: true,
  onCombatStart: (state) => {
    state.player.plating += 8;
    state.log.push('Sovereign Plating: +8 Plating.');
  }
};

const PYROCLAST_COIL: Relic = {
  id: 'pyroclastCoil',
  name: 'Pyroclast Coil',
  description: 'At the end of each turn, apply 1 Burn to all enemies.',
  signature: true,
  onTurnEnd: (state) => {
    let any = false;
    for (const e of state.enemies) {
      if (e.hull > 0) { e.burn += 1; any = true; }
    }
    if (any) state.log.push('Pyroclast Coil: every enemy gains 1 Burn.');
  }
};

const WARDENS_LOCK: Relic = {
  id: 'wardensLock',
  name: "Warden's Lock",
  description: 'Heal 6 Hull after each combat.',
  signature: true,
  onCombatEnd: (run) => {
    const before = run.player.hull;
    run.player.hull = Math.min(run.player.maxHull, run.player.hull + 6);
    if (run.player.hull > before) {
      // No log channel in run scope; the relic bar update is the cue.
    }
  }
};

const STORMHEART_CORE: Relic = {
  id: 'stormheartCore',
  name: 'Stormheart Core',
  description: 'At the start of each combat, deal 10 damage to a random enemy.',
  signature: true,
  onCombatStart: (state) => {
    const alive = aliveEnemies(state);
    if (alive.length === 0) return;
    const target = alive[Math.floor(Math.random() * alive.length)];
    const idx = state.enemies.indexOf(target);
    dealDamageToEnemy({ state, log: (m) => state.log.push(m) }, 10, idx);
    state.log.push('Stormheart Core arcs a bolt.');
  }
};

const WRAITH_VEIL: Relic = {
  id: 'wraithVeil',
  name: 'Wraith Veil',
  description: 'At the end of each turn, if you have no Plating, gain 5 Plating.',
  signature: true,
  onTurnEnd: (state) => {
    if (state.player.plating <= 0) {
      state.player.plating += 5;
      state.log.push('Wraith Veil: +5 Plating.');
    }
  }
};

const CYCLONE_CROWN: Relic = {
  id: 'cycloneCrown',
  name: 'Cyclone Crown',
  description: 'Start each combat with +1 Dexterity.',
  signature: true,
  onCombatStart: (state) => {
    state.player.dexterity += 1;
    state.log.push('Cyclone Crown: +1 Dexterity.');
  }
};

// ===== Slice 50 — Act 4 & 5 boss signatures =====

// Choirmaster — echoes the boss's resonance cycle: every 3rd turn gain
// 5 plating. Deterministic, pairs well with defensive decks.
const RESONANCE_COIL: Relic = {
  id: 'resonanceCoil',
  name: 'Resonance Coil',
  description: 'Every 3rd turn, gain 5 Plating.',
  signature: true,
  onTurnStart: (state) => {
    if (state.turn % 3 === 0) {
      state.player.plating += 5;
      state.log.push('Resonance Coil: +5 Plating.');
    }
  }
};

// Iron Saint — the trophy mirrors the boss's relentless ramp: combat
// starts with a small Strength + Dexterity boost.
const SAINTS_HALO: Relic = {
  id: 'saintsHalo',
  name: "Saint's Halo",
  description: 'Start each combat with +1 Strength and +1 Dexterity.',
  signature: true,
  onCombatStart: (state) => {
    state.player.strength += 1;
    state.player.dexterity += 1;
    state.log.push("Saint's Halo: +1 Strength / +1 Dexterity.");
  }
};

// World-Forge Heart — the boss radiates burn + plating; the relic does
// both at combat start.
const FORGE_CORE: Relic = {
  id: 'forgeCore',
  name: 'Forge Core',
  description: 'Start each combat with 6 Plating and apply 3 Burn to all enemies.',
  signature: true,
  onCombatStart: (state) => {
    state.player.plating += 6;
    let burned = false;
    for (const e of state.enemies) {
      if (e.hull > 0) { e.burn += 3; burned = true; }
    }
    state.log.push(
      burned
        ? 'Forge Core: +6 Plating, foes are Burning.'
        : 'Forge Core: +6 Plating.'
    );
  }
};

// First Engine — the boss is all about charged-up first strikes. The
// trophy turns the player's first damaging hit each turn into a heavier
// blow. Uses indexInTurn to fire only on the first card played that
// actually deals damage.
const ENGINE_SHARD: Relic = {
  id: 'engineShard',
  name: 'Engine Shard',
  description: 'First attack each turn deals +6 damage.',
  signature: true,
  onTurnStart: (state) => {
    // Stacks with Brass Knuckles' +3 — both bonuses live on
    // firstAttackBonus and consume on the first damaging hit.
    state.player.firstAttackBonus += 6;
  }
};

// Maps boss enemy ID → signature relic ID. Used by completeCombat to
// stage the right drop when that specific boss is killed. Adding a
// new boss means adding an entry here too.
export const BOSS_SIGNATURE_RELICS: Record<string, string> = {
  foundryTyrant:   TYRANTS_BELLOWS.id,
  salvageColossus: COLOSSUS_ARM.id,
  reclaimerPrime:  RECLAIMER_SPIKE.id,
  ironSovereign:   SOVEREIGN_PLATING.id,
  pyroclastEngine: PYROCLAST_COIL.id,
  vaultWarden:     WARDENS_LOCK.id,
  stormheart:      STORMHEART_CORE.id,
  theWraith:       WRAITH_VEIL.id,
  cycloneKing:     CYCLONE_CROWN.id,
  choirmaster:     RESONANCE_COIL.id,
  ironSaint:       SAINTS_HALO.id,
  worldForgeHeart: FORGE_CORE.id,
  firstEngine:     ENGINE_SHARD.id
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
  [FURNACE_HEART.id]: FURNACE_HEART,
  [STEAM_WHISTLE.id]: STEAM_WHISTLE,
  [HOT_COIL.id]: HOT_COIL,
  [REACTOR_LENS.id]: REACTOR_LENS,
  [SALVAGE_WREATH.id]: SALVAGE_WREATH,
  [MECHANICS_LOOP.id]: MECHANICS_LOOP,
  [FORGE_BELL.id]: FORGE_BELL,
  [SLAG_FILTER.id]: SLAG_FILTER,
  [TWIN_BOILER.id]: TWIN_BOILER,
  [IRON_HEART.id]: IRON_HEART,
  [TYRANTS_BELLOWS.id]:   TYRANTS_BELLOWS,
  [COLOSSUS_ARM.id]:      COLOSSUS_ARM,
  [RECLAIMER_SPIKE.id]:   RECLAIMER_SPIKE,
  [SOVEREIGN_PLATING.id]: SOVEREIGN_PLATING,
  [PYROCLAST_COIL.id]:    PYROCLAST_COIL,
  [WARDENS_LOCK.id]:      WARDENS_LOCK,
  [STORMHEART_CORE.id]:   STORMHEART_CORE,
  [WRAITH_VEIL.id]:       WRAITH_VEIL,
  [CYCLONE_CROWN.id]:     CYCLONE_CROWN,
  [RESONANCE_COIL.id]:    RESONANCE_COIL,
  [SAINTS_HALO.id]:       SAINTS_HALO,
  [FORGE_CORE.id]:        FORGE_CORE,
  [ENGINE_SHARD.id]:      ENGINE_SHARD
};

export const ALL_RELIC_IDS: string[] = Object.keys(RELICS);

// Random rolls (elite drops, events, workshop unlocks) exclude
// signature relics — those are gated behind specific boss kills.
export function pickRelicFor(owned: Set<string>, rng: () => number = Math.random): string | null {
  const available = ALL_RELIC_IDS.filter((id) => !owned.has(id) && !RELICS[id].signature);
  if (available.length === 0) return null;
  return available[Math.floor(rng() * available.length)];
}
