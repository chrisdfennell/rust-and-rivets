import type { CardDef, CardRarity } from './types';

const card = (
  id: string,
  name: string,
  cost: number,
  target: CardDef['target'],
  description: string,
  effects: CardDef['effects'],
  exhaust?: boolean,
  rarity?: CardRarity
): CardDef => ({ id, name, cost, target, description, effects, exhaust, rarity });

export const CARDS: Record<string, CardDef> = {
  // ===== Starter =====
  autocannon: card('autocannon', 'Auto-Cannon', 1, 'enemy', 'Deal 6 damage.',
    [{ kind: 'damage', amount: 6 }]),
  'autocannon+': card('autocannon+', 'Auto-Cannon+', 1, 'enemy', 'Deal 9 damage.',
    [{ kind: 'damage', amount: 9 }]),

  brace: card('brace', 'Brace', 1, 'self', 'Gain 5 Plating.',
    [{ kind: 'plating', amount: 5 }]),
  'brace+': card('brace+', 'Brace+', 1, 'self', 'Gain 8 Plating.',
    [{ kind: 'plating', amount: 8 }]),

  ventSteam: card('ventSteam', 'Vent Steam', 0, 'enemy', 'Deal 3 damage. Apply 2 Vulnerable.',
    [{ kind: 'damage', amount: 3 }, { kind: 'applyVulnerable', amount: 2 }]),
  'ventSteam+': card('ventSteam+', 'Vent Steam+', 0, 'enemy', 'Deal 4 damage. Apply 3 Vulnerable.',
    [{ kind: 'damage', amount: 4 }, { kind: 'applyVulnerable', amount: 3 }]),

  // ===== Buyable =====
  ironHail: card('ironHail', 'Iron Hail', 1, 'enemy', 'Deal 8 damage.',
    [{ kind: 'damage', amount: 8 }], false, 'common'),
  'ironHail+': card('ironHail+', 'Iron Hail+', 1, 'enemy', 'Deal 11 damage.',
    [{ kind: 'damage', amount: 11 }], false, 'common'),

  bulwark: card('bulwark', 'Bulwark', 2, 'self', 'Gain 12 Plating.',
    [{ kind: 'plating', amount: 12 }], false, 'uncommon'),
  'bulwark+': card('bulwark+', 'Bulwark+', 2, 'self', 'Gain 16 Plating.',
    [{ kind: 'plating', amount: 16 }], false, 'uncommon'),

  recalibrate: card('recalibrate', 'Recalibrate', 1, 'none', 'Draw 2 cards.',
    [{ kind: 'draw', amount: 2 }], false, 'uncommon'),
  'recalibrate+': card('recalibrate+', 'Recalibrate+', 0, 'none', 'Draw 2 cards.',
    [{ kind: 'draw', amount: 2 }], false, 'uncommon'),

  overdrive: card('overdrive', 'Overdrive', 0, 'none', 'Gain 2 Steam. Exhaust.',
    [{ kind: 'gainSteam', amount: 2 }], true, 'uncommon'),
  'overdrive+': card('overdrive+', 'Overdrive+', 0, 'none', 'Gain 3 Steam. Exhaust.',
    [{ kind: 'gainSteam', amount: 3 }], true, 'uncommon'),

  hydraulicPunch: card('hydraulicPunch', 'Hydraulic Punch', 1, 'enemy', 'Deal 10 damage. Apply 1 Weak.',
    [{ kind: 'damage', amount: 10 }, { kind: 'applyWeak', amount: 1 }], false, 'uncommon'),
  'hydraulicPunch+': card('hydraulicPunch+', 'Hydraulic Punch+', 1, 'enemy', 'Deal 14 damage. Apply 2 Weak.',
    [{ kind: 'damage', amount: 14 }, { kind: 'applyWeak', amount: 2 }], false, 'uncommon'),

  steamLance: card('steamLance', 'Steam Lance', 2, 'enemy', 'Deal 14 damage.',
    [{ kind: 'damage', amount: 14 }], false, 'rare'),
  'steamLance+': card('steamLance+', 'Steam Lance+', 2, 'enemy', 'Deal 18 damage.',
    [{ kind: 'damage', amount: 18 }], false, 'rare'),

  repairDrone: card('repairDrone', 'Repair Drone', 1, 'self', 'Heal 5 Hull. Exhaust.',
    [{ kind: 'heal', amount: 5 }], true, 'uncommon'),
  'repairDrone+': card('repairDrone+', 'Repair Drone+', 1, 'self', 'Heal 8 Hull. Exhaust.',
    [{ kind: 'heal', amount: 8 }], true, 'uncommon'),

  smokeScreen: card('smokeScreen', 'Smoke Screen', 1, 'self', 'Gain 6 Plating. Apply 1 Weak.',
    [{ kind: 'plating', amount: 6 }, { kind: 'applyWeak', amount: 1 }], false, 'common'),
  'smokeScreen+': card('smokeScreen+', 'Smoke Screen+', 1, 'self', 'Gain 9 Plating. Apply 2 Weak.',
    [{ kind: 'plating', amount: 9 }, { kind: 'applyWeak', amount: 2 }], false, 'common'),

  counterStrike: card('counterStrike', 'Counter-Strike', 1, 'enemy', 'Deal 4 damage. Gain 4 Plating.',
    [{ kind: 'damage', amount: 4 }, { kind: 'plating', amount: 4 }], false, 'common'),
  'counterStrike+': card('counterStrike+', 'Counter-Strike+', 1, 'enemy', 'Deal 6 damage. Gain 6 Plating.',
    [{ kind: 'damage', amount: 6 }, { kind: 'plating', amount: 6 }], false, 'common'),

  hammerStrike: card('hammerStrike', 'Hammer Strike', 1, 'enemy', 'Deal 5 damage. Apply 1 Vulnerable.',
    [{ kind: 'damage', amount: 5 }, { kind: 'applyVulnerable', amount: 1 }], false, 'common'),
  'hammerStrike+': card('hammerStrike+', 'Hammer Strike+', 1, 'enemy', 'Deal 7 damage. Apply 2 Vulnerable.',
    [{ kind: 'damage', amount: 7 }, { kind: 'applyVulnerable', amount: 2 }], false, 'common'),

  drillBit: card('drillBit', 'Drill Bit', 1, 'enemy', 'Deal 6 damage. Deal 6 more if enemy has Plating.',
    [{ kind: 'damageIfEnemyPlated', amount: 6 }, { kind: 'damage', amount: 6 }], false, 'uncommon'),
  'drillBit+': card('drillBit+', 'Drill Bit+', 1, 'enemy', 'Deal 8 damage. Deal 8 more if enemy has Plating.',
    [{ kind: 'damageIfEnemyPlated', amount: 8 }, { kind: 'damage', amount: 8 }], false, 'uncommon'),

  sledgehammer: card('sledgehammer', 'Sledgehammer', 2, 'enemy', 'Deal 16 damage. Lose 3 Hull.',
    [{ kind: 'damage', amount: 16 }, { kind: 'loseHull', amount: 3 }], false, 'uncommon'),
  'sledgehammer+': card('sledgehammer+', 'Sledgehammer+', 2, 'enemy', 'Deal 22 damage. Lose 3 Hull.',
    [{ kind: 'damage', amount: 22 }, { kind: 'loseHull', amount: 3 }], false, 'uncommon'),

  steamSurge: card('steamSurge', 'Steam Surge', 1, 'enemy', 'Deal 4 damage. Gain 1 Steam.',
    [{ kind: 'damage', amount: 4 }, { kind: 'gainSteam', amount: 1 }], false, 'uncommon'),
  'steamSurge+': card('steamSurge+', 'Steam Surge+', 1, 'enemy', 'Deal 5 damage. Gain 2 Steam.',
    [{ kind: 'damage', amount: 5 }, { kind: 'gainSteam', amount: 2 }], false, 'uncommon'),

  pressureBurst: card('pressureBurst', 'Pressure Burst', 2, 'enemy', 'Deal damage equal to your Plating. Lose all Plating.',
    [{ kind: 'damageEqualToPlating', bonus: 0 }, { kind: 'losePlating' }], false, 'rare'),
  'pressureBurst+': card('pressureBurst+', 'Pressure Burst+', 2, 'enemy', 'Deal damage equal to your Plating + 4. Lose all Plating.',
    [{ kind: 'damageEqualToPlating', bonus: 4 }, { kind: 'losePlating' }], false, 'rare'),

  // ===== Slice 20: status-effect cards =====
  battleForge: card('battleForge', 'Battle Forge', 1, 'self', 'Gain 2 Strength. Exhaust.',
    [{ kind: 'gainStrength', amount: 2 }], true, 'uncommon'),
  'battleForge+': card('battleForge+', 'Battle Forge+', 1, 'self', 'Gain 3 Strength. Exhaust.',
    [{ kind: 'gainStrength', amount: 3 }], true, 'uncommon'),

  bufferPlate: card('bufferPlate', 'Buffer Plate', 1, 'self', 'Gain 2 Dexterity. Exhaust.',
    [{ kind: 'gainDexterity', amount: 2 }], true, 'uncommon'),
  'bufferPlate+': card('bufferPlate+', 'Buffer Plate+', 1, 'self', 'Gain 3 Dexterity. Exhaust.',
    [{ kind: 'gainDexterity', amount: 3 }], true, 'uncommon'),

  pyroCharge: card('pyroCharge', 'Pyro Charge', 1, 'enemy', 'Deal 4 damage. Apply 4 Burn.',
    [{ kind: 'damage', amount: 4 }, { kind: 'applyBurn', amount: 4 }], false, 'uncommon'),
  'pyroCharge+': card('pyroCharge+', 'Pyro Charge+', 1, 'enemy', 'Deal 5 damage. Apply 6 Burn.',
    [{ kind: 'damage', amount: 5 }, { kind: 'applyBurn', amount: 6 }], false, 'uncommon'),

  cinderRound: card('cinderRound', 'Cinder Round', 2, 'enemy', 'Deal 8 damage. Apply 8 Burn. Exhaust.',
    [{ kind: 'damage', amount: 8 }, { kind: 'applyBurn', amount: 8 }], true, 'rare'),
  'cinderRound+': card('cinderRound+', 'Cinder Round+', 2, 'enemy', 'Deal 10 damage. Apply 11 Burn. Exhaust.',
    [{ kind: 'damage', amount: 10 }, { kind: 'applyBurn', amount: 11 }], true, 'rare'),

  spikePlating: card('spikePlating', 'Spike Plating', 1, 'self', 'Gain 4 Plating. Gain 3 Thorns.',
    [{ kind: 'plating', amount: 4 }, { kind: 'gainThorns', amount: 3 }], false, 'common'),
  'spikePlating+': card('spikePlating+', 'Spike Plating+', 1, 'self', 'Gain 6 Plating. Gain 4 Thorns.',
    [{ kind: 'plating', amount: 6 }, { kind: 'gainThorns', amount: 4 }], false, 'common'),

  ironWill: card('ironWill', 'Iron Will', 2, 'self', 'Gain 2 Strength. Gain 2 Dexterity. Exhaust.',
    [{ kind: 'gainStrength', amount: 2 }, { kind: 'gainDexterity', amount: 2 }], true, 'rare'),
  'ironWill+': card('ironWill+', 'Iron Will+', 2, 'self', 'Gain 3 Strength. Gain 3 Dexterity. Exhaust.',
    [{ kind: 'gainStrength', amount: 3 }, { kind: 'gainDexterity', amount: 3 }], true, 'rare'),

  // ===== Slice 22: AoE cards (target: 'allEnemies') =====
  shrapnelBurst: card('shrapnelBurst', 'Shrapnel Burst', 1, 'allEnemies', 'Deal 6 damage to ALL enemies.',
    [{ kind: 'damageAll', amount: 6 }], false, 'uncommon'),
  'shrapnelBurst+': card('shrapnelBurst+', 'Shrapnel Burst+', 1, 'allEnemies', 'Deal 9 damage to ALL enemies.',
    [{ kind: 'damageAll', amount: 9 }], false, 'uncommon'),

  forgeWave: card('forgeWave', 'Forge Wave', 2, 'allEnemies', 'Deal 10 damage to ALL enemies. Apply 1 Vulnerable to all.',
    [{ kind: 'damageAll', amount: 10 }, { kind: 'applyVulnerableAll', amount: 1 }], false, 'rare'),
  'forgeWave+': card('forgeWave+', 'Forge Wave+', 2, 'allEnemies', 'Deal 13 damage to ALL enemies. Apply 2 Vulnerable to all.',
    [{ kind: 'damageAll', amount: 13 }, { kind: 'applyVulnerableAll', amount: 2 }], false, 'rare'),

  acidMist: card('acidMist', 'Acid Mist', 1, 'allEnemies', 'Apply 4 Burn to ALL enemies.',
    [{ kind: 'applyBurnAll', amount: 4 }], false, 'uncommon'),
  'acidMist+': card('acidMist+', 'Acid Mist+', 1, 'allEnemies', 'Apply 6 Burn to ALL enemies.',
    [{ kind: 'applyBurnAll', amount: 6 }], false, 'uncommon'),

  concussion: card('concussion', 'Concussion', 1, 'allEnemies', 'Deal 4 damage to ALL enemies. Apply 1 Weak to all.',
    [{ kind: 'damageAll', amount: 4 }, { kind: 'applyWeakAll', amount: 1 }], false, 'common'),
  'concussion+': card('concussion+', 'Concussion+', 1, 'allEnemies', 'Deal 6 damage to ALL enemies. Apply 2 Weak to all.',
    [{ kind: 'damageAll', amount: 6 }, { kind: 'applyWeakAll', amount: 2 }], false, 'common')
};

export const STARTER_DECK: string[] = [
  'autocannon', 'autocannon', 'autocannon', 'autocannon', 'autocannon',
  'brace', 'brace', 'brace', 'brace',
  'ventSteam'
];

export const SHOP_POOL: string[] = [
  'ironHail', 'bulwark', 'recalibrate', 'overdrive',
  'hydraulicPunch', 'steamLance', 'repairDrone', 'smokeScreen',
  'counterStrike', 'hammerStrike', 'drillBit', 'sledgehammer',
  'steamSurge', 'pressureBurst',
  'battleForge', 'bufferPlate', 'pyroCharge', 'cinderRound',
  'spikePlating', 'ironWill',
  'shrapnelBurst', 'forgeWave', 'acidMist', 'concussion'
];

export function isUpgradable(cardId: string): boolean {
  return !cardId.endsWith('+') && (cardId + '+') in CARDS;
}

export function upgradeCardId(cardId: string): string {
  return isUpgradable(cardId) ? cardId + '+' : cardId;
}

export const REWARD_POOL: string[] = SHOP_POOL.slice();

const RARITY_WEIGHTS_COMBAT: Record<CardRarity, number> = { common: 70, uncommon: 25, rare: 5 };
const RARITY_WEIGHTS_ELITE: Record<CardRarity, number> = { common: 30, uncommon: 50, rare: 20 };

export function pickRewardCards(count: number, isElite: boolean, rng: () => number = Math.random): string[] {
  const weights = isElite ? RARITY_WEIGHTS_ELITE : RARITY_WEIGHTS_COMBAT;
  const pool = REWARD_POOL.slice();
  const picked: string[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const choices = pool.map((id) => ({ id, w: weights[CARDS[id].rarity ?? 'common'] }));
    const total = choices.reduce((a, b) => a + b.w, 0);
    let roll = rng() * total;
    let chosen = choices[choices.length - 1].id;
    for (const c of choices) {
      roll -= c.w;
      if (roll <= 0) { chosen = c.id; break; }
    }
    picked.push(chosen);
    pool.splice(pool.indexOf(chosen), 1);
  }
  return picked;
}

// Allow runtime imports of CardRarity for tooling that needs it
export type { CardRarity };
