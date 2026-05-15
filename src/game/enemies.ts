import type { EnemyDef, EnemyAction, ResolveCtx } from './types';
import {
  dealDamageToPlayer,
  gainEnemyPlating,
  applyVulnerableToPlayer,
  applyWeakToPlayer
} from './combat';

export const SCRAP_RAIDER: EnemyDef = {
  id: 'scrapRaider',
  name: 'Scrap Raider',
  maxHull: 38,
  pickAction: ({ turn, rng }): EnemyAction => {
    const roll = rng();
    if (turn === 1 || roll < 0.55) {
      const dmg = 7;
      return {
        intent: { kind: 'attack', label: `Cleaver: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx: ResolveCtx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (roll < 0.85) {
      const dmg = 3;
      return {
        intent: { kind: 'attack', label: `Quick Slash: ${dmg}x2`, damage: dmg, hits: 2 },
        resolve: (ctx: ResolveCtx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    const armor = 6;
    return {
      intent: { kind: 'defend', label: `Scrap Wall: +${armor}`, plating: armor },
      resolve: (ctx: ResolveCtx) => gainEnemyPlating(ctx, armor)
    };
  }
};

export const JUNK_HOUND: EnemyDef = {
  id: 'junkHound',
  name: 'Junk Hound',
  maxHull: 22,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    const roll = rng();
    // Always open with a bite so first turn is readable
    if (turn === 1) {
      const dmg = 5;
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
      const dmg = 4;
      return {
        intent: { kind: 'attack', label: `Frenzy: ${dmg}x2`, damage: dmg, hits: 2 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    if (roll < 0.85) {
      const dmg = 5;
      return {
        intent: { kind: 'attack', label: `Bite: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    const dmg = 8;
    return {
      intent: { kind: 'attack', label: `Rabid Lunge: ${dmg}`, damage: dmg, hits: 1 },
      resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
    };
  }
};

export const SENTINEL_DRONE: EnemyDef = {
  id: 'sentinelDrone',
  name: 'Sentinel Drone',
  maxHull: 32,
  pickAction: ({ turn, rng, memory }): EnemyAction => {
    // Telegraph cleared → fire the lance
    if (memory.charging) {
      memory.charging = false;
      const dmg = 14;
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
      const dmg = 4;
      return {
        intent: { kind: 'attack', label: `Tracer: ${dmg} + Vuln`, damage: dmg, hits: 1 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyVulnerableToPlayer(ctx, 1);
        }
      };
    }
    const armor = 5;
    return {
      intent: { kind: 'defend', label: `Repair: +${armor}`, plating: armor },
      resolve: (ctx) => gainEnemyPlating(ctx, armor)
    };
  }
};

export const RUST_SPRAYER: EnemyDef = {
  id: 'rustSprayer',
  name: 'Rust Sprayer',
  maxHull: 28,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      const dmg = 4;
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
      const dmg = 4;
      return {
        intent: { kind: 'debuff', label: `Spray: ${dmg} + Vuln` },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyVulnerableToPlayer(ctx, 2);
        }
      };
    }
    if (!last.startsWith('Acid Burst') && roll < 0.6) {
      const dmg = 3;
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
      intent: { kind: 'defend', label: 'Plating Mist: +4' },
      resolve: (ctx) => gainEnemyPlating(ctx, 4)
    };
  }
};

export const PYLON_CRAWLER: EnemyDef = {
  id: 'pylonCrawler',
  name: 'Pylon Crawler',
  maxHull: 30,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      return {
        intent: { kind: 'defend', label: 'Anchor: +8' },
        resolve: (ctx) => gainEnemyPlating(ctx, 8)
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Anchor') && roll < 0.25) {
      return {
        intent: { kind: 'defend', label: 'Anchor: +8' },
        resolve: (ctx) => gainEnemyPlating(ctx, 8)
      };
    }
    if (!last.startsWith('Pylon Slam') && roll < 0.6) {
      const dmg = 9;
      return {
        intent: { kind: 'attack', label: `Pylon Slam: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (!last.startsWith('Reinforce') && roll < 0.85) {
      return {
        intent: { kind: 'defend', label: 'Reinforce: +12 + Weak' },
        resolve: (ctx) => {
          gainEnemyPlating(ctx, 12);
          applyWeakToPlayer(ctx, 1);
        }
      };
    }
    const dmg = 7;
    return {
      intent: { kind: 'attack', label: `Bash: ${dmg}`, damage: dmg, hits: 1 },
      resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
    };
  }
};

export const TINKER_HAWK: EnemyDef = {
  id: 'tinkerHawk',
  name: 'Tinker Hawk',
  maxHull: 24,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      const dmg = 3;
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
      const dmg = 2;
      return {
        intent: { kind: 'debuff', label: `Talons: ${dmg}x4 + Vuln`, damage: dmg, hits: 4 },
        resolve: (ctx) => {
          for (let i = 0; i < 4; i++) dealDamageToPlayer(ctx, dmg);
          applyVulnerableToPlayer(ctx, 1);
        }
      };
    }
    if (!last.startsWith('Dive') && roll < 0.65) {
      const dmg = 3;
      return {
        intent: { kind: 'attack', label: `Dive: ${dmg}x2`, damage: dmg, hits: 2 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    if (!last.startsWith('Strike') && roll < 0.9) {
      const dmg = 8;
      return {
        intent: { kind: 'attack', label: `Strike: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    return {
      intent: { kind: 'defend', label: 'Flutter: +4' },
      resolve: (ctx) => gainEnemyPlating(ctx, 4)
    };
  }
};

export const SLAG_WALKER: EnemyDef = {
  id: 'slagWalker',
  name: 'Slag Walker',
  maxHull: 52,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      return {
        intent: { kind: 'defend', label: 'Heating Up: +8' },
        resolve: (ctx) => gainEnemyPlating(ctx, 8)
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Heavy Slam') && roll < 0.35) {
      const dmg = 12;
      return {
        intent: { kind: 'attack', label: `Heavy Slam: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (!last.startsWith('Sweep') && roll < 0.7) {
      const dmg = 4;
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
      intent: { kind: 'defend', label: 'Heating Up: +6' },
      resolve: (ctx) => gainEnemyPlating(ctx, 6)
    };
  }
};

export const IRON_RECLAIMER: EnemyDef = {
  id: 'ironReclaimer',
  name: 'Iron Reclaimer',
  maxHull: 45,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      const dmg = 8;
      return {
        intent: { kind: 'attack', label: `Bash: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Reinforce') && roll < 0.35) {
      return {
        intent: { kind: 'defend', label: 'Reinforce: +10' },
        resolve: (ctx) => gainEnemyPlating(ctx, 10)
      };
    }
    if (!last.startsWith('Stagger') && roll < 0.6) {
      const dmg = 5;
      return {
        intent: { kind: 'debuff', label: `Stagger: ${dmg} + Weak` },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyWeakToPlayer(ctx, 1);
        }
      };
    }
    const dmg = 11;
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
  maxHull: 32,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      const dmg = 7;
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
    const dmg = 10;
    return {
      intent: { kind: 'attack', label: `Maul: ${dmg}`, damage: dmg, hits: 1 },
      resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
    };
  }
};

export const SLAG_DRONE: EnemyDef = {
  id: 'slagDrone',
  name: 'Slag Drone',
  maxHull: 40,
  pickAction: ({ turn, rng, memory }): EnemyAction => {
    if (memory.charging) {
      memory.charging = false;
      const dmg = 18;
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
      const dmg = 6;
      return {
        intent: { kind: 'attack', label: `Tracer: ${dmg} + Vuln`, damage: dmg, hits: 1 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyVulnerableToPlayer(ctx, 1);
        }
      };
    }
    const armor = 8;
    return {
      intent: { kind: 'defend', label: `Repair: +${armor}`, plating: armor },
      resolve: (ctx) => gainEnemyPlating(ctx, armor)
    };
  }
};

export const FORGE_REAVER: EnemyDef = {
  id: 'forgeReaver',
  name: 'Forge Reaver',
  maxHull: 45,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      const dmg = 9;
      return {
        intent: { kind: 'attack', label: `Cleaver: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Cleaver') && roll < 0.4) {
      const dmg = 9;
      return {
        intent: { kind: 'attack', label: `Cleaver: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (!last.startsWith('Quick Slash') && roll < 0.7) {
      const dmg = 4;
      return {
        intent: { kind: 'attack', label: `Quick Slash: ${dmg}x2`, damage: dmg, hits: 2 },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          dealDamageToPlayer(ctx, dmg);
        }
      };
    }
    if (!last.startsWith('Smash') && roll < 0.9) {
      const dmg = 14;
      return {
        intent: { kind: 'attack', label: `Smash: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    const armor = 8;
    return {
      intent: { kind: 'defend', label: `Brace: +${armor}` },
      resolve: (ctx) => gainEnemyPlating(ctx, armor)
    };
  }
};

export const MAGMA_SENTINEL: EnemyDef = {
  id: 'magmaSentinel',
  name: 'Magma Sentinel',
  maxHull: 65,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      return {
        intent: { kind: 'defend', label: 'Heat Sink: +12' },
        resolve: (ctx) => gainEnemyPlating(ctx, 12)
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Magma Slam') && roll < 0.3) {
      const dmg = 15;
      return {
        intent: { kind: 'attack', label: `Magma Slam: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (!last.startsWith('Ember Spray') && roll < 0.65) {
      const dmg = 5;
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
      intent: { kind: 'defend', label: 'Heat Sink: +10' },
      resolve: (ctx) => gainEnemyPlating(ctx, 10)
    };
  }
};

export const RECLAIMER_MK2: EnemyDef = {
  id: 'reclaimerMk2',
  name: 'Reclaimer Mk II',
  maxHull: 60,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    if (turn === 1) {
      const dmg = 9;
      return {
        intent: { kind: 'attack', label: `Bash: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';
    if (!last.startsWith('Reinforce') && roll < 0.35) {
      return {
        intent: { kind: 'defend', label: 'Reinforce: +14' },
        resolve: (ctx) => gainEnemyPlating(ctx, 14)
      };
    }
    if (!last.startsWith('Iron Stagger') && roll < 0.65) {
      const dmg = 6;
      return {
        intent: { kind: 'debuff', label: `Iron Stagger: ${dmg} + Weak 2` },
        resolve: (ctx) => {
          dealDamageToPlayer(ctx, dmg);
          applyWeakToPlayer(ctx, 2);
        }
      };
    }
    const dmg = 13;
    return {
      intent: { kind: 'attack', label: `Hammer Down: ${dmg}`, damage: dmg, hits: 1 },
      resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
    };
  }
};

export const IRON_SOVEREIGN: EnemyDef = {
  id: 'ironSovereign',
  name: 'Iron Sovereign',
  maxHull: 95,
  pickAction: ({ turn, rng, memory, lastIntent }): EnemyAction => {
    if (memory.charging) {
      memory.charging = false;
      const dmg = 20;
      return {
        intent: { kind: 'attack', label: `Cannon Volley: ${dmg}`, damage: dmg, hits: 1 },
        resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
      };
    }
    if (turn === 1) {
      const dmg = 10;
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
      const dmg = 4;
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
        intent: { kind: 'defend', label: 'Heat Sink: +15' },
        resolve: (ctx) => gainEnemyPlating(ctx, 15)
      };
    }
    const dmg = 12;
    return {
      intent: { kind: 'attack', label: `Plasma Cleave: ${dmg}`, damage: dmg, hits: 1 },
      resolve: (ctx) => dealDamageToPlayer(ctx, dmg)
    };
  }
};

export const FOUNDRY_TYRANT: EnemyDef = {
  id: 'foundryTyrant',
  name: 'Foundry Tyrant',
  maxHull: 70,
  pickAction: ({ turn, rng, lastIntent }): EnemyAction => {
    // Telegraphed opener — gives the player a turn to set up
    if (turn === 1) {
      return {
        intent: { kind: 'defend', label: 'Forge Heat: +10' },
        resolve: (ctx) => {
          gainEnemyPlating(ctx, 10);
          applyWeakToPlayer(ctx, 1);
        }
      };
    }
    const roll = rng();
    const last = lastIntent?.label ?? '';

    if (!last.startsWith('Piston Rain') && roll < 0.25) {
      const dmg = 4;
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
      const dmg = 5;
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
        intent: { kind: 'defend', label: 'Forge Heat: +8' },
        resolve: (ctx) => gainEnemyPlating(ctx, 8)
      };
    }
    const dmg = 14;
    return {
      intent: { kind: 'attack', label: `Furnace Slam: ${dmg}`, damage: dmg, hits: 1 },
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

function regularPoolFor(act: number): EnemyDef[] {
  return act >= 2 ? ACT2_POOL : ACT1_POOL;
}

function elitePoolFor(act: number): EnemyDef[] {
  return act >= 2 ? ACT2_ELITE_POOL : ACT1_ELITE_POOL;
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
  return act >= 2 ? IRON_SOVEREIGN : FOUNDRY_TYRANT;
}

export function getActName(act: number): string {
  if (act >= 2) return 'THE FOUNDRY DEPTHS';
  return 'ROAD TO THE FOUNDRY';
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
  [IRON_SOVEREIGN.id]: IRON_SOVEREIGN
};
