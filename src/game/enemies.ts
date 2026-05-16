import type { EnemyDef, EnemyAction, ResolveCtx } from './types';
import {
  dealDamageToPlayer,
  gainEnemyPlating,
  applyVulnerableToPlayer,
  applyWeakToPlayer,
  applyBurnToPlayer,
  addCardToDiscard
} from './combat';

export const SCRAP_RAIDER: EnemyDef = {
  id: 'scrapRaider',
  name: 'Scrap Raider',
  maxHull: 46,
  pickAction: ({ turn, rng }): EnemyAction => {
    const roll = rng();
    if (turn === 1 || roll < 0.55) {
      const dmg = 9;
      return {
        intent: { kind: 'attack', label: `Cleaver: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx: ResolveCtx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (roll < 0.85) {
      const dmg = 4;
      return {
        intent: { kind: 'attack', label: `Quick Slash: ${dmg}x2`, damage: dmg, hits: 2 },
        resolve: (ctx: ResolveCtx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    const armor = 8;
    return {
      intent: { kind: 'defend', label: `Scrap Wall: +${armor}`, plating: armor },
      resolve: (ctx: ResolveCtx) => gainEnemyPlating(ctx, armor)
    };
  }
};

export const JUNK_HOUND: EnemyDef = {
  id: 'junkHound',
  name: 'Junk Hound',
  maxHull: 28,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    const roll = rng();
    // Always open with a bite so first turn is readable
    if (turn === 1) {
      const dmg = 7;
      return {
        intent: { kind: 'attack', label: `Bite: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    // Don't snarl twice in a row
    const justSnarled = lastIntent?.label === 'Snarl';
    if (!justSnarled && roll < 0.18) {
      return {
        intent: { kind: 'debuff', label: 'Snarl' },
        resolve: (ctx) => applyWeakToPlayer(ctx, 2)
      };
    }
    if (roll < 0.55) {
      const dmg = 5;
      return {
        intent: { kind: 'attack', label: `Frenzy: ${dmg}x2`, damage: dmg, hits: 2 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    if (roll < 0.85) {
      const dmg = 7;
      return {
        intent: { kind: 'attack', label: `Bite: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    const dmg = 11;
    return {
      intent: { kind: 'attack', label: `Rabid Lunge: ${dmg}`, damage: dmg, hits: 1 },
      resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
    };
  }
};

export const SENTINEL_DRONE: EnemyDef = {
  id: 'sentinelDrone',
  name: 'Sentinel Drone',
  maxHull: 38,
  pickAction: ({ turn, rng, memory }): EnemyAction => {
    // Telegraph cleared → fire the lance
    if (memory.charging) {
      memory.charging = false;
      const dmg = 18;
      return {
        intent: { kind: 'attack', label: `Plasma Lance: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    const roll = rng();
    // No telegraph on turn 1 — give the player a clean read first
    if (turn > 1 && roll < 0.35) {
      memory.charging = true;
      return {
        intent: { kind: 'buff', label: 'Charging...' },
        resolve: (ctx) => ctx.log('The drone hums, gathering charge.')
      };
    }
    if (roll < 0.75) {
      const dmg = 5;
      return {
        intent: { kind: 'attack', label: `Tracer: ${dmg} + Vuln`, damage: dmg, hits: 1 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyVulnerableToPlayer(ctx, 1);
        }
      };
    }
    const armor = 7;
    return {
      intent: { kind: 'defend', label: `Repair: +${armor}`, plating: armor },
      resolve: (ctx) => gainEnemyPlating(ctx, armor)
    };
  }
};

export const RUST_SPRAYER: EnemyDef = {
  id: 'rustSprayer',
  name: 'Rust Sprayer',
  maxHull: 34,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      const dmg = 5;
      return {
        intent: { kind: 'debuff', label: `Spray: ${dmg} + Vuln` },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyVulnerableToPlayer(ctx, 2);
        }
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Spray') && roll < 0.3) {
      const dmg = 5;
      return {
        intent: { kind: 'debuff', label: `Spray: ${dmg} + Vuln` },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyVulnerableToPlayer(ctx, 2);
        }
      };
    }
    if (!last.startsWith('Acid Burst') && roll < 0.6) {
      const dmg = 4;
      return {
        intent: { kind: 'attack', label: `Acid Burst: ${dmg}x2`, damage: dmg, hits: 2 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    if (!last.startsWith('Corrode') && roll < 0.7) {
      return {
        intent: { kind: 'debuff', label: 'Corrode: Weak + Vuln' },
        resolve: (ctx) => {
          applyWeakToPlayer(ctx, 2);
          applyVulnerableToPlayer(ctx, 1);
        }
      };
    }
    if (!last.startsWith('Slag Lob') && roll < 0.9) {
      const dmg = 4;
      return {
        // Lobs a status card (Slag Glob) into the player's discard pile.
        // Player has to either spend a steam to exhaust it or just live
        // with the dead draw next time it cycles around.
        intent: { kind: 'debuff', label: `Slag Lob: ${dmg} + Slag Glob`, damage: dmg, hits: 1 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          addCardToDiscard(ctx, 'slagGlob');
        }
      };
    }
    return {
      intent: { kind: 'defend', label: 'Plating Mist: +5' },
      resolve: (ctx) => gainEnemyPlating(ctx, 5)
    };
  }
};

export const PYLON_CRAWLER: EnemyDef = {
  id: 'pylonCrawler',
  name: 'Pylon Crawler',
  maxHull: 36,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      return {
        intent: { kind: 'defend', label: 'Anchor: +10' },
        resolve: (ctx) => gainEnemyPlating(ctx, 10)
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Anchor') && roll < 0.25) {
      return {
        intent: { kind: 'defend', label: 'Anchor: +10' },
        resolve: (ctx) => gainEnemyPlating(ctx, 10)
      };
    }
    if (!last.startsWith('Pylon Slam') && roll < 0.6) {
      const dmg = 11;
      return {
        intent: { kind: 'attack', label: `Pylon Slam: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (!last.startsWith('Reinforce') && roll < 0.85) {
      return {
        intent: { kind: 'defend', label: 'Reinforce: +14 + Weak' },
        resolve: (ctx) => {
          gainEnemyPlating(ctx, 14);
          applyWeakToPlayer(ctx, 1);
        }
      };
    }
    const dmg = 9;
    return {
      intent: { kind: 'attack', label: `Bash: ${dmg}`, damage: dmg, hits: 1 },
      resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
    };
  }
};

export const TINKER_HAWK: EnemyDef = {
  id: 'tinkerHawk',
  name: 'Tinker Hawk',
  maxHull: 30,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      const dmg = 4;
      return {
        intent: { kind: 'attack', label: `Dive: ${dmg}x2`, damage: dmg, hits: 2 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Talons') && roll < 0.3) {
      const dmg = 3;
      return {
        intent: { kind: 'debuff', label: `Talons: ${dmg}x4 + Vuln`, damage: dmg, hits: 4 },
        resolve: (ctx) => {
          for (let i = 0; i < 4; i++) dealDamageToPlayer(ctx, dmg);
          applyVulnerableToPlayer(ctx, 1);
        }
      };
    }
    if (!last.startsWith('Dive') && roll < 0.65) {
      const dmg = 4;
      return {
        intent: { kind: 'attack', label: `Dive: ${dmg}x2`, damage: dmg, hits: 2 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    if (!last.startsWith('Strike') && roll < 0.9) {
      const dmg = 10;
      return {
        intent: { kind: 'attack', label: `Strike: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    return {
      intent: { kind: 'defend', label: 'Flutter: +5' },
      resolve: (ctx) => gainEnemyPlating(ctx, 5)
    };
  }
};

export const SLAG_WALKER: EnemyDef = {
  id: 'slagWalker',
  name: 'Slag Walker',
  maxHull: 62,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      return {
        intent: { kind: 'defend', label: 'Heating Up: +10' },
        resolve: (ctx) => gainEnemyPlating(ctx, 10)
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Heavy Slam') && roll < 0.35) {
      const dmg = 16;
      return {
        intent: { kind: 'attack', label: `Heavy Slam: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (!last.startsWith('Sweep') && roll < 0.7) {
      const dmg = 5;
      return {
        intent: { kind: 'attack', label: `Sweep: ${dmg}x3`, damage: dmg, hits: 3 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    return {
      intent: { kind: 'defend', label: 'Heating Up: +8' },
      resolve: (ctx) => gainEnemyPlating(ctx, 8)
    };
  }
};

export const IRON_RECLAIMER: EnemyDef = {
  id: 'ironReclaimer',
  name: 'Iron Reclaimer',
  maxHull: 54,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      const dmg = 10;
      return {
        intent: { kind: 'attack', label: `Bash: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Reinforce') && roll < 0.35) {
      return {
        intent: { kind: 'defend', label: 'Reinforce: +12' },
        resolve: (ctx) => gainEnemyPlating(ctx, 12)
      };
    }
    if (!last.startsWith('Stagger') && roll < 0.6) {
      const dmg = 6;
      return {
        intent: { kind: 'debuff', label: `Stagger: ${dmg} + Weak` },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyWeakToPlayer(ctx, 1);
        }
      };
    }
    const dmg = 14;
    return {
      intent: { kind: 'attack', label: `Hammer Down: ${dmg}`, damage: dmg, hits: 1 },
      resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
    };
  }
};

// ===== Act 2 — The Foundry Depths =====

export const CINDER_HOUND: EnemyDef = {
  id: 'cinderHound',
  name: 'Cinder Hound',
  maxHull: 42,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      const dmg = 9;
      return {
        intent: { kind: 'attack', label: `Bite: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Snarl') && roll < 0.15) {
      return {
        intent: { kind: 'debuff', label: 'Snarl' },
        resolve: (ctx) => applyWeakToPlayer(ctx, 2)
      };
    }
    if (!last.startsWith('Frenzy') && roll < 0.55) {
      const dmg = 6;
      return {
        intent: { kind: 'attack', label: `Frenzy: ${dmg}x2`, damage: dmg, hits: 2 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    if (roll < 0.85) {
      const dmg = 9;
      return {
        intent: { kind: 'attack', label: `Bite: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    const dmg = 14;
    return {
      intent: { kind: 'attack', label: `Maul: ${dmg}`, damage: dmg, hits: 1 },
      resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
    };
  }
};

export const SLAG_DRONE: EnemyDef = {
  id: 'slagDrone',
  name: 'Slag Drone',
  maxHull: 50,
  pickAction: ({ turn, rng, memory }): EnemyAction => {
    if (memory.charging) {
      memory.charging = false;
      const dmg = 24;
      return {
        intent: { kind: 'attack', label: `Plasma Lance: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    const roll = rng();
    if (turn > 1 && roll < 0.32) {
      memory.charging = true;
      return {
        intent: { kind: 'buff', label: 'Charging...' },
        resolve: (ctx) => ctx.log('The drone hums, gathering charge.')
      };
    }
    if (roll < 0.7) {
      const dmg = 8;
      return {
        intent: { kind: 'attack', label: `Tracer: ${dmg} + Vuln`, damage: dmg, hits: 1 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyVulnerableToPlayer(ctx, 1);
        }
      };
    }
    const armor = 10;
    return {
      intent: { kind: 'defend', label: `Repair: +${armor}`, plating: armor },
      resolve: (ctx) => gainEnemyPlating(ctx, armor)
    };
  }
};

export const FORGE_REAVER: EnemyDef = {
  id: 'forgeReaver',
  name: 'Forge Reaver',
  maxHull: 58,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      const dmg = 12;
      return {
        intent: { kind: 'attack', label: `Cleaver: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Cleaver') && roll < 0.4) {
      const dmg = 12;
      return {
        intent: { kind: 'attack', label: `Cleaver: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (!last.startsWith('Quick Slash') && roll < 0.7) {
      const dmg = 5;
      return {
        intent: { kind: 'attack', label: `Quick Slash: ${dmg}x2`, damage: dmg, hits: 2 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    if (!last.startsWith('Smash') && roll < 0.9) {
      const dmg = 18;
      return {
        intent: { kind: 'attack', label: `Smash: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    const armor = 10;
    return {
      intent: { kind: 'defend', label: `Brace: +${armor}` },
      resolve: (ctx) => gainEnemyPlating(ctx, armor)
    };
  }
};

// Ember Spitter — Act 2 mook that brings Burn into regular fights. The
// foundry already has Pyroclast Engine as the Burn-themed boss; this is
// the cheap-fight version so Burn pressure is felt every encounter, not
// just at the boss. Also gives the Stoker more Furnace Heart food.
export const EMBER_SPITTER: EnemyDef = {
  id: 'emberSpitter',
  name: 'Ember Spitter',
  maxHull: 44,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      const dmg = 5;
      return {
        intent: { kind: 'debuff', label: `Spit: ${dmg} + Burn 2`, damage: dmg, hits: 1 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyBurnToPlayer(ctx, 2);
        }
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Spit') && roll < 0.35) {
      const dmg = 5;
      return {
        intent: { kind: 'debuff', label: `Spit: ${dmg} + Burn 2`, damage: dmg, hits: 1 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyBurnToPlayer(ctx, 2);
        }
      };
    }
    if (!last.startsWith('Ember Salvo') && roll < 0.65) {
      const dmg = 3;
      return {
        intent: { kind: 'attack', label: `Ember Salvo: ${dmg}x3`, damage: dmg, hits: 3 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    if (!last.startsWith('Magma Spew') && roll < 0.88) {
      const dmg = 11;
      return {
        intent: { kind: 'attack', label: `Magma Spew: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    return {
      intent: { kind: 'defend', label: 'Vent Heat: +7' },
      resolve: (ctx) => gainEnemyPlating(ctx, 7)
    };
  }
};

// Pig Iron Brute — Act 2 mook that snowballs Strength via Anneal. A
// lighter cousin of Salvage Colossus: if the player lets it stand,
// later hits land much harder. Adds a "kill it fast or eat it" rhythm
// to regular Act 2 fights, which Cinder Hound / Slag Drone / Forge
// Reaver don't currently have.
export const PIG_IRON_BRUTE: EnemyDef = {
  id: 'pigIronBrute',
  name: 'Pig Iron Brute',
  maxHull: 62,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      return {
        intent: { kind: 'buff', label: 'Anneal: +1 Strength' },
        resolve: (ctx) => {
          const idx = ctx.state.activeAttackerIndex ?? 0;
          ctx.state.enemies[idx].strength += 1;
          ctx.log('The Brute heat-treats its arm (+1 Strength).');
        }
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Anneal') && roll < 0.22) {
      return {
        intent: { kind: 'buff', label: 'Anneal: +1 Strength' },
        resolve: (ctx) => {
          const idx = ctx.state.activeAttackerIndex ?? 0;
          ctx.state.enemies[idx].strength += 1;
          ctx.log('The Brute anneals heavier plating (+1 Strength).');
        }
      };
    }
    if (!last.startsWith('Iron Punch') && roll < 0.55) {
      const dmg = 9;
      return {
        intent: { kind: 'attack', label: `Iron Punch: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (!last.startsWith('Heavy Slam') && roll < 0.82) {
      const dmg = 13;
      return {
        intent: { kind: 'attack', label: `Heavy Slam: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    return {
      intent: { kind: 'defend', label: 'Brace: +9' },
      resolve: (ctx) => gainEnemyPlating(ctx, 9)
    };
  }
};

export const MAGMA_SENTINEL: EnemyDef = {
  id: 'magmaSentinel',
  name: 'Magma Sentinel',
  maxHull: 80,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      return {
        intent: { kind: 'defend', label: 'Heat Sink: +14' },
        resolve: (ctx) => gainEnemyPlating(ctx, 14)
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Magma Slam') && roll < 0.3) {
      const dmg = 20;
      return {
        intent: { kind: 'attack', label: `Magma Slam: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (!last.startsWith('Ember Spray') && roll < 0.65) {
      const dmg = 6;
      return {
        intent: { kind: 'attack', label: `Ember Spray: ${dmg}x3`, damage: dmg, hits: 3 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    return {
      intent: { kind: 'defend', label: 'Heat Sink: +12' },
      resolve: (ctx) => gainEnemyPlating(ctx, 12)
    };
  }
};

export const RECLAIMER_MK2: EnemyDef = {
  id: 'reclaimerMk2',
  name: 'Reclaimer Mk II',
  maxHull: 75,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      const dmg = 12;
      return {
        intent: { kind: 'attack', label: `Bash: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Reinforce') && roll < 0.35) {
      return {
        intent: { kind: 'defend', label: 'Reinforce: +16' },
        resolve: (ctx) => gainEnemyPlating(ctx, 16)
      };
    }
    if (!last.startsWith('Iron Stagger') && roll < 0.65) {
      const dmg = 8;
      return {
        intent: { kind: 'debuff', label: `Iron Stagger: ${dmg} + Weak 2` },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyWeakToPlayer(ctx, 2);
        }
      };
    }
    const dmg = 17;
    return {
      intent: { kind: 'attack', label: `Hammer Down: ${dmg}`, damage: dmg, hits: 1 },
      resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
    };
  }
};

export const IRON_SOVEREIGN: EnemyDef = {
  id: 'ironSovereign',
  name: 'Iron Sovereign',
  maxHull: 130,
  pickAction: ({ turn, rng, memory, lastIntent }): EnemyAction => {
    if (memory.charging) {
      memory.charging = false;
      const dmg = 28;
      return {
        intent: { kind: 'attack', label: `Cannon Volley: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (turn === 1) {
      const dmg = 14;
      return {
        intent: { kind: 'attack', label: `Plasma Cleave: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    // Telegraphed cannon every few turns
    if (!last.startsWith('Charging') && roll < 0.25) {
      memory.charging = true;
      return {
        intent: { kind: 'buff', label: 'Charging Cannon...' },
        resolve: (ctx) => ctx.log('The Sovereign winds its barrel.')
      };
    }
    if (!last.startsWith('Static Burst') && roll < 0.5) {
      const dmg = 5;
      return {
        intent: { kind: 'attack', label: `Static Burst: ${dmg}x3`, damage: dmg, hits: 3 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    if (!last.startsWith('Heat Sink') && roll < 0.75) {
      return {
        intent: { kind: 'defend', label: 'Heat Sink: +18' },
        resolve: (ctx) => gainEnemyPlating(ctx, 18)
      };
    }
    const dmg = 16;
    return {
      intent: { kind: 'attack', label: `Plasma Cleave: ${dmg}`, damage: dmg, hits: 1 },
      resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
    };
  }
};

// Salvage Colossus — Act 1 alternate boss. Where Foundry Tyrant is steady
// pressure, the Colossus stacks Strength via Bolt-On so each pass hits
// harder. Players need to either burst it down or strip Strength.
export const SALVAGE_COLOSSUS: EnemyDef = {
  id: 'salvageColossus',
  name: 'Salvage Colossus',
  maxHull: 95,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      return {
        intent: { kind: 'buff', label: 'Bolt-On: +2 Strength' },
        resolve: (ctx) => {
          const idx = ctx.state.activeAttackerIndex ?? 0;
          ctx.state.enemies[idx].strength += 2;
          ctx.log('The Colossus bolts on a heavier arm (+2 Strength).');
        }
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Bolt-On') && roll < 0.22) {
      return {
        intent: { kind: 'buff', label: 'Bolt-On: +2 Strength' },
        resolve: (ctx) => {
          const idx = ctx.state.activeAttackerIndex ?? 0;
          ctx.state.enemies[idx].strength += 2;
          ctx.log('More salvage clamps on (+2 Strength).');
        }
      };
    }
    if (!last.startsWith('Crushing Punch') && roll < 0.55) {
      const dmg = 12;
      return {
        intent: { kind: 'attack', label: `Crushing Punch: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (!last.startsWith('Salvage Storm') && roll < 0.85) {
      const dmg = 5;
      return {
        intent: { kind: 'attack', label: `Salvage Storm: ${dmg}x3`, damage: dmg, hits: 3 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    return {
      intent: { kind: 'defend', label: 'Plate Wall: +14' },
      resolve: (ctx) => gainEnemyPlating(ctx, 14)
    };
  }
};

// Reclaimer Prime — Act 1 third boss. Mechanic: high innate Thorns,
// refreshed each Reinforce. Punishes multi-hit / AoE decks because each
// hit retaliates. Foundry Tyrant is steady pressure, Salvage Colossus
// snowballs Strength, this one weaponizes the player's own attacks.
export const RECLAIMER_PRIME: EnemyDef = {
  id: 'reclaimerPrime',
  name: 'Reclaimer Prime',
  maxHull: 100,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      // Opener arms retaliatory spikes. Player turn 1 is now a "do I dare
      // attack into 6 thorns" decision.
      return {
        intent: { kind: 'defend', label: 'Activate Defense: +10 + 6 Thorns' },
        resolve: (ctx) => {
          gainEnemyPlating(ctx, 10);
          const idx = ctx.state.activeAttackerIndex ?? 0;
          ctx.state.enemies[idx].thorns += 6;
          ctx.log('Reclaimer Prime arms retaliatory spikes (+6 Thorns).');
        }
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Reinforce') && roll < 0.25) {
      // Reinforce refreshes thorns, so they don't dwindle from player
      // strip cards (if any existed). Plating tops up too.
      return {
        intent: { kind: 'defend', label: 'Reinforce: +14 + 4 Thorns' },
        resolve: (ctx) => {
          gainEnemyPlating(ctx, 14);
          const idx = ctx.state.activeAttackerIndex ?? 0;
          ctx.state.enemies[idx].thorns = Math.max(ctx.state.enemies[idx].thorns, 6) + 4;
          ctx.log('Reclaimer Prime refreshes its spikes.');
        }
      };
    }
    if (!last.startsWith('Heavy Slam') && roll < 0.55) {
      const dmg = 16;
      return {
        intent: { kind: 'attack', label: `Heavy Slam: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (!last.startsWith('Cleave') && roll < 0.85) {
      const dmg = 5;
      return {
        intent: { kind: 'attack', label: `Cleave: ${dmg}x3`, damage: dmg, hits: 3 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    const dmg = 12;
    return {
      intent: { kind: 'attack', label: `Hammer Down: ${dmg}`, damage: dmg, hits: 1 },
      resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
    };
  }
};

export const FOUNDRY_TYRANT: EnemyDef = {
  id: 'foundryTyrant',
  name: 'Foundry Tyrant',
  maxHull: 90,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    // Telegraphed opener — gives the player a turn to set up
    if (turn === 1) {
      return {
        intent: { kind: 'defend', label: 'Forge Heat: +12' },
        resolve: (ctx) => {
          gainEnemyPlating(ctx, 12);
          applyWeakToPlayer(ctx, 1);
        }
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';

    if (!last.startsWith('Piston Rain') && roll < 0.25) {
      const dmg = 5;
      return {
        intent: { kind: 'attack', label: `Piston Rain: ${dmg}x3`, damage: dmg, hits: 3 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    if (!last.startsWith('Slag Pour') && roll < 0.5) {
      const dmg = 7;
      return {
        intent: { kind: 'debuff', label: `Slag Pour: ${dmg} + Weak` },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyWeakToPlayer(ctx, 2);
        }
      };
    }
    if (!last.startsWith('Forge Heat') && roll < 0.7) {
      return {
        intent: { kind: 'defend', label: 'Forge Heat: +10' },
        resolve: (ctx) => gainEnemyPlating(ctx, 10)
      };
    }
    const dmg = 18;
    return {
      intent: { kind: 'attack', label: `Furnace Slam: ${dmg}`, damage: dmg, hits: 1 },
      resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
    };
  }
};

// Pyroclast Engine — Act 2 alternate boss. Burns dominate this fight:
// the boss stacks Burn on the player so passively bleeding hull becomes
// a real concern, and pairs heavy attacks with end-of-turn ticks.
export const PYROCLAST_ENGINE: EnemyDef = {
  id: 'pyroclastEngine',
  name: 'Pyroclast Engine',
  maxHull: 130,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      return {
        intent: { kind: 'defend', label: 'Ignition: +10 + Burn 3' },
        resolve: (ctx) => {
          gainEnemyPlating(ctx, 10);
          applyBurnToPlayer(ctx, 3);
        }
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Ember Burst') && roll < 0.30) {
      const dmg = 8;
      return {
        intent: { kind: 'debuff', label: `Ember Burst: ${dmg} + Burn 4` },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyBurnToPlayer(ctx, 4);
        }
      };
    }
    if (!last.startsWith('Magma Slam') && roll < 0.55) {
      const dmg = 22;
      return {
        intent: { kind: 'attack', label: `Magma Slam: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (!last.startsWith('Vent Heat') && roll < 0.80) {
      return {
        intent: { kind: 'defend', label: 'Vent Heat: +14 + Burn 3' },
        resolve: (ctx) => {
          gainEnemyPlating(ctx, 14);
          applyBurnToPlayer(ctx, 3);
        }
      };
    }
    const dmg = 6;
    return {
      intent: { kind: 'attack', label: `Cinder Volley: ${dmg}x3`, damage: dmg, hits: 3 },
      resolve: (ctx) => {
        dealDamageToPlayer(ctx, dmg);
        dealDamageToPlayer(ctx, dmg);
        dealDamageToPlayer(ctx, dmg);
      }
    };
  }
};

// Vault Warden — Act 2 third boss. Mechanic: every 3 turns, jams a
// Slag Glob into the player's discard pile, slowly polluting future
// draws. Iron Sovereign is one huge telegraph, Pyroclast Engine is Burn
// pressure; the Warden weaponizes the player's deck against itself.
export const VAULT_WARDEN: EnemyDef = {
  id: 'vaultWarden',
  name: 'Vault Warden',
  maxHull: 130,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      return {
        intent: { kind: 'defend', label: 'Seal Vault: +18 Plating' },
        resolve: (ctx) => gainEnemyPlating(ctx, 18)
      };
    }
    // Every third turn (3, 6, 9, ...) the Warden pollutes the deck.
    // Deterministic so the player can plan around it.
    if (turn % 3 === 0) {
      const dmg = 10;
      return {
        intent: { kind: 'debuff', label: `Pollute: ${dmg} + Slag Glob`, damage: dmg, hits: 1 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          addCardToDiscard(ctx, 'slagGlob');
        }
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Reinforce') && roll < 0.30) {
      return {
        intent: { kind: 'defend', label: 'Reinforce: +14 Plating' },
        resolve: (ctx) => gainEnemyPlating(ctx, 14)
      };
    }
    if (!last.startsWith('Slam') && roll < 0.60) {
      const dmg = 18;
      return {
        intent: { kind: 'attack', label: `Slam: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (!last.startsWith('Vault Volley') && roll < 0.85) {
      const dmg = 5;
      return {
        intent: { kind: 'attack', label: `Vault Volley: ${dmg}x3`, damage: dmg, hits: 3 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    const dmg = 12;
    return {
      intent: { kind: 'debuff', label: `Iron Stagger: ${dmg} + Weak 2`, damage: dmg, hits: 1 },
      resolve: (ctx) => {
        dealDamageToPlayer(ctx, dmg);
        applyWeakToPlayer(ctx, 2);
      }
    };
  }
};

// ===== Act 3 — Above the Cloudline =====

export const STRATUS_DRONE: EnemyDef = {
  id: 'stratusDrone',
  name: 'Stratus Drone',
  maxHull: 45,
  pickAction: ({ turn, rng, memory }): EnemyAction => {
    if (memory.charging) {
      memory.charging = false;
      const dmg = 22;
      return {
        intent: { kind: 'attack', label: `Plasma Lance: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    const roll = rng();
    if (turn > 1 && roll < 0.3) {
      memory.charging = true;
      return {
        intent: { kind: 'buff', label: 'Charging...' },
        resolve: (ctx) => ctx.log('The drone howls, gathering charge.')
      };
    }
    if (roll < 0.6) {
      const dmg = 6;
      return {
        intent: { kind: 'attack', label: `Tracer: ${dmg} + Vuln`, damage: dmg, hits: 1 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyVulnerableToPlayer(ctx, 1);
        }
      };
    }
    if (roll < 0.9) {
      const dmg = 4;
      return {
        intent: { kind: 'attack', label: `Strafe: ${dmg}x3`, damage: dmg, hits: 3 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    return {
      intent: { kind: 'defend', label: 'Repair: +10' },
      resolve: (ctx) => gainEnemyPlating(ctx, 10)
    };
  }
};

export const SKY_PIRATE: EnemyDef = {
  id: 'skyPirate',
  name: 'Sky Pirate',
  maxHull: 52,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      const dmg = 14;
      return {
        intent: { kind: 'attack', label: `Cutlass: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Smoke Bomb') && roll < 0.2) {
      return {
        intent: { kind: 'debuff', label: 'Smoke Bomb: +12 + Vuln' },
        resolve: (ctx) => {
          gainEnemyPlating(ctx, 12);
          applyVulnerableToPlayer(ctx, 1);
        }
      };
    }
    if (!last.startsWith('Boarding') && roll < 0.55) {
      const dmg = 5;
      return {
        intent: { kind: 'debuff', label: `Boarding: ${dmg}x2 + Weak`, damage: dmg, hits: 2 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
          applyWeakToPlayer(ctx, 1);
        }
      };
    }
    if (!last.startsWith('Pistol') && roll < 0.85) {
      const dmg = 10;
      return {
        intent: { kind: 'attack', label: `Pistol Shot: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    const dmg = 14;
    return {
      intent: { kind: 'attack', label: `Cutlass: ${dmg}`, damage: dmg, hits: 1 },
      resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
    };
  }
};

export const LIGHTNING_SPRITE: EnemyDef = {
  id: 'lightningSprite',
  name: 'Lightning Sprite',
  maxHull: 38,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      const dmg = 7;
      return {
        intent: { kind: 'debuff', label: `Spark: ${dmg} + Vuln 2` },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyVulnerableToPlayer(ctx, 2);
        }
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Spark') && roll < 0.3) {
      const dmg = 7;
      return {
        intent: { kind: 'debuff', label: `Spark: ${dmg} + Vuln 2` },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyVulnerableToPlayer(ctx, 2);
        }
      };
    }
    if (!last.startsWith('Ignite') && roll < 0.5) {
      const dmg = 5;
      return {
        intent: { kind: 'debuff', label: `Ignite: ${dmg} + Burn 2`, damage: dmg, hits: 1 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyBurnToPlayer(ctx, 2);
        }
      };
    }
    if (!last.startsWith('Surge') && roll < 0.7) {
      const dmg = 5;
      return {
        intent: { kind: 'attack', label: `Surge: ${dmg}x3`, damage: dmg, hits: 3 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    if (!last.startsWith('Strike') && roll < 0.9) {
      const dmg = 12;
      return {
        intent: { kind: 'attack', label: `Strike: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    return {
      intent: { kind: 'defend', label: 'Recharge: +8' },
      resolve: (ctx) => gainEnemyPlating(ctx, 8)
    };
  }
};

// Mist Specter — Act 3 mook with innate Thorns + a small self-heal on
// Drain. Punishes button-mashing and creates a "do I keep poking this
// 40-HP ghost or burst it down" decision. Reclaimer Prime brings thorns
// to a boss; this is the regular-fight counterpart so the mechanic
// shows up more than once a run.
export const MIST_SPECTER: EnemyDef = {
  id: 'mistSpecter',
  name: 'Mist Specter',
  maxHull: 42,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      return {
        intent: { kind: 'defend', label: 'Shroud: +6 + 4 Thorns' },
        resolve: (ctx) => {
          gainEnemyPlating(ctx, 6);
          const idx = ctx.state.activeAttackerIndex ?? 0;
          ctx.state.enemies[idx].thorns += 4;
          ctx.log('The Specter wraps itself in mist (+4 Thorns).');
        }
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Vanish') && roll < 0.22) {
      // Refresh thorns so they don't dwindle from player attacks. Caps
      // at 4 so it never stacks into an unkillable wall.
      return {
        intent: { kind: 'buff', label: 'Vanish: refresh Thorns' },
        resolve: (ctx) => {
          const idx = ctx.state.activeAttackerIndex ?? 0;
          ctx.state.enemies[idx].thorns = Math.max(ctx.state.enemies[idx].thorns, 4);
          ctx.log('The Specter dissolves and reforms its spikes.');
        }
      };
    }
    if (!last.startsWith('Drain') && roll < 0.5) {
      const dmg = 5;
      return {
        intent: { kind: 'debuff', label: `Drain: ${dmg} → heal 4`, damage: dmg, hits: 1 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          const idx = ctx.state.activeAttackerIndex ?? 0;
          const me = ctx.state.enemies[idx];
          const healed = Math.min(4, me.maxHull - me.hull);
          if (healed > 0) {
            me.hull += healed;
            ctx.log(`The Specter siphons ${healed} hull.`);
          }
        }
      };
    }
    if (!last.startsWith('Wisp Strike') && roll < 0.8) {
      const dmg = 9;
      return {
        intent: { kind: 'attack', label: `Wisp Strike: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    return {
      intent: { kind: 'debuff', label: 'Phase: +6 + Vuln' },
      resolve: (ctx) => {
        gainEnemyPlating(ctx, 6);
        applyVulnerableToPlayer(ctx, 1);
      }
    };
  }
};

// Cloud Corsair — Act 3 mook that injects a Shrapnel curse every 3rd
// turn. The mook-tier echo of Vault Warden's Slag Glob pollute, but
// the curse is cheaper (0-cost unplayable Shrapnel) so it's annoying
// rather than fight-defining. Adds deck-pollution texture to regular
// sky fights, which currently only have Sky Pirate's Weak-via-board.
export const CLOUD_CORSAIR: EnemyDef = {
  id: 'cloudCorsair',
  name: 'Cloud Corsair',
  maxHull: 50,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      const dmg = 6;
      return {
        intent: { kind: 'debuff', label: `Boarding Hook: ${dmg} + Weak`, damage: dmg, hits: 1 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyWeakToPlayer(ctx, 1);
        }
      };
    }
    // Deterministic shrapnel injection every 3rd turn (3, 6, 9, ...).
    if (turn % 3 === 0) {
      const dmg = 6;
      return {
        intent: { kind: 'debuff', label: `Plunder: ${dmg} + Shrapnel`, damage: dmg, hits: 1 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          addCardToDiscard(ctx, 'shrapnel');
        }
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Smoke Bomb') && roll < 0.22) {
      return {
        intent: { kind: 'debuff', label: 'Smoke Bomb: +8 + Vuln' },
        resolve: (ctx) => {
          gainEnemyPlating(ctx, 8);
          applyVulnerableToPlayer(ctx, 1);
        }
      };
    }
    if (!last.startsWith('Pistol') && roll < 0.55) {
      const dmg = 9;
      return {
        intent: { kind: 'attack', label: `Pistol Shot: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (!last.startsWith('Cutlass') && roll < 0.85) {
      const dmg = 12;
      return {
        intent: { kind: 'attack', label: `Cutlass: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    const dmg = 4;
    return {
      intent: { kind: 'attack', label: `Boarding: ${dmg}x2`, damage: dmg, hits: 2 },
      resolve: (ctx) => {
        dealDamageToPlayer(ctx, dmg);
        dealDamageToPlayer(ctx, dmg);
      }
    };
  }
};

export const CLOUD_REAVER: EnemyDef = {
  id: 'cloudReaver',
  name: 'Cloud Reaver',
  maxHull: 78,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      return {
        intent: { kind: 'defend', label: 'Heat Up: +14 + Weak' },
        resolve: (ctx) => {
          gainEnemyPlating(ctx, 14);
          applyWeakToPlayer(ctx, 1);
        }
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Air Slam') && roll < 0.3) {
      const dmg = 22;
      return {
        intent: { kind: 'attack', label: `Air Slam: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (!last.startsWith('Tempest') && roll < 0.7) {
      const dmg = 6;
      return {
        intent: { kind: 'attack', label: `Tempest: ${dmg}x3`, damage: dmg, hits: 3 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    return {
      intent: { kind: 'defend', label: 'Brace: +14' },
      resolve: (ctx) => gainEnemyPlating(ctx, 14)
    };
  }
};

export const SKY_MARSHAL: EnemyDef = {
  id: 'skyMarshal',
  name: 'Sky Marshal',
  maxHull: 85,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      const dmg = 14;
      return {
        intent: { kind: 'debuff', label: `Riposte: ${dmg} + Weak` },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyWeakToPlayer(ctx, 1);
        }
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Iron Stance') && roll < 0.3) {
      return {
        intent: { kind: 'defend', label: 'Iron Stance: +18' },
        resolve: (ctx) => gainEnemyPlating(ctx, 18)
      };
    }
    if (!last.startsWith('Stagger Volley') && roll < 0.6) {
      const dmg = 9;
      return {
        intent: { kind: 'debuff', label: `Stagger Volley: ${dmg} + Vuln 2` },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyVulnerableToPlayer(ctx, 2);
        }
      };
    }
    const dmg = 20;
    return {
      intent: { kind: 'attack', label: `Hammer Down: ${dmg}`, damage: dmg, hits: 1 },
      resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
    };
  }
};

export const STORMHEART: EnemyDef = {
  id: 'stormheart',
  name: 'Stormheart',
  maxHull: 160,
  pickAction: ({ turn, rng, memory, lastIntent }): EnemyAction => {
    if (memory.charging) {
      memory.charging = false;
      const dmg = 32;
      return {
        intent: { kind: 'attack', label: `Lightning Strike: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (turn === 1) {
      return {
        intent: { kind: 'defend', label: 'Storm Cycle: +18 + Weak 2' },
        resolve: (ctx) => {
          gainEnemyPlating(ctx, 18);
          applyWeakToPlayer(ctx, 2);
        }
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Charging') && roll < 0.25) {
      memory.charging = true;
      return {
        intent: { kind: 'buff', label: 'Charging Lightning...' },
        resolve: (ctx) => ctx.log('Stormheart pulls cloud and current.')
      };
    }
    if (!last.startsWith('Static Pulse') && roll < 0.5) {
      const dmg = 6;
      return {
        intent: { kind: 'attack', label: `Static Pulse: ${dmg}x3`, damage: dmg, hits: 3 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    if (!last.startsWith('Iron Sphere') && roll < 0.7) {
      return {
        intent: { kind: 'defend', label: 'Iron Sphere: +22' },
        resolve: (ctx) => gainEnemyPlating(ctx, 22)
      };
    }
    if (!last.startsWith('Crackle') && roll < 0.9) {
      const dmg = 10;
      return {
        intent: { kind: 'debuff', label: `Crackle: ${dmg} + Vuln 2` },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyVulnerableToPlayer(ctx, 2);
        }
      };
    }
    const dmg = 18;
    return {
      intent: { kind: 'attack', label: `Heavy Slam: ${dmg}`, damage: dmg, hits: 1 },
      resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
    };
  }
};

// The Wraith — Act 3 alternate boss. Heavy debuffs and a self-heal.
// Stormheart is about huge telegraphed swings; the Wraith is about
// grinding the player down via Vuln/Weak stacking and Drain healing.
export const THE_WRAITH: EnemyDef = {
  id: 'theWraith',
  name: 'The Wraith',
  maxHull: 150,
  pickAction: ({ turn, rng, memory, lastIntent }): EnemyAction => {
    if (memory.phasing) {
      memory.phasing = false;
      const dmg = 30;
      return {
        intent: { kind: 'attack', label: `Spectral Strike: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (turn === 1) {
      return {
        intent: { kind: 'defend', label: 'Shroud: +20 + Weak 2 + Vuln 2' },
        resolve: (ctx) => {
          gainEnemyPlating(ctx, 20);
          applyWeakToPlayer(ctx, 2);
          applyVulnerableToPlayer(ctx, 2);
        }
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Phasing') && roll < 0.20) {
      memory.phasing = true;
      return {
        intent: { kind: 'buff', label: 'Phasing...' },
        resolve: (ctx) => ctx.log('The Wraith vanishes between realms.')
      };
    }
    if (!last.startsWith('Chain Lightning') && roll < 0.45) {
      const dmg = 4;
      return {
        intent: { kind: 'attack', label: `Chain Lightning: ${dmg}x4`, damage: dmg, hits: 4 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    if (!last.startsWith('Drain') && roll < 0.70) {
      const dmg = 8;
      return {
        intent: { kind: 'debuff', label: `Drain: ${dmg} → heal 12` },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          const idx = ctx.state.activeAttackerIndex ?? 0;
          const me = ctx.state.enemies[idx];
          const healed = Math.min(12, me.maxHull - me.hull);
          if (healed > 0) {
            me.hull += healed;
            ctx.log(`The Wraith siphons ${healed} hull from your machine.`);
          }
        }
      };
    }
    if (!last.startsWith('Shroud') && roll < 0.90) {
      return {
        intent: { kind: 'defend', label: 'Shroud: +18 + Weak 2 + Vuln 2' },
        resolve: (ctx) => {
          gainEnemyPlating(ctx, 18);
          applyWeakToPlayer(ctx, 2);
          applyVulnerableToPlayer(ctx, 2);
        }
      };
    }
    const dmg = 16;
    return {
      intent: { kind: 'attack', label: `Spectral Slash: ${dmg}`, damage: dmg, hits: 1 },
      resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
    };
  }
};

// Cyclone King — Act 3 third boss. Mechanic: alternates between Tempest
// stance (heavy offense, no defense) and Iron stance (huge plating +
// debuffs). Stance flips each turn, so the player can predict the
// rhythm but has to plan two-turn windows: burst in Tempest, scrub
// debuffs in Iron. Stormheart is one big telegraphed cannon, the
// Wraith grinds with debuffs/heal; the King is a clock you read.
export const CYCLONE_KING: EnemyDef = {
  id: 'cycloneKing',
  name: 'Cyclone King',
  maxHull: 145,
  pickAction: ({ turn, rng, memory }): EnemyAction => {
    // Initialize stance on turn 1 — open in Tempest so first hit is
    // immediate and readable, then Iron next turn.
    if (turn === 1) {
      memory.stance = 'tempest';
      const dmg = 16;
      return {
        intent: { kind: 'attack', label: `Tempest Strike: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    // Flip stance each turn — predictable rhythm.
    memory.stance = memory.stance === 'tempest' ? 'iron' : 'tempest';
    const roll = rng();
    if (memory.stance === 'tempest') {
      // Tempest stance: offense-only, no plating gained.
      if (roll < 0.45) {
        const dmg = 6;
        return {
          intent: { kind: 'attack', label: `Cyclone Sweep: ${dmg}x4`, damage: dmg, hits: 4 },
          resolve: (ctx) => {
            for (let i = 0; i < 4; i++) dealDamageToPlayer(ctx, dmg);
          }
        };
      }
      if (roll < 0.8) {
        const dmg = 24;
        return {
          intent: { kind: 'attack', label: `Tempest Strike: ${dmg}`, damage: dmg, hits: 1 },
          resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
        };
      }
      const dmg = 10;
      return {
        intent: { kind: 'debuff', label: `Gale: ${dmg} + Vuln 2`, damage: dmg, hits: 1 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyVulnerableToPlayer(ctx, 2);
        }
      };
    }
    // Iron stance: defense + debuffs, no big damage.
    if (roll < 0.5) {
      return {
        intent: { kind: 'defend', label: 'Iron Bulwark: +22 + Weak 2' },
        resolve: (ctx) => {
          gainEnemyPlating(ctx, 22);
          applyWeakToPlayer(ctx, 2);
        }
      };
    }
    if (roll < 0.85) {
      return {
        intent: { kind: 'defend', label: 'Iron Bulwark: +18 + Vuln 2' },
        resolve: (ctx) => {
          gainEnemyPlating(ctx, 18);
          applyVulnerableToPlayer(ctx, 2);
        }
      };
    }
    return {
      intent: { kind: 'defend', label: 'Iron Wall: +26' },
      resolve: (ctx) => gainEnemyPlating(ctx, 26)
    };
  }
};

export const ACT1_POOL: EnemyDef[] = [
  SCRAP_RAIDER, JUNK_HOUND, SENTINEL_DRONE,
  RUST_SPRAYER, PYLON_CRAWLER, TINKER_HAWK
];
export const ACT1_ELITE_POOL: EnemyDef[] = [SLAG_WALKER, IRON_RECLAIMER];

export const ACT2_POOL: EnemyDef[] = [
  CINDER_HOUND, SLAG_DRONE, FORGE_REAVER,
  EMBER_SPITTER, PIG_IRON_BRUTE
];
export const ACT2_ELITE_POOL: EnemyDef[] = [MAGMA_SENTINEL, RECLAIMER_MK2];

export const ACT3_POOL: EnemyDef[] = [
  STRATUS_DRONE, SKY_PIRATE, LIGHTNING_SPRITE,
  MIST_SPECTER, CLOUD_CORSAIR
];
export const ACT3_ELITE_POOL: EnemyDef[] = [CLOUD_REAVER, SKY_MARSHAL];

// Boss pools — each act picks one random boss at boss-node entry. The
// selection is persisted via run.pendingEnemyIds so refresh resumes the
// same boss, but a new run rolls a fresh choice.
export const ACT1_BOSS_POOL: EnemyDef[] = [FOUNDRY_TYRANT, SALVAGE_COLOSSUS, RECLAIMER_PRIME];
export const ACT2_BOSS_POOL: EnemyDef[] = [IRON_SOVEREIGN, PYROCLAST_ENGINE, VAULT_WARDEN];
export const ACT3_BOSS_POOL: EnemyDef[] = [STORMHEART, THE_WRAITH, CYCLONE_KING];

function regularPoolFor(act: number): EnemyDef[] {
  if (act >= 3) return ACT3_POOL;
  if (act === 2) return ACT2_POOL;
  return ACT1_POOL;
}

function elitePoolFor(act: number): EnemyDef[] {
  if (act >= 3) return ACT3_ELITE_POOL;
  if (act === 2) return ACT2_ELITE_POOL;
  return ACT1_ELITE_POOL;
}

export function pickRegularEnemy(act: number, rng: () => number): EnemyDef {
  const pool = regularPoolFor(act);
  return pool[Math.floor(rng() * pool.length)];
}

export function pickEliteEnemy(act: number, rng: () => number): EnemyDef {
  const pool = elitePoolFor(act);
  return pool[Math.floor(rng() * pool.length)];
}

function bossPoolFor(act: number): EnemyDef[] {
  if (act >= 3) return ACT3_BOSS_POOL;
  if (act === 2) return ACT2_BOSS_POOL;
  return ACT1_BOSS_POOL;
}

export function getActBoss(act: number, rng: () => number = Math.random): EnemyDef {
  const pool = bossPoolFor(act);
  return pool[Math.floor(rng() * pool.length)];
}

// ===== Encounter pickers — return arrays so future fights can be 1-N enemies. =====

// Multi-enemy encounters are sprinkled in by these helpers. The 1-enemy
// case stays the common path; groups appear roughly 1 in 4 regular fights.

const REGULAR_GROUP_CHANCE = 0.4;
const ELITE_GROUP_CHANCE = 0.35;

function regularGroupFor(act: number, rng: () => number): EnemyDef[] | null {
  if (rng() >= REGULAR_GROUP_CHANCE) return null;
  if (act === 1) {
    // Pack of two scrap mooks
    return rng() < 0.5
      ? [JUNK_HOUND, JUNK_HOUND]
      : [SCRAP_RAIDER, RUST_SPRAYER];
  }
  if (act === 2) {
    return rng() < 0.5
      ? [CINDER_HOUND, CINDER_HOUND]
      : [SLAG_DRONE, FORGE_REAVER];
  }
  // Act 3+
  return rng() < 0.5
    ? [LIGHTNING_SPRITE, LIGHTNING_SPRITE]
    : [SKY_PIRATE, LIGHTNING_SPRITE];
}

function eliteGroupFor(act: number, rng: () => number): EnemyDef[] | null {
  if (rng() >= ELITE_GROUP_CHANCE) return null;
  if (act === 1) return [IRON_RECLAIMER, SCRAP_RAIDER];
  if (act === 2) return [RECLAIMER_MK2, CINDER_HOUND];
  return [SKY_MARSHAL, LIGHTNING_SPRITE];
}

export function pickRegularEncounter(act: number, rng: () => number = Math.random): EnemyDef[] {
  const group = regularGroupFor(act, rng);
  if (group) return group;
  return [pickRegularEnemy(act, rng)];
}

export function pickEliteEncounter(act: number, rng: () => number = Math.random): EnemyDef[] {
  const group = eliteGroupFor(act, rng);
  if (group) return group;
  return [pickEliteEnemy(act, rng)];
}

export function getBossEncounter(act: number, rng: () => number = Math.random): EnemyDef[] {
  // Bosses stay solo — the fight is their pattern, adding minions would
  // break their balance. Easy to revisit later (e.g. boss-with-adds).
  return [getActBoss(act, rng)];
}

export function getActName(act: number): string {
  if (act >= 3) return 'ABOVE THE CLOUDLINE';
  if (act === 2) return 'THE FOUNDRY DEPTHS';
  return 'ROAD TO THE FOUNDRY';
}

export function isFinalAct(act: number): boolean {
  return act >= 3;
}

export const ENEMY_DEFS: Record<string, EnemyDef> = {
  [SCRAP_RAIDER.id]: SCRAP_RAIDER,
  [JUNK_HOUND.id]: JUNK_HOUND,
  [SENTINEL_DRONE.id]: SENTINEL_DRONE,
  [RUST_SPRAYER.id]: RUST_SPRAYER,
  [PYLON_CRAWLER.id]: PYLON_CRAWLER,
  [TINKER_HAWK.id]: TINKER_HAWK,
  [SLAG_WALKER.id]: SLAG_WALKER,
  [IRON_RECLAIMER.id]: IRON_RECLAIMER,
  [FOUNDRY_TYRANT.id]: FOUNDRY_TYRANT,
  [CINDER_HOUND.id]: CINDER_HOUND,
  [SLAG_DRONE.id]: SLAG_DRONE,
  [FORGE_REAVER.id]: FORGE_REAVER,
  [MAGMA_SENTINEL.id]: MAGMA_SENTINEL,
  [RECLAIMER_MK2.id]: RECLAIMER_MK2,
  [IRON_SOVEREIGN.id]: IRON_SOVEREIGN,
  [STRATUS_DRONE.id]: STRATUS_DRONE,
  [SKY_PIRATE.id]: SKY_PIRATE,
  [LIGHTNING_SPRITE.id]: LIGHTNING_SPRITE,
  [CLOUD_REAVER.id]: CLOUD_REAVER,
  [SKY_MARSHAL.id]: SKY_MARSHAL,
  [STORMHEART.id]: STORMHEART,
  [SALVAGE_COLOSSUS.id]: SALVAGE_COLOSSUS,
  [PYROCLAST_ENGINE.id]: PYROCLAST_ENGINE,
  [THE_WRAITH.id]: THE_WRAITH,
  [RECLAIMER_PRIME.id]: RECLAIMER_PRIME,
  [VAULT_WARDEN.id]: VAULT_WARDEN,
  [CYCLONE_KING.id]: CYCLONE_KING,
  [EMBER_SPITTER.id]: EMBER_SPITTER,
  [PIG_IRON_BRUTE.id]: PIG_IRON_BRUTE,
  [MIST_SPECTER.id]: MIST_SPECTER,
  [CLOUD_CORSAIR.id]: CLOUD_CORSAIR
};
