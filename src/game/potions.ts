import type { PotionDef, CardRarity } from './types';

// Slice 58 — icons added as the optional 7th arg. Single-glyph emoji
// chosen for readability at small sizes on the potion belt. Defaults
// to a generic flask 🧪 if omitted so future potions can opt-in.
const potion = (
  id: string,
  name: string,
  target: PotionDef['target'],
  description: string,
  effects: PotionDef['effects'],
  rarity: CardRarity = 'common',
  icon: string = '🧪'
): PotionDef => ({ id, name, target, description, effects, rarity, icon });

export const POTIONS: Record<string, PotionDef> = {
  blockPotion: potion('blockPotion', 'Block Potion', 'self', 'Gain 12 Plating.',
    [{ kind: 'plating', amount: 12 }], 'common', '🛡️'),
  firePotion: potion('firePotion', 'Fire Potion', 'enemy', 'Deal 20 damage.',
    [{ kind: 'damage', amount: 20 }], 'common', '🔥'),
  swiftPotion: potion('swiftPotion', 'Swift Potion', 'none', 'Draw 3 cards.',
    [{ kind: 'draw', amount: 3 }], 'common', '🃏'),
  energyPotion: potion('energyPotion', 'Energy Potion', 'none', 'Gain 2 Steam.',
    [{ kind: 'gainSteam', amount: 2 }], 'common', '💨'),
  weakPotion: potion('weakPotion', 'Weak Potion', 'allEnemies', 'Apply 3 Weak to ALL enemies.',
    [{ kind: 'applyWeakAll', amount: 3 }], 'uncommon', '☠️'),
  vulnerablePotion: potion('vulnerablePotion', 'Vulnerable Potion', 'allEnemies', 'Apply 3 Vulnerable to ALL enemies.',
    [{ kind: 'applyVulnerableAll', amount: 3 }], 'uncommon', '🎯'),
  strengthPotion: potion('strengthPotion', 'Strength Potion', 'self', 'Gain 2 Strength.',
    [{ kind: 'gainStrength', amount: 2 }], 'uncommon', '💪'),
  regenPotion: potion('regenPotion', 'Repair Potion', 'self', 'Heal 8 hull.',
    [{ kind: 'heal', amount: 8 }], 'uncommon', '🔧'),

  // ===== Slice 52 — Potion expansion =====
  cinderPotion: potion('cinderPotion', 'Cinder Potion', 'allEnemies',
    'Apply 8 Burn to ALL enemies.',
    [{ kind: 'applyBurnAll', amount: 8 }], 'common', '🌋'),
  spikePotion: potion('spikePotion', 'Spike Potion', 'self', 'Gain 5 Thorns.',
    [{ kind: 'gainThorns', amount: 5 }], 'common', '🌵'),
  bracerPotion: potion('bracerPotion', 'Bracer Potion', 'self', 'Gain 2 Dexterity.',
    [{ kind: 'gainDexterity', amount: 2 }], 'uncommon', '🤸'),
  // First rare-tier potion. Surge is two effects rolled into one — the
  // payoff is meant to feel deck-defining when it shows up.
  surgePotion: potion('surgePotion', 'Surge Potion', 'none',
    'Gain 3 Steam and draw 2 cards.',
    [{ kind: 'gainSteam', amount: 3 }, { kind: 'draw', amount: 2 }], 'rare', '⚡')
};

export const POTION_POOL: string[] = Object.keys(POTIONS);

// Potions only span common/uncommon/rare. Epic and legendary weights are
// 0 since no potions of those tiers exist; the fields are required by the
// shared CardRarity type.
const RARITY_WEIGHTS: Record<CardRarity, number> = {
  common: 65, uncommon: 30, rare: 5, epic: 0, legendary: 0
};

export function pickRandomPotionId(rng: () => number = Math.random): string {
  const choices = POTION_POOL.map((id) => ({ id, w: RARITY_WEIGHTS[POTIONS[id].rarity ?? 'common'] }));
  const total = choices.reduce((a, b) => a + b.w, 0);
  let roll = rng() * total;
  for (const c of choices) {
    roll -= c.w;
    if (roll <= 0) return c.id;
  }
  return choices[choices.length - 1].id;
}

export const POTION_SLOT_COUNT = 3;
export const POTION_DROP_CHANCE = 0.4;
export const POTION_SHOP_PRICE = 40;
