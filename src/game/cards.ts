import type { CardDef } from './types';

const card = (
  id: string,
  name: string,
  cost: number,
  target: CardDef['target'],
  description: string,
  effects: CardDef['effects'],
  exhaust?: boolean
): CardDef => ({ id, name, cost, target, description, effects, exhaust });

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
    [{ kind: 'damage', amount: 8 }]),
  'ironHail+': card('ironHail+', 'Iron Hail+', 1, 'enemy', 'Deal 11 damage.',
    [{ kind: 'damage', amount: 11 }]),

  bulwark: card('bulwark', 'Bulwark', 2, 'self', 'Gain 12 Plating.',
    [{ kind: 'plating', amount: 12 }]),
  'bulwark+': card('bulwark+', 'Bulwark+', 2, 'self', 'Gain 16 Plating.',
    [{ kind: 'plating', amount: 16 }]),

  recalibrate: card('recalibrate', 'Recalibrate', 1, 'none', 'Draw 2 cards.',
    [{ kind: 'draw', amount: 2 }]),
  'recalibrate+': card('recalibrate+', 'Recalibrate+', 0, 'none', 'Draw 2 cards.',
    [{ kind: 'draw', amount: 2 }]),

  overdrive: card('overdrive', 'Overdrive', 0, 'none', 'Gain 2 Steam. Exhaust.',
    [{ kind: 'gainSteam', amount: 2 }], true),
  'overdrive+': card('overdrive+', 'Overdrive+', 0, 'none', 'Gain 3 Steam. Exhaust.',
    [{ kind: 'gainSteam', amount: 3 }], true),

  hydraulicPunch: card('hydraulicPunch', 'Hydraulic Punch', 1, 'enemy', 'Deal 10 damage. Apply 1 Weak.',
    [{ kind: 'damage', amount: 10 }, { kind: 'applyWeak', amount: 1 }]),
  'hydraulicPunch+': card('hydraulicPunch+', 'Hydraulic Punch+', 1, 'enemy', 'Deal 14 damage. Apply 2 Weak.',
    [{ kind: 'damage', amount: 14 }, { kind: 'applyWeak', amount: 2 }]),

  steamLance: card('steamLance', 'Steam Lance', 2, 'enemy', 'Deal 14 damage.',
    [{ kind: 'damage', amount: 14 }]),
  'steamLance+': card('steamLance+', 'Steam Lance+', 2, 'enemy', 'Deal 18 damage.',
    [{ kind: 'damage', amount: 18 }]),

  repairDrone: card('repairDrone', 'Repair Drone', 1, 'self', 'Heal 5 Hull. Exhaust.',
    [{ kind: 'heal', amount: 5 }], true),
  'repairDrone+': card('repairDrone+', 'Repair Drone+', 1, 'self', 'Heal 8 Hull. Exhaust.',
    [{ kind: 'heal', amount: 8 }], true),

  smokeScreen: card('smokeScreen', 'Smoke Screen', 1, 'self', 'Gain 6 Plating. Apply 1 Weak.',
    [{ kind: 'plating', amount: 6 }, { kind: 'applyWeak', amount: 1 }]),
  'smokeScreen+': card('smokeScreen+', 'Smoke Screen+', 1, 'self', 'Gain 9 Plating. Apply 2 Weak.',
    [{ kind: 'plating', amount: 9 }, { kind: 'applyWeak', amount: 2 }])
};

export const STARTER_DECK: string[] = [
  'autocannon', 'autocannon', 'autocannon', 'autocannon', 'autocannon',
  'brace', 'brace', 'brace', 'brace',
  'ventSteam'
];

export const SHOP_POOL: string[] = [
  'ironHail', 'bulwark', 'recalibrate', 'overdrive',
  'hydraulicPunch', 'steamLance', 'repairDrone', 'smokeScreen'
];

export function isUpgradable(cardId: string): boolean {
  return !cardId.endsWith('+') && (cardId + '+') in CARDS;
}

export function upgradeCardId(cardId: string): string {
  return isUpgradable(cardId) ? cardId + '+' : cardId;
}
