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

export const ACT1_POOL: EnemyDef[] = [SCRAP_RAIDER, JUNK_HOUND, SENTINEL_DRONE];

export function pickAct1Enemy(rng: () => number): EnemyDef {
  return ACT1_POOL[Math.floor(rng() * ACT1_POOL.length)];
}

export const ENEMY_DEFS: Record<string, EnemyDef> = {
  [SCRAP_RAIDER.id]: SCRAP_RAIDER,
  [JUNK_HOUND.id]: JUNK_HOUND,
  [SENTINEL_DRONE.id]: SENTINEL_DRONE,
  [FOUNDRY_TYRANT.id]: FOUNDRY_TYRANT
};
