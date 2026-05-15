import type { EnemyDef, EnemyAction, ResolveCtx } from './types';
import {
  dealDamageToPlayer,
  gainEnemyPlating,
  applyVulnerableToPlayer,
  applyWeakToPlayer,
  applyBurnToPlayer
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
    if (!last.startsWith('Corrode') && roll < 0.85) {
      return {
        intent: { kind: 'debuff', label: 'Corrode: Weak + Vuln' },
        resolve: (ctx) => {
          applyWeakToPlayer(ctx, 2);
          applyVulnerableToPlayer(ctx, 1);
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

export const ACT1_POOL: EnemyDef[] = [
  SCRAP_RAIDER, JUNK_HOUND, SENTINEL_DRONE,
  RUST_SPRAYER, PYLON_CRAWLER, TINKER_HAWK
];
export const ACT1_ELITE_POOL: EnemyDef[] = [SLAG_WALKER, IRON_RECLAIMER];

export const ACT2_POOL: EnemyDef[] = [CINDER_HOUND, SLAG_DRONE, FORGE_REAVER];
export const ACT2_ELITE_POOL: EnemyDef[] = [MAGMA_SENTINEL, RECLAIMER_MK2];

export const ACT3_POOL: EnemyDef[] = [STRATUS_DRONE, SKY_PIRATE, LIGHTNING_SPRITE];
export const ACT3_ELITE_POOL: EnemyDef[] = [CLOUD_REAVER, SKY_MARSHAL];

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

export function getActBoss(act: number): EnemyDef {
  if (act >= 3) return STORMHEART;
  if (act === 2) return IRON_SOVEREIGN;
  return FOUNDRY_TYRANT;
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

export function getBossEncounter(act: number): EnemyDef[] {
  // Bosses stay solo — the fight is their pattern, adding minions would
  // break their balance. Easy to revisit later (e.g. boss-with-adds).
  return [getActBoss(act)];
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
  [STORMHEART.id]: STORMHEART
};
